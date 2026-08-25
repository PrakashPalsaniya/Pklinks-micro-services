import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { verifyAccessToken } from '@pklinks/utils/auth';
import config from '@pklinks/config';

export function jwtGuard(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or invalid' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch (err) {
    console.error('[jwtGuard] Token verification failed:', err.name, '-', err.message);
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
}

function proxy(targetUrl, filterPaths, options = {}) {
  const filterFn = typeof filterPaths === 'function' ? filterPaths : (pathname) => {
    const prefixes = Array.isArray(filterPaths) ? filterPaths : [filterPaths];
    return prefixes.some(prefix => {
      if (prefix.endsWith('/**')) {
        return pathname.startsWith(prefix.slice(0, -2));
      }

      if (prefix.includes('/*/')) {
        const regex = new RegExp('^' + prefix.replace('/*', '/[^/]+') + '$');
        return regex.test(pathname);
      }
      return pathname === prefix || pathname.startsWith(`${prefix}/`);
    });
  };

  let middlewareInstance;

  const proxyOptions = {
    target:       targetUrl,
    changeOrigin: true,
    pathFilter:   filterFn,
    on: {
      proxyReq: (proxyReq, req) => {
        // Pass verified user ID to microservices
        if (req.userId) {
          proxyReq.setHeader('x-user-id', req.userId);
        }

        proxyReq.setHeader('x-forwarded-for', req.ip);
        proxyReq.setHeader('x-forwarded-proto', req.protocol);

        // Re-serialize req.body so POST/PATCH payloads survive proxy retries
        fixRequestBody(proxyReq, req);

        if (typeof options.onProxyReq === 'function') {
          options.onProxyReq(proxyReq, req);
        }
      },
      error: async (err, req, res) => {
        const code = err.code;
        const isConnectionError = ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND'].includes(code);

        req.retries = req.retries || 0;

        // Render free tier takes ~30 seconds to wake up.
        // We retry 6 times, waiting 5 seconds between each (30s total).
        if (isConnectionError && req.retries < 6) {
          req.retries += 1;
          console.warn(`[gateway] Service at ${targetUrl} is offline (${code}). Retrying in 5s... (Attempt ${req.retries}/6)`);
          await new Promise(resolve => setTimeout(resolve, 5000));

          return middlewareInstance(req, res, (nextErr) => {
            if (nextErr && !res.headersSent) {
              res.status(502).json({ message: 'Service starting up — please reload in a moment.' });
            }
          });
        }

        console.error(`[gateway] Proxy error to ${targetUrl}: ${err.message}`);
        if (!res.headersSent) {
          res.status(502).json({ 
            message: 'Service is waking up. Please refresh the page in a few seconds.',
            wakingUp: true
          });
        }
      },
    },
  };

  middlewareInstance = createProxyMiddleware(proxyOptions);
  return middlewareInstance;
}

export function registerRoutes(app) {
  const auth      = config.authServiceUrl;
  const link      = config.linkServiceUrl;
  const redirect  = config.redirectServiceUrl;
  const analytics = config.analyticsApiUrl;

  const protectedPrefixes = [
    '/api/auth/logout',
    '/api/auth/me',
    '/api/links'
  ];

  // Global Auth Check
  app.use((req, res, next) => {
    if (protectedPrefixes.some(prefix => req.path.startsWith(prefix))) {
      return jwtGuard(req, res, next);
    }
    next();
  });

  // Routing setup
  app.use(proxy(auth, [
    '/api/auth/signup',
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/logout',
    '/api/auth/me'
  ]));

  // Order matters: analytics must be registered before general link routes
  app.use(proxy(analytics, '/api/links/*/analytics'));

  app.use(proxy(link, [
    '/api/links',
    '/api/links/**'
  ]));

  // Route to redirect-service
  app.use(proxy(redirect, [
    '/api/redirect',
    '/api/redirect/**',
    '/r',
    '/r/**'
  ]));
}
