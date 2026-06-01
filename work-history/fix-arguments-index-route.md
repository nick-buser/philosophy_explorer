# FIX — /arguments resolves to the list, not the empty-splat detail

**Branch:** `fix/arguments-index-route`
**Merged:** (pending)

Follow-up to `feat/arguments-nav-link` (#53, merged). Adding the Arguments nav
link made the bare `/arguments` reachable for the first time and surfaced a
latent crash.

## What changed

- `routes/arguments.tsx` — `argumentsRoute` is now a layout (`component: () =>
  <Outlet/>`); the list page moved to a new `argumentsIndexRoute` (`path: '/'`).
- `routes/arguments.$.tsx` — detail reparented to `argumentsRoute` (`path: '$'`);
  `useParams({ from: '/arguments/$' })` → `argumentDetailRoute.useParams()`.
- `routes/arguments.new.tsx` — editor reparented to `argumentsRoute` (`path: 'new'`).
- `router.tsx` — assembles `argumentsRoute.addChildren([index, new, $])` and adds
  the single subtree to the root. Full paths are unchanged (`/arguments`,
  `/arguments/new`, `/arguments/$`), so every existing `to=`/`from=` still resolves.
- `routes/__tests__/arguments-routing.test.tsx` — regression test: `/arguments` →
  list, `/arguments/new` → editor, `/arguments/<id>` → detail. Fails on the pre-fix
  tree, passes after.
- `.playwright-flows/arguments/verify-fix.ts` + `.gitignore` (`.pw-out/`) — browser
  walkthrough for the shared `pw-validate` runner.

## Why

Visiting `/arguments` threw `Cannot read properties of undefined (reading '0')`
and rendered the root error boundary. The `/arguments/$` splat matched the bare
`/arguments` with an empty `_splat`, so `ArgumentDetailPage` rendered with
`id = ''`, `ArgumentCard` fetched `GET /api/arguments/` (which returns the list
array), and `data.formalizations[0]` blew up. It was never seen before because
nothing linked to `/arguments` — only `/arguments/<id>` (works) and the static
`/arguments/new` (already out-ranked the splat) were ever visited. The nav link
merged in #53 shipped this broken page; this is the fast-follow fix. Closes #NNN.

## Notes for future work

- **Verified in a real browser.** Reproduced on the dev deploy with pw-validate
  (minified stack → `ArgumentCard` `data.formalizations[t] ?? data.formalizations[0]`,
  tell-tale `GET /api/arguments/`), then confirmed the fix against a local stack
  (fixed web + local API, 99 seeded args): `/arguments` renders 99 cards,
  list→detail→editor all clean, zero console errors.
- **General TanStack gotcha:** a `$` splat and a bare index at the same path level
  collide — the splat swallows the index unless they're siblings under a shared
  parent. Keep any new `/arguments/*` routes as children of `argumentsRoute`.
- **Process miss that prompted this branch:** the fix was first pushed onto the
  already-merged `feat/arguments-nav-link` branch, so it never reached `main`.
  Check PR state before adding commits to a branch — a merged PR won't carry them.
- **Pre-existing cosmetic bug, out of scope:** on an `aristotelian` argument the
  clause table renders the conclusion proposition for every row (`clauseFormula`
  returns the whole `ast.formula` per clause). Worth a separate `BUG` ticket.
