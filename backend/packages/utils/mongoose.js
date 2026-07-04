import mongoose from 'mongoose';
import config from '@pklinks/config';

/**
 * @param {{ readPreference?: string }} [options]
 */
export async function connectMongo(options = {}) {
  const readPreference = options.readPreference ?? config.mongoReadPreference ?? undefined;

  const connectOptions = {
    serverSelectionTimeoutMS: 10000,
  };

  if (readPreference) {
    connectOptions.readPreference = readPreference;
    console.log(`[mongo] readPreference=${readPreference}`);
  }

  await mongoose.connect(config.mongoUri, connectOptions);

  console.log('[mongo] Connected to MongoDB');

  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] Disconnected from MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[mongo] MongoDB error:', err.message);
  });
}

export async function disconnectMongo() {
  await mongoose.connection.close();
  console.log('[mongo] Connection closed');
}
