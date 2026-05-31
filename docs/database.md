# Data layer — architecture & decisions

A consolidated reference for how philosophy-explorer stores data: the stores,
the schema, how it's accessed, migrated, seeded, written to, and deployed. For
the migration *mechanics* specifically, see [`db-migrations.md`](db-migrations.md).

## Stores & dialect

The dialect is auto-detected from `DATABASE_URL` (`Db/DbFactory.fs`):

| `DATABASE_URL` | Dialect | Driver |
|---|---|---|
| `file:./dev.db`, `:memory:` (default) | SQLite | `Microsoft.Data.Sqlite` |
| `postgresql://…` | Postgres | `Npgsql` |

Three concrete stores exist:

| Store | Engine | Lifecycle |
|---|---|---|
| **local `dev.db`** | SQLite | **disposable** — recreate (`rm dev.db && npm run db:seed`), never migrated |
| **dev** (`philosophy_explorer_dev` @ `192.168.1.12`) | Postgres (NAS) | long-lived; redeploys on every `main` push |
| **prod** (`philosophy_explorer_prod` @ `192.168.1.12`) | Postgres (NAS) | long-lived; redeploys on a version tag |

One DDL serves both engines via small dialect substitutions: SQLite's
`datetime('now')` defaults become `now()::text` on Postgres, and
`INSERT OR IGNORE` is rewritten to `… ON CONFLICT DO NOTHING` (`skipDuplicates`
in `Db/Seed.fs`). `is_primary` is stored as an integer (0/1) on both; Dapper maps
it to `bool` on read.

## Schema

Defined as the `0001_baseline` migration in `Db/Migrations.fs` (all
`… IF NOT EXISTS`). Two groups plus a journal:

**Catalog / entities:** `users`, `schools`, `philosophers`, `philosopher_schools`,
`philosopher_influences`, `works`, `notes`. Slugs are `UNIQUE` (the seeder relies
on this for idempotency).

**Arguments** (the formalized-argument model):

| Table | Holds |
|---|---|
| `arguments` | id (= `extraction_id`), `origin`, `work_id`→works, source span, intent, extractor_note |
| `argument_clauses` | premises/conclusion/claim rows, positional |
| `argument_formalizations` | `formalism`, `is_primary`, `ast_json` (opaque blob), fit/reason |
| `argument_formalism_assessments` | runner-up formalisms (fit score only) |
| `argument_reviewer_notes` | ordered notes |
| `argument_attributions` | `philosopher_id`, `work_id`, **`formalization_id`** (ties an attribution to a specific formalization), provenance, source_text |

**Journal:** `schema_migrations(id, applied_at)` — which migrations a DB has.

Design points:
- **An argument lifts above any single formalism.** It's a clause sequence +
  N formalizations; today's extraction becomes one argument with one primary
  formalization.
- **AST payloads are stored as raw JSON** (`ast_json`), opaque to the F# side.
  The web client narrows on `formalism` and parses with the existing Logic Lab
  TS types. This keeps the wire schema stable as the 15 formalisms evolve.
- **`origin`** = `'import'` (seeded from claim_extractor) | `'user'` (created
  in-app). See the write model below.

## Access

- **Dapper** with raw SQL (works on both dialects). `MatchNamesWithUnderscores`
  maps snake_case columns to PascalCase — set via `Queries.configureDapper ()`,
  called explicitly at every entry point (web host, seeder, tests) because an
  F# module `do` doesn't reliably run before first use.
- **F# DTOs are the source of truth for wire shapes** (`Domain/Dtos.fs`).
  Swashbuckle generates the OpenAPI spec; `openapi-typescript` generates the TS
  client types (`packages/web/src/lib/api-types.ts`).
- **Caveat:** no route uses `.Produces<T>()`, so the spec is *request-shape-only*
  — response bodies are `content?: never`, and response wire types on the web are
  hand-mirrored. (Why `schemaVersion` on `/api/health` doesn't appear in the
  generated types; it's an ops/curl field.)

## Migrations

In-house, forward-only, ordered, journaled — see [`db-migrations.md`](db-migrations.md)
for the full convention. Summary: `Db/Migrations.fs` keeps an append-only list of
`{ Id; Up }`; `run` applies any id not in `schema_migrations`, in order, each in
its own transaction. **Migrations own structure; seed owns content.** A lagging
env catches up on its backlog at deploy time; `0001_baseline` no-ops on an
already-populated DB (so existing dev/prod were adopted with zero disruption) and
builds a fresh one.

## Seeding (content)

`Seed.run` (the `--seed` entrypoint) runs migrations, then idempotently inserts
content from `data/seed/*.json` (`INSERT … ON CONFLICT DO NOTHING`, keyed on
unique slug / `extraction_id`, so re-seeding never duplicates).

**Argument import pipeline:** `scripts/build-arguments-seed.mjs` converts
claim_extractor extractions (`../claim_extractor/extractions/**/*.json`) into
`data/seed/arguments.json`. It maps all **15 formalisms**, passes AST payloads
through verbatim, and emits `origin: 'import'`. The argument id is the
`extraction_id` verbatim (`author/work/slug`), giving stable, human-readable
detail URLs.

**Slug resolution:** claim_extractor uses short author slugs (`russell`); the
philosophers seed uses full-name slugs (`bertrand-russell`). The importer
resolves exact-then-unique-suffix, lifting attribution coverage to **95/99**
(only `dasgupta` and `gotama`, absent from `philosophers.json`, remain).

**Known catalog gap:** **53/99 arguments have a null `work_id`** — 26 works
(most Plato minor dialogues, the Aristotle Organon, Brandom, etc.) aren't in
`works.json`; two are slug variants (`kant/groundwork` →
`groundwork-of-the-metaphysics-of-morals`, `nietzsche/genealogy-of-morals` →
`genealogy-of-morality`). Source span (file/lines/excerpt) is always preserved,
so "source" is never lost — only the normalized work link. Backfilling
`works.json` (+ adding the two philosophers) is a future `DB` ticket.

## Write model / CRUD (arguments)

The DB is **authoritative** for arguments, with a write API (`POST`/`PUT`/`DELETE`
in `Routes/ArgumentRoutes.fs`):

- **`POST`** mints a UUID id and sets `origin='user'`. **`PUT`** replaces the
  whole argument graph in one transaction (delete children + re-insert) — so an
  editor must round-trip *all* child sections or they're dropped. **`DELETE`**
  cascades via FK.
- **The importer stays additive** (`INSERT OR IGNORE` / `ON CONFLICT DO
  NOTHING`): it only adds new extractions and **never clobbers in-app edits**.
  `origin` distinguishes imported vs user rows.
- **Consequence:** once an `extraction_id` is imported, a re-seed skips it
  forever — so later claim_extractor edits to that passage don't propagate.
  Accepted under "DB authoritative."
- **Dialect-portable writes:** `updated_at` on `PUT` is set from F# (not
  SQLite-only `datetime('now')`), so writes work on Postgres.

## Deployment & operations

- **The Postgres DB is external** to the app container (NAS). So data persists
  across container restarts/redeploys — seeding a fresh env's DB **once** is
  enough.
- **Entrypoint is seed-then-serve** (`Dockerfile`): when `RUN_SEED=true`,
  `--seed` runs (migrations + content) and returns, then the server `exec`s.
  `set -e` makes a failed migration crash the container rather than serve a
  half-migrated DB. **Set `RUN_SEED=true` on the dev/prod Dokploy slots** to get
  auto-apply-on-deploy (image default is `false`).
- **Sync check:** `GET /api/health` returns `schemaVersion` (latest applied
  migration). Compare dev vs prod:
  ```bash
  curl -s https://philosophy-explorer-dev.app.lab/api/health | jq .schemaVersion
  curl -s https://philosophy-explorer.app.lab/api/health     | jq .schemaVersion
  ```
- **First-deploy gotcha (observed at v1.0.0):** a fresh deploy serves but every
  DB-table endpoint 500s until the external DB is seeded. With `RUN_SEED=true`
  the entrypoint handles it on boot; otherwise run `--seed` once against the
  target (`DATABASE_URL=<target> dotnet run -- --seed`). Health/`SELECT 1` and
  the in-memory graph endpoints work regardless, which is the tell-tale.

## Key decisions

| Decision | Rationale |
|---|---|
| F# DTOs as wire source of truth; OpenAPI codegen for TS | No manual type sync; ML-family types suit logical structures |
| AST stored as opaque JSON, not modeled in F# | Wire schema stable across 15 evolving formalisms; web parses with Logic Lab types |
| DB authoritative + additive import (`origin` flag) | In-app edits never clobbered by a re-seed; import still bulk-adds new material |
| Migrations split from seed; in-house journaled runner | Version visibility + ordered forward-only changes keep dev/prod in sync at different deploy cadences, without a heavy framework |
| SQLite-dev disposable; Postgres is the migration target | SQLite's `ALTER` is too limited to migrate; local dev rebuilds cheaply |
| External Postgres + seed-then-serve on boot | Data persists across deploys; fresh envs self-seed once `RUN_SEED=true` |
