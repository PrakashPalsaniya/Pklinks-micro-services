import mongoose from 'mongoose';
import config from '@pklinks/config';

export async function connectMongo() {
  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

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
