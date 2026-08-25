import config from '@pklinks/config';

function rateLimitKey(code, ip) {
  const safeIp = String(ip || 'unknown').replace(/:/g, '_');
  return `rate:${code}:${safeIp}`;
}

export async function checkRateLimit(redisClient, code, ip) {
  const key = rateLimitKey(code, ip);
  const window = config.redirectRateLimitWindow;

  const results = await redisClient
    .multi()
    .incr(key)
    .expire(key, window, 'NX')
    .exec();

  const [incrErr, count] = results[0];
  if (incrErr) throw incrErr;

  return { allowed: count <= config.redirectRateLimitMax, count };
}
