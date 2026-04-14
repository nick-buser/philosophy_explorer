// Barrel re-export of the Postgres schema.
// This file exists so existing imports (seed-data.ts, tests, etc.)
// continue to work without changes. The Postgres schema is the canonical
// type definition for the whole codebase regardless of active dialect.
export * from './schema/postgres.js';
