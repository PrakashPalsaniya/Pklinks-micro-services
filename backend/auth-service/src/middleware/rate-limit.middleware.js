import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { createRedisClient } from '@pklinks/utils/redis';

const redisClient = createRedisClient({
  maxRetriesPerRequest: 1,
  commandTimeout: 800,
});

function makeStore(prefix) {
  const store = new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix,
  });

  store.incrementScriptSha.catch(() => {});
  store.getScriptSha.catch(() => {});

  return store;
}

function emailPart(req) {
  const email = req.body?.email;
  if (typeof email !== 'string') return 'anon';
  return email.trim().toLowerCase().slice(0, 254);
}

function ipAndEmailKey(req) {
  return `${ipKeyGenerator(req.ip ?? '')}|${emailPart(req)}`;
}

function makeLimiter({ windowMinutes, max, prefix, message, keyGenerator }) {
  const limiter = rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore(prefix),
    message: { message },
    ...(keyGenerator ? { keyGenerator } : {}),
  });

  return (req, res, next) =>
    limiter(req, res, (err) => {
      if (err) {
        console.warn(`[rate-limit] store unavailable, allowing request: ${err.message}`);
        return next();
      }
      next();
    });
}

export const signupLimiter = makeLimiter({
  windowMinutes: 60,
  max: 10,
  prefix: 'rl:signup:',
  message: 'Too many accounts created from this address. Please try again later.',
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),
});

export const loginLimiter = makeLimiter({
  windowMinutes: 15,
  max: 10,
  prefix: 'rl:login:',
  message: 'Too many login attempts. Please try again in 15 minutes.',
  keyGenerator: ipAndEmailKey,
});

export const loginIpLimiter = makeLimiter({
  windowMinutes: 15,
  max: 50,
  prefix: 'rl:login-ip:',
  message: 'Too many login attempts. Please try again in 15 minutes.',
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),
});

export const forgotPasswordLimiter = makeLimiter({
  windowMinutes: 15,
  max: 3,
  prefix: 'rl:forgot-password:',
  message: 'Too many password reset requests. Please try again in 15 minutes.',
  keyGenerator: ipAndEmailKey,
});

export const forgotPasswordIpLimiter = makeLimiter({
  windowMinutes: 15,
  max: 15,
  prefix: 'rl:forgot-password-ip:',
  message: 'Too many password reset requests. Please try again in 15 minutes.',
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),
});

export const resetPasswordLimiter = makeLimiter({
  windowMinutes: 15,
  max: 10,
  prefix: 'rl:reset-password:',
  message: 'Too many password reset attempts. Please try again in 15 minutes.',
});
