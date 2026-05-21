# philosophy-explorer

Philosophy notes, conceptualizations, and visualizations across thinkers and works.

## Stack

- API: Hono 4 + Drizzle ORM + Postgres + OpenAPI/Zod
- Web: Vite + React 19 + TanStack Router + TanStack Query + Tailwind v4

## Development

```bash
npm install
cp packages/api/.env.example packages/api/.env
# Edit packages/api/.env — set DATABASE_URL
npm run db:generate && npm run db:migrate && npm run db:seed
npm run dev:api   # http://localhost:3001, docs at /api/doc
npm run dev:web   # http://localhost:3000
```

## Lean verification (optional)

The `/api/lean/health` route and the `LeanRunner` integration tests
shell out to a Lean 4 toolchain. It is **not** required for general
development — the integration tests skip cleanly when `lean` is absent
from `PATH`. To run them, install [elan](https://github.com/leanprover/elan)
(the Lean toolchain manager) and build the Mathlib-free lake package once:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none
(cd packages/lean && lake build)   # installs the pinned toolchain on first run
```

`npm run dev:api` then serves `GET /api/lean/health` (Development only).

## API contract workflow

After any route schema change:

```bash
npm run gen:spec   # regenerate packages/api/specs/openapi.json (API must be running)
npm run gen:types  # regenerate packages/web/src/lib/api-types.ts from spec
# commit both files
```

## CI / Deploy

CI runs on the homelab Woodpecker instance (`ci.lab`), driven by
`.woodpecker.yml`: it tests both packages, builds the Docker image,
pushes it to the Gitea registry, and pokes Dokploy to redeploy.
`.deploy-target` maps `dev` / `prod` to the Dokploy slots.

```bash
npm run ci:precheck   # fast local lint of .woodpecker.yml before pushing
./scripts/smoke-deployed.sh   # curl smoke test against a deployed slot
```
