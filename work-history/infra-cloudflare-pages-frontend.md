# INFRA — Deploy the web frontend to Cloudflare Pages

**Branch:** `infra/cloudflare-pages-frontend`
**Merged:** (pending)

First public hosting of the SPA, via Cloudflare Pages Git integration
against the GitHub mirror (`gh-snapshot` → `github.com/nick-buser/philosophy_explorer`).
Frontend-only for now — the F# API is **not** yet hosted, so the
deployed shell renders but live data calls fail until the API lands
(see notes).

## What changed

- `packages/web/public/_redirects` (new) — SPA fallback `/* /index.html 200`.
  Vite copies `public/` verbatim into `dist/`, and Cloudflare Pages applies
  `_redirects` from the output root. Without it, deep links / refresh on any
  client-side route (TanStack Router uses HTML5 history) 404. Existing hashed
  assets still take precedence, so only unmatched paths fall back.
- `.nvmrc` (new, repo root) — pins Node `22` for reproducible builds. Local
  dev is on Node 23 (non-LTS); 22 is the build target and what Cloudflare
  resolves to. The Vite 6 build runs clean on it. Harmless to the homelab
  Woodpecker pipeline (it uses its own pinned node image).

No source/behavior changes — purely deploy plumbing.

## Cloudflare Pages settings (Git integration)

Recorded here so the config is reproducible (it lives in the Cloudflare
dashboard, not the repo):

| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | None (Vite) |
| Root directory | `/` (repo root — npm workspaces install hoists web deps to root) |
| Build command | `npm run build:web` |
| Build output directory | `packages/web/dist` |
| Env var | `NODE_VERSION=22` (redundant with `.nvmrc`, set as belt-and-suspenders) |
| Env var | `VITE_API_URL` — **left unset for now** (bakes the `http://localhost:3001` default; see notes) |

## Why

The frontend had no public home — it only ran against a local Vite dev
server + local F# API. Cloudflare Pages gives the SPA a real URL on the
same Cloudflare account that already fronts `bittern-chameleon.dev`. The
GitHub mirror is the build source because the Cloudflare GitHub app is
already authorized against it; canonical origin remains Gitea, so the flow
is: land on Gitea `main` → fast-forward `gh-snapshot/main` → Cloudflare
builds the push.

## Notes for future work

- **`VITE_API_URL` is baked in at build time** (`import.meta.env.VITE_API_URL`
  in `packages/web/src/lib/api.ts`, default `http://localhost:3001`). The
  current deploy is a static shell: live API calls will fail until the F#
  API is publicly hosted. To wire it up later: set `VITE_API_URL` to the
  public API origin in the Pages project env, then trigger a rebuild
  (a new build is required — the value is compiled into the bundle, not
  read at runtime).
- **CORS gate.** The API reads `ALLOWED_ORIGINS` (comma-separated, default
  `http://localhost:3000`, in `Program.fs`). Once the SPA calls the API
  cross-origin from its Pages URL, that origin (e.g. `https://philosophy-explorer.pages.dev`
  and any custom domain) must be added to `ALLOWED_ORIGINS` on the API
  deploy or the browser blocks every request.
- **Topology divergence from the homelab plan.** `docs/homelab-migration-plan.md`
  has the .NET API serving the SPA *same-origin* (`MapFallbackToFile`). This
  Cloudflare deploy splits them (SPA on Pages, API elsewhere). If the homelab
  same-origin deploy becomes the canonical one, this Pages project can either
  be retired or repurposed as a CDN front that proxies `/api/*` — decide before
  maintaining two serving paths.
- **Mirror sync is manual.** `gh-snapshot/main` only updates when someone
  pushes Gitea `main` to it. Cloudflare builds stale code if the mirror lags.
  A future ticket could automate the Gitea→GitHub mirror (Gitea push mirror
  or a CI step).
