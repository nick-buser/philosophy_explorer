# feat — Boolean algebra Logic Lab

**Branch:** `feat/logic-lab-boolean-algebra`
**Merged:** 2026-05-03 (TBD on actual merge)

This is the first work-history entry filed without a numeric ticket
ID, per the convention proposed in `docs/formal-logic/lab-roadmap.md`.
Slug-based filenames (`feat-boolean-algebra.md` here) replace the
old `FEAT-###.md` pattern; if the convention sticks, `work-history/
README.md` should be updated to reflect it.

## What changed

- New Logic Lab system at `/logic/boolean`. Adds the algebraic-logic
  lineage (Boole → De Morgan → Schröder) that the historical spine
  was missing.
- AST + parser: `boolean-types.ts`, `boolean-parser.ts`. Mixed
  algebraic / propositional syntax — juxtaposition is conjunction,
  `+` is disjunction, postfix `′` and prefix `~` / `¬` / `!` are
  complement; XOR via `^`, IMP via `->`, IFF via `<->`. Variables
  are restricted to single letters so `xy` parses unambiguously as
  `x · y`.
- Truth-table builder `boolean-truth-table.ts` — same shape as
  `fol-truth-table.ts` but works directly on the Boolean AST. The
  Boolean Lab uses it for the truth-table panel and the
  `tautology / contradiction / contingent` status badge. Reused by
  `boolean-kmap.ts` and `boolean-lattice.ts` for cell values.
- Rule-based simplifier `boolean-simplify.ts` with a step trace.
  Implements the standard textbook rule list (de Morgan, absorption,
  distributivity not present — handled implicitly via DNF/CNF for
  now, double-negation, idempotence, identity, annihilator,
  complement, IMP/IFF/XOR elimination). Step cap of 64; deterministic
  pre-order traversal; exposes `RULE_LABELS` for UI legends.
- Normal forms `boolean-normal-forms.ts` — DNF (sum-of-minterms),
  CNF (product-of-maxterms), and ANF (Reed-Muller via Möbius
  transform on the truth table).
- Karnaugh map `boolean-kmap.ts` + `KarnaughMap.tsx`. Quine–McCluskey
  for prime implicants; greedy minimal cover (essentials first, then
  largest-coverage greedy fill). 1-, 2-, 3-, and 4-variable layouts
  (Gray-code rows / cols). Cells coloured by which PI covers them;
  a legend lists each PI's algebraic label and cell count. Capped at
  4 variables (`KMAP_MAX_VARS`).
- Hasse diagram `boolean-lattice.ts` + `HasseDiagram.tsx`. The
  Boolean lattice up to 2⁴ = 16 vertices, levels by Hamming weight,
  covering edges between adjacent levels; vertices satisfying the
  formula are highlighted, edges with both endpoints true are
  emphasised. Capped at 4 variables (`HASSE_MAX_VARS`).
- Lab page `BooleanAlgebraLab.tsx`, editor `BooleanEditor.tsx`,
  command set `boolean-commands.ts`. Composes K-map, Hasse, truth
  table, simplification trace, and DNF / CNF / ANF panels.
- Seed entry in `data/logic-systems.ts` — 11 examples (atoms / OR /
  De Morgan / absorption / distributivity / consensus theorem /
  majority-of-three / 3-bit XOR parity / 4-variable reducible /
  excluded middle / non-contradiction). History note covers Boole
  through Schröder, Shannon, and the Karnaugh / Quine-McCluskey
  pipeline. 4 reading pointers (SEP entries on Boole and the
  algebra-of-logic tradition; Boole's 1854 *Laws of Thought*; SEP
  on Boolean algebra).
- Route wiring in `routes/logic.$system.lazy.tsx` — new `boolean`
  slug routes to `BooleanAlgebraLab`. Code-split chunk weighs in at
  31 kB / 9 kB gzipped — between MedievalLab and ModernFolLab.
- Tests: 79 new tests across `boolean-parser`, `boolean-simplify`,
  `boolean-truth-table`, `boolean-normal-forms`, `boolean-kmap`,
  `boolean-lattice`, and `boolean-system-data`. Total now
  463/463 passing (was 384).
- `lab-status.md` updated: 7th row added, "Last shipped" promoted to
  this ticket.

## Why

The two pre-FEAT-012 reviews collated into `lab-roadmap.md` both
flagged Boolean algebra as the single largest *historical* gap in
the spine — the bridge between Aristotelian term logic and modern
quantificational logic, and an entire notational and visualisation
tradition (algebraic equations, Karnaugh maps, Hasse / lattice
diagrams) absent from the Lab. Picking this system as the first
medium-term ticket also tested the roadmap's "system × visualisation
matrix" framing: a single ticket added three new visualisation
families (algebraic, K-map, lattice) plus one new system, with
demonstrable leverage from reusing existing infrastructure
(`LogicCmEditor`, the truth-table conventions, the lazy-route
machinery).

The ticket also serves as the inflection point for the
no-numeric-ID branch convention — see `lab-roadmap.md` §"Note on
ticket numbering."

## Notes for future work

- **K-map grouping rectangles.** Cells are coloured by which PI in
  the cover contains them, but the canonical "rectangle around the
  group" highlight is not drawn. Wrap-around grouping (a PI that
  spans the toroidal edge of the K-map) was the awkward part to get
  right and was deferred in v1; cell colouring conveys the same
  information at one less visual layer. Adding rectangles becomes
  worthwhile if user feedback says the colours alone aren't reading
  as "groups."
- **Variable cap of 4.** Both K-map and Hasse are capped at 4
  variables. 5-variable K-maps require paired sub-maps; the 5-cube
  Hasse with 32 vertices stops being legible flat. Lift if there's
  demand; for now the Lab silently falls back to "no K-map / Hasse
  shown" when the formula has more variables, which matches the
  roadmap's expectation.
- **Simplifier is rule-based, not a decision procedure.** Truth-table
  equivalence remains the source of truth; the simplifier exists to
  *show the work*. It does not implement distributivity (the rule
  doesn't terminate without a guidance heuristic). For "tightest
  equivalent expression" use the K-map cover output, which is the
  classical minimisation procedure.
- **No Postgres migration for the seed entry.** The Boolean system
  is added to `data/logic-systems.ts` like the other six; the
  question of moving system metadata to Postgres remains
  `open-questions.md` §2.9. Boolean isn't the trigger.
- **Editor doesn't pretty-print prime in autocomplete.** The
  `/prime` slash-command inserts U+2032 (`′`); some keyboard layouts
  need a paste shortcut, which works fine. The `'` ASCII variant is
  what most users will type and is fully accepted.
- **Compare view (next ticket per roadmap).** Boolean ↔ Modern FOL is
  a natural pair — the Lab now has both algebraic and linear-symbolic
  renderings of the same propositional content, and the truth-table
  conventions match. When `feat/logic-lab-compare-view` opens, this
  is the cheapest second pair after Frege ↔ Modern FOL.
- **UI not browser-tested.** Verification was vitest (463/463), `tsc
  --noEmit` clean, and `npm run build` clean. No Playwright or human
  smoke pass — that gap is what the roadmap's
  `infra/logic-lab-playwright-smoke` ticket addresses.

Closes the "Boolean algebra" entry in
`docs/formal-logic/lab-roadmap.md` §Medium term.