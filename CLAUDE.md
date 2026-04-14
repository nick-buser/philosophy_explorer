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

- `packages/api` — Hono 4 + `@hono/zod-openapi` + Drizzle ORM (port 3001)
- `packages/web` — Vite 6 + React 19 SPA (port 3000)
  - **TanStack Router** (code-based — routes in `src/routes/`, assembled in `src/router.tsx`)
  - **TanStack Query 5** (client singleton in `src/lib/query-client.ts`, provider in `__root.tsx`)
  - Tailwind v4, dark-first

## Database strategy

Dialect is auto-detected from `DATABASE_URL`. No separate flag needed.

| Value | Dialect | When |
|---|---|---|
| `file:./dev.db` (default) | SQLite via libsql | local dev, no Postgres needed |
| `postgresql://...` | Postgres via postgres-js | staging, production |

**Schema:** `src/db/schema/postgres.ts` (Postgres, source of truth) and `src/db/schema/sqlite.ts` (isomorphic SQLite translation). Both produce identical row shapes. TypeScript types are always driven by the Postgres schema.

**Migrations:** `drizzle/postgres/` for Postgres, `drizzle/sqlite/` for SQLite. The active dialect is determined by `DATABASE_URL` at the time `db:generate` and `db:migrate` run. Commit both migration directories.

**Dev workflow (SQLite):**
```bash
cp packages/api/.env.example packages/api/.env   # default uses file:./dev.db
npm run db:generate && npm run db:migrate && npm run db:seed
npm run dev:api
```

**Schema changes require both migration sets:**
```bash
# SQLite (dev default)
npm run db:generate   # generates drizzle/sqlite/
# Switch to Postgres
DATABASE_URL=postgresql://... npm run db:generate   # generates drizzle/postgres/
```

**Auxiliary graph DB (future — not yet configured):** When deep traversal queries (multi-hop influence chains, entailment graphs) outgrow Postgres recursive CTEs, Neo4j is the planned next layer — as an auxiliary alongside Postgres, not a replacement. Postgres stays the system of record; Neo4j mirrors graph edges for traversal-heavy queries. The pattern would be a `src/db/neo4j.ts` client, separate from this factory. Configure only when the need is concrete.

## API contract workflow

After any route schema change:
1. `npm run gen:spec` — regenerates `packages/api/specs/openapi.json` (API must be running)
2. `npm run gen:types` — regenerates `packages/web/src/lib/api-types.ts`
3. Commit both files alongside the route change

## Testing

```bash
npm test          # both packages
npm run test:api  # packages/api (vitest, mocks db)
npm run test:web  # packages/web (vitest + jsdom + testing-library)
```

API tests live in `packages/api/tests/`. Pattern: mock `src/db/index.js` via `vi.mock()`,
then call `app.request()` directly — no running server needed.

Web tests: component and hook tests alongside source or in `src/**/__tests__/`.

## Adding a route (web)

1. Create `packages/web/src/routes/<name>.tsx` with a `createRoute(...)` export
2. Register it in `packages/web/src/router.tsx` under `routeTree`

## Adding a route (API)

1. Create `packages/api/src/routes/<resource>.ts` with an `OpenAPIHono` instance
2. Register it in `packages/api/src/index.ts` via `app.route('/', resourceRoutes)`
3. Add a test in `packages/api/tests/routes/<resource>.test.ts`
4. Run gen:spec + gen:types and commit the updated spec and types

## Key decisions

- Postgres + Drizzle for persistence. Domain is graph-shaped; starting with Postgres
  (recursive CTEs handle 3–5 hop traversals fine). Revisit Neo4j only if deep traversal
  queries become the bottleneck.
- No auth yet — `DEFAULT_USER_ID` placeholder in `src/lib/default-user.ts`.
  When adding auth, replace with `c.get('user').id` from auth middleware.
- ESM throughout the API. Local imports use `.js` extensions even on `.ts` source files.
