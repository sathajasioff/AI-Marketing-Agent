import mongoose from 'mongoose';
import { env, requireEnv } from './env.js';
import Lead from '../models/Lead.js';

const reconcileLeadIndexes = async () => {
  try {
    const existingIndexes = await Lead.collection.indexes();
    const hasLegacyUniqueContactIndex = existingIndexes.some(
      (index) => index.name === 'ghlContactId_1'
    );

    if (hasLegacyUniqueContactIndex) {
      await Lead.collection.dropIndex('ghlContactId_1');
      console.log('ℹ️ Dropped legacy leads index: ghlContactId_1');
    }

    const hasLegacyCompositeIndex = existingIndexes.some(
      (index) => index.name === 'ghlContactId_1_ghlAccountId_1'
    );

    if (hasLegacyCompositeIndex) {
      await Lead.collection.dropIndex('ghlContactId_1_ghlAccountId_1');
      console.log('ℹ️ Dropped legacy leads index: ghlContactId_1_ghlAccountId_1');
    }

    await Lead.syncIndexes();
  } catch (err) {
    const namespaceMissing =
      err?.codeName === 'NamespaceNotFound' ||
      err?.message?.includes('ns not found');

    if (!namespaceMissing) {
      throw err;
    }
  }
};

const connectDB = async () => {
  try {
    requireEnv('MONGO_URI');
    const conn = await mongoose.connect(env.MONGO_URI);
    await reconcileLeadIndexes();
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    const isAuthError =
      err?.message?.toLowerCase().includes('bad auth') ||
      err?.message?.toLowerCase().includes('authentication failed');

    if (isAuthError) {
      console.error(
        `❌ MongoDB authentication failed for "${env.MONGO_URI}". Update MONGO_URI with a valid Atlas user/password or use a local URI like mongodb://127.0.0.1:27017/elev8-agent`
      );
    } else {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    }
    process.exit(1);
  }
};

export default connectDB;
