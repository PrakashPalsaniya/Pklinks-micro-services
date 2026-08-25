import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import config from '@pklinks/config';
import { registerRoutes } from './routes.js';
import { createLogger } from '@pklinks/utils/logger';
import { createRedisClient } from '@pklinks/utils/redis';

const logger = createLogger('api-gateway');
const app    = express();
app.set('trust proxy', 1);

app.use(helmet());

app.use(
  cors({
    origin: config.allowedOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

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

const makeLimiter = ({ windowSeconds, max, prefix, message }) =>
  rateLimit({
    windowMs: windowSeconds * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
    store: makeStore(prefix),
  });

const failOpen = (limiter) => (req, res, next) =>
  limiter(req, res, (err) => {
    if (err) {
      logger.warn(`rate limiter unavailable, allowing request: ${err.message}`);
      return next();
    }
    next();
  });

const apiLimiter = failOpen(
  makeLimiter({
    windowSeconds: config.rateLimitWindow,
    max: config.rateLimitMax,
    prefix: 'rl:gateway:api:',
    message: 'Too many requests — please slow down',
  })
);

const redirectLimiter = failOpen(
  makeLimiter({
    windowSeconds: config.redirectRateLimitWindow,
    max: config.redirectRateLimitMax,
    prefix: 'rl:gateway:redirect:',
    message: 'Too many requests — please slow down',
  })
);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

app.use('/r', redirectLimiter);
app.use('/api', apiLimiter);

registerRoutes(app);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const port = config.port || 3000;
const server = app.listen(port, () => {
  logger.info(`api-gateway listening on port ${port}`);
});

function shutdown() {
  logger.info('Shutting down api-gateway...');
  server.close(() => {
    redisClient.quit().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
