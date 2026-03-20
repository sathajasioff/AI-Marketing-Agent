import mongoose from 'mongoose';
import { env, requireEnv } from './env.js';

const connectDB = async () => {
  try {
    requireEnv('MONGO_URI');
    const conn = await mongoose.connect(env.MONGO_URI);
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
