# infra — Dockerize the monorepo (API serves built SPA)

**Branch:** `infra/dockerize-monorepo`
**Merged:** 2026-05-18 (TBD on actual merge)

First deployment artifact for philosophy-explorer. Pairs with the
companion homelab-side tickets 0014–0017 (Postgres contract, Garage
buckets, Dokploy slots, Caddy/DNS) and unblocks
`infra/woodpecker-pipeline`.

## What changed

- **`Dockerfile`** — multi-stage build, three named stages:
  1. **`web-build`** (`node:20-alpine`). Copies `package.json` +
     lockfile + workspace `package.json` first so `npm ci` caches
     until any of those change. Then copies `packages/specs/` +
     `packages/web/` and runs `npm run build --workspace=packages/web`.
     `ENV VITE_API_URL=""` is set before the build so the Vite
     substitution bakes the empty string into the bundle — see *Why*
     below for the same-origin implication.
  2. **`api-build`** (`mcr.microsoft.com/dotnet/sdk:9.0`). Copies only
     the API `.fsproj`, restores, then copies sources and publishes
     the `PhilosophyExplorer.Api` project to `/publish` with
     `--no-restore`. The test project (`PhilosophyExplorer.Tests`) is
     intentionally excluded; CI handles `dotnet test` separately.
  3. **`runtime`** (`mcr.microsoft.com/dotnet/aspnet:9.0`). Copies
     the publish output to `/app/`, the built SPA to `/app/wwwroot/`,
     and `data/seed/` + `data/graph-data.json` to `/app/data/`. The
     env vars `SEED_DATA_PATH`, `GRAPH_DATA_PATH`, `ASPNETCORE_URLS`,
     `PORT`, and `RUN_SEED` are set with sensible defaults.
- **Entrypoint script** — written as a Dockerfile heredoc
  (`COPY <<EOF /docker-entrypoint.sh`). When `RUN_SEED=true` it
  exec's the API binary with `--seed` and the process exits when
  seeding completes. Otherwise it exec's the API in serve mode. This
  is the "one-shot seed" pattern from the ticket — operator runs a
  short-lived container with `RUN_SEED=true` once per environment,
  then normal containers leave it unset/false.
- **`.dockerignore`** — mirrors `.gitignore` plus the directories
  the image doesn't need (`.tickets/`, `work-history/`, `docs/`,
  `node_modules/`, `bin/`, `obj/`, `*.db`).
- **`Program.fs`** — three additions around the existing middleware
  pipeline:
  - `app.UseDefaultFiles()` and `app.UseStaticFiles()` after `UseCors`
    so `wwwroot/index.html` resolves at `/` and SPA assets under
    `/assets/*` are served directly.
  - `app.MapFallbackToFile("index.html")` after every endpoint
    registration so any unmatched non-API path (e.g. a TanStack-Router
    subroute hit by hard-reload) returns `index.html` and lets the
    client router resolve it.
  - The fallback is registered last, so Swagger middleware (`/api/doc`,
    `/swagger/v1/swagger.json`) and all `/api/*` route handlers
    short-circuit before the fallback can match.
- **`.tickets/infra-dockerize-monorepo.md`** — deleted (rewritten as
  this work-history file per the `.tickets/README.md` lifecycle).

### Files

| File | Change |
|------|--------|
| `Dockerfile` | new — multi-stage web/api/runtime |
| `.dockerignore` | new |
| `packages/api-fsharp/PhilosophyExplorer.Api/Program.fs` | + UseDefaultFiles, UseStaticFiles, MapFallbackToFile |
| `.tickets/infra-dockerize-monorepo.md` | removed (moved to work-history) |
| `work-history/infra-dockerize-monorepo.md` | this file |

Verified:
- `dotnet build -c Release` clean (0 warnings, 0 errors).
- `docker build .` clean — web stage 7.6s (one pre-existing Vite
  "chunk > 500 kB" warning on the main bundle, unrelated to this
  ticket), api stage 4.4s, runtime stage assembled cleanly.
- Container smoke against `philex:dev` with `DATABASE_URL=file:./dev.db`:
  - `GET /` returns the SPA shell HTML.
  - `GET /api/graph/stats` returns
    `{"nodeCount":275,"edgeCount":385}` (the MemoryGraphService load
    confirms the baked `graph-data.json` is in the right place).
  - `GET /lab/foo` returns 200 + the SPA shell — `MapFallbackToFile`
    handles client-side routes on hard reload.
  - `GET /ping` returns `{"ok":true}`.
  - `GET /api/doc/index.html` (Swagger UI) returns 200.
  - `GET /assets/index--vjR21Hy.js` returns 200 with
    `Content-Type: text/javascript` — static assets served before
    the fallback fires.

## Why

The homelab CI/CD pipeline (Woodpecker → Gitea registry → Dokploy →
Caddy) is image-driven; nothing else in the cutover initiative could
proceed without a built image. The Dockerfile is the gate.

Same-origin SPA / API was a deliberate choice (locked in the
kickoff thread) and shapes most of the structure here:
- One image, one container, one URL — no separate static-server
  sidecar, no per-env CORS allowlist to maintain.
- `VITE_API_URL=""` at build time → the `openapi-fetch` client uses
  relative URLs → the SPA fetches `/api/*` from whatever origin
  served the HTML. Works behind Caddy without any per-environment
  build variant.
- `MapFallbackToFile` only fires on non-matched routes, so the
  existing `/api/*` and `/swagger/*` handlers retain priority.
  Static assets in `wwwroot/assets/*` are served by `UseStaticFiles`
  before routing even runs.

Framework-dependent .NET image (`aspnet:9.0`, Debian-based) over
self-contained / AOT or Alpine: the homelab is amd64 throughout, the
final image is ~250 MB which is fine, and the Debian base avoids the
Microsoft.Data.Sqlite native-bundle compatibility surprises that
Alpine can produce. We can revisit if image size becomes an issue.

## Notes for future work

- **Docker Desktop hiccup mid-branch.** Local Docker briefly fell
  over with a containerd `meta.db` I/O error after an unrelated
  `dojo-postgres` container's image blob went missing and the Mac
  host disk hit 95%. Even `docker rm -f` failed against the bolt
  DB. Resolution was: quit + relaunch Docker Desktop, free disk
  space. After the relaunch the smoke test ran cleanly (verified
  above). Not a Dockerfile issue, but worth noting if it recurs.
- **Migrations still informal.** The image bakes the seed data and
  the `--seed` entrypoint runs idempotent `CREATE TABLE IF NOT
  EXISTS` from `Db/Seed.fs`. Once prod data exists, any schema
  change risks drift. A migration-tool ticket (DbUp or Evolve) is
  worth queueing before the first schema-change PR — but explicitly
  out of scope here.
- **`--seed` re-inserts seed rows.** The `INSERT` statements in
  `Db/Seed.fs` need to be `ON CONFLICT DO NOTHING`-style for re-runs
  against the prod DB to be safe. Not audited here. The Dokploy
  ticket 0016 defaults `RUN_SEED=false` in prod, so the only
  scheduled re-seed happens when the operator explicitly flips it.
- **No multi-arch build.** Homelab is amd64; the Dockerfile doesn't
  use `--platform` or buildx multi-arch tags. If a future deploy
  target is arm64 (e.g. Raspberry Pi compute joining the cluster),
  add a buildx invocation to the Woodpecker pipeline.
- **wwwroot resolves relative to the publish dir.** ASP.NET's
  `IWebHostEnvironment.WebRootFileProvider` defaults to
  `ContentRoot/wwwroot`. `ContentRoot` at runtime is `/app` (where
  `dotnet` runs), so `/app/wwwroot/` is correct. If the Dockerfile
  ever splits the publish output across multiple `COPY` destinations,
  this assumption needs re-checking.
- **CORS middleware retained.** Same-origin in prod means CORS is
  irrelevant there, but `dev:api` + `dev:web` still cross
  `localhost:3001` ↔ `localhost:3000`, so `UseCors` stays. With
  `ALLOWED_ORIGINS=""` in prod, the policy admits zero cross-origin
  hosts — fine, no requests should be cross-origin anyway.
- **Heredoc syntax requires BuildKit 1.4+.** The entrypoint script
  is written via `COPY <<'EOF'`. The Dockerfile declares
  `# syntax=docker/dockerfile:1.7` to be explicit. Woodpecker's
  docker runner should already use BuildKit by default, but if a
  pipeline runs on an older daemon, switch to writing the script as
  a normal file in the repo and `COPY`-ing it in.
- **Test project excluded from publish.** `PhilosophyExplorer.Tests`
  is in the same solution but the runtime image doesn't need it.
  `dotnet test` runs in the Woodpecker pipeline against the source,
  not against the published artifact.
