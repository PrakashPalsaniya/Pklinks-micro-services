import express from 'express';
import * as controller from './links/link.controller.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();
app.set('trust proxy', true);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'link-service' });
});

app.use('/api/links', requireAuth);

app.get('/api/links',        controller.listLinks);
app.get('/api/links/:code',  controller.getLink);
app.post('/api/links',       controller.createLink);
app.patch('/api/links/:code', controller.updateLink);
app.delete('/api/links/:code', controller.deleteLink);

app.use(errorHandler);

export default app;
