# feat — Logic Lab: Catuṣkoṭi (Nāgārjuna's Tetralemma)

**Branch:** `feat/logic-lab-catuskoti`
**Merged:** TBD

Implements `.tickets/feat-logic-lab-catuskoti.md` against the design
doc `docs/formal-logic/catuskoti.md`. The third world-logic system,
landing after `feat/logic-lab-saptabhangi` and reusing its system
shape. Catuṣkoṭi was the first of the two remaining un-ticketed
candidates in `docs/formal-logic/world-logic-traditions.md` §2; its
ticket and design doc were written as the opening commit of this
branch (the four earlier world-logic systems had their tickets opened
in a separate `docs/` commit, but Catuṣkoṭi was un-ticketed).

## What changed

- New Logic Lab system at `/logic/catuskoti`. A proposition is placed
  at one of the four *koṭis* — A, ¬A, A∧¬A, ¬(A∨¬A) — under one of
  two readings (affirming / prasaṅga), and the four corner-formulas
  are evaluated under a four-valued (FDE) valuation.
- Types `catuskoti-types.ts` — `TruthValue` (`true | false`), the
  `FOUR_KOTIS` constant (each koṭi is one subset of {true,false} —
  the four FDE values — with Sanskrit phrasing, modern formula, and
  gloss), `Reading` (`affirming | prasanga`) with `READING_INFO`,
  `Proposition`, and the `valueKey` / `kotiByNumber` /
  `formatProposition` helpers. `FOUR_KOTIS` is to this system what
  `SEVEN_BHANGAS` is to saptabhaṅgī: a constant encoding the closed
  structure.
- Parser `catuskoti-parser.ts` — line-based `key: value` in the
  `saptabhangi-parser.ts` idiom: a `proposition:` line, a `koti:`
  line, and an optional `reading:` line (defaulting to `affirming`).
  Koṭi aliases (`affirmation`/`is`/`asti`/`1`, …) and reading aliases
  (`positive`, `rejecting`, `prasaṅga`, …) accepted. `--` and `#`
  line comments stripped. Duplicate lines and unknown keys/values are
  parse errors.
- Engine `catuskoti-engine.ts` — the FDE connectives `fdeNot` /
  `fdeAnd` / `fdeOr` over values represented as `TruthValue[]`, and
  `evaluateCatuskoti`: fix v(A) to the selected koṭi's value set,
  evaluate the four fixed corner-formulas under it, and read the
  verdict (`affirmed` / `rejected`) off the reading. Total and
  structural — no proof search.
- UI:
  - `CatuskotiDiagram.tsx` — the four-corner SVG: the proposition at
    the centre, the four koṭis at the corners of a square, the
    selected koṭi ringed, each corner badged with its corner-
    formula's evaluated value; in the prasaṅga reading every corner
    is struck through.
  - `CatuskotiEditor.tsx` wraps `LogicCmEditor`;
    `catuskoti-commands.ts` supplies slash commands for the four
    koṭis, the prasaṅga reading, a skeleton, and the seed examples.
  - `labs/CatuskotiLab.tsx` — header / history / primitives /
    further-reading in the shared shape; editor + evaluation panel
    with a verdict badge and a per-corner value table; the four-
    corner diagram; an `affirming` / `prasaṅga` reading toggle (in
    the `ImportToggle` idiom) that rewrites the DSL `reading:` line.
- Seed entry in `data/logic-systems.ts` — 8 examples: the four koṭis
  of MMK 18.8 in the affirming reading (`dharmas-*`), and the
  Tathāgata-after-death *avyākṛta* refused at each of the four
  corners in the prasaṅga reading (`tathagata-*`). `thinkerSlug:
  null` — no Nāgārjuna node is seeded yet.
- Route wiring in `routes/logic.$system.lazy.tsx` — the `catuskoti`
  slug routes to a lazy-loaded `CatuskotiLab` chunk.
- `docs/formal-logic/world-logic-traditions.md` updated — §2 marked
  ticketed; the intro's "un-ticketed" note narrowed to Mohist only.
- Tests: `catuskoti-parser.test.ts` (17), `catuskoti-engine.test.ts`
  (17 — including the four-koṭi / 0-1-1-2 geometry invariant, the FDE
  connective tables, and the all-corners-reachable check),
  `catuskoti-system-data.test.ts` (7).

## Why

`world-logic-traditions.md` §2 picks catuṣkoṭi as the smallest
world-logic candidate and the sharpest classical/non-classical
contrast: a tiny, exact state space — four corners — that formalizes
cleanly as the four-valued FDE scheme and renders as a four-corner
diagram, a diagrammatic foil to the Aristotelian square of
opposition. It also brings the affirm/reject contrast no other Lab
system carries: the same closed structure read two opposite ways.

Closes the Catuṣkoṭi item of `world-logic-traditions.md` §2.

## Notes for future work

- **Reading lives in the DSL, not on `LogicExample`.** Unlike the
  Aristotelian import setting (a pure UI toggle), the catuṣkoṭi
  reading is a `reading:` line in the DSL, so seed examples are
  self-contained and the toggle just rewrites that line
  (`setReadingInDsl` in `CatuskotiLab.tsx`). No new optional field
  was added to `LogicExample`.
- **The consistency tension is surfaced, not resolved.** The engine
  reports two structural facts the design doc (§"Open questions" 2)
  flags: koṭi 3 (the glut) designates all four corner-formulas, and
  koṭi 4 (the gap) designates none — not even ¬(A∨¬A), the formula
  expressing "neither." Phase 1 commits to the four-valued FDE
  reading; Priest's (2010) five-valued extension is deferred.
- **Phase 2** — compound-statement evaluation over the four values,
  best built alongside the roadmap's many-valued logic item and
  saptabhaṅgī's phase 2 so the *n*-valued substrate is shared once.
  The five-valued extension and a compare view against the
  Aristotelian square are the other phase-2 items — see
  `docs/formal-logic/catuskoti.md` §"Phase 2+".
- **Verification** was `vitest` (1174/1174 passing) + `tsc --noEmit`
  + `npm run build`. No browser / interaction pass — consistent with
  `lab-status.md` §4, the standing gap across all Lab tickets.
