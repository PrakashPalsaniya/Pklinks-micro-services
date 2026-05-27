import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import config from '@pklinks/config';

export function jwtGuard(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or invalid' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = payload.sub;
    next();
  } catch (err) {
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

  return createProxyMiddleware({
    target:       targetUrl,
    changeOrigin: true,
    pathFilter:   filterFn,
    onProxyReq: (proxyReq, req) => {
      if (req.userId) {
        proxyReq.setHeader('x-user-id', req.userId);
      }

      if (typeof options.onProxyReq === 'function') {
        options.onProxyReq(proxyReq, req);
      }
    },
    on: {
      error: (err, req, res) => {
        console.error(`[gateway] Proxy error to ${targetUrl}: ${err.message}`);
        if (!res.headersSent) {
          res.status(502).json({ message: 'Service unavailable — please try again later' });
        }
      },
    },
  });
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

  app.use((req, res, next) => {
    if (protectedPrefixes.some(prefix => req.path.startsWith(prefix))) {
      return jwtGuard(req, res, next);
    }
    next();
  });

  app.use(proxy(auth, [
    '/api/auth/signup',
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/logout',
    '/api/auth/me'
  ]));


  app.use(proxy(analytics, '/api/links/*/analytics'));

  app.use(proxy(link, [
    '/api/links',
    '/api/links/**'
  ]));

  app.use(proxy(redirect, [
    '/api/redirect',
    '/api/redirect/**',
    '/r',
    '/r/**'
  ]));
}
