# Database migrations

Schema changes are applied by a small in-house **versioned migration runner**
(`packages/api-fsharp/PhilosophyExplorer.Api/Db/Migrations.fs`). It is
forward-only, ordered, and journaled — enough to keep the long-lived Postgres
environments in sync without a heavyweight framework.

## Model

- **Journal table** `schema_migrations (id, applied_at)` records which migrations
  a database has. `SELECT id FROM schema_migrations` (or `GET /api/health` →
  `schemaVersion`) answers "what schema is this env at?".
- **Ordered, append-only list** `Migrations.migrations`. Each entry is
  `{ Id; Up: conn -> tx -> unit }`. `Migrations.run` applies any id not in the
  journal, **in order, each in its own transaction**, then records it. A lagging
  env (prod deploys on a tag; dev on every push) catches up by applying its
  backlog on its next deploy.
- **Fail-fast**: a migration that throws aborts startup (the entrypoint runs
  under `set -e`), so a half-migrated DB is never served.

## Migrations vs. seed data

- **Migrations = structure** (DDL). They live in `Db/Migrations.fs`.
- **Seed = content** (the JSON-driven reference/corpus rows). `Db/Seed.fs`
  inserts them idempotently (`INSERT … ON CONFLICT DO NOTHING`). `Seed.run` calls
  `Migrations.run` first, then seeds.

Keep them separate: a schema change is a migration; new rows are seed data.

## Adding a migration

1. Append a new entry to `Migrations.migrations` with the next zero-padded id,
   e.g. `0002_add_argument_tags`. **Never edit or reorder a shipped migration** —
   it may already be recorded somewhere; add a new one instead.
2. Write `Up` as raw SQL via the `exec conn tx "<sql>"` helper. Make it
   dialect-aware where the SQL differs (`match DbFactory.dialect with …`), as the
   baseline does for timestamp defaults.
3. Add/extend a test in `PhilosophyExplorer.Tests` (a fresh DB applies it; a
   re-run is a no-op).

## Dialects

- **Postgres (dev + prod, NAS)** is the migration target. Migrations run on every
  deploy (`RUN_SEED=true` on the Dokploy slot → the entrypoint runs `--seed`,
  which migrates then serves).
- **SQLite (local `dev.db`)** is **disposable** — recreate it (`rm dev.db &&
  npm run db:seed`) rather than migrating. SQLite's `ALTER` is limited (no
  `ADD COLUMN IF NOT EXISTS`, no easy drop/retype), so if a forward migration
  can't run on SQLite, guard it to Postgres and rely on the local rebuild. The
  baseline (`0001_baseline`) is dialect-aware and runs on both.

## Adopting an already-populated database

`0001_baseline` is the full schema expressed entirely with `… IF NOT EXISTS`. On
a database that already has the schema (e.g. an env seeded before the runner
existed) it is a **no-op that just gets recorded**; on a fresh DB it builds
everything. Either way the env converges to "0001_baseline applied" with no data
disruption.

## Checking sync

```bash
curl -s https://philosophy-explorer-dev.app.lab/api/health | jq .schemaVersion
curl -s https://philosophy-explorer.app.lab/api/health     | jq .schemaVersion
```

Equal `schemaVersion` ⇒ the two environments are at the same schema.
