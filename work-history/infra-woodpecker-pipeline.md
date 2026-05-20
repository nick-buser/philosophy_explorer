# infra — Woodpecker pipeline for build/test/push/redeploy

**Branch:** `infra/woodpecker-pipeline`
**Merged:** 2026-05-20 (TBD on actual merge)

Resolves `.tickets/infra-woodpecker-pipeline.md` — Phase 4 of the
homelab migration (`docs/homelab-migration-plan.md`).

## What changed

- `.woodpecker.yml` — CI pipeline, adapted from the homelab
  `scripts/templates/woodpecker-app/dotnet-fsharp/` template:
  - `check` — `dotnet restore/build/test` on
    `packages/api-fsharp/PhilosophyExplorer.sln`.
  - `web-check` — `npm ci` at the repo root (workspace install) then
    `npm run test` / `npm run build` for `packages/web`.
  - `publish-pr` / `publish-main` / `publish-tag` — build the
    `runtime` Docker target via `plugin-docker-buildx`, push to the
    Gitea registry as `git.lab/nick-b/philosophy_explorer`.
  - `deploy-dev` / `deploy-prod` — POST to the Dokploy
    `application.deploy` API for the matching slot.
- `.deploy-target` — single-slot mapping: `dev` →
  `philosophy-explorer-dev`, `prod` → `philosophy-explorer-prod`.
- `scripts/ci-precheck.sh` — fast (<2s) local validator for
  `.woodpecker.yml`; copied verbatim from the homelab template.
- `scripts/smoke-deployed.sh` — curl smoke test, adapted to this
  app's routes (`/api/health`, `/ping`, `/api/graph/stats`,
  `/api/philosophers`, `/api/doc`, SPA title).
- `package.json` — `ci:precheck` script.
- `README.md` — added a CI / Deploy section.

## Why

The homelab CI runs on Woodpecker (`ci.lab`) with the Gitea
container registry as the image store. With the Dockerfile already
in place (`infra/dockerize-monorepo`, PR #29), a pipeline closes the
loop: push → test → build image → push image → redeploy the Dokploy
slot. Without it every deploy is a manual `docker build && push &&
curl webhook`. Closes the `infra/woodpecker-pipeline` ticket.

Image identity note: the registry image is
`git.lab/nick-b/philosophy_explorer` (snake — matches the Gitea repo
name and vault key prefix), while the Dokploy slots and hostnames
use `philosophy-explorer` (kebab). Both spellings are intentional —
see the decisions table in `docs/homelab-migration-plan.md`.

## Notes for future work

- **The pipeline is authored but not yet live.** Two follow-ups are
  needed before a push deploys anything:
  1. Register the repo in the Woodpecker UI (Repositories → Add) —
     one-time; the Gitea webhook lands automatically.
  2. The `deploy-*` steps reference `philosophy_explorer_{dev,prod}_app_id`
     secrets that don't exist until the Dokploy slots are bootstrapped
     (migration Phase 5). Until then the `check` / `web-check` /
     `publish-*` steps run fine and the `deploy-*` steps fail on the
     missing secret. `registry_user` / `registry_token` /
     `dokploy_token` are shared homelab secrets and should already
     exist from the swe-interview-prep onboarding.
- **No Postgres sidecar.** The F# test project
  (`PhilosophyExplorer.Tests`) seeds its own throwaway SQLite DB in
  `Path.GetTempPath()` and reads `data/seed` + `data/graph-data.json`
  from the repo, so `check` needs no DB. The dev DB URL is a
  runtime-only concern for the deployed app, not CI. This sidesteps
  the exit-137 sidecar-cleanup footgun the homelab skill warns about.
- **Known gap — API 404 fallback.** `Program.fs` maps
  `MapFallbackToFile("index.html")` with no `/api` exclusion, so an
  unknown `/api/...` path serves the SPA HTML (200) instead of a JSON
  404. The migration plan flagged this as a kickoff TODO ("use
  `MapFallbackToFile` with an `excludePrefix` for `/api`"). Not
  breaking — deferred to keep this PR scoped to CI — but worth a
  small follow-up. The disabled assertion is left commented in
  `smoke-deployed.sh`.
- **README is broadly stale.** The `## Stack` and `## Development`
  sections still describe the pre-migration Hono/Drizzle shape. The
  migration plan calls a full refresh a separate follow-up PR; only
  the new CI section was added here.
- Remaining migration phases (DB/Garage tenancy, Dokploy bootstrap,
  dev-workshop env) are homelab-repo work and mutate shared infra —
  tracked by tickets 0014–0017 on the homelab side.
