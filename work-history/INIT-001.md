# INIT-001 — Initial buildout: monorepo scaffold through curricula feature

**Branch:** `main` (initial commit — no branch history; VCS was not initialized during buildout)
**Merged:** 2026-04-14

---

## What changed

This commit captures the complete state of the project as built across multiple working sessions
before version control was initialized. Everything below was built without a git repo in place.

### Monorepo scaffold

- Root `package.json` with npm workspaces (`packages/api`, `packages/web`)
- `CLAUDE.md` — project instructions: branch discipline, stack decisions, DB strategy,
  API contract workflow, testing conventions
- `work-history/README.md` — format spec for per-ticket work-history docs
- `agents.md` — notes on agent usage patterns
- `docs/` — supplementary design docs

### `packages/api` — Hono 4 API (port 3001)

**Stack:** Hono 4 + `@hono/zod-openapi` + Drizzle ORM. Dialect auto-detected from `DATABASE_URL`
(SQLite via libsql for dev, Postgres for prod).

**DB schema** (`src/db/schema/`):
- `postgres.ts` — source of truth; 8 tables: `schools`, `philosophers`, `philosopher_schools`,
  `philosopher_influences`, `works`, `notes`, `users` (auth placeholder)
- `sqlite.ts` — isomorphic SQLite translation; identical row shapes
- `shared.ts` — shared enum types

**Migrations:** `drizzle/postgres/` and `drizzle/sqlite/` — both committed.

**Seed data** (`src/data/seed-data.ts`, ~1900 lines):
- 29 philosophers (Presocratics through contemporary analytic/continental)
- 87 works
- 25 philosophical schools
- 6 notes (mostly Hegel: reading guides, secondary literature, philosophical neighbors)
- Influence graph edges throughout

**Routes:**
- `GET /api/health` — ping
- `GET /api/philosophers` — list, ordered by birth year
- `GET /api/philosophers/:slug` — detail: works, schools, influences, notes
- `GET /api/works` — list with philosopher info
- `GET /api/works/:slug` — detail with notes
- `GET /api/schools` — list
- `GET /api/schools/:slug` — detail with members grouped by role
- Auto-generated OpenAPI spec at `/api/doc/openapi.json`

**Tests:** `packages/api/tests/` — vitest, mocks `src/db/index.js` via `vi.mock()`,
calls `app.request()` directly (no running server needed).

### `packages/web` — Vite 6 + React 19 SPA (port 3000)

**Stack:** Vite 6, React 19, TanStack Router (code-based), TanStack Query 5, Tailwind v4 (dark-first).

**Routes:**
- `/` (`routes/index.tsx`) — Browse page: tabbed philosophers / works / schools with real-time search
- `/philosophers/:slug` — Philosopher detail: bio, works, schools, influence graph, notes
- `/works/:slug` — Work detail: metadata, notes
- `/schools/:slug` — School detail: members grouped by role
- `/curricula` — Planned Curricula list page (see below)
- `/curricula/:slug` — Curriculum detail page (see below)

**Root layout** (`routes/__root.tsx`): QueryClientProvider, sticky nav bar with Browse / Curricula
links, TanStack Router + Query devtools in dev.

**Generated types:** `src/lib/api-types.ts` — regenerated from OpenAPI spec via `gen:types`.

### Curricula feature

A frontend-only planned reading curriculum system, data-driven but hard-coded for now.

**Schema** (`src/lib/curriculum-schema.ts`):
Zod schemas as single source of truth. Four entity types designed to map cleanly to DB tables
when the time comes:

| Zod type | Future DB table | Key fields |
|---|---|---|
| `Curriculum` | `curricula` | `id`, `slug`, `title`, `tagline`, `level`, `estimatedDuration` |
| `CurriculumStage` | `curriculum_stages` | `id`, `curriculumId` FK, `title`, `order` |
| `CurriculumItem` | `curriculum_items` | `id`, `stageId`, `type` (primary/secondary), `workSlug?`, `authorSlug?` |
| `Dependency` | `curriculum_dependencies` | `from`, `to`, `note?` |

`workSlug` and `authorSlug` on items are optional links into the existing explorer pages.
Items with neither are valid (secondary works by authors not in the philosopher list).

**Data** (`src/data/curricula/`):
- `ancient-greek-foundations.json` — 18 items (14 primary, 4 secondary), 24 dependency edges,
  7 stages (Orientation → Presocratic → Socratic → Platonic → Aristotelian → Hellenistic → Synthesis)
- `index.ts` — loads and validates each JSON file against `CurriculumSchema` at startup;
  exports `curricula[]` and `getCurriculumBySlug()`

**Dependency graph** (`routes/curricula.$slug.tsx`):
React Flow (`@xyflow/react`) + dagre (`@dagrejs/dagre`) for layout.
- `LR` rank-direction dagre layout: prereqs left, dependents right; fully static (no physics)
- `nodesDraggable={false}`, `nodesConnectable={false}`, `elementsSelectable={false}`
- Custom `CurriculumItemNode`: type badge, title, author, year; solid border = in explorer,
  dashed = not yet
- Pan/zoom via React Flow's `Controls` widget

---

## Why

The project had no VCS from the start. Multiple working sessions built out the full initial
feature set — monorepo scaffold, DB schema, seed data, API routes, web routes, and the
curricula feature — before git was initialized. Rather than artificially reconstruct
branch history, everything is landed in a single initial commit on main.

The curricula feature specifically exists to provide structured, sequenced reading paths
through philosophical traditions — distinct from the unstructured browse/search the explorer
already provides.

---

## Notes for future work

**VCS going forward:** Branch discipline is documented in `CLAUDE.md`. All future work must
follow it: `type/PREFIX-###-short-description` branches, work-history doc before merge,
PR into main. This initial commit is the only exception.

**Curricula → DB migration:** When the number of curricula or their complexity outgrows
hand-edited JSON, migrate as follows:
1. Add the four tables (`curricula`, `curriculum_stages`, `curriculum_items`,
   `curriculum_dependencies`) to both `schema/postgres.ts` and `schema/sqlite.ts`
2. Write a migration that seeds from the existing JSON files (the Zod schema maps 1:1)
3. Add API routes under `/api/curricula` following the same pattern as `philosophers.ts`
4. Replace the static `getCurriculumBySlug()` calls in the web routes with TanStack Query fetches

**Works/philosophers not yet in explorer:** Several curriculum items reference texts
(Plato's Apology, Meno, Euthyphro; Epicurus' Letter to Menoeceus) and scholars
(Guthrie, Annas, Barnes) not yet seeded. The secondary scholars are intentionally omitted
from the philosophers list to avoid clutter — a tagging/role system (e.g. `isHistorian`)
may be worth adding before seeding them.

**Auth:** `DEFAULT_USER_ID` placeholder in `packages/api/src/lib/default-user.ts`.
Replace with `c.get('user').id` from auth middleware when auth is added.

**Graph DB:** If deep traversal queries (multi-hop influence chains) outgrow Postgres
recursive CTEs, Neo4j is the planned auxiliary layer. Postgres remains system of record.
See `CLAUDE.md` for the intended pattern.

**Hegel** is the most developed philosopher in the seed data: 5 works, 3 detailed notes
(reading order, secondary literature, philosophical neighborhood), 11 influence relationships.
Other philosophers are sparse — fleshing out notes and influence edges is ongoing editorial work.
