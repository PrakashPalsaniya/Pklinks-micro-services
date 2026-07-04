import express from 'express';
import { handleRedirect, getRedirectInfo } from './redirect.handler.js';

export function createApp(redisClient) {
  const app = express();

  app.set('trust proxy', true);
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'redirect-service' });
  });

  // Real Redis stats for the Architecture dashboard
  app.get('/api/arch-stats', async (req, res) => {
    try {
      const info = await redisClient.info('stats');
      const lines = info.split('\r\n');
      const get = (key) => {
        const line = lines.find(l => l.startsWith(key + ':'));
        return line ? parseInt(line.split(':')[1], 10) : 0;
      };

      const hits   = get('keyspace_hits');
      const misses = get('keyspace_misses');
      const total  = hits + misses;
      const hitRate = total > 0 ? (hits / total) * 100 : 0;

      // Count redirect:* keys in Redis
      const redirectKeys = await redisClient.dbsize();

      res.json({
        redis: {
          hits,
          misses,
          total,
          hitRate: parseFloat(hitRate.toFixed(2)),
          keyCount: redirectKeys,
        },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/r/:code', (req, res) => handleRedirect(redisClient, req, res));
  app.get('/api/redirect/:code', (req, res) => getRedirectInfo(redisClient, req, res));

  return app;
}
