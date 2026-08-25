import Redis from 'ioredis';
import config from '@pklinks/config';

export function createRedisClient(options = {}) {
  const client = new Redis(config.redisUrl, {
    lazyConnect: false,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    ...options,
  });

  client.on('connect', () => {
    console.log('[redis] Connected to Redis');
  });

  client.on('error', (err) => {
    console.error('[redis] Redis error:', err.message);
  });

  client.on('reconnecting', () => {
    console.log('[redis] Reconnecting to Redis...');
  });

  return client;
}
