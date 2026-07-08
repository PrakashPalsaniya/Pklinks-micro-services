import http from 'http';
import { connect, subscribe, disconnect } from '@pklinks/utils/rabbitmq';
import { handleEmailMessage } from './email.handler.js';

let healthServer;

function startHealthCheckServer() {
  const port = process.env.PORT || 3007;
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', service: 'notification-service' }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  server.listen(port, () => {
    console.log(`[notification-service] Health check server listening on port ${port}`);
  });
  return server;
}

async function bootstrap() {
  console.log('[notification-service] Starting...');

  try {
    healthServer = startHealthCheckServer();
    await connect();
    
    // Dead-letter after a few retries so a failing SMTP server doesn't requeue forever
    await subscribe('pklinks_email_queue', 'email.send', async (payload) => {
      await handleEmailMessage(payload);
    }, { deadLetter: true, maxRetries: 3 });

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
    if (healthServer) {
      healthServer.close();
    }
    await disconnect();
  } catch (err) {
    console.error('[notification-service] Error during shutdown:', err.message);
  }
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
