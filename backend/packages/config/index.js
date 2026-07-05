import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

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

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3000'),
  MONGO_URI: z.string().default('mongodb://127.0.0.1:27017/urlshortener'),
  MONGO_READ_PREFERENCE: z.string().nullable().optional(),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  RABBITMQ_URL: z.string().default('amqp://guest:guest@127.0.0.1:5672'),

  JWT_SECRET: z.string().default('dev-secret-please-change'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  BASE_URL: z.string().default('http://localhost:5175'),
  REDIRECT_CACHE_TTL: z.string().regex(/^\d+$/).transform(Number).default('3600'),
  RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).default('100'),
  RATE_LIMIT_WINDOW: z.string().regex(/^\d+$/).transform(Number).default('120'),

  AUTH_SERVICE_URL: z.string().default('http://127.0.0.1:3001'),
  LINK_SERVICE_URL: z.string().default('http://127.0.0.1:3002'),
  REDIRECT_SERVICE_URL: z.string().default('http://127.0.0.1:3003'),
  ANALYTICS_API_URL: z.string().default('http://127.0.0.1:3005'),

  ALLOWED_ORIGIN: z.string().default('http://localhost:5175'),

  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.string().regex(/^\d+$/).transform(Number).default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

let parsedEnv;
try {
  parsedEnv = envSchema.parse(process.env);
} catch (err) {
  console.error("❌ Invalid environment variables:", JSON.stringify(err.flatten().fieldErrors, null, 2));
  process.exit(1);
}

const config = {
  nodeEnv: parsedEnv.NODE_ENV,
  isDev: parsedEnv.NODE_ENV === 'development',
  port: parsedEnv.PORT,
  mongoUri: parsedEnv.MONGO_URI,
  mongoReadPreference: parsedEnv.MONGO_READ_PREFERENCE,
  redisUrl: parsedEnv.REDIS_URL,
  rabbitmqUrl: parsedEnv.RABBITMQ_URL,
  jwtSecret: parsedEnv.JWT_SECRET,
  jwtAccessExpiresIn: parsedEnv.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: parsedEnv.JWT_REFRESH_EXPIRES_IN,
  baseUrl: parsedEnv.BASE_URL,
  redirectCacheTtl: parsedEnv.REDIRECT_CACHE_TTL,
  rateLimitMax: parsedEnv.RATE_LIMIT_MAX,
  rateLimitWindow: parsedEnv.RATE_LIMIT_WINDOW,
  authServiceUrl: parsedEnv.AUTH_SERVICE_URL,
  linkServiceUrl: parsedEnv.LINK_SERVICE_URL,
  redirectServiceUrl: parsedEnv.REDIRECT_SERVICE_URL,
  analyticsApiUrl: parsedEnv.ANALYTICS_API_URL,
  allowedOrigin: parsedEnv.ALLOWED_ORIGIN,
  smtp: {
    host: parsedEnv.SMTP_HOST,
    port: parsedEnv.SMTP_PORT,
    user: parsedEnv.SMTP_USER,
    pass: parsedEnv.SMTP_PASS,
  },
};

export default config;
