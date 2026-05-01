# FEAT-006 — Logic Lab (phase 2: Kripke modal logic)

**Branch:** `feat/FEAT-006-logic-lab-kripke-modal`
**Merged:** <unmerged>

## What changed

- Designed and scoped the system in
  `docs/formal-logic/kripke-modal-logic.md`, with a companion
  `docs/formal-logic/backend-logic-core.md` recording the longer-term
  F# logic-core strategy.
- Added the Kripke modal-logic pipeline under `packages/web/src/logic/`:
  - `kripke-types.ts` — `ModalFormula` AST, `KripkeModel` (worlds,
    accessibility edges, designated world), `FrameClass` /
    `FrameClassSlug`.
  - `kripke-parser.ts` — recursive-descent parser for the modal DSL.
    Accepts both ASCII (`[]`, `<>`, `->`, `<->`, `&`, `|`, `!`) and
    Unicode spellings; right-associative `->`, left-associative
    everywhere else.
  - `kripke-render.ts` — pretty-printer with two outputs sharing one
    precedence pass: `renderUnicode` for plain text and `renderKatex`
    for KaTeX-rendered display.
  - `kripke-frames.ts` — pure-data records for `K`, `T`, `S4`, `S5`
    plus the four characteristic axioms.
  - `kripke-commands.ts` — slash-command registry (operators + per-
    example completions) for the editor.
  - `KripkeFormulaEditor.tsx` — CodeMirror 6 host. Mostly a copy of
    `EgEditor` per the design doc's "copy first, extract later"
    decision (Open Q2).
  - `KripkeModelView.tsx` — `@xyflow/react` visualization. Self-loops
    render as a ↻ on the node rather than a curved edge; symmetric
    pairs collapse to a double-headed arrow; the designated world
    gets a blue ring. `buildGraph` is exported separately for
    headless unit testing.
  - `KatexFormula.tsx` — thin React wrapper around `katex.render`.
- Wired the `kripke` system end-to-end:
  - Flipped `LOGIC_SYSTEMS['kripke'].status` from `'stub'` to
    `'available'` in `packages/web/src/data/logic-systems.ts`,
    populating it with seven hand-authored examples (each with
    `model`, `frameClass`, `satisfied`, and a teaching note).
  - Extended `LogicSystem`/`LogicExample` additively with optional
    `frameClasses`, `model`, `frameClass`, `satisfied` fields. Other
    systems leave them undefined.
  - `routes/logic.$system.tsx` — added a `KripkeLab` branch alongside
    `PeirceEgLab`. The lab shows: a frame-class picker (K/T/S4/S5)
    with constraints + characteristic axiom, an editor + KaTeX
    rendering of the parsed formula, the example's Kripke model,
    and a truth badge (⊨ / ⊭ at the designated world) sourced from
    the hand-authored `satisfied` flag.
- Test coverage:
  - `__tests__/kripke-parser.test.ts` — 25 parser cases plus
    pretty-printer round-trips, extended with four `renderKatex`
    cases.
  - `__tests__/kripke-frames.test.ts` — 11 cases asserting that each
    frame's `characteristicAxiom.dsl` parses and round-trips to its
    declared `unicode` form.
  - `__tests__/kripke-system-data.test.ts` — 45 cases over the seed
    examples (slugs unique, models internally consistent, designated
    worlds present, etc.).
  - `__tests__/kripke-model-view.test.ts` — 8 cases over `buildGraph`.
  - Total web suite: 101 tests (was 8 pre-FEAT-006).
- Installed `katex` + `@types/katex` in `packages/web`. `@xyflow/react`
  and `@dagrejs/dagre` were already present from the original
  scaffold; FEAT-006 is the first consumer.

## Why

Continues the Logic Lab initiative scoped in
`docs/formal-logic/logic-explorer-tab.md`. Kripke modal logic is the
right second system because it stresses parts of the Lab that Peirce
EG didn't:

- **Two authoring surfaces, not one.** A modal formula is linear
  text, but its meaning lives in a directed graph of worlds. This is
  the first system where the system descriptor has to carry an
  artifact (`KripkeModel`) alongside each example formula.
- **Parameterized semantics.** "Modal logic" is a family. Picking a
  frame class (K, T, S4, S5) changes which formulas are valid. Peirce's
  alpha system has no such knob, so we hadn't yet exercised the
  "frame-class metadata is per-system" shape.
- **First real `@xyflow/react` consumer.** The dep was scaffolded
  long before FEAT-006; this ticket is what justifies it.

The phase-1 cut is deliberately narrow per the design doc: no
algorithmic model checker, no tableau proofs, no multi-agent
modalities, no Lean integration, no `LogicIR`. The truth badge is
sourced from a hand-authored `satisfied` field; replacing it with a
recursive evaluator is the most likely follow-up.

Closes #<issue-tbd>

## Notes for future work

- **Truth badge is hand-authored.** Each example's `satisfied: bool`
  is asserted by the seed author, not computed. When the user edits
  the formula in the editor away from the example's DSL, the badge
  renders a neutral `⊨ ?` rather than lying. The phase-2 evaluator
  should replace both branches and unblock free-form authoring. See
  `docs/formal-logic/kripke-modal-logic.md` Open Q5.
- **Frame-class picker is informational only.** Picking K/T/S4/S5
  changes the constraint/axiom display, not anything about the
  example's model. The design doc explicitly defers algorithmic
  enforcement (warn when a model labelled S4 has a non-transitive R)
  to phase 2.
- **AST is TS-only, by design.** The parser, pretty-printer, and
  (eventual) evaluator all live in TS. The migration path is recorded
  in `docs/formal-logic/backend-logic-core.md`: the strongest forcing
  functions are the first computed truth badge, the introduction of
  `LogicIR`, or the first Lean integration. Whichever fires first
  takes responsibility for promoting the modal AST to F#.
- **Editor duplication.** `KripkeFormulaEditor` is a near-copy of
  `EgEditor`; the only differences are the slash-command source and
  some labels. Per the design doc's "copy first, extract later"
  decision, a small REFAC ticket should pull a shared `LogicCmEditor`
  out once we have a third system using CodeMirror.
- **Pretty-printer factoring.** `renderUnicode` and `renderKatex`
  share a single precedence pass parameterized by a `Glyphs` table.
  Adding a third output (e.g. LaTeX with bigger boxes for print, or
  ASCII for snapshot tests) is a data edit.
- **xyflow defaults.** `KripkeModelView` is non-interactive (no
  drag, no zoom, no pan). Phase 2 turns this into an interactive
  model editor. The `buildGraph` split keeps the visual decisions
  testable headlessly.
- **Bundle size.** Adding KaTeX + `@xyflow/react` lifts the build
  from 974 kB pre-gzip to ~1.26 MB pre-gzip (390 kB gzipped). Vite
  surfaces the >500 kB warning. Route-level code-splitting for
  `/logic/$system` is the obvious next move and was already noted
  as follow-up in FEAT-005.
- **No live browser test.** Per CLAUDE.md the rule is to verify UI
  in a browser. I verified via `tsc --noEmit`, `npm run build`, the
  full `vitest` suite (101 tests, all passing), and a Vite dev
  server smoke test confirming each new module transforms with no
  errors. A human browser check should happen before merge —
  particularly the KaTeX layout in the rendering panel and the
  React Flow canvas at small viewport widths.
- **Reading-pointer wiring deferred.** The design doc anticipated a
  deep link from a "Kripke" philosopher detail page back into the
  Lab. The seed currently has no Saul Kripke or David Lewis entry,
  so `system.thinkerSlug` is `null` and the detail-page CTA logic
  in `routes/philosophers.$slug.tsx` correctly hides itself.
