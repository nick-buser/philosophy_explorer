# Homelab Migration Plan — philosophy-explorer

Onboard philosophy-explorer onto the homelab pipeline (Gitea →
Woodpecker → Gitea registry → Dokploy → Caddy) with NAS Postgres
backing the running app. Following the canonical path validated by
the swe-interview-prep first deploy.

This plan is intentionally short — the substrate now handles the
heavy lifting. Read `~/Projects/homelab/proxmox/homelab_infra_and_planning/.claude/skills/homelab-migrate/SKILL.md`
first; this doc only captures the philosophy-explorer-specific bits.

## Stack

The repo is a workspace with two distinct halves:

- **API: F# / .NET 9** — `packages/api-fsharp/PhilosophyExplorer.Api/`
  (.fsproj, F# sources). Built via `dotnet build -c Release`, tested
  via `dotnet test`. Schema currently seeded via the app's `--seed`
  entrypoint (idempotent `CREATE TABLE IF NOT EXISTS` per
  `Db/Seed.fs`).
- **Web: Vite + React 19 + TanStack** — `packages/web/`. Built via
  `npm run build --workspace=packages/web`.

The root `package.json` orchestrates both — `dev:api` shells out to
`dotnet run`, `dev:web` runs vite, `test` runs both.

(Aside: the `## Stack` section in the repo's README currently shows
"Hono 4 + Drizzle ORM" which is **stale** — that was an earlier shape.
Worth a small follow-up PR to refresh the README to match
`package.json` reality.)

The homelab tickets [[0014]] (Postgres contract), [[0015]] (Garage
buckets), [[0016]] (Dokploy slots), [[0017]] (Caddy DNS) correctly
describe the F#/.NET 9 + React shape — those are accurate and ready to
land.

## Decisions

| Decision | Value |
|---|---|
| Owner / repo name | `nick-b/philosophy_explorer` (already on Gitea) |
| App slug | `philosophy-explorer` (kebab) / `philosophy_explorer` (snake — vault keys) |
| API stack template | `scripts/templates/woodpecker-app/dotnet-fsharp/` |
| Web stack template | `scripts/templates/woodpecker-app/node-fullstack/` (for the web-builder + .woodpecker.yml web-check shape only — the runtime is the dotnet image) |
| Service shape | Two options: (a) **single Dokploy slot** with the .NET API serving the built SPA same-origin (recommended — mirrors swe-interview-prep), or (b) two slots (`philosophy-explorer-api-{dev,prod}` + `-web-{dev,prod}`) using the `apps:` shape in `.deploy-target`. (a) is simpler unless the web needs to scale independently. |
| DB roles | Already in homelab `app-db-contracts.yml` per ticket 0014 |
| Garage buckets | Already in homelab `nas-services-setup.yml` per ticket 0015 |
| URL pattern | `philosophy-explorer.app.lab` (prod), `philosophy-explorer-dev.app.lab` (dev) + `.app.bittern-chameleon.dev` variants |
| Dual-pipeline | Origin already on Gitea. Add `github` remote when external visibility wanted. |

## Phase deltas vs. the canonical flow

Most phases are stock — see the homelab skill. The bits that need
attention for this repo:

1. **Phase 3 (Dockerfile)**: copy `scripts/templates/woodpecker-app/dotnet-fsharp/`
   into the repo. Substitute `{{APP_SLUG}}=philosophy-explorer` and
   `{{APP_DLL}}=PhilosophyExplorer.Api.dll`. The web-builder stage
   from the template is the same Vite/React shape we already use
   elsewhere; that stays. The publish stage uses `dotnet publish -c
   Release -o /app/publish` and the runtime is `mcr.microsoft.com/dotnet/aspnet:9.0`.
2. **Phase 3 (SPA serving from .NET)**: the .NET API needs to serve
   the built `packages/web/dist` same-origin, including a 404
   exception-handler fallback to `index.html` for client-side routes.
   Reference: swe-interview-prep `dojo/server/app.py:_spa_404_handler`
   is the FastAPI version; the ASP.NET Core equivalent uses
   `UseStaticFiles` + a fallback endpoint mapped to the SPA's index.
   Watch for the same trap that bit swe-interview-prep: don't make
   the SPA fallback a wildcard-GET catch-all — that returns 405 on
   POST to 404-shaped API paths and breaks API contracts. Map
   `MapFallbackToFile("index.html")` only for non-API prefixes.
3. **Phase 4 (`.woodpecker.yml`)**: the `dotnet-fsharp` template
   already has `dotnet restore` / `dotnet build` / `dotnet test` in
   the check step and a separate `web-check` for the Vite build.
   Substitute `{{APP_SLUG_SNAKE}}=philosophy_explorer` in the secret
   refs.
4. **Phase 5 (Dokploy)**: if going single-slot, stock bootstrap. If
   going multi-slot, two bootstraps (one for api, one for web) — same
   gap noted for poetry-tracker. Single-slot is simpler.
5. **Phase 6 (dev-workshop)**: add `philosophy-explorer.env.dev.j2`
   under `ansible/templates/workspace-env-dev/`. Env vars:
   `DATABASE_URL` (the `--seed` entrypoint uses it), `GRAPH_DATA_PATH`
   (per `dev:api` script — careful, the repo-relative path won't work
   in a container; use a baked-in path), plus whatever feature flags
   the API needs.

## App-specific TODOs before kickoff

- [ ] Decide single-slot vs. multi-slot deploy. Single-slot
      recommended.
- [ ] If single-slot: add the ASP.NET Core static-file + SPA-fallback
      wiring in `Program.fs`. Don't use a catch-all wildcard — use
      `MapFallbackToFile` with an `excludePrefix` for `/api`.
- [ ] Migration story: the README + ticket 0014 say schema is created
      via the `--seed` entrypoint. Decide whether the entrypoint
      script runs `dotnet ... -- --seed` on every container start
      (idempotent — fine), or only on first deploy. The entrypoint
      template can call it unconditionally given it's already
      idempotent.
- [ ] Schema migration discipline: roadmap (ticket 0014) notes that
      schema-tooling is "a separate follow-up on the philosophy-explorer
      side." Worth doing before prod traffic, but not blocking the
      first dev deploy.
- [ ] `GRAPH_DATA_PATH` and any other file-system data references —
      either bake into the image (if static) or move to a Dokploy
      volume / Garage bucket.
- [ ] Refresh the README's `## Stack` section to match
      `package.json`-reality (Hono claim → F#/.NET + Vite/React). Out
      of scope for the migration but worth a 5-minute follow-up PR.

## Deferred

- Phase 8 (Redpanda outbox) — gated on homelab ticket 0024.
- Phase 9 (dual-pipeline) — optional based on whether this repo wants
  external visibility.
