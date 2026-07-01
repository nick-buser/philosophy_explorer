import createClient from 'openapi-fetch';
import type { paths } from './api-types';

// Types are generated from packages/api/specs/openapi.json via `npm run gen:types`.
// After any API change: run gen:spec (API must be running), then gen:types, then commit both.
// Production builds default to '' (same-origin — proxied by the Cloudflare Pages
// Function at functions/api/[[path]].ts) rather than a baked-in backend URL, so
// the deploy target never needs a build-time env var. Dev keeps hitting the local
// F# server directly since there's no dev-time proxy configured in vite.config.ts.
export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:3001'),
});
