import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '@pklinks/config';
import User from '../models/user.model.js';
import { publish } from '@pklinks/utils/rabbitmq';

// Helpers for token generation
const signAccess  = (id) => jwt.sign({ sub: id }, config.jwtSecret, { expiresIn: config.jwtAccessExpiresIn });
const signRefresh = (id) => jwt.sign({ sub: id }, config.jwtSecret, { expiresIn: config.jwtRefreshExpiresIn });

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export async function issueTokens(user) {
  const id = user._id.toString();
  const accessToken  = signAccess(id);
  const refreshToken = signRefresh(id);
  
  await User.findByIdAndUpdate(user._id, { refreshToken });
  return { accessToken, refreshToken };
}

export async function signup({ email, password, name, displayName }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const err = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({
    email:       email.toLowerCase(),
    passwordHash: hash,
    displayName: displayName || name || email.split('@')[0],
  });

  publish('user.registered', {
    userId: user._id.toString(),
    email:  user.email,
    name:   user.displayName,
    timestamp: new Date().toISOString(),
  });

  const tokens = await issueTokens(user);
  return { user: simplifyUser(user), ...tokens };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !user.passwordHash) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const tokens = await issueTokens(user);
  return { user: simplifyUser(user), ...tokens };
}

export async function refreshAccessToken(token) {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.sub);
    
    if (!user || user.refreshToken !== token) {
      throw new Error();
    }
    
    return issueTokens(user);
  } catch (e) {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }
}

export async function logout(userId) {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
}

export async function getMe(userId) {
  const user = await User.findById(userId).lean();
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return simplifyUser(user);
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email: email.toLowerCase() });
  
  // Don't leak user existence for security reasons
  if (!user) return false;


  // Generate raw token and hashed version
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  // Queue an email to the user with their reset link
  const resetLink = `${config.baseUrl}/reset-password?token=${resetToken}`;
  
  publish('email.send', {
    to: user.email,
    template: 'forgot_password',
    data: {
      name: user.displayName,
      resetLink,
    },
    timestamp: new Date().toISOString(),
  });

  return true;
}


export async function resetPassword(token, newPassword) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    const err = new Error('Password reset token is invalid or has expired');
    err.statusCode = 400;
    throw err;
  }

  // Save the new password and clean up the reset tokens
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  
  // Invalidate refresh token for security
  user.refreshToken = null;
  
  await user.save();

  // Notify user of change
  publish('email.send', {
    to: user.email,
    template: 'password_reset_confirmation',
    data: {
      name: user.displayName,
    },
    timestamp: new Date().toISOString(),
  });
}

function simplifyUser(user) {
  return {
    id:    user._id,
    email: user.email,
    name:  user.displayName,
    createdAt: user.createdAt,
  };
}
