# infra: Dockerize the monorepo (API serves built SPA)

**Branch slug:** `infra/dockerize-monorepo`
**Status:** queued
**Size:** M
**Depends on:** `none`

## Why

`philosophy-explorer` has no deployment artifact yet — no Dockerfile,
no published image, no static-serving story for the React app. The
homelab CI/CD pipeline (Woodpecker → Gitea registry → Dokploy) is
image-driven; nothing else can move until an image exists.

Locked decision (see `docs/homelab-deployment-decisions.md` once
filed, or the kickoff thread): the API container serves the built
SPA as static files. One image, one URL, same-origin, no CORS, web
build can target `VITE_API_URL=/api`.

## Scope

**In:**
- Top-level `Dockerfile` with a multi-stage build:
  1. **web build stage** — `node:20-alpine`, install + `npm run build`
     in `packages/web/`. Output: `packages/web/dist/`.
  2. **api build stage** — `mcr.microsoft.com/dotnet/sdk:9.0`,
     `dotnet publish packages/api-fsharp/PhilosophyExplorer.Api -c
     Release -o /app/publish`.
  3. **runtime stage** — `mcr.microsoft.com/dotnet/aspnet:9.0`,
     copy `/app/publish` and the SPA `dist/` into the image,
     `ENTRYPOINT ["dotnet", "PhilosophyExplorer.Api.dll"]`.
- ASP.NET static-serving wiring in `Program.fs`:
  `UseDefaultFiles` + `UseStaticFiles` over the copied SPA dir,
  with a fallback that rewrites any non-`/api/*` 404 to
  `index.html` so client-side routing works on hard reload.
- `data/seed/` and `data/graph-data.json` baked into the image
  under a stable path; `SEED_DATA_PATH` and `GRAPH_DATA_PATH`
  default to that path inside the container.
- A `--seed` entrypoint mode — gate seeding on a `RUN_SEED=true`
  env var (or a subcommand) so the same image can both serve the
  app and run one-shot seeding against the prod DB.
- `.dockerignore` excluding `node_modules`, `bin`, `obj`, `dev.db`,
  `.git`, `work-history/`, `.tickets/`.
- Local smoke test: `docker build -t philex:dev . && docker run
  --rm -p 3001:3001 -e DATABASE_URL=file:./dev.db philex:dev`,
  hit `/` (SPA) and `/api/graph/stats` (API).

**Out (captured separately):**
- Pushing to the Gitea registry / CI build — `infra/woodpecker-pipeline`.
- Wiring the image into Dokploy slots — `0016-philosophy-explorer-dokploy-slots.md`
  in `homelab_infra_and_planning`.
- Postgres migrations vs. idempotent `CREATE TABLE IF NOT EXISTS` —
  separate follow-up; current behaviour is fine for first cutover.
- Trimmed self-contained .NET binaries / AOT — premature; framework-
  dependent image is fine for a homelab.

## Build sketch

- Write the Dockerfile bottom-up: get the runtime image to start
  with a bind-mounted publish dir first; only then collapse into a
  full multi-stage build.
- For the SPA fallback, prefer the framework-level
  `app.MapFallbackToFile("index.html")` (Minimal API supports it)
  rather than custom 404 middleware.
- `VITE_API_URL=/api` baked at web build time. Confirm no places
  in `packages/web/src/lib/api-*.ts` hardcode `localhost:3001`.
- Smoke-test list: home page renders, `/api/graph/stats` returns
  JSON, a TanStack-Router subroute (e.g. `/lab/...`) survives a
  hard refresh.
- Image size sanity check — target < 300 MB final image.

## References

- `CLAUDE.md` — stack overview, env-var list, dev workflow.
- `packages/api-fsharp/PhilosophyExplorer.Api/Program.fs` — current
  middleware ordering; static-serving wiring goes near the top.
- `packages/web/vite.config.ts` — Vite output path and base URL.
- `data/graph-data.json`, `data/seed/*.json` — bake locations.
