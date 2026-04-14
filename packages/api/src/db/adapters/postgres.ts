import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../schema/postgres.js';

const client = postgres(process.env.DATABASE_URL!);

export const db     = drizzle(client, { schema });
export const pgSchema = schema;

export type PgDb     = typeof db;
export type PgSchema = typeof schema;
