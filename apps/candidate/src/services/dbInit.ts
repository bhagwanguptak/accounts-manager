import { initializeDatabase } from './database';

let initialized = false;

export async function ensureDbInitialized() {
  if (!initialized) {
    await initializeDatabase();
    initialized = true;
    console.log('[DB] Initialized');
  }
}

export default ensureDbInitialized;