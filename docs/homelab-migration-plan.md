# Homelab Migration Plan — philosophy-explorer

Onboard philosophy-explorer onto the homelab pipeline (Gitea →
Woodpecker → Gitea registry → Dokploy → Caddy) with NAS Postgres
backing the running app. Following the canonical path validated by
the swe-interview-prep first deploy.

This plan is intentionally short — the substrate now handles the
heavy lifting. Read `~/Projects/homelab/proxmox/homelab_infra_and_planning/.claude/skills/homelab-migrate/SKILL.md`
first; this doc only captures the philosophy-explorer-specific bits.

## Stack reality check

**Important: the existing homelab tickets 0014–0017 describe this app
as F# / .NET 9. That's wrong.** The actual stack (per `README.md` and
`package.json`):

- API: **Hono 4 + Drizzle ORM + Postgres + OpenAPI/Zod** (Node)
- Web: **Vite + React 19 + TanStack Router + TanStack Query + Tailwind v4**

Workspace layout: `packages/api/` + `packages/web/`. Multi-service, so
the `apps:` shape in `.deploy-target` applies (similar to poetry-tracker).
The homelab tickets need a fix-up commit before they're actionable;
flag in the relevant PR.

## Decisions

| Decision | Value |
|---|---|
| Owner / repo name | `nick-b/philosophy_explorer` (already on Gitea) |
| App slug | `philosophy-explorer` (kebab) / `philosophy_explorer` (snake — vault keys) |
| Stack template | `scripts/templates/woodpecker-app/node-fullstack/` |
| Service shape | Multi-service: `philosophy-explorer-api-{dev,prod}` + `philosophy-explorer-web-{dev,prod}` |
| DB roles | Already in homelab `app-db-contracts.yml` per ticket 0014 |
| Garage buckets | Already in homelab `nas-services-setup.yml` per ticket 0015 |
| URL pattern | `philosophy-explorer-api.app.lab` + `philosophy-explorer.app.lab` (web) |
| Dual-pipeline | Yes — origin already on Gitea. Add `github` remote when ready for external visibility. |

## Phase deltas vs. the canonical flow

Most phases are stock — see the homelab skill. The bits that need
attention for this repo:

1. **Phase 0 prep**: fix the F#/.NET claim in homelab tickets 0014–0017
   (one PR in homelab repo, adjust template hint to `node-fullstack`).
2. **Phase 3 (Dockerfile)**: the template is `node-fullstack` but
   needs two slots — one Dockerfile builds the API image, another
   builds the web image. Cleanest split: two `Dockerfile`s
   (`Dockerfile.api`, `Dockerfile.web`) under each `packages/*` dir,
   referenced by build target in `.woodpecker.yml`. Multi-service in
   cicd-flow.md § Per-app repo setup.
3. **Phase 4 (`.woodpecker.yml`)**: stock `node-fullstack` template
   plus a second `publish-*` block per service, and the `apps:` form
   in `.deploy-target`.
4. **Phase 5 (Dokploy bootstrap)**: `scripts/dokploy_bootstrap` doesn't
   yet support `--envs` × multi-service — only one app per env. For
   this app, **bootstrap twice**: once for the API project, once for
   the web. Or run it once and then use the Dokploy API directly to
   add the second app. Flag this gap upstream (tooling-0087 or a
   follow-up).
5. **Phase 6 (dev-workshop)**: add `philosophy-explorer.env.dev.j2`
   under `ansible/templates/workspace-env-dev/`. Env vars: `DATABASE_URL`,
   plus any Drizzle/Hono-specific config from `packages/api/.env.example`.

## App-specific TODOs before kickoff

- [ ] Verify Drizzle migrations work via `npm run db:migrate` in the
      container at startup — likely needs a small entrypoint wrapper.
- [ ] OpenAPI spec workflow (`npm run gen:spec` / `gen:types`) — these
      run against the API at port 3001 locally. Decide whether to run
      them in CI or treat them as pre-commit. Probably pre-commit.
- [ ] Confirm `cp packages/api/.env.example packages/api/.env` is
      still load-bearing — if so, the Dockerfile needs to source from
      Dokploy env instead.
- [ ] Multi-service smoke: `smoke-deployed.sh` needs to probe both
      `philosophy-explorer.app.lab` (web) and `philosophy-explorer-api.app.lab`
      (api).

## Deferred

- Phase 8 (Redpanda outbox) — gated on homelab ticket 0024
  (`app-kafka-contracts.yml` scaffolder). Don't pull in this work
  pass.
- Phase 9 (dual-pipeline) — needs GitHub mirror minted; currently
  Gitea-only. Optional based on whether this repo wants external
  visibility.
