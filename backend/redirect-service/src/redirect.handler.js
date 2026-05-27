import mongoose from 'mongoose';
import { getCache, setCache, setNegativeCache, NOT_FOUND_SENTINEL } from './cache.js';
import { checkRateLimit } from './ratelimit.js';
import { publishClickEvent } from './producer.js';

// Simple schema for the redirect service (read-only mostly)
const urlSchema = new mongoose.Schema({
  code:        String,
  originalUrl: String,
  isActive:    Boolean,
  expiresAt:   Date,
});

const Url = mongoose.models.Url || mongoose.model('Url', urlSchema);

export async function handleRedirect(redis, req, res) {
  const { code } = req.params;
  const ip = req.ip || 'unknown';
  const ua = req.headers['user-agent'] || '';
  const ref = req.headers['referer'] || '';

  // 1. Check rate limit first
  try {
    const { allowed } = await checkRateLimit(redis, code, ip);
    if (!allowed) {
      return res.status(429).json({ message: 'Too many requests. Slow down.' });
    }
  } catch (e) {
    console.log('Rate limit error:', e.message);
  }

  // 2. Try to get from cache (Fast Path)
  try {
    const cached = await getCache(redis, code);

    if (cached === NOT_FOUND_SENTINEL) {
      return res.status(404).json({ message: 'Link not found' });
    }

    if (cached) {
      publishClickEvent({ code, originalUrl: cached, ip, userAgent: ua, referer: ref });
      return res.redirect(302, cached);
    }
  } catch (e) {
    console.log('Cache error:', e.message);
  }

  // 3. Fallback to Database (Slow Path)
  try {
    const link = await Url.findOne({ code }).lean();
    const now = new Date();
    const isValid = link && link.isActive && (!link.expiresAt || link.expiresAt > now);

    if (!isValid) {
      // Mark as not found in cache so we don't hit DB again immediately
      await setNegativeCache(redis, code).catch(() => {});
      return res.status(404).json({ message: 'Link not found' });
    }

    // Success! Update cache and publish event
    await setCache(redis, code, link.originalUrl).catch(() => {});
    publishClickEvent({ code, originalUrl: link.originalUrl, ip, userAgent: ua, referer: ref });

    return res.redirect(302, link.originalUrl);
  } catch (err) {
    console.error('Redirect handler crashed:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getRedirectInfo(redis, req, res) {
  const { code } = req.params;

  try {
    const cached = await getCache(redis, code);
    if (cached && cached !== NOT_FOUND_SENTINEL) {
      return res.json({ originalUrl: cached });
    }

    const link = await Url.findOne({ code, isActive: true }).lean();
    if (!link) return res.status(404).json({ message: 'Link not found' });

    return res.json({ originalUrl: link.originalUrl });
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching link info' });
  }
}
