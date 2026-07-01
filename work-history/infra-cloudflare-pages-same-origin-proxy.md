# INFRA — Same-origin proxy from Cloudflare Pages to the Railway API

**Branch:** `infra/cloudflare-pages-same-origin-proxy`
**Merged:** (pending)

Wires the deployed SPA to the now-live Railway-hosted F# API without any
build-time or dashboard-managed environment variable. Follow-up to the
Cloudflare Pages frontend deploy (`infra-cloudflare-pages-frontend.md`) and
the Railway backend setup (done interactively via CLI/MCP, not a branch —
see that project's `[[railway-access]]`-adjacent memory for the account-side
details: service `api` + `Postgres` in the `wholesome-truth` project,
domain `https://api-production-fd53.up.railway.app`).

## What changed

- `functions/api/[[path]].ts` (new, repo root — **not** `packages/web/`, per
  Cloudflare's Pages Functions convention) — catch-all proxy that forwards
  every `/api/*` request to the Railway API origin, preserving method,
  headers, and body. The backend origin is a source constant, not an env
  var; update it via a normal commit if the Railway domain ever changes.
- `packages/web/public/_routes.json` (new) — `{"include": ["/api/*"]}` so
  only `/api/*` invokes the Function; everything else falls through to
  static assets and the existing `_redirects` SPA fallback. Copied into
  `dist/` by Vite alongside `_redirects`.
- `packages/web/src/lib/api.ts` — `baseUrl` now defaults to `''` (same-origin)
  in production builds (`import.meta.env.PROD`) instead of falling back to
  `http://localhost:3001`. Dev (`vite dev`) behavior is unchanged — still
  defaults to `http://localhost:3001` since there's no dev-time proxy
  configured in `vite.config.ts`. `VITE_API_URL` remains a supported escape
  hatch if ever needed, just not required anymore.

## Why

The Cloudflare Pages deploy went live frontend-only, with the API not yet
publicly hosted (see `infra-cloudflare-pages-frontend.md`'s notes). Once the
F# API landed on Railway, the naive fix was a `VITE_API_URL` build-time env
var set in the Cloudflare dashboard — but that's a manual UI step every time
the backend URL changes, and (separately) any temptation to automate it via
this repo's homelab Woodpecker pipeline would tie an external showcase
deploy to homelab CI, which is a hard boundary this project (and every
project) must not cross — the homelab is the real system; Cloudflare/Railway
are an external showcase, and their build/deploy must never depend on
homelab CI/CD.

The same-origin edge-proxy approach avoids both problems at once: no env var
to manage (UI or otherwise), and zero homelab involvement — the whole fix is
a source-code constant plus a routing file, built and served entirely by
Cloudflare's existing dashboard Git-integration pipeline, untouched.

## Notes for future work

- **CORS is now moot for the browser hop.** Since the SPA calls `/api/*`
  same-origin, the browser never sees a cross-origin request — no preflight,
  no `Access-Control-Allow-Origin` needed for this path. `ALLOWED_ORIGINS`
  is still set on the Railway service to `https://philosophy-explorer.pages.dev`
  from when this was still a planned cross-origin call; harmless to leave,
  but no longer load-bearing for the deployed SPA. Only matters if something
  ever calls the Railway domain directly from a browser (e.g. manual testing).
- **If the Railway domain changes** (custom domain, service recreated, etc.),
  update `BACKEND_ORIGIN` in `functions/api/[[path]].ts` and redeploy — one
  line, one commit, no dashboard.
- **Verified locally** with `wrangler pages dev ./packages/web/dist` —
  `/api/health` proxied correctly, SPA fallback routes still resolved.
  Not yet verified against the actual deployed Cloudflare Pages build.
- The original Railway service (`@philosophy-explorer/web`, stuck in a
  `FAILED` state from before `railway.json` existed) is still sitting in the
  `wholesome-truth` Railway project, unused — candidate for deletion as
  cleanup, not yet removed.
