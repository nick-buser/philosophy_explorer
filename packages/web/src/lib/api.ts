import createClient from 'openapi-fetch';
import type { paths } from './api-types';

// Types are generated from packages/api/specs/openapi.json via `npm run gen:types`.
// After any API change: run gen:spec (API must be running), then gen:types, then commit both.
// Production builds default to '' (same-origin — proxied by the Cloudflare Pages
// Function at functions/api/[[path]].ts) rather than a baked-in backend URL, so
// the deploy target never needs a build-time env var. Dev keeps hitting the local
// F# server directly since there's no dev-time proxy configured in vite.config.ts.
//
// Every raw-fetch call site (routes/components not using the typed `api` client
// below) must import this instead of redefining its own `?? 'http://localhost:3001'`
// fallback — that duplication is exactly how a same-origin proxy migration missed
// nine of ten call sites and left them calling localhost from production.
export const apiBaseUrl =
  import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:3001');

export const api = createClient<paths>({
  baseUrl: apiBaseUrl,
});
