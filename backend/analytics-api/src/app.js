import express from 'express';
import * as controller from './analytics.controller.js';

const app = express();
app.set('trust proxy', true);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'analytics-api' });
});

app.use('/api/links/:code/analytics', (req, res, next) => {
  if (!req.headers['x-user-id']) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  next();
});

app.get('/api/links/:code/analytics', controller.getLinkAnalytics);

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status  = err.statusCode || 500;
  const message = err.message    || 'Internal server error';
  if (status === 500) console.error('[error]', err);
  res.status(status).json({ message });
});

export default app;
