import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createRedisClient } from '@pklinks/utils/redis';

const redisClient = createRedisClient();

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP or email to 3 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - ioredis types sometimes clash with rate-limit-redis
    sendCommand: (...args) => redisClient.call(...args),
    prefix: 'rl:forgot-password:',
  }),
  message: {
    message: 'Too many password reset requests. Please try again in 15 minutes.',
  },
  keyGenerator: (req, res) => {
    // Limit by email if provided, otherwise fallback to IP
    return req.body.email ? req.body.email.toLowerCase() : ipKeyGenerator(req, res);
  },
});
