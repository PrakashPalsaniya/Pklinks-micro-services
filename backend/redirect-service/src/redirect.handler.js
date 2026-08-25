import Url from '@pklinks/utils/models/url';
import { getCache, setCache, setCacheWithTtl, setNegativeCache, NOT_FOUND_SENTINEL } from './cache.js';

import { checkRateLimit } from './ratelimit.js';
import { publishClickEvent } from './producer.js';

async function findLink(code) {
  const fromReplica = await Url.findOne({ code }).lean();
  if (fromReplica) return fromReplica;

  return Url.findOne({ code }).read('primary').lean();
}

export async function handleRedirect(redis, req, res) {
  const { code } = req.params;
  const ip = req.ip || 'unknown';
  const ua = req.headers['user-agent'] || '';
  const ref = req.headers['referer'] || '';

  try {
    const { allowed } = await checkRateLimit(redis, code, ip);
    if (!allowed) {
      return res.status(429).json({ message: 'Too many requests. Slow down.' });
    }
  } catch (e) {
    console.error('Rate limit error:', e.message);
  }

  // try cache first
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
    console.error('Cache error:', e.message);
  }

  // fall back to db
  try {
    const link = await findLink(code);
    const now = new Date();
    const isValid = link && link.isActive && (!link.expiresAt || link.expiresAt > now);

    if (!isValid) {
      await setNegativeCache(redis, code).catch(() => {});
      return res.status(404).json({ message: 'Link not found' });
    }

    // cap TTL so cache can't outlive the link
    if (link.expiresAt) {
      const ttl = Math.floor((link.expiresAt.getTime() - now.getTime()) / 1000);
      await setCacheWithTtl(redis, code, link.originalUrl, ttl).catch(() => {});
    } else {
      await setCache(redis, code, link.originalUrl).catch(() => {});
    }
    publishClickEvent({ code, originalUrl: link.originalUrl, ip, userAgent: ua, referer: ref });

    return res.redirect(302, link.originalUrl);
  } catch (err) {
    console.error('Redirect handler crashed:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getRedirectInfo(redis, req, res) {
  const { code } = req.params;
  const ip = req.ip || 'unknown';

  try {
    const { allowed } = await checkRateLimit(redis, code, ip);
    if (!allowed) {
      return res.status(429).json({ message: 'Too many requests. Slow down.' });
    }
  } catch (e) {
    console.error('Rate limit error:', e.message);
  }

  try {
    const cached = await getCache(redis, code);
    if (cached === NOT_FOUND_SENTINEL) {
      return res.status(404).json({ message: 'Link not found' });
    }
    if (cached) {
      return res.json({ originalUrl: cached });
    }

    const link = await findLink(code);
    if (!link || !link.isActive) {
      await setNegativeCache(redis, code).catch(() => {});
      return res.status(404).json({ message: 'Link not found' });
    }

    const now = new Date();
    if (link.expiresAt && link.expiresAt <= now) {
      return res.status(410).json({ message: 'Link has expired' });
    }

    return res.json({ originalUrl: link.originalUrl });
  } catch (err) {
    console.error('getRedirectInfo error:', err);
    return res.status(500).json({ message: 'Error fetching link info' });
  }
}
