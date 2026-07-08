import helmet from 'helmet';
import cors from 'cors';
import config from '@pklinks/config';

// applies the standard security headers + CORS to a service.
// pass { cors: false } for services that don't need cross-origin access.
export function applySecurity(app, { cors: enableCors = true } = {}) {
  app.use(helmet());

  if (enableCors) {
    app.use(cors({
      origin: config.allowedOrigin,
      credentials: true,
    }));
  }
}
