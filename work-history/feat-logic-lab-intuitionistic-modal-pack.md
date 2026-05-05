# feat — Intuitionistic + Modal-variant pack on the Kripke engine

**Branch:** `feat/logic-lab-intuitionistic-modal-pack` (off `feat/logic-lab-kripke-engine`)
**Merged:** TBD

Five new Logic Lab systems built on top of the Kripke engine that
shipped the previous ticket. Closes the "Intuitionistic logic" and
"Modal expansion" entries of `docs/formal-logic/lab-roadmap.md`
§Medium term and §Long term, except for dynamic logic and Lewis
counterfactuals, which are explicitly deferred (they need a different
semantic substrate than Kripke proper — sphere semantics or labelled
transition systems with action AST — and warrant their own ticket).

## What changed

Five new Logic Lab systems. Each is a separate route entry, separate
slug, separate Lab page, and separate test file. Three of them
(intuitionistic, deontic, epistemic) sit naturally on Kripke frames and
required only engine-level extensions or content additions; two of them
(temporal-ltl, temporal-ctl) are *new engines* on different frame shapes
(lassos and branching trees) — bundled here as the user requested but
substantially larger than the others.

### Stage 1 — Intuitionistic propositional logic (`/logic/intuitionistic`)

Pre-order Kripke semantics with a monotone valuation. Reuses the
classical `ModalFormula` AST (atoms, ¬, ∧, ∨, →, ↔; box / diamond
explicitly rejected by the engine).

- `intuitionistic-eval.ts` — `forces(formula, model, world)` with
  intuitionistic forcing clauses for → and ¬ (universal-future
  quantification). Reflexive-transitive closure of R is taken once and
  reused so the engine works on any directed graph, not only on
  pre-orders.
- `intuitionistic-frames.ts` — diagnostics for *reflexive +
  transitive + monotone valuation* with `closeFrame` (refl-trans
  closure of R) and `closeValuation` (lift atoms upward) for the
  "fix frame" affordance.
- `intuitionistic-axioms.ts` — verdict table for canonical
  intuitionistically-valid principles (modus ponens, identity,
  conjunction projection) and classically-valid-but-intuitionistically-
  invalid principles (LEM, DNE, Peirce, weak LEM, the non-intuitionistic
  half of De Morgan). `kind: 'classical-only'` on each axiom drives
  the colour code: green when the verdict matches the pedagogical
  role (intuitionistic-valid axioms holding, classical-only axioms
  failing).
- 9 hand-authored examples: 2-world chain showcasing LEM / DNE /
  Peirce failures; 3-world fork for weak LEM and the De Morgan
  asymmetry; identity / modus ponens / DNI for the intuitionistic-
  valid side.
- `IntuitionisticLab.tsx` reusing `KripkeModelView` with the forcing
  map; `IntuitionisticFormulaEditor` wraps `LogicCmEditor` with a
  smaller palette (no □/◇).

### Stage 2 — Standard deontic logic (`/logic/deontic`)

Pure content + axiom-pack addition on the existing modal engine.

- `kripke-frames.ts` extended with `D` — a new `FrameClassSlug` whose
  only constraint is seriality. Characteristic axiom `[]p -> <>p`.
- `KripkeLab.tsx` refactored to take optional `commands` and
  `findCommand` props (default to the Kripke versions); the FrameClass
  picker reads `system.frameClasses ?? ALL_FRAMES`. The kripke system's
  declaration is now explicit (`[FRAMES.K, FRAMES.T, FRAMES.S4,
  FRAMES.S5]`) so adding D doesn't bleed into the kripke picker.
- `deontic-commands.ts` — slash-command palette glossing □/◇/¬◇ as
  O / P / F (obligatory / permitted / forbidden).
- `DeonticLab.tsx` — thin wrapper that forwards to KripkeLab with the
  deontic command set.
- 7 hand-authored examples on KD: D-axiom on serial frames; D failing
  on non-serial frames; the duality F = ¬P = O¬; aggregation; Ross's
  paradox; the failure of free-choice permission; the Chisholm
  fragment (K-axiom). The system entry declares
  `frameClasses: [FRAMES.D, FRAMES.T]` so the picker reflects the
  pedagogically relevant frames only.

### Stage 3 — Multi-agent epistemic logic (`/logic/epistemic`)

Real AST + frame extension.

- `epistemic-types.ts` — `EpistemicFormula` with indexed `know` /
  `consider` (K_a / M_a) operators; `EpistemicModel` with a single
  edge list carrying an `agent` label and a separate declared `agents`
  list.
- `epistemic-parser.ts` — recognises `K_<agent>`, `M_<agent>`,
  `[<agent>]`, and `<<<agent>>>` forms; agent names are alphanumerics.
- `epistemic-eval.ts` — labelling-style satisfaction: K_a quantifies
  universally over R_a-successors, M_a existentially. Edges
  referencing un-declared agents are silently ignored at eval time and
  caught at seed-load by the system-data tests.
- `epistemic-axioms.ts` — K / T / 4 / 5 / D verdicts *per declared
  agent*. The schemas use `K__` / `M__` placeholders that the
  instantiator substitutes with each agent in turn.
- `epistemic-render.ts` — `K_a` / `M_a` rendering for KaTeX and Unicode.
- `EpistemicModelView.tsx` — multi-agent React Flow viewer; each agent
  gets a colour from a fixed palette and edges carry an agent label.
  Self-loops collapse to per-agent ↻ chips on the node.
- `epistemic-commands.ts` and `EpistemicLab.tsx` — Lab page with an
  agent legend, a per-agent verdict grid, and the same satisfaction
  badge layout as the modal lab.
- 7 examples: alice-blind-bob-knows asymmetry; positive / negative
  introspection on full S5; K-axiom on a multi-agent S5 frame; and the
  knowledge-vs-belief cleavage (T fails for an agent on a KD45 frame).

### Stage 4 — Linear Temporal Logic (`/logic/temporal-ltl`)

A new engine — finite *lasso* traces with closed-form fixed-point eval
for the temporal operators.

- `temporal-types.ts` — `TemporalFormula` (atom / ¬ / ∧ / ∨ / → / ↔ /
  X / F / G / U) and `Trace` with `loopBack` index that says where the
  finite list of states cycles to.
- `temporal-parser.ts` — recursive-descent grammar with right-
  associative U above implication, longest-match keyword recognition
  for X / F / G / U so atoms named `Xs` etc. don't get split. Unicode
  spellings (◯, ◇, □) accepted.
- `temporal-eval.ts` — `satisfactionSetT(formula, trace)` returns a
  bit-set over positions; F / G / U computed by least / greatest fixed
  points iterating over the n positions. SAT(Xφ) is `{ i :
  next(i) ∈ SAT(φ) }` where next wraps via `loopBack`.
- `temporal-render.ts` — KaTeX & Unicode pretty-print with `\mathsf{X}`
  etc. for KaTeX and `X / F / G` for Unicode.
- `temporal-axioms.ts` — K-distribution, F∨ / G∧ / X∧ distributions,
  F = ¬G¬ duality, U → F closure, F and G unfold equations. Every
  schema is universally valid on every lasso; the panel doubles as a
  regression check on the fixed-point computations.
- `temporal-commands.ts` and `TraceView.tsx` — horizontal trace layout
  with a dashed purple loopback edge or a dashed grey "stutter" self-
  loop on the last state; React Flow under the hood.
- `TemporalLtlLab.tsx` — the Lab page, with start-position truth badge
  and trace-validity verdict. 8 examples: X / F / G basics; cyclic
  traces where G fails; until with proper closure; the response /
  liveness pattern `G(req → F resp)`; a fairness failure; the F = ¬G¬
  identity.

### Stage 5 — Computation Tree Logic (`/logic/temporal-ctl`)

Branching-time, the second new engine.

- `ctl-types.ts` — `CtlFormula` with eight paired path-quantifier-
  plus-temporal operators (AX, EX, AF, EF, AG, EG, AU, EU). Reuses
  `KripkeModel` directly — CTL frames are serial Kripke structures.
- `ctl-parser.ts` — `AX`, `EX`, … recognised as keyword prefixes
  (longest-match against bare-`A` / `E` atoms); bracketed-Until forms
  `A[φ U ψ]` and `E[φ U ψ]` parsed structurally.
- `ctl-eval.ts` — labelling algorithm. EX / AX direct; EF / AF / EG /
  AG / EU / AU as least / greatest fixed points using forward and
  reverse adjacency. Standard Clarke-Emerson-Sistla recipes; runs in
  polynomial time on the small examples.
- `ctl-render.ts` — KaTeX & Unicode pretty-print.
- `ctl-axioms.ts` — AG = ¬EF¬, EF unfold, AG unfold, AX-distributes-
  over-∧, EX-distributes-over-∨, AF = ¬EG¬, AU → AF closure, EU → EF
  closure. All are universally valid on serial frames.
- `ctl-commands.ts` and `TemporalCtlLab.tsx` — Lab page; reuses
  `KripkeModelView` (CTL frames are just directed graphs). Diagnostics
  chip flags non-serial frames so the user knows when AG / AF go
  vacuous on dead ends.
- 8 examples: EX vs AX; EF without AG; EG via a self-loop branch;
  A[U] vs E[U]; a toy mutex with `AG ¬(p1 ∧ p2)`; a starvation
  failure that requires a path quantifier to express.

### Cross-cutting changes

- `LogicExample` extended with optional `epistemicModel` (per-agent
  relations) and `trace` (lasso) fields. Other systems still use
  `model` (KripkeModel) or no model.
- `KripkeLab` is now parameterized over its slash-command set, so the
  deontic system reuses it directly without duplication.
- Route switch in `logic.$system.lazy.tsx` extended with five new
  lazy-loaded chunks. Each Lab is still a separate Vite chunk to keep
  the Logic-Lab landing page light.

## Why

The user's request was to put the Kripke engine to work: build the
intuitionistic system that fits naturally on its frames, plus the modal
variants the engine was always intended to support. Bundling everything
into one branch (rather than chasing the lab-roadmap's separate
`feat/logic-lab-intuitionistic` and `feat/logic-lab-modal-variants`
tickets) keeps the "engine reuse" story coherent and the work in one
review pass. The trade-off — a large branch — was made explicitly with
the user.

For the temporal logics, the alternative was deferring them to a
separate `feat/logic-lab-temporal` ticket; we kept them in scope on the
user's directive. They are the largest pieces of new code in the
branch and the only ones that aren't reusing the Kripke engine
verbatim.

## Notes for future work

- **Common knowledge / distributed knowledge.** The epistemic AST is
  deliberately minimal — no `C` (common knowledge) or `K_D`
  (distributed knowledge) operators. Both are eval extensions only;
  C is the least fixed point of "everyone knows" iterated, computable
  by the same reachability/labelling pattern as CTL EF/AF. Worth
  picking up alongside the Muddy Children / coordinated attack
  examples that motivate them.
- **Past-time LTL.** Y / O / H / S (yesterday / once / historically /
  since). The lasso eval extends naturally to past-time by walking
  predecessors instead of successors; the parser and renderer would
  need new operator entries. Not a substantial engine change.
- **CTL\* and the µ-calculus.** CTL\* (allowing arbitrary path
  formulas under A / E) is a real generalisation; the µ-calculus is
  the sweet spot for fixed-point logics. Both are substantial; CTL is
  the right pedagogical entry point and we ship it as such.
- **Dynamic logic and counterfactuals (the deferred sixth stage).**
  Dynamic logic needs an action AST (α; β, α ∪ β, α*, ?φ) and a
  labelled-transition-system frame; counterfactuals need Lewis sphere
  semantics or Stalnaker selection functions. Different semantic
  substrates from Kripke proper. Track in `feat/logic-lab-dynamic`
  and `feat/logic-lab-counterfactuals` respectively. Pulling them
  into this bundle was rejected during planning because the engine
  changes are large and unrelated to the rest of the pack.
- **Compare-view across modal flavours.** Now that we have
  intuitionistic / classical / epistemic / deontic all on Kripke
  frames, a comparison view that takes a single formula and shows its
  verdict in each system would highlight the structural differences
  cheaply. Pairs naturally with the still-open `feat/logic-lab-
  compare-view` ticket from the lab roadmap.
- **Engine-derived multi-agent frame closures.** The deontic system
  has the Kripke engine's `closeUnderFrame` button; the epistemic
  system doesn't (multi-agent frame closures need to operate per-
  agent and aren't a generalisation of the existing closeUnderFrame).
  Worth adding when content surfaces a real need.
- **Branching-frame visualization for CTL.** `KripkeModelView` works
  for CTL but the layout (linear x-axis position) is awkward on
  branching trees. A custom dagre layout pass keyed on tree depth
  would read better; deferred until the examples grow in size.
- **Atom-candidate freshness in axiom panels.** Three of the new
  systems (intuitionistic, epistemic, LTL, CTL) needed to extend the
  atom-candidate set with fresh names so classical-only / engine-
  identity countermodels could be staged. Six fresh-name slots
  (x, y, z, r, s, t) is plenty for the schemas we ship; longer
  schemas will need more. Worth pulling into a shared helper if a
  future system has > 6 metavariables.
- **Test count after this ticket: 973 tests, all passing.** No
  regressions on the existing 648 from the kripke-engine branch.
