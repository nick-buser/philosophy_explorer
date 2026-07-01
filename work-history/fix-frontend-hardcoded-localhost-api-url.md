# FIX — nine call sites still hit `localhost:3001` from production

**Branch:** `fix/frontend-hardcoded-localhost-api-url`
**Merged:** (pending)

Follow-up to `infra-cloudflare-pages-same-origin-proxy.md`. That PR fixed
`packages/web/src/lib/api.ts` (the typed `openapi-fetch` client) to default to
same-origin in production, but missed nine other files that each independently
redefined the same `import.meta.env.VITE_API_URL ?? 'http://localhost:3001'`
fallback for raw `fetch()` calls. Once the Cloudflare Pages build config outage
(separate issue, see `project_cloudflare_pages_build_config_outage` memory) was
fixed and the homepage started loading again, it showed "0 philosophers · 0
works · 0 schools" — every data fetch was hitting `localhost:3001` from the
production browser and getting `net::ERR_CONNECTION_REFUSED`.

## What changed

- `packages/web/src/lib/api.ts` — exported the existing fallback logic as
  `apiBaseUrl`, so it's defined in exactly one place.
- Nine files updated to import `apiBaseUrl` instead of redefining their own
  `const API`/`const API_BASE` fallback: `routes/index.tsx`,
  `routes/philosophers.$slug.tsx`, `routes/works.$slug.tsx`,
  `routes/schools.$slug.tsx`, `routes/arguments.tsx`, `routes/arguments.$.tsx`,
  `components/ArgumentCard.tsx`, `components/ArgumentEditor.tsx`,
  `logic/labs/NaturalDeductionLab.tsx`.
- `lib/telemetry.ts` was checked and left alone — it already falls back to a
  same-origin regex (`/\/api\//`) when `VITE_API_URL` is unset, and is gated
  behind the (currently unset) OTEL browser RUM endpoint anyway.

## Why

The duplication itself was the bug: fixing the same-origin default in one file
gave false confidence that the whole app was fixed, when nine other call sites
had silently copy-pasted the same pre-proxy-era fallback. A single exported
constant means there's now exactly one place this can go wrong.

## Notes for future work

- **Verified with a real browser, not just curl.** `curl /api/health` returning
  200 said nothing about whether the *page* actually calls that path — the
  outage here was invisible to endpoint-level curl checks. Confirmed via
  `wrangler pages dev` + a headless Playwright script that captured
  `page.on('requestfailed', ...)` and read the actual rendered stats
  ("101 philosophers · 136 works · 20 schools"), not just HTTP status codes.
- If a new route/component ever needs the API base URL again, import
  `apiBaseUrl` from `lib/api.ts` — don't redefine the fallback locally.
