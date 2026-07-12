import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '@pklinks/config';
import User from '../models/user.model.js';
import { publish } from '@pklinks/utils/rabbitmq';
import { verifyRefreshToken } from '@pklinks/utils/auth';

const signAccess  = (id) => jwt.sign({ sub: id, type: 'access' }, config.jwtSecret, { expiresIn: config.jwtAccessExpiresIn });
const signRefresh = (id) => jwt.sign({ sub: id, type: 'refresh' }, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiresIn });

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const MAX_SESSIONS = 5;

export async function issueTokens(user, oldRefreshToken = null) {
  const id = user._id.toString();
  const accessToken  = signAccess(id);
  const refreshToken = signRefresh(id);

  const oldHash = oldRefreshToken ? hashToken(oldRefreshToken) : null;
  const kept = (user.refreshTokens || []).filter((t) => t !== oldHash);
  kept.push(hashToken(refreshToken));
  const trimmed = kept.slice(-MAX_SESSIONS);

  await User.findByIdAndUpdate(user._id, { refreshTokens: trimmed });
  return { accessToken, refreshToken };
}

export async function signup({ email, password, name, displayName }) {
  const hash = await bcrypt.hash(password, 12);

  let user;
  try {
    user = await User.create({
      email:        email.toLowerCase(),
      passwordHash: hash,
      displayName:  displayName || name || email.split('@')[0],
    });
  } catch (e) {
    // Duplicate email
    if (e.code === 11000) {
      const err = new Error('Email already in use');
      err.statusCode = 409;
      throw err;
    }
    throw e;
  }

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
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);

    if (!user || !(user.refreshTokens || []).includes(hashToken(token))) {
      throw new Error();
    }

    return issueTokens(user, token);
  } catch (e) {
    const err = new Error('Invalid or expired refresh token');
    err.statusCode = 401;
    throw err;
  }
}

export async function logout(userId, refreshToken = null) {
  if (refreshToken) {
    await User.findByIdAndUpdate(userId, { $pull: { refreshTokens: hashToken(refreshToken) } });
  } else {
    await User.findByIdAndUpdate(userId, { refreshTokens: [] });
  }
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

  // Don't leak whether the user exists
  if (!user) return false;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

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

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  // Invalidate all sessions
  user.refreshTokens = [];

  await user.save();

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
