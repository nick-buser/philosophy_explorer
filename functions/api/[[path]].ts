// Cloudflare Pages Function — proxies every /api/* request to the Railway-hosted
// F# API, so the SPA always calls same-origin and never needs a build-time
// backend URL baked in via VITE_API_URL. _routes.json (packages/web/public/)
// scopes invocation to /api/* only; everything else serves as static assets.
//
// Backend origin is a source constant, not an env var — update via a normal
// commit if the Railway domain ever changes (e.g. a custom domain).
const BACKEND_ORIGIN = 'https://api-production-fd53.up.railway.app';

// Typed against plain Request/Response rather than the `@cloudflare/workers-types`
// PagesFunction global, since this repo doesn't otherwise depend on that package.
export const onRequest = async ({ request }: { request: Request }): Promise<Response> => {
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, BACKEND_ORIGIN);
  return fetch(new Request(target, request));
};
