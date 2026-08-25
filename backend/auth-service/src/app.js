import express from 'express';
import cookieParser from 'cookie-parser';
import * as controller from './auth/auth.controller.js';
import { requireAuth } from '@pklinks/utils/auth';
import { applySecurity } from '@pklinks/utils/security';
import { errorHandler } from './middleware/error.middleware.js';
import { forgotPasswordLimiter, forgotPasswordIpLimiter, resetPasswordLimiter, loginLimiter, loginIpLimiter, signupLimiter } from './middleware/rate-limit.middleware.js';
import { validate } from '@pklinks/utils/validate';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth/auth.schemas.js';

const app = express();

app.set('trust proxy', 1);

applySecurity(app);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

app.post('/api/auth/signup', signupLimiter, validate(signupSchema), controller.signup);
app.post('/api/auth/login', loginIpLimiter, loginLimiter, validate(loginSchema), controller.login);
app.post('/api/auth/refresh', controller.refresh);

app.post('/api/auth/forgot-password', forgotPasswordIpLimiter, forgotPasswordLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
app.post('/api/auth/reset-password', resetPasswordLimiter, validate(resetPasswordSchema), controller.resetPassword);

app.post('/api/auth/logout', requireAuth, controller.logout);
app.get('/api/auth/me',      requireAuth, controller.getMe);

app.use(errorHandler);

export default app;
