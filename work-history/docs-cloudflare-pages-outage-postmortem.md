# DOCS — postmortem for the Cloudflare Pages outage

**Branch:** `docs/cloudflare-pages-outage-postmortem`
**Merged:** (pending)

Follow-up to `fix-cloudflare-pages-routes-json-outage.md` and
`fix-frontend-hardcoded-localhost-api-url.md`. Those two docs cover the
individual technical fixes; this one records the full incident as it actually
unfolded — including the misdiagnosis and the process missteps — so the
lessons aren't lost once the individual PRs are merged and forgotten.

## What changed

- Added `docs/incidents/001-cloudflare-pages-outage-2026-07-01.md` — a full
  timeline of the ~2 hour outage: the `_routes.json` red herring, the
  `build_config` reset-to-empty root cause, and the nine-duplicated-fallback
  bug that hid behind both. Includes a "what went wrong (process)" section
  and a "what went right" section, not just technical root causes.

## Why

Three unrelated bugs shipped and were fixed across two prior PRs, one of them
after an initial misdiagnosis that cost a full deploy cycle. The individual
fix PRs document *what* changed; this postmortem documents *why the process
took two hours instead of twenty minutes* — under-testing the initial change,
trusting `wrangler pages dev` as equivalent to the real edge without
verifying, and reaching for "ask the user to check the dashboard" before
exhausting programmatic diagnosis. That's worth recording honestly so the
next incident like this gets caught faster.

## Notes for future work

- Two action items from the postmortem are already done: the
  wrangler-OAuth-token-as-API-key diagnostic technique and the
  `build_config`-can-silently-reset gotcha are now in the global
  `cloudflare-access` skill; the homelab-isolation and no-dashboard-messenger
  rules are now global feedback memories.
- Two action items remain open (not addressed by this branch):
  - A repo lint/check that fails CI if a
    `VITE_API_URL ?? 'http://localhost...'`-style literal appears outside
    `packages/web/src/lib/api.ts`, so a duplicated fallback fails fast at
    review time instead of shipping to production.
  - Whether `pw-validate smoke` (or an equivalent real-data browser check)
    should run automatically after every Cloudflare Pages deploy, rather than
    only on request.
