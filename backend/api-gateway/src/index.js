import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import config from '@pklinks/config';
import { registerRoutes } from './routes.js';
import { createLogger } from '@pklinks/utils/logger';

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

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: 'Too many requests — please slow down' },
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

app.use(globalLimiter);


registerRoutes(app);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const port = config.port || 3000;
app.listen(port, () => {
  logger.info(`api-gateway listening on port ${port}`);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down api-gateway...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Shutting down api-gateway...');
  process.exit(0);
});
