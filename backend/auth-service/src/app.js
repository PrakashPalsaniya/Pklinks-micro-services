import express from 'express';
import cookieParser from 'cookie-parser';
import * as controller from './auth/auth.controller.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { forgotPasswordLimiter } from './middleware/rate-limit.middleware.js';

const app = express();

app.set('trust proxy', 1);

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

app.post('/api/auth/signup',  controller.signup);
app.post('/api/auth/login',   controller.login);
app.post('/api/auth/refresh', controller.refresh);

app.post('/api/auth/forgot-password', forgotPasswordLimiter, controller.forgotPassword);
app.post('/api/auth/reset-password',  controller.resetPassword);

app.post('/api/auth/logout', requireAuth, controller.logout);
app.get('/api/auth/me',      requireAuth, controller.getMe);

app.use(errorHandler);

export default app;
