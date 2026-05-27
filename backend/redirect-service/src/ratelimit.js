import config from '@pklinks/config';

function rateLimitKey(code, ip) {
  const safeIp = ip.replace(/:/g, '_');
  return `rate:${code}:${safeIp}`;
}

export async function checkRateLimit(redisClient, code, ip) {
  const key = rateLimitKey(code, ip);

  const count = await redisClient.incr(key);

  if (count === 1) {
    await redisClient.expire(key, config.rateLimitWindow);
  }

  return { allowed: count <= config.rateLimitMax, count };
}
