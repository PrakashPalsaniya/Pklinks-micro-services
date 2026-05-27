import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..', '..');

const loadEnvFiles = () => {
  if (globalThis.__pklinksEnvLoaded) {
    return;
  }

  dotenv.config({ path: path.join(backendRoot, '.env') });

  const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
  const relativeEntryFile = entryFile ? path.relative(backendRoot, entryFile) : '';
  const [serviceName] = relativeEntryFile.split(path.sep);

  if (
    serviceName &&
    !relativeEntryFile.startsWith('..') &&
    !['infra', 'node_modules', 'packages'].includes(serviceName)
  ) {
    dotenv.config({
      path: path.join(backendRoot, serviceName, '.env'),
      override: true,
    });
  }

  globalThis.__pklinksEnvLoaded = true;
};

loadEnvFiles();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  port: parseInt(process.env.PORT || '3000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/urlshortener',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@127.0.0.1:5672',

  jwtSecret: process.env.JWT_SECRET || 'dev-secret-please-change',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  baseUrl: process.env.BASE_URL || 'http://localhost:5175',
  redirectCacheTtl: parseInt(process.env.REDIRECT_CACHE_TTL || '3600', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '120', 10),

  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001',
  linkServiceUrl: process.env.LINK_SERVICE_URL || 'http://127.0.0.1:3002',
  redirectServiceUrl: process.env.REDIRECT_SERVICE_URL || 'http://127.0.0.1:3003',
  analyticsApiUrl: process.env.ANALYTICS_API_URL || 'http://127.0.0.1:3005',

  allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:5175',

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

export default config;
