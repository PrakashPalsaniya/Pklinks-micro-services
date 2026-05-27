import app from './app.js';
import config from '@pklinks/config';
import { connectMongo, disconnectMongo } from '@pklinks/utils/mongoose';
import { createLogger } from '@pklinks/utils/logger';

const logger = createLogger('analytics-api');

async function startServer() {
  try {
    await connectMongo();
    logger.info('MongoDB connected');

    const port = config.port || 3005;
    app.listen(port, () => {
      logger.info(`analytics-api listening on port ${port}`);
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start analytics-api');
    process.exit(1);
  }
}

startServer();

async function shutdown() {
  logger.info('Shutting down analytics-api...');
  await disconnectMongo();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT',  shutdown);
