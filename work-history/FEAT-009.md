# FEAT-009 — Logic Lab (Aristotelian phase 2: square of opposition, existential-import toggle, immediate inferences)

**Branch:** `feat/FEAT-009-logic-lab-aristotelian-phase-2`
**Merged:** <unmerged>

## What changed

- Added the **square of opposition** as a second visualization on the
  Aristotelian Lab page:
  - `aristotelian-square.ts` — geometry (`buildSquareLayout`) plus the
    relationship table. Six edges: two always-active contradictory
    diagonals (A-O, E-I); one contrary (A-E), one subcontrary (I-O),
    and two subalternation edges (A-I, E-O) whose `active` flag
    follows the `ImportSetting`. `deriveTruths(focused, import)`
    returns `{ A, E, I, O } → 'true' | 'false' | 'unknown'`, where
    Boolean reading only flips the contradictory partner and
    traditional reading also propagates contraries / subcontraries /
    subalternation.
  - `AristotelianSquare.tsx` — SVG renderer. Corner badges, dashed
    + dimmed edges when not active, T/F/? truth glyphs at the three
    unfocused corners when a focused corner is set.
  - Tests (`aristotelian-square.test.ts`, 14 cases) cover layout
    geometry, edge activation per import setting, and truth-table
    correctness for both readings.

- Added the **existential-import toggle**:
  - `aristotelian-validity.ts` extended: `checkSyllogism` now accepts
    an optional `ImportSetting` (`'traditional' | 'boolean'`, default
    traditional). Under Boolean the 9 weakened moods are reported as
    invalid but still surface their entry plus a
    `'weakened-under-boolean'` reason so the badge can explain the
    flip rather than appearing as a generic table miss.
  - `ImportToggle` component in `routes/logic.$system.tsx` — a small
    radiogroup pair (Traditional / Boolean) wired into the toolbar.
    State lives at the `AristotelianLab` level and is threaded into
    the validity badge, the square renderer, and the immediate-
    inferences panel.
  - Validity-test suite (`aristotelian-validity.test.ts`) gained 6
    new cases covering the toggle: every weakened mood flips to
    invalid under Boolean, every non-weakened mood stays valid,
    table-miss moods stay invalid under both readings.

- Added the **immediate inferences** panel:
  - `aristotelian-immediate.ts` — pure functions `convert`,
    `convertPerAccidens`, `obvert`, `contrapose`, plus
    `allImmediateInferences` and `formatProposition`. Each
    transformation returns `{ result, validity, reason }` with
    validity tagged `'simple' | 'per-accidens' | 'invalid'`.
    Obversion / contraposition produce predicates prefixed `non-X`
    (toggling on the prefix so double-obversion cancels — verified
    by the test suite).
  - `ImmediateInferencesPanel` and `ImmediateInferenceRow` components
    in `routes/logic.$system.tsx` — render the inferences for the
    parsed single-proposition input and re-grade `per-accidens` rows
    to invalid when the toggle is on Boolean.
  - Tests (`aristotelian-immediate.test.ts`, 24 cases) cover all four
    forms × all four moves, double-obversion cancellation, ordering
    of `allImmediateInferences`, and the prose pretty-printer.

- Wired the new pieces into `AristotelianLabBody`:
  - Toolbar: existing structural commands + example picker + new
    `ImportToggle`.
  - Bottom row of the lab body: a 2-column grid with the square on
    the left and the immediate-inferences panel on the right. The
    square renders all the time (with no focused corner for syllogism
    input); the inferences panel shows a hint when the input is a
    syllogism rather than a single proposition.
  - The validity badge now takes `importSetting` and renders a third
    appearance for the "valid traditionally, invalid under Boolean"
    case (rose with the entry name shown).

- Updated `docs/formal-logic/aristotelian-syllogistic.md`:
  - Status line now reflects phase-2 shipped under FEAT-009.
  - New "Phase 2 — what shipped" section documenting the toggle,
    square, and immediate inferences.
  - "Open questions" trimmed to what's actually still open (boundary-
    straddling ×, `non-X` round-tripping, syllogism corner
    highlighting).

### Files

| File | Change |
|------|--------|
| `packages/web/src/logic/aristotelian-immediate.ts` | new |
| `packages/web/src/logic/aristotelian-square.ts` | new |
| `packages/web/src/logic/AristotelianSquare.tsx` | new |
| `packages/web/src/logic/aristotelian-validity.ts` | extend `checkSyllogism` for `ImportSetting` |
| `packages/web/src/logic/__tests__/aristotelian-immediate.test.ts` | new (24 cases) |
| `packages/web/src/logic/__tests__/aristotelian-square.test.ts` | new (14 cases) |
| `packages/web/src/logic/__tests__/aristotelian-validity.test.ts` | +7 cases |
| `packages/web/src/routes/logic.$system.tsx` | wire toggle + square + inferences panel; thread `ImportSetting` through `ValidityBadge` |
| `docs/formal-logic/aristotelian-syllogistic.md` | phase-2 section + status update |
| `work-history/FEAT-009.md` | this file |

Verified: `tsc --noEmit` clean; `npm run test:web` 247/247 (was
202/202 pre-FEAT-009, +45 new); `npm run test:api` 10/10; `npm run
build --workspace=packages/web` clean (1.31 MB pre-gzip / 402 kB
gzipped, +6 kB over FEAT-008); Vite dev-server smoke confirmed
`/logic/aristotelian` returns HTTP 200 and the new modules transform
without error.

## Why

Phase 1 (FEAT-008) cut the syllogism Lab deliberately narrow: A/E/I/O
forms, the syllogism, the 24-mood validity table, no philosophical
toggles. The followups called out at merge time were **square of
opposition**, **existential-import toggle**, and **medieval immediate
inferences (conversion / obversion / contraposition)** — three
additive features that pedagogically reinforce each other, since:

- The existential-import toggle has near-zero standalone meaning
  without something to demonstrate the flip on. The 9 weakened moods
  in the syllogism table are part of that, but the square's
  contraries / subcontraries / subalternation are the cleaner visual
  story for a one-proposition input.
- The square of opposition is the pedagogically natural place to
  watch traditional → Boolean flatten the relationship graph.
- The immediate inferences are the medieval extension that completes
  the term-logic story: "given one proposition, what else is forced?"
  vs. the syllogism's "given two, what conclusion follows?". Their
  validity also depends on import (conversion per accidens, E
  contraposition by limitation), so the toggle drives them too.

Bundling all three into one PR lets the toggle do real work in three
places at once instead of being a switch with a single downstream
effect.

Closes #<issue-tbd>

## Notes for future work

- **The toggle composes cleanly across three subsystems.** The
  `ImportSetting` parameter threads through `checkSyllogism`,
  `buildSquareLayout` / `deriveTruths`, and the per-accidens-grade
  fall-through in `ImmediateInferencesPanel`. If a future system
  also has a "philosophical reading" toggle (e.g. classical vs.
  intuitionistic for a future propositional system), the same
  pattern (a small union type as a default-traditional argument)
  is the obvious shape to copy. The toggle component itself is
  currently inlined in the route — extracting a generic
  `LogicReadingToggle` becomes worthwhile as soon as the second
  system needs one.
- **`non-X` predicates are display-only.** Obversion and
  contraposition produce predicates like `non-Mortal`. The parser
  does not accept these as DSL terms, so the user can read the
  inferred proposition in the panel but cannot paste it back into
  the editor. Round-tripping would require either a parser
  extension (allow `non-X` as a term) or a structural change to
  the AST (a `complement` mark on the predicate). Neither was
  worth the scope of this ticket but it is the obvious next move
  if someone wants to chain immediate inferences.
- **Square geometry uses fixed pixel coordinates.** The layout is
  on a 360×280 viewBox with constant corner positions. This is
  fine for the current usage (one square per lab page) but if the
  square is ever embedded into a smaller card, it'll need a
  responsive variant. Test coverage asserts the geometric
  invariants (top/bottom rows, left/right columns) so changes
  there are safe.
- **`deriveTruths` for I and O under traditional is intentionally
  partial.** I-true forces only E-false (via the contradictory);
  A and O remain `unknown` because subalternation runs A→I (not
  I→A) and the subcontrary relation only forbids both being false.
  This is the textbook reading and matches how square diagrams are
  drawn in modern logic textbooks (e.g. Copi & Cohen). If a future
  user expects "I-true forces O-true" via subcontrary, they're
  reading the relationship backwards — subcontraries can't both
  be false, but they can both be true.
- **`ValidityBadge` now has a third appearance** for the
  "weakened-under-boolean" case. This is the second time the badge
  has grown a state (FEAT-008 introduced the weakened-traditional
  amber state). If a fourth state appears, it's worth refactoring
  the badge into a small state machine rather than continuing to
  branch on result shape.
- **`AristotelianLab` and the rest of the Lab pages still share
  ~80% of their chrome.** FEAT-008 already flagged this as the
  next REFAC target. FEAT-009 grows the Aristotelian page (toggle
  + two new panels) but does not move toward extracting the
  shared chrome — partly because the Aristotelian-specific layout
  is now genuinely larger than the other three labs. The REFAC
  is still on the table but the calculation is different now: the
  generic chrome is smaller relative to the Aristotelian-specific
  body, so a `LogicSystemPageChrome` extraction has less leverage
  than it did at merge time of FEAT-008.
- **No human browser check** — verified via `tsc --noEmit`,
  `vitest`, `dotnet test`, `npm run build`, and a Vite dev-server
  smoke (`/logic/aristotelian` returned HTTP 200, the two new
  modules transformed cleanly). A human pass should confirm:
  visual fit of the two-panel bottom row at narrow widths; the
  T/F/? truth glyphs are legible at the corner badge size; the
  toggle gives a satisfying "click" of feedback when flipping
  between readings on a syllogism that contains a weakened mood
  (e.g. the existing Bramantip seed example).
- **Bundle: +6 kB pre-gzip over FEAT-008.** Web build is now
  ~1.31 MB pre-gzip / ~402 kB gzipped. The route-level
  code-splitting follow-up flagged since FEAT-005 remains the
  obvious next move — none of the immediate-inferences /
  square modules are huge individually, but they're additive and
  the trend is one-way.
