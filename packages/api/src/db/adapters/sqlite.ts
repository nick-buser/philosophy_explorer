import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as sqliteSchema from '../schema/sqlite.js';
import type { PgDb, PgSchema } from './postgres.js';

const client = createClient({
  url: process.env.DATABASE_URL ?? 'file:./dev.db',
});

const _db     = drizzle(client, { schema: sqliteSchema });
const _schema = sqliteSchema;

// The Postgres schema is the canonical TypeScript type across the codebase.
// Both dialects produce identical row shapes, so this cast is safe at runtime.
// All TypeScript inference in routes and queries uses the Postgres types.
export const db     = _db     as unknown as PgDb;
export const pgSchema = _schema as unknown as PgSchema;
