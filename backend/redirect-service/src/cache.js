import config from '@pklinks/config';

export const NOT_FOUND_SENTINEL = '__NOT_FOUND__';
const NEGATIVE_TTL = 60;

function cacheKey(code) {
  return `redirect:${code}`;
}

export async function getCache(redisClient, code) {
  return redisClient.get(cacheKey(code));
}

export async function setCache(redisClient, code, originalUrl) {
  await redisClient.setex(cacheKey(code), config.redirectCacheTtl, originalUrl);
}

// Cache with a custom TTL, capped at the configured max (for links with an expiry)
export async function setCacheWithTtl(redisClient, code, originalUrl, ttlSeconds) {
  const ttl = Math.min(config.redirectCacheTtl, Math.max(1, ttlSeconds));
  await redisClient.setex(cacheKey(code), ttl, originalUrl);
}

export async function setNegativeCache(redisClient, code) {
  await redisClient.setex(cacheKey(code), NEGATIVE_TTL, NOT_FOUND_SENTINEL);
}

export async function bustCache(redisClient, code) {
  await redisClient.del(cacheKey(code));
}
