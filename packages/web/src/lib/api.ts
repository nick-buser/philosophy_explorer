import createClient from 'openapi-fetch';
import type { paths } from './api-types';

// Types are generated from packages/api/specs/openapi.json via `npm run gen:types`.
// After any API change: run gen:spec (API must be running), then gen:types, then commit both.
export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
});
