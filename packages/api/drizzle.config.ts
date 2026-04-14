import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url      = process.env.DATABASE_URL ?? 'file:./dev.db';
const isSQLite = url.startsWith('file:') || url.startsWith(':memory:');

export default isSQLite
  ? defineConfig({
      schema:       './src/db/schema/sqlite.ts',
      out:          './drizzle/sqlite',
      dialect:      'sqlite',
      dbCredentials: { url },
    })
  : defineConfig({
      schema:       './src/db/schema/postgres.ts',
      out:          './drizzle/postgres',
      dialect:      'postgresql',
      dbCredentials: { url },
    });
