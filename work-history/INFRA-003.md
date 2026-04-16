# INFRA-003 — F# Backend Migration

**Branch:** `infra/INFRA-003-fsharp-backend`
**Merged:** 2026-04-15

## What changed

- Added `packages/api-fsharp/` — complete F# 9 + ASP.NET Minimal API backend
  - `Domain/Types.fs` — DB entity types mirroring the Postgres schema (string IDs, Nullable<int> for optional ints)
  - `Domain/Dtos.fs` — all API response DTOs with JsonPropertyName attributes for exact camelCase wire format
  - `Db/DbFactory.fs` — SQLite/Postgres dual-dialect connection factory (mirrors original src/db/index.ts pattern)
  - `Db/Queries.fs` — Dapper-based raw SQL queries for all entity retrieval
  - `Db/Seed.fs` — database seeder reading JSON seed files, creates tables for SQLite dev mode
  - `Graph/GraphTypes.fs` — graph domain types (node labels, edge types, graphology JSON deserialization types)
  - `Graph/MemoryGraphService.fs` — in-memory graph with adjacency lists, replaces graphology (loads graph-data.json directly)
  - `Routes/HealthRoutes.fs` — GET /api/health with DB connectivity check
  - `Routes/PhilosopherRoutes.fs` — GET /api/philosophers, GET /api/philosophers/{slug}
  - `Routes/CatalogRoutes.fs` — GET /api/works, /api/works/{slug}, /api/schools, /api/schools/{slug}
  - `Routes/GraphRoutes.fs` — all 8 graph endpoints (stats, node, neighbors, path, influence, school, curriculum, influence-network)
  - `Program.fs` — entry point with CORS, Swagger/OpenAPI, --seed CLI mode
- Added `PhilosophyExplorer.Tests/` — 10 xUnit tests for MemoryGraphService
- Added `data/seed/` — JSON seed files exported from the original TypeScript seed-data.ts (schools, philosophers, philosopher-schools, philosopher-influences, works, notes)
- Added `data/graph-data.json` — copy of the canonical graph (274 nodes, 382 edges)
- Added `scripts/gen-spec.sh` — fetches OpenAPI spec from running F# server
- Updated root `package.json` — all scripts point to F# backend (dev:api, db:seed, etc.)
- Updated `CLAUDE.md` and `AGENTS.md` — comprehensive F# stack documentation
- Updated `.gitignore` — added .NET build artifacts (bin/, obj/)

## Why

The project's roadmap includes formal logic layers (syllogistic, Fregean, Kripke semantics), integration with Lean theorem prover, and deep Neo4j graph queries. These features demand:

1. **Strong algebraic types** — discriminated unions for logical connectives, propositions, proof terms. F#'s type system makes these first-class, whereas TypeScript's structural types require runtime validation (Zod) for safety.

2. **Pattern matching** — logic evaluation, proof checking, and graph traversal algorithms are naturally expressed as recursive pattern matches. F#'s exhaustiveness checking catches missing cases at compile time.

3. **Lean interop** — Lean 4 has better FFI stories with .NET/ML languages than with Node.js. An F# backend can call Lean tactics and parse Lean export files natively.

4. **Neo4j driver maturity** — the .NET Neo4j driver is first-class (maintained by Neo4j Inc), while the Node.js driver has lagged.

The migration was done now (2 commits, ~5k lines of data seeded) rather than later because the codebase was small enough that a clean port was feasible. Waiting longer would have made the migration exponentially harder as more routes, logic, and graph features accumulated.

## Notes for future work

- **The original `packages/api/` is retained** for reference but is no longer the active backend. It can be removed in a cleanup ticket once the F# backend is proven stable.
- **Graph build script** still uses the original TypeScript `npm run graph:build` (via `packages/api/src/graph/build-graph.ts`). This should eventually be ported to F# or replaced with a standalone script that reads the JSON seed files directly.
- **Postgres migrations** — the F# seeder creates SQLite tables inline. For Postgres, a proper migration tool (e.g., FluentMigrator or DbUp) should be added. The schema DDL is already written in Seed.fs and can be adapted.
- **OpenAPI spec quality** — Swashbuckle generates a spec from ASP.NET Minimal API endpoints, but the current endpoints use `Func<IResult>` delegates which produce less rich schemas. Adding proper `.WithOpenApi()` metadata and `.Produces<T>()` annotations would improve the generated spec.
- **Missing seed slugs** — 14 philosophers referenced in the seed data (brandom, mcdowell, habermas, etc.) have influence/school associations but no philosopher entries. These were already missing in the original TS seed and should be added in a DB ticket.
- **Hot reload** — `dotnet watch run` can be used for dev instead of `dotnet run` for auto-restart on F# file changes.
- **Test coverage** — current tests cover the graph service only. DB query tests and HTTP route integration tests should be added.
