import { subscribe } from '@pklinks/utils/rabbitmq';
import { bustCache, setCache } from './cache.js';

export async function startLinkEventConsumer(redisClient) {
  await subscribe(
    'redirect.cache.bust',
    'link.*',
    async (payload, routingKey) => {
      const { code, originalUrl, isActive } = payload;
      if (!code) {
        console.warn('[consumer] Received link event without code, skipping');
        return;
      }

      if (routingKey === 'link.created' || routingKey === 'link.updated') {
        if (isActive !== false && originalUrl) {
          await setCache(redisClient, code, originalUrl);
          console.log(`[consumer] Cache primed for code: ${code} (${routingKey})`);
        } else {
          await bustCache(redisClient, code);
          console.log(`[consumer] Cache busted for code: ${code} (inactive/deleted)`);
        }
      } else {
        // Fallback for link.deleted or any other event
        await bustCache(redisClient, code);
        console.log(`[consumer] Cache busted for code: ${code} (${routingKey})`);
      }
    },
    1
  );

  console.log('[consumer] Listening for link.* events to bust Redis cache');
}
