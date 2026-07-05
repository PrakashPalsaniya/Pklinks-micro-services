import express from 'express';
import * as controller from './links/link.controller.js';
import { requireAuth } from '@pklinks/utils/auth';
import { errorHandler } from './middleware/error.middleware.js';
import { validate } from '@pklinks/utils/validate';
import { createLinkSchema, updateLinkSchema } from './links/link.schemas.js';

const app = express();
app.set('trust proxy', true);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'link-service' });
});

app.use('/api/links', requireAuth);

app.get('/api/links',        controller.listLinks);
app.get('/api/links/:code',  controller.getLink);
app.post('/api/links',       validate(createLinkSchema), controller.createLink);
app.patch('/api/links/:code', validate(updateLinkSchema), controller.updateLink);
app.delete('/api/links/:code', controller.deleteLink);

app.use(errorHandler);

export default app;
