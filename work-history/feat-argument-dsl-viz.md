# FEAT — Argument formalizations in DSL + rendered-visualization form

**Branch:** `feat/argument-dsl-viz`
**Merged:** (pending)

## What changed

Argument formalizations now render the stored AST as **(a) copyable Logic Lab DSL**
and **(b) the lab's own visualization**, inline on the argument detail page —
plus a deep link that opens the matching lab pre-loaded. Phase 1 covers
`fol` / `nd` / `aristotelian` (92 of 99 seeded arguments). A registry-style
dispatch makes the remaining (single-argument) formalisms a fast-follow.

- `lib/argument-dsl.ts` (new) — AST → Logic Lab DSL serializers (`folToDsl`,
  `ndToDsl`, `aristotelianToDsl`) + `formalizationToDsl` dispatch. Each emits
  exactly what the corresponding parser accepts, so the round trip is lossless.
  - fol: `renderUnicode` (the fol-parser already accepts the Unicode glyphs).
  - nd: `p, q ⊢ r` sequent.
  - aristotelian: long-form prose (`All … are …` ×2 + `Therefore …`).
- `logic/FolVisualization.tsx` (new) — the FOL "show your work" panels
  (validity badge, countermodel, truth table, semantic tableau) extracted from
  `ModernFolLab` into reusable exports, plus a `<FolVisualization formula>` that
  composes them. `ModernFolLab` now imports them (single source, no dup).
- `components/ArgumentCard.tsx` — new `FormalizationVisual` (fol → tableau/truth
  table + validity; nd → `FitchProofView`; aristotelian → `AristotelianRenderer`
  Venn) and `FormalizationDsl` (copyable DSL + prefilled lab link), rendered
  below the standard-form clause table.
- **Lab prefill** — `routes/logic.$system.tsx` adds `validateSearch` for `?dsl=`;
  `logic.$system.lazy.tsx` reads it and threads `initialDsl` to the lab (cast at
  the dispatch so only the 3 Phase-1 labs need the prop). `ModernFolLab`,
  `NaturalDeductionLab`, `AristotelianLab` seed their editor from `initialDsl`.
- Tests: `lib/__tests__/argument-dsl.test.ts` (6 round-trip + dispatch cases);
  `ArgumentCard.test.tsx` updated (the FOL formula now also appears in the DSL
  block → 3 occurrences, was 2). `.playwright-flows/arguments/dsl-viz.ts` —
  browser walkthrough for the shared pw-validate runner.

## Why

The arguments carry a formalism + AST, but the point of the project is to *see*
real arguments under a logic and reason about them. The not-yet-wired formalisms
showed only raw AST JSON + an "Open in Logic Lab" link that required copy-paste;
the wired ones showed only a clause table. Now FOL arguments render a full
semantic tableau (with countermodel) or truth table + validity verdict, nd
arguments render their Fitch proof, and aristotelian arguments render a Venn
diagram — and "Open in Logic Lab" opens the lab populated with the argument, no
copy-paste. Scope, FOL-viz choice (tableau + truth table), and prefill were
confirmed with the user before building. Closes #NNN.

## Notes for future work

- **Verified in a real browser** (pw-validate, local stack, 99 seeded args):
  FOL tableau + DSL render; clicking the lab link lands on
  `/logic/modern-fol?dsl=…` already parsed; aristotelian Venn renders; the FOL
  lab still works post-extraction. Zero console errors.
- **Phase 2 — the 7 single-argument formalisms** (boolean, kripke, ctl,
  epistemic, temporal, intuitionistic, indian, + eg/frege/etc. when they appear
  as alternative formalizations). Each has a renderer + a `format*` helper; add a
  `toDsl` + a `FormalizationVisual` case and give its lab an `initialDsl` prop.
- **Modal logics can't render a frame inline.** kripke/epistemic/temporal/ctl/
  intuitionistic visualizations need a *model* (worlds + relation) that the
  extraction's formula AST doesn't carry. Inline they can only show the formula
  notation; a richer view would require the extractor to emit a model.
- **Pre-existing cosmetic bug, still unaddressed:** on `aristotelian` arguments
  the clause table shows the conclusion proposition for every row (`clauseFormula`
  returns the whole `ast.formula` per clause). Separate `BUG` ticket.
- **DSL round-trip is covered by tests** — if a parser's accepted syntax changes,
  `argument-dsl.test.ts` will catch the drift before the lab prefill breaks.
