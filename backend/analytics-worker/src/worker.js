import http from 'http';
import { connectMongo, disconnectMongo } from '@pklinks/utils/mongoose';
import { connect as connectRabbitMQ, subscribe } from '@pklinks/utils/rabbitmq';
import { createLogger } from '@pklinks/utils/logger';
import { processClickEvent } from './processor.js';
import { startBatcher, stopBatcher } from './batcher.js';

const logger = createLogger('analytics-worker');
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);
let healthServer;

function startHealthCheckServer() {
  const port = process.env.PORT || 0;
  const server = http.createServer((req, res) => {
    if (req.url === '/health' || req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy', service: 'analytics-worker' }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  server.listen(port, () => {
    logger.info(`Health check server listening on port ${port}`);
  });
  return server;
}

async function startWorker() {
  try {
    healthServer = startHealthCheckServer();
    await connectMongo();
    logger.info('MongoDB connected');

    await connectRabbitMQ();
    logger.info('RabbitMQ connected');

    startBatcher();

    await subscribe(
      'analytics.clicks',
      'click.event',
      processClickEvent,
      {
        prefetch:   CONCURRENCY,
        deadLetter: true,
        maxRetries: 3,
      }
    );

    logger.info(`analytics-worker started, processing up to ${CONCURRENCY} messages at a time`);
  } catch (err) {
    logger.error({ err }, 'Failed to start analytics-worker');
    process.exit(1);
  }
}

startWorker();

async function shutdown() {
  logger.info('Shutting down analytics-worker...');
  if (healthServer) {
    healthServer.close();
  }
  await stopBatcher();
  await disconnectMongo();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);
