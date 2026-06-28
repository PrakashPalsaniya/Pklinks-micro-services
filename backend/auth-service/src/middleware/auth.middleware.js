import { verifyToken } from '../auth/auth.service.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or invalid' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
}
