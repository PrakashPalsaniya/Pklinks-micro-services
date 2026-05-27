import mongoose from 'mongoose';
import { getAnalytics } from './analytics.service.js';

export async function getLinkAnalytics(req, res, next) {
  try {
    const { code } = req.params;
    const { from, to } = req.query;
    const userId = req.headers['x-user-id'];

    // Validate that userId is a proper MongoDB ObjectId before querying.
    // The gateway sets x-user-id from a verified JWT, but we guard here as
    // defence-in-depth to prevent Mongoose CastErrors.
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const analytics = await getAnalytics(code, userId, { from, to });
    res.json({ analytics });
  } catch (err) {
    next(err);
  }
}
