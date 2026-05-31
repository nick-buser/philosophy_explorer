# FEAT — Arguments nav link

**Branch:** `feat/arguments-nav-link`
**Merged:** (pending)

## What changed

- `packages/web/src/routes/__root.tsx` — added an `Arguments` link to the header
  `<nav>`, between Curricula and Logic Lab, pointing to `/arguments`. Same styling
  and `[&.active]` highlight as the existing links.

## Why

The argument browse/detail/create views (and full CRUD API) shipped in
`feat/argument-crud`, and arguments were seeded into both the dev and prod
Postgres stores — but the `/arguments` routes were never linked from the header
nav. They were reachable only by typing the URL directly, so the seeded data
appeared "missing" from the UI. This wires the existing view into navigation.
Closes #NNN.

## Notes for future work

- Pure nav addition — no API, route, DTO, or spec changes; the routes and
  `/api/arguments` endpoints already existed.
- The `+ New argument` entry point lives on the `/arguments` index page itself
  (top-right), so it's now reachable through the nav too.
