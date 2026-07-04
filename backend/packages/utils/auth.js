import jwt from 'jsonwebtoken';
import config from '@pklinks/config';

export const JWT_VERIFY_OPTIONS = { clockTolerance: 300 };

export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret, JWT_VERIFY_OPTIONS);
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or invalid' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
}
