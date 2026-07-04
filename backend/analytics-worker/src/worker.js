import { connectMongo, disconnectMongo } from '@pklinks/utils/mongoose';
import { connect as connectRabbitMQ, subscribe } from '@pklinks/utils/rabbitmq';
import { createLogger } from '@pklinks/utils/logger';
import { processClickEvent } from './processor.js';

const logger = createLogger('analytics-worker');

const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);

async function startWorker() {
  try {
    await connectMongo();
    logger.info('MongoDB connected');

    await connectRabbitMQ();
    logger.info('RabbitMQ connected');

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
  await disconnectMongo();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);
