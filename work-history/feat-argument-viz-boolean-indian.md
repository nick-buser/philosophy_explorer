# FEAT — DSL + visualization for boolean & indian arguments

**Branch:** `feat/argument-viz-boolean-indian`
**Merged:** (pending)

Phase 2a of the argument DSL + rendered-visualization work (follows #55). Wires
the two **self-contained** non-Phase-1 formalisms — those whose visual derives
purely from the AST, no model needed. The five model-bearing formalisms
(kripke/ctl/intuitionistic/epistemic/temporal) follow in a separate PR with a
shared model explorer.

## What changed

- `lib/argument-types.ts` — added `BooleanAst` / `IndianAst` and typed members
  to the `Formalization` union (excluded from the `GenericAst` catch-all) so the
  views narrow cleanly. `WiredFormalism` (the clause-table set) is unchanged.
- `lib/argument-dsl.ts` — `booleanToDsl` (boolean `renderUnicode`) and
  `indianToDsl` (`formatInference`); both round-trip through their parsers.
- `logic/BooleanVisualization.tsx` (new) — formula + tautology/contradiction/
  contingent verdict (`buildBoolTruthTable`) + a Karnaugh map (`buildKMap` +
  `KarnaughMap`, when within the 4-var budget).
- `components/ArgumentCard.tsx` — `FormalizationVisual` now handles `boolean`
  (Karnaugh map) and `indian` (`FiveStepView` over `fiveSteps(inference)` — the
  five-membered Nyāya inference). A `VISUAL_ONLY_FORMALISMS` set suppresses the
  raw-AST generic view for formalisms that have a bespoke visual.
- `labs/BooleanAlgebraLab.tsx`, `labs/IndianBuddhistLab.tsx` — accept `initialDsl`
  so the "Open in Logic Lab" prefill works.
- Tests: `argument-dsl.test.ts` +2 round-trip cases (boolean, indian).
  `.playwright-flows/arguments/viz-boolean-indian.ts` browser walkthrough.

## Why

Continues making real arguments legible under their logic. boolean → the
Karnaugh map makes the Law of Excluded Middle visibly a tautology (both cells 1);
indian → the five-step inference lays out pratijñā/hetu/udāharaṇa/upanaya/
nigamana, and even surfaces a missing udāharaṇa. Both previously showed only raw
AST JSON + a copy-paste lab link. Scope and sequencing (self-contained first)
were confirmed with the user. Closes #NNN.

## Notes for future work

- **Phase 2b — the 5 model-bearing formalisms.** Their ASTs already carry a
  model/trace (`kripke`/`ctl`/`intuitionistic`/`epistemic` = `{ formula, model }`,
  `temporal` = `{ formula, trace }`), so the default render is faithful. Per the
  user, add a **model switcher** (the argument's model + the system's example
  models) and a **frame-class toggle** (K/T/S4/S5) where meaningful, reusing
  KripkeLab's eval machinery — likely a shared `<ModalModelExplorer>` extracted
  the way `FolVisualization` was. Add each to `Formalization` (typed AST),
  `formalizationToDsl`, `FormalizationVisual`, `VISUAL_ONLY_FORMALISMS`, and give
  its lab an `initialDsl` prop.
- HetuCakra (Dignāga's wheel of reason) was left out — it needs the engine to
  compute the active cell. `FiveStepView` is the direct-from-AST view; the wheel
  is a possible enrichment.
- Verified in a real browser (pw-validate, local stack): both render, the
  boolean lab prefill round-trips (`/logic/boolean?dsl=`), zero console errors.
