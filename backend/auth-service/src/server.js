import app from './app.js';
import config from '@pklinks/config';
import { connectMongo, disconnectMongo } from '@pklinks/utils/mongoose';
import { connect as connectRabbitMQ } from '@pklinks/utils/rabbitmq';
import { createLogger } from '@pklinks/utils/logger';

const logger = createLogger('auth-service');

async function startServer() {
  try {
    await connectMongo();
    logger.info('MongoDB connected');

    await connectRabbitMQ();
    logger.info('RabbitMQ connected');

    const port = config.port || 3001;
    app.listen(port, () => {
      logger.info(`auth-service listening on port ${port}`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start auth-service');
    process.exit(1);
  }
}

startServer();

async function shutdown() {
  logger.info('Shutting down auth-service...');
  await disconnectMongo();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);
