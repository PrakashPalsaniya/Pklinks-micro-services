import config from '@pklinks/config';
import { createApp } from './app.js';
import { connectMongo, disconnectMongo } from '@pklinks/utils/mongoose';
import { connect as connectRabbitMQ } from '@pklinks/utils/rabbitmq';
import { createRedisClient } from '@pklinks/utils/redis';
import { startLinkEventConsumer } from './consumer.js';
import { createLogger } from '@pklinks/utils/logger';

const logger = createLogger('redirect-service');

async function startServer() {
  try {
    await connectMongo();
    logger.info('MongoDB connected');

    const redisClient = createRedisClient();

    await connectRabbitMQ();
    logger.info('RabbitMQ connected');

    await startLinkEventConsumer(redisClient);

    const app  = createApp(redisClient);
    const port = config.port || 3003;

    app.listen(port, () => {
      logger.info(`redirect-service listening on port ${port}`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start redirect-service');
    process.exit(1);
  }
}

startServer();

async function shutdown() {
  logger.info('Shutting down redirect-service...');
  await disconnectMongo();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);
