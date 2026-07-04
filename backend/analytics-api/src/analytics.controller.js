import mongoose from 'mongoose';
import { getAnalytics } from './analytics.service.js';

export async function getLinkAnalytics(req, res, next) {
  try {
    const { code } = req.params;
    const { from, to } = req.query;
    const userId = req.userId;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const analytics = await getAnalytics(code, userId, { from, to });
    res.json({ analytics });
  } catch (err) {
    next(err);
  }
}
