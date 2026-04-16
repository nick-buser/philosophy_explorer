# Claude Instructions — philosophy-explorer

## Branch discipline

**Never commit directly to main.** All work goes on a branch.

Branch naming: `type/PREFIX-###-short-description`
- `feat/FEAT-012-add-thinker-search`
- `fix/BUG-003-health-route-timeout`
- `infra/INFRA-001-api-vitest-setup`

Merge into main via PR. Squash or merge — either is fine; just keep the commit message meaningful.

## Work-history docs

Before merging any branch, create `work-history/PREFIX-###.md` for that ticket.
See `work-history/README.md` for the format. The **why** and **notes for future work**
sections are mandatory — the git diff covers what changed.

## Ticket prefixes (GitHub Issues)

| Prefix  | Use for                                    |
|---------|--------------------------------------------|
| `FEAT`  | New feature or user-facing capability      |
| `BUG`   | Bug fix                                    |
| `INFRA` | Build, tooling, CI, test infrastructure    |
| `DB`    | Schema changes, migrations, seed data      |
| `REFAC` | Refactor with no behavior change           |
| `DOCS`  | Documentation only                         |

## Stack

- `packages/api-fsharp/` — **F# 9 + ASP.NET Minimal API** (port 3001)
  - Dapper for DB queries (raw SQL, works with both SQLite and Postgres)
  - Swashbuckle for OpenAPI spec generation
  - Custom in-memory graph service (replaces graphology, loads graph-data.json)
  - Domain types in `Domain/Types.fs` and DTO types in `Domain/Dtos.fs`
- `packages/web` — Vite 6 + React 19 SPA (port 3000)
  - **TanStack Router** (code-based — routes in `src/routes/`, assembled in `src/router.tsx`)
  - **TanStack Query 5** (client singleton in `src/lib/query-client.ts`, provider in `__root.tsx`)
  - Tailwind v4, dark-first
- `data/` — Shared data directory
  - `data/seed/` — JSON seed files (exported from original TS seed-data.ts)
  - `data/graph-data.json` — Canonical graphology JSON (the unified graph)

## Database strategy

Dialect is auto-detected from `DATABASE_URL`. No separate flag needed.

| Value | Dialect | When |
|---|---|---|
| `file:./dev.db` (default) | SQLite via Microsoft.Data.Sqlite | local dev |
| `postgresql://...` | Postgres via Npgsql | staging, production |

**Schema:** Defined in SQL CREATE statements in `Db/Seed.fs` for SQLite dev.
For Postgres, migrations are managed separately (future ticket).
Row shapes and column names are identical across both dialects.
TypeScript client types are driven by the OpenAPI spec generated from F# DTOs.

**Dev workflow (SQLite):**
```bash
npm run db:seed     # seeds SQLite dev.db from data/seed/ JSON files
npm run dev:api     # starts F# API on port 3001
npm run dev:web     # starts Vite dev server on port 3000
```

## Graph layer

A unified property graph consolidates all entity relationships (philosopher influences,
school memberships, authorship, curriculum prerequisites) into a single directed graph.

**Architecture:** `packages/api-fsharp/.../Graph/` — `MemoryGraphService` loads graphology JSON:

| `GRAPH_DATA_PATH` | Backend | When |
|---|---|---|
| path to graph-data.json (default) | In-memory adjacency lists | dev, test |
| future: Neo4j via bolt:// | Neo4j driver | staging, prod |

**Data file:** `data/graph-data.json` — canonical graphology JSON.
Regenerate after seed data changes: `npm run graph:build` (uses the original TS build script).

**Key F# files:**
- `Graph/GraphTypes.fs` — node labels, edge types, shared data types
- `Graph/MemoryGraphService.fs` — in-memory graph (replaces graphology)

**API endpoints:** `/api/graph/stats`, `/api/graph/node/{key}`, `/api/graph/neighbors/{key}`,
`/api/graph/path`, `/api/graph/influence/{slug}`, `/api/graph/school/{slug}`,
`/api/graph/curriculum/{slug}`, `/api/graph/influence-network`

**Node key format:** `{label}:{slug}` (e.g. `philosopher:immanuel-kant`).

**Design doc:** `docs/graph-layer-design.md`

## API contract workflow

The F# server generates an OpenAPI spec via Swashbuckle. After any route/DTO change:
1. Start the API: `npm run dev:api`
2. `npm run gen:spec` — fetches spec from `/swagger/v1/swagger.json` → `packages/specs/openapi.json`
3. `npm run gen:types` — regenerates `packages/web/src/lib/api-types.ts` from the spec
4. Commit both files alongside the route change

This maintains type coherence across F# server and TypeScript client by definition:
F# DTOs → OpenAPI spec → openapi-typescript → TypeScript types.

## Testing

```bash
npm test          # both packages
npm run test:api  # packages/api-fsharp (dotnet test)
npm run test:web  # packages/web (vitest + jsdom + testing-library)
```

API integration tests should verify the contract at the HTTP boundary — the joint
between F# server and TypeScript client. Use the running server + curl/fetch assertions.

Web tests: component and hook tests alongside source or in `src/**/__tests__/`.

## Adding a route (web)

1. Create `packages/web/src/routes/<name>.tsx` with a `createRoute(...)` export
2. Register it in `packages/web/src/router.tsx` under `routeTree`

## Adding a route (API)

1. Add DTO types in `Domain/Dtos.fs` if needed
2. Create or update a route module in `Routes/<Resource>Routes.fs`
3. Register it in `Program.fs`
4. Add to the .fsproj `<Compile>` list in correct order
5. Run gen:spec + gen:types and commit the updated spec and types

## Key decisions

- **F# for the backend.** The project's direction toward formal logic layers (syllogistic,
  Fregean, Kripke semantics) and integration with Lean/Neo4j benefits from ML-family type
  safety. F#'s discriminated unions, pattern matching, and type inference make modeling
  logical structures natural. Postgres + Dapper for persistence; in-memory graph for traversal.
- **Type coherence via OpenAPI codegen.** F# DTOs are the source of truth for wire types.
  Swashbuckle generates the OpenAPI spec, openapi-typescript generates TS client types.
  No manual type synchronization needed.
- **Seed data in JSON.** The original 1900-line TypeScript seed file is exported to JSON
  files in `data/seed/`. Both the F# seeder and the graph build script consume them.
- **Graph data preserved.** The 274-node, 382-edge graph-data.json is loaded directly
  by the F# MemoryGraphService. No graphology dependency needed — pure F# adjacency lists.
- No auth yet — `DEFAULT_USER_ID` placeholder.
  When adding auth, add ASP.NET auth middleware.
- `packages/api/` (the old Hono/TS backend) is retained for reference but is no longer
  the active backend. The F# server in `packages/api-fsharp/` is the active API.
