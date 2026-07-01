# FIX — `_routes.json` broke the entire Cloudflare Pages site

**Branch:** `fix/cloudflare-pages-routes-json-outage`
**Merged:** (pending)

Follow-up to `infra-cloudflare-pages-same-origin-proxy.md`, which introduced
`packages/web/public/_routes.json` alongside the new `/api/*` proxy Function.
That file caused a full production outage — the homepage and all static
assets started 404ing site-wide, discovered immediately after merge while
sanity-testing the deploy.

## What changed

- Deleted `packages/web/public/_routes.json`.

## Why

`_routes.json`'s `include` list was assumed (per Cloudflare's docs summary)
to scope only *Function invocation* — i.e. "only invoke a Function for
`/api/*`, let everything else fall through to normal static asset serving
and `_redirects`." In practice, on this deploy, its presence restricted the
site's **entire routable surface** to the include list: `/`, `/index.html`,
and even `_routes.json` itself all returned 404, while `/api/*` worked fine.

Confirmed via `wrangler pages dev` locally: with `_routes.json` present,
`/` → 404; with it removed, `/` → 200 and `/api/health` → 200. The Function
doesn't need `_routes.json` at all — Cloudflare's file-based routing already
scopes `functions/api/[[path]].ts` to `/api/*` by its location alone.

## Notes for future work

- **Don't add `_routes.json` "for clarity" without testing against a real
  deploy first.** The docs' description of its effect (Function-invocation
  scoping only) didn't match observed behavior here. If it's ever
  reintroduced (e.g. to reduce Function invocation costs), verify against
  an actual Cloudflare Pages deployment — `wrangler pages dev` locally
  reproduced this exact failure, so it's a cheap check before shipping.
- General lesson: the previous ticket's "Verified locally... Not yet
  verified against the actual deployed Cloudflare Pages build" note in
  `infra-cloudflare-pages-same-origin-proxy.md` was exactly the gap that let
  this ship — `wrangler pages dev` matched production behavior closely
  enough to have caught this if the specific file (`_routes.json`) had been
  tested standalone, but the local smoke test only checked `/api/health` and
  the SPA fallback, not a plain static asset request like `/index.html`.
