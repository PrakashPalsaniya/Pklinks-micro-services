import { subscribe } from '@pklinks/utils/rabbitmq';
import { bustCache, setCache } from './cache.js';

export async function startLinkEventConsumer(redisClient) {
  await subscribe(
    'pklinks_redirect_cache_bust',
    'link.*',
    async (payload, routingKey) => {
      const { code, originalUrl, isActive, expiresAt } = payload;
      if (!code) {
        console.warn('[consumer] Received link event without code, skipping');
        return;
      }

      const notExpired = !expiresAt || new Date(expiresAt) > new Date();

      if (routingKey === 'link.created' || routingKey === 'link.updated') {
        if (isActive !== false && originalUrl && notExpired) {
          await setCache(redisClient, code, originalUrl);
          console.log(`[consumer] Cache primed for code: ${code} (${routingKey})`);
        } else {
          await bustCache(redisClient, code);
          console.log(`[consumer] Cache busted for code: ${code} (inactive/deleted)`);
        }
      } else {
        await bustCache(redisClient, code);
        console.log(`[consumer] Cache busted for code: ${code} (${routingKey})`);
      }
    },
    { prefetch: 1, deadLetter: true, maxRetries: 3 }
  );

  console.log('[consumer] Listening for link.* events to bust Redis cache');
}
