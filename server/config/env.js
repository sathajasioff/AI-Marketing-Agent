import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootEnvPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: rootEnvPath });

const readEnv = (name) => {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
};

const isValidUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export const env = {
  PORT: Number(readEnv('PORT')) || 5000,
  MONGO_URI: readEnv('MONGO_URI'),
  ANTHROPIC_API_KEY: readEnv('ANTHROPIC_API_KEY'),
  CLIENT_URL: isValidUrl(readEnv('CLIENT_URL')) ? readEnv('CLIENT_URL') : 'http://localhost:5173',
  GHL_API_KEY: readEnv('GHL_API_KEY'),
  GHL_LOCATION_ID: readEnv('GHL_LOCATION_ID'),
};

export const requireEnv = (...names) => {
  const missing = names.filter((name) => !env[name]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Check ${rootEnvPath}`);
  }
};

export { rootEnvPath };
