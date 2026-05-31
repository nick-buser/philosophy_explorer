# INFRA — In-house versioned DB migration runner

**Branch:** `infra/db-migration-runner`
**Merged:** (pending)

## What changed

### Migration runner
- **`Db/Migrations.fs`** (new) — forward-only, ordered, journaled runner.
  `schema_migrations(id, applied_at)` journal; an append-only `migrations` list
  of `{ Id; Up: conn -> tx -> unit }`; `run` applies un-recorded migrations in
  order, each in its own transaction, then records it (timestamp set from F#,
  dialect-neutral). `appliedIds` / `latestApplied` helpers.
- **`0001_baseline`** = the entire current schema, relocated out of
  `Seed.createTables` (+ the `origin` `ADD COLUMN IF NOT EXISTS`). All
  `… IF NOT EXISTS`, so it no-ops on an already-populated DB and builds a fresh
  one — see "adoption" below.

### Migrations vs seed-data split
- **`Db/Seed.fs`** — `createTables` + `migrateSchema` removed (moved to the
  baseline). `run` now calls `Migrations.run conn` then does the same idempotent
  JSON inserts. Net: Migrations own *structure*, Seed owns *content*.
- **`.fsproj`** — `Db/Migrations.fs` compiles before `Db/Seed.fs`.

### Auto-apply on deploy
- **`Dockerfile`** entrypoint is now **seed-then-serve**: `--seed` runs (no
  `exec`) then the server `exec`s. With `RUN_SEED=true` on the Dokploy slot every
  deploy applies pending migrations before serving; `set -e` keeps it fail-fast.
- **Ops:** set `RUN_SEED=true` on the `philosophy-explorer-{dev,prod}` slots.

### Sync visibility
- **`/api/health`** gains `schemaVersion` (= `Migrations.latestApplied`), via
  `HealthResponseDto` (`Domain/Dtos.fs`) + `Routes/HealthRoutes.fs`. Curl dev vs
  prod and compare to confirm they're in sync. (No spec/type change: responses
  are untyped in this project — see notes — so the field lives in the F# DTO and
  the live JSON only.)

### Tests + docs + incidental
- **`PhilosophyExplorer.Tests/ArgumentTests.fs`** — +3 migration tests (baseline
  recorded, `latestApplied`, idempotent re-run). 43 total, green.
- **`docs/db-migrations.md`** — the convention (add a migration, journal,
  migrations-vs-seed, dialect rules, adoption, sync check).
- **`scripts/gen-spec.sh`** (incidental) — Python 3.14's `json.tool` colorizes
  even when redirected, embedding ANSI escapes that corrupt `openapi.json` and
  break `gen:types`. Added `NO_COLOR=1 PYTHON_COLORS=0`.

## Why

`migrateSchema`'s `ADD COLUMN IF NOT EXISTS` was idempotent-by-guard-clause: fine
for additive changes but with **no record of what's applied**, so there was no
way to answer "is prod at the same schema as dev?" — a real concern given dev-PG
redeploys on every `main` push while prod-PG only moves on a tag, so prod is
routinely several changes behind. A journaled, ordered, forward-only runner makes
a lagging env safely catch up on its backlog at deploy time, and the
`schema_migrations` journal (+ `schemaVersion` in health) makes drift visible.

## Notes for future work

- **Adoption is the key property, and it's verified live.** First run against the
  already-populated dev-PG (data present, no journal) created `schema_migrations`,
  ran `0001_baseline` as a no-op (counts unchanged 101/136/99, `origin` intact),
  and recorded `0001`. Prod will adopt identically on its next deploy. No data
  touched. Fresh DBs build from `0001`.
- **SQLite is disposable.** Forward migrations target Postgres; SQLite's `ALTER`
  is limited, so if a migration can't run on SQLite, guard it to Postgres and
  recreate `dev.db` locally. `0001_baseline` is dialect-aware and runs on both.
- **Multi-replica caveat.** Auto-migrate-on-boot is safe for single-replica slots
  (current). If a slot ever scales out, move migrations to a one-shot pre-deploy
  job so replicas don't race on DDL.
- **`RUN_SEED=true` must be set on the Dokploy dev/prod slots** for auto-apply —
  it is otherwise `false` (image default). Until then, migrations still apply via
  a manual `--seed` (how dev/prod were seeded for v1.0.0).
- **OpenAPI is still response-shape-only** (no `.Produces`), so `schemaVersion`
  doesn't appear in the generated spec/types and isn't consumed by the web; it's
  an ops/curl field. Adding `.Produces` across routes remains a separate ticket.
- **Real migration tool** (DbUp / FluentMigrator / Atlas) is the eventual upgrade
  if schema changes get complex (drops, retypes, backfills beyond add-column).
  This runner is the seam where that would slot in.
