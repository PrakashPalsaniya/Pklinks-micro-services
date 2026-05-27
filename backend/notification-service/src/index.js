import { connect, subscribe, disconnect } from '@pklinks/utils/rabbitmq';
import { handleEmailMessage } from './email.handler.js';

async function bootstrap() {
  console.log('[notification-service] Starting...');

  try {
    await connect();
    
    // Subscribe to email.send events
    await subscribe('email_queue', 'email.send', async (payload) => {
      await handleEmailMessage(payload);
    });

    console.log('[notification-service] Listening for email events...');
  } catch (err) {
    console.error('[notification-service] Bootstrap failed:', err.message);
    process.exit(1);
  }
}

bootstrap();

// ── Graceful shutdown ──────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`[notification-service] Received ${signal}, shutting down gracefully...`);
  try {
    await disconnect();
  } catch (err) {
    console.error('[notification-service] Error during shutdown:', err.message);
  }
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
