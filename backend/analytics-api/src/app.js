import express from 'express';
import { requireAuth } from '@pklinks/utils/auth';
import { applySecurity } from '@pklinks/utils/security';
import * as controller from './analytics.controller.js';

const app = express();
app.set('trust proxy', 1);

applySecurity(app);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'analytics-api' });
});

app.get('/api/links/:code/analytics', requireAuth, controller.getLinkAnalytics);

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status  = err.statusCode || 500;
  const message = err.message    || 'Internal server error';
  if (status === 500) console.error('[error]', err);
  res.status(status).json({ message });
});

export default app;
