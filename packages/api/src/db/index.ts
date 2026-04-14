// DB adapter factory.
//
// Dialect is auto-detected from DATABASE_URL:
//   file:./dev.db      → SQLite via @libsql/client (dev default)
//   postgresql://...   → Postgres via postgres-js  (production)
//
// The exported `db` and `schema` are typed as the Postgres dialect in all
// environments — Postgres is the production dialect and the source of truth
// for TypeScript correctness. The SQLite adapter casts to match; row shapes
// are isomorphic so this is safe at runtime.
//
// ── Auxiliary graph DB (future) ───────────────────────────────────────────────
// When deep traversal queries (Brandomian entailment chains, multi-hop influence
// paths) outgrow what Postgres recursive CTEs can handle, Neo4j is the likely
// next layer. The pattern would be a separate neo4j.ts client alongside this
// file — not a replacement for the relational layer, but an auxiliary:
//   import { neo4j } from './neo4j.js'  ← not yet wired
// Postgres stays as the system of record; Neo4j mirrors the graph edges for
// traversal-heavy queries. Configure only when the need is concrete.
// ─────────────────────────────────────────────────────────────────────────────

import type { PgDb, PgSchema } from './adapters/postgres.js';

const url = process.env.DATABASE_URL ?? 'file:./dev.db';
const isSQLite = url.startsWith('file:') || url.startsWith(':memory:');

const adapter = await (isSQLite
  ? import('./adapters/sqlite.js')
  : import('./adapters/postgres.js'));

export const db: PgDb         = adapter.db;
export const schema: PgSchema = adapter.pgSchema;
