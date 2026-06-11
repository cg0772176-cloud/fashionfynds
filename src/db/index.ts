
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/db/schema';

const url = process.env.TURSO_CONNECTION_URL || (process.env.NODE_ENV === 'production' ? '' : 'file:local.db');
const authToken = process.env.TURSO_AUTH_TOKEN;

if (process.env.NODE_ENV === 'production' && !process.env.TURSO_CONNECTION_URL) {
  console.error("CRITICAL ERROR: TURSO_CONNECTION_URL is missing in production!");
}

const client = createClient({
  url: url || 'file:local.db',
  ...(authToken && !url.startsWith('file:') ? { authToken } : {}),
});

export const db = drizzle(client, { schema });

export type Database = typeof db;