
import { defineConfig } from 'drizzle-kit';
import type { Config } from 'drizzle-kit';

const dbConfig: Config = defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.TURSO_CONNECTION_URL || 'file:local.db',
    ...(process.env.TURSO_AUTH_TOKEN && !(process.env.TURSO_CONNECTION_URL || 'file:local.db').startsWith('file:') 
      ? { authToken: process.env.TURSO_AUTH_TOKEN } 
      : {}),
  },
});

export default dbConfig;