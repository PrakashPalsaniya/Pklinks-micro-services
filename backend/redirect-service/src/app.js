import express from 'express';
import { handleRedirect, getRedirectInfo } from './redirect.handler.js';

export function createApp(redisClient) {
  const app = express();

  app.set('trust proxy', true);
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'redirect-service' });
  });

  app.get('/r/:code', (req, res) => handleRedirect(redisClient, req, res));
  app.get('/api/redirect/:code', (req, res) => getRedirectInfo(redisClient, req, res));

  return app;
}
