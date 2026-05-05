# feat — Engine-derived Kripke

**Branch:** `feat/logic-lab-kripke-engine`
**Merged:** 2026-05-05 (TBD on actual merge)

Sixth work-history entry filed under the slug-only convention,
following `feat-logic-lab-resolution.md`. Closes the
"Engine-derived Kripke" entry in
`docs/formal-logic/lab-roadmap.md` §Medium term, the FEAT-006
§Notes "engine-derived satisfaction" deferral, and
`docs/formal-logic/kripke-modal-logic.md` §Open question 5
("is the static `satisfied` field honest?").

## What changed

The Kripke Lab is now engine-driven. Where FEAT-006 stored a
hand-authored `satisfied: boolean` on every example and rendered
it as a static badge — only honest at the designated world, only
for the example formula, never for user edits — phase 2 evaluates
satisfaction recursively at every world for the live editor formula,
diagnoses which structural constraints R actually satisfies, and
reports per-axiom validity against the model. Three pure modules
share no UI dependencies and are wired into the existing
`KripkeLab.tsx`.

- **Satisfaction engine** `kripke-eval.ts`:
  - `satisfies(formula, model, world)` — recursive over the existing
    `ModalFormula` AST. Atoms by lookup; ¬ / ∧ / ∨ / → / ↔ pointwise;
    □ quantifies over R-successors; ◇ over the same. Vacuous truth
    on dead-end worlds (□φ true, ◇φ false) — verified by tests.
  - `satisfactionMap(formula, model)` — `{worldId → bool}` so the UI
    can label every node without re-walking the AST per world.
  - `validInModel(formula, model)` — universal-at-every-world sense,
    returning a failing-world witness when invalid. The contrast
    with "true at the designated world" matters now that both are
    cheap; the Lab surfaces both badges side by side.
- **Frame-constraint diagnostics** `kripke-frame-check.ts`:
  - `isReflexive` / `isSymmetric` / `isTransitive` / `isSerial` /
    `isEuclidean` — each returns a typed `ConstraintCheck` with a
    constraint-specific witness shape. The witness is what the UI
    reads back as "no self-loop at w0", "w0→w1→w2 but w0→w2
    missing", etc.
  - `frameDiagnostics(model)` — the aggregate satisfied-set used
    by the Lab's diagnostics grid.
  - `validateAgainst(model, frameClassSlug)` — checks whether a
    model honours its declared frame class (catches mismatched
    seed data + drives the "close R under {frame}" affordance).
  - `closeUnder(model, constraints)` / `closeUnderFrame(model,
    slug)` — adds the smallest set of edges so R satisfies the
    chosen constraints. Iterates reflexive → symmetric →
    transitive → euclidean → serial until stable; each pass is
    monotone (only adds), so termination is automatic in finite
    worlds.
- **Per-axiom verdicts** `kripke-axioms.ts`:
  - Canonical list `AXIOMS = [K, T, 4, 5, B, D]` with each axiom's
    schema (in DSL), schema variables, and the constraint it
    corresponds to. Adding new axioms (the next Modal-expansion
    ticket) is a single record append — no code branches reference
    the list by name.
  - `verdictFor(axiom, model)` — substitutes every combination of
    schema variables to atoms occurring in the model, evaluates
    the instantiation at every world, and returns
    `{valid, failure?: {substitution, world}}`. Closed-world atom
    pool (model atoms) + small models means the substitution
    enumeration is finite and small — exhaustive is the right
    strategy here.
  - `axiomVerdicts(model)` — the full table the UI renders.
- **UI wiring** `KripkeLab.tsx`:
  - Truth badge: now derived from the engine on every render. Edits
    to the formula re-evaluate at the designated world and update
    the badge live. The "edited / ⊨ ?" placeholder from phase 1 is
    gone.
  - Per-world ⊨ / ⊭ chip below each world's atom row, driven by
    `satisfactionMap` of the active formula. `KripkeModelView` and
    its `buildGraph` extractor accept an optional `satisfaction`
    map.
  - `KripkeModelPanel` now shows three engine outputs: designated-
    world truth (⊨ at w0), model-validity (forced at every world),
    and a "close R under {frame}" button when the current model
    violates the picked frame's constraints.
  - `FrameDiagnosticsPanel` — five-cell grid (reflexive / symmetric
    / transitive / serial / euclidean), each cell coloured by
    holds-or-fails and required-by-current-frame. Hover surface
    the violation witness.
  - `AxiomVerdictsPanel` — six-card grid (K, T, 4, 5, B, D) with
    each axiom's schema rendered as DSL, valid/fails badge, and a
    "fails at {world} under {p↦q}" line when invalid.
  - `liveModel` state lets the user mutate the model via "close R
    under {frame}" without losing the example reference; a "reset"
    button restores the seed model.
- **Seed data** `data/logic-systems.ts` — three new examples added
  to `KRIPKE_EXAMPLES`:
  - `four-fails-non-transitive` — explicitly the model the FEAT-006
    §Notes anticipated as the engine's motivating example. The
    "close R under S4" button flips the verdict.
  - `b-fails` — non-symmetric line where p → □◇p fails at the
    designated world; pairs with the new B / 5 verdict cards.
  - `d-on-serial` — serial-but-not-reflexive frame on which
    □p → ◇p holds; shows D's correspondence to seriality without
    requiring reflexivity.
  - The hand-authored `satisfied: boolean` field is retained on
    every example; the cross-check test in `kripke-eval.test.ts`
    asserts the engine agrees, catching drift if a future content
    edit moves the model out from under the badge.
- **Tests** — 81 new tests across `kripke-eval` (28 — including
  the cross-check that runs against every shipped example),
  `kripke-frame-check` (20), `kripke-axioms` (15), and the
  parametric tests in `kripke-system-data` that fire automatically
  against the three new examples (+18). Total now **648/648
  passing** (was 567 after Resolution).
- `docs/formal-logic/lab-status.md` — promoted last-shipped row;
  Kripke row updated to reflect engine-derived satisfaction; the
  per-system deferrals row for `kripke` updated to mark
  engine-derived shipped and list what remains open
  (multi-agent indexed modalities; B / D / K4 / KD45 axiom-set
  additions are now data-only; tableau-style countermodel finder).
- `docs/formal-logic/lab-roadmap.md` — Engine-derived Kripke entry
  marked shipped; per-system deferrals row updated.
- `docs/formal-logic/kripke-modal-logic.md` — header updated to
  cite phase-2 ticket; §1b "AST authority" updated to note that the
  first forcing function for F# migration has now fired but the
  pure-TS engine is the right call (browser-side, ~150 LOC,
  offline-capable); §5 "is the static satisfied field honest?"
  closed; §Phase 2+ scope updated to mark the engine items shipped
  and prioritise intuitionistic Kripke as the immediate next ticket.

### Files

| File | Change |
|------|--------|
| `packages/web/src/logic/kripke-eval.ts` | new — `satisfies`, `satisfactionMap`, `validInModel` |
| `packages/web/src/logic/kripke-frame-check.ts` | new — per-constraint checks + aggregate diagnostics + `closeUnder` / `closeUnderFrame` |
| `packages/web/src/logic/kripke-axioms.ts` | new — canonical axiom list, `verdictFor`, `axiomVerdicts`, exhaustive substitution enumeration |
| `packages/web/src/logic/KripkeModelView.tsx` | extended — optional per-world `satisfaction` prop drives ⊨ / ⊭ chips |
| `packages/web/src/logic/labs/KripkeLab.tsx` | rewrite — engine-driven badges, live-evaluation as the user edits, frame-diagnostics panel, axiom-verdict panel, "close R under {frame}" affordance + reset |
| `packages/web/src/logic/__tests__/kripke-eval.test.ts` | new (28 cases — atoms, all connectives, modal operators including duality, validInModel, cross-check against every shipped example) |
| `packages/web/src/logic/__tests__/kripke-frame-check.test.ts` | new (20 cases — per-constraint, aggregate, validateAgainst, closeUnder / closeUnderFrame) |
| `packages/web/src/logic/__tests__/kripke-axioms.test.ts` | new (15 cases — definitional sanity + each axiom on at least one valid + one counter-frame) |
| `packages/web/src/data/logic-systems.ts` | + 3 examples (`four-fails-non-transitive`, `b-fails`, `d-on-serial`) |
| `docs/formal-logic/lab-status.md` | promoted last-shipped; Kripke row + deferrals row updated |
| `docs/formal-logic/lab-roadmap.md` | Engine-derived Kripke entry marked shipped; per-system deferrals row updated |
| `docs/formal-logic/kripke-modal-logic.md` | header + §1b + §5 + §Phase 2+ scope updated |
| `work-history/feat-logic-lab-kripke-engine.md` | this file |

Verified: `npm run test:web` 648/648 (was 567 pre-engine, +81 new);
`tsc --noEmit -p packages/web` clean; `npm run build
--workspace=packages/web` clean (KripkeLab chunk: 26.37 kB / 7.77 kB
gzipped — was ~16 kB pre-engine).

## Why

The hand-authored `satisfied: boolean` field shipped in FEAT-006 was
explicitly flagged as deliberate debt in two places: `kripke-modal-
logic.md` §Open question 5 ("is the static field honest? Risk: a
future content edit changes the model but forgets the badge.") and
the FEAT-006 §Notes "engine-derived satisfaction" deferral. The
mitigation proposed at the time — "a unit test that runs the (phase-
2) evaluator over every example and checks consistency" — is exactly
what `kripke-eval.test.ts` now does, but the larger payoff is that
the badge is finally honest for *user* formulas, not just the seven
seed examples.

The framing decision that mattered most: **build the engine before
the intuitionistic ticket**, not as part of it. Two reasons. First,
the FEAT-006 deferral was already on the books and overdue; the
"hand-authored truth on a curated demo" framing didn't survive
contact with users typing their own formulas. Second, intuitionistic
Kripke reuses the frame data shape and the recursion-over-AST idiom
but differs on three points (different connective recursion for →
and ¬ via upward-closure; persistence check on atoms; poset rather
than arbitrary R). Doing the modal engine first establishes the
substrate cleanly: `KripkeModel`, `satisfactionMap`, the
constraint-check pattern, and the per-world chip rendering all
generalise. Bundling the two would have produced one engine with
two modes (a shared abstraction designed for two examples — a
classic premature-generalisation trap).

The substrate claim is concrete: the next ticket
(`feat/logic-lab-intuitionistic`) will add an
`intuitionistic-eval.ts` with the same `satisfies(formula, model,
world)` shape but different connective recursion, plus a
`isPoset` constraint check (reflexive + transitive + antisymmetric)
and an `isPersistent(model)` check on atoms. UI scaffolding —
per-world chips, designated badge, model-validity badge,
diagnostics panel pattern — is all reusable.

The "close R under {frame}" button is the affordance that pays for
the closure code. A user who picks T on a non-reflexive line gets
the diagnostics panel telling them why; the closure button lets
them snap the model into the chosen class with one click. This is
the most-honest version of FEAT-006's frame-class picker: phase 1
warned (in prose) that the picker was "informational only"; phase 2
makes it actually do something when there's a meaningful action to
take.

## Notes for future work

- **No browser smoke pass.** Verified via `tsc --noEmit`, `vitest`
  (648/648), and `npm run build`. A human pass should confirm: the
  per-world ⊨ / ⊭ chips render legibly at narrow viewports; the
  five-cell diagnostics grid wraps cleanly; the six-card axiom
  table doesn't overflow on long failure-witness strings; the
  "close R under {frame}" button updates the canvas without
  jankily-relayouting the whole panel; live re-evaluation as the
  user types stays under perceptual latency on the largest shipped
  model. Same gap that `infra/logic-lab-playwright-smoke` tracks
  across the Lab.

- **Axiom enumeration is exhaustive over model atoms only.** The
  `AXIOMS` table substitutes schema variables (`p`, `q`) with
  whatever atoms the model declares. That's correct under the
  closed-world reading but means a model containing only atom `p`
  can never falsify an axiom that requires two distinct atoms (the
  K axiom's `[](p → q) → ([]p → []q)` becomes
  `[](p → p) → ([]p → []p)`, which is a tautology). For shipped
  examples this is fine; if a user authors a model with very few
  atoms and wants to "stress-test" an axiom, the verdict can be
  optimistic. Mitigation deferred — the right fix is to inject one
  fresh atom not in the model whenever schema vars outnumber model
  atoms, ~10 LOC.

- **Closure passes are not minimum.** `closeUnder` adds the
  smallest set of edges *per pass*; the iterated fixpoint can
  over-close in pathological cases (e.g. closing under {symmetric,
  transitive, reflexive} on a sparse graph could route through
  intermediate worlds the user wouldn't expect). For the shipped
  examples this never matters — they're small enough that the
  result is always the obvious closure — but a "closure preview"
  diff would help if user-authored models grow. Not currently in
  scope.

- **Validity is "in this model", not "in the frame class".** The
  axiom-verdict panel reports whether each axiom is forced at every
  world *of the current model*. That's not the same as "valid in
  the frame class declared by the picker" — for that, the engine
  would need to enumerate frames satisfying the constraints up to
  some bound. The distinction is genuine pedagogically (an axiom
  can hold accidentally in one S4-shaped model without being valid
  on every S4 frame), and it's worth a future ticket: a
  "frame-class-valid" verdict via bounded model search. The
  current panel's wording is hopefully clear enough that this
  doesn't mislead.

- **No countermodel synthesis.** When a formula isn't model-valid,
  the engine reports the failing world *in the current model*. It
  doesn't construct a fresh small countermodel from scratch — the
  Modern FOL Lab's truth-tree view does that for FOL, and a modal
  analogue (prefixed-formula tableaux) is a natural future ticket.
  Same shape as the deferred truth-tree work that landed in
  FEAT-012 for FOL, but for modal.

- **B / D / K4 / KD45 are now data edits.** `kripke-frames.ts` ends
  in `FRAME_ORDER` and `ALL_FRAMES`; the picker reads `ALL_FRAMES`
  and is constraint-driven. Adding a new frame class is one record
  append in `FRAMES`, one slug in `FRAME_ORDER`, and (if the
  characteristic axiom isn't already in `AXIOMS`) one record append
  in `kripke-axioms.ts`. No code branches reference frame classes
  by name. Worth picking up when a content reason surfaces — e.g.
  a deontic worked example that needs D as the picker default.

- **Multi-agent indexed modalities deferred.** Phase 1 already
  deferred `[a]p` / `K_a p`. The engine doesn't presuppose single-
  agent — adding indexing means extending the AST with an optional
  agent label on `box` / `dia` and giving `KripkeModel` a per-agent
  edge map. The recursion shape is unchanged. Sized as its own
  ticket because the UI for picking agents and rendering
  per-agent edges is its own design problem.

- **Live re-evaluation is unmemoised across edits.** Every keystroke
  re-runs `satisfactionMap`, `axiomVerdicts`, and
  `frameDiagnostics`. For the shipped examples this is microseconds
  — the largest model has 3 worlds and the most expensive axiom
  enumerates 4 substitutions × 3 worlds = 12 evaluations. If user-
  authored models grow large, memoisation by `(model identity,
  formula identity)` would be cheap to add. Not currently a real
  cost.

- **Intuitionistic Kripke is next** (`feat/logic-lab-intuitionistic`).
  This ticket established the substrate; the next reuses it for a
  different connective recursion. See `kripke-modal-logic.md`
  §Phase 2+ scope #1 and `lab-roadmap.md` §Medium term.
