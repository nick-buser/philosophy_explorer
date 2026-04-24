# Kripke / Modal Logic — System Design

**Status:** Draft — phase-1 scope, 2026-04-24
**Implementing ticket:** `FEAT-006-logic-lab-kripke-modal`

The second populated system in the Logic Lab, after Peirce EG. Modal
propositional logic with a Kripke-semantics visualization and a
frame-class picker. Design context:
[`notation-systems.md`](./notation-systems.md),
[`logic-explorer-tab.md`](./logic-explorer-tab.md),
[`editor-and-ir.md`](./editor-and-ir.md).

---

## Purpose

Modal logic is a natural second system because it stresses parts of
the Logic Lab that Peirce EG didn't:

- **Two authoring surfaces**, not one. A modal formula is linear text;
  a *Kripke model* is a directed graph of worlds. Peirce had only the
  formula. This forces us to design the system descriptor for two
  artifacts per example.
- **Parameterized semantics.** "Modal logic" is a family. Picking a
  frame class (K, T, S4, S5, …) changes which formulas are valid.
  Peirce's alpha system has no such knob.
- **Real use of `@xyflow/react`.** Already installed (12.10.2) +
  `@dagrejs/dagre` 3.0.0; currently unused. The Kripke model view is
  the natural first consumer.

---

## Out of scope (phase 1)

To keep the ticket honest:

- **No model-checking / satisfaction algorithm.** "Truth at a world"
  shows as a static badge on hand-authored examples; no recursive
  evaluator.
- **No tableaux, sequent proofs, or completeness theorems.**
- **No quantified modal logic.** Constant-vs-varying domain, possibilist
  vs actualist quantification, counterpart theory — all deferred.
- **No multi-agent logic.** Single accessibility relation `R` only;
  indexed `[a]`, `K_a`, `B_a` deferred to phase 2.
- **No Lean integration.** That's a separate cross-cutting ticket per
  [`formal-verification.md`](./formal-verification.md).
- **No interactive model editing.** Drag-to-add a world,
  click-to-toggle an atom, draw R-edges — phase 2.
- **No `LogicIR` migration.** See "Open questions" §1.

---

## What ships in phase 1

A new system at `/logic/kripke` with the same surface as
`/logic/peirce-eg`, plus the Kripke-model panel:

1. **DSL editor** — CodeMirror 6 (reusing the `EgEditor` shape) for
   modal propositional formulas.
2. **Formula renderer** — KaTeX for the linear notation. New dep.
3. **Kripke-model panel** — `@xyflow/react` graph showing worlds,
   accessibility edges, and per-world atom valuations.
4. **Frame-class picker** — K, T, S4, S5 in phase 1. Picking a class
   shows the constraints on `R` as text and as visual cues
   (e.g. self-loops drawn for T/S4/S5).
5. **Hand-authored examples** — 5–7 formulas, each with a small
   accompanying Kripke model and an at-a-world truth badge.
6. **Primitives panel** — `□`, `◇`, ASCII fallbacks, frame conditions.

Deep link from any modal-relevant philosopher detail page (Lewis,
Kripke, etc.) is **deferred** until those philosophers are seeded —
nothing to wire to today.

---

## DSL grammar (phase 1)

Propositional modal, ASCII-friendly:

```
formula  := primary ( binop primary )*
primary  := atom | "(" formula ")" | unary primary
unary    := "!" | "~" | "¬" | "[]" | "□" | "<>" | "◇"
binop    := "&" | "∧" | "|" | "∨" | "->" | "→" | "<->" | "↔"
atom     := [a-z][a-z0-9_]*
```

Operator precedence (tightest first): `! [] <>`, `&`, `|`, `->`,
`<->`. Right-associative for `->`; left for the rest.

Examples:

| DSL | Rendered |
|---|---|
| `[]p` | `□p` |
| `<>p` | `◇p` |
| `[]p -> p` | `□p → p` (the **T** axiom) |
| `[]p -> [][]p` | `□p → □□p` (the **4** axiom) |
| `<>[]p -> p` | `◇□p → p` (the **5** axiom — actually `p → □◇p`; pick the canonical form for display) |
| `[](p -> q) -> ([]p -> []q)` | `□(p → q) → (□p → □q)` (the **K** axiom) |

Use ASCII for editor input; render Unicode in the visualization.

---

## Frame classes (phase 1)

| Slug | Name | Constraint on `R` | Characteristic axiom |
|---|---|---|---|
| `K` | Minimal modal logic | none | `□(p→q) → (□p → □q)` |
| `T` | Reflexive | `∀w. R(w,w)` | `□p → p` |
| `S4` | Reflexive + transitive | T + `R(w,u) ∧ R(u,v) → R(w,v)` | `□p → □□p` |
| `S5` | Equivalence relation | T + symmetric + transitive | `◇p → □◇p` |

Phase 2 adds `B` (symmetric), `D` (serial), `K4` (transitive only),
`KD45` (the canonical doxastic / KB45 family). Each frame class is a
data record, not a code branch — adding one is a JSON edit.

The **picker** is a UI affordance only in phase 1. We do **not**
algorithmically enforce that the example model satisfies the picked
frame's constraints — examples are hand-authored to be
well-formed. Validation is phase 2 and is mostly defensive: warn if
a model labelled S4 has a non-transitive R.

---

## Kripke model — data shape

```ts
type WorldId = string;            // "w0", "w1", ...

type KripkeModel = {
  worlds: { id: WorldId; label?: string; atoms: string[] }[];
  // atoms is the list of propositional letters true at that world.
  // Anything not listed is false (closed-world for the visualization).

  edges: { from: WorldId; to: WorldId }[];
  // Directed accessibility relation. Self-loops allowed.

  designated?: WorldId;
  // The "actual world" — where ⊨ is evaluated for the truth badge.
};
```

Deliberately small and JSON-friendly. No nested structure, no
references back to the formula AST.

### Visualization

`@xyflow/react` for the canvas, `@dagrejs/dagre` for layout
(directed graph, top-to-bottom). Per-world node renders the world id
+ a chip-row of true atoms. Edges are arrows; self-loops drawn as
small loops above the node. The designated world gets a ring/border
treatment.

---

## System descriptor extension

`packages/web/src/data/logic-systems.ts` currently has:

```ts
type LogicExample = { slug; natural; dsl; note? };
```

Phase 1 extends it (additive, optional):

```ts
type LogicExample = {
  slug: string;
  natural: string;
  dsl: string;
  note?: string;
  // New in FEAT-006:
  model?: KripkeModel;       // attach a Kripke model to the example
  satisfied?: boolean;       // truth at the designated world
  frameClass?: FrameClassSlug; // which frame this example is meant to live in
};
```

Plus a top-level addition to `LogicSystem`:

```ts
type LogicSystem = {
  // ...existing fields...
  frameClasses?: FrameClass[];  // populated for kripke; undefined for peirce-eg
};
```

`FrameClass` and `KripkeModel` types live in
`packages/web/src/logic/kripke-types.ts` (new), keeping
`logic-systems.ts` agnostic about per-system shapes via optional
fields.

---

## File layout

New files in `packages/web/src/logic/`:

| File | Purpose |
|---|---|
| `kripke-types.ts` | `KripkeModel`, `FrameClass`, `ModalFormula` AST. |
| `kripke-parser.ts` | Recursive-descent parser for the modal DSL. |
| `kripke-render.ts` | Pretty-printer (AST → KaTeX-ready string). |
| `kripke-frames.ts` | The K / T / S4 / S5 records + frame-class metadata. |
| `KripkeFormulaEditor.tsx` | CodeMirror host. Mostly a copy of `EgEditor`; refactor to share later. |
| `KripkeModelView.tsx` | `@xyflow/react` panel for one `KripkeModel`. |
| `__tests__/kripke-parser.test.ts` | Vitest coverage for parser + precedence. |

Route page: `packages/web/src/routes/logic.$system.tsx` already
dispatches by slug; add a `kripke` branch alongside the existing
`peirce-eg` branch.

Data:
`packages/web/src/data/logic-systems.ts` — flip the `kripke` entry
from a stub (or add it; currently absent — current stubs are
`frege-bs`, `aristotelian`, `modern-fol`) to fully populated, and
extend the type as above.

New deps: `katex` (+ `@types/katex`). `@xyflow/react` and `dagre`
already installed.

---

## Implementation order

Suggested sequencing for the branch — each step is independently
testable:

1. Types + parser. `kripke-types.ts`, `kripke-parser.ts`,
   `kripke-render.ts`, parser unit tests.
2. Frame-class data. `kripke-frames.ts` with the four records.
3. Seed examples (data only). Add the `kripke` system to
   `LOGIC_SYSTEMS` with 5–7 formulas + models. Inert — not yet
   wired into a route.
4. Model view component. `KripkeModelView.tsx` rendering one
   `KripkeModel`. Unit-tested separately.
5. Formula editor. `KripkeFormulaEditor.tsx`. Slash-commands wire
   to the same `EG_COMMANDS`-style registry (new file
   `kripke-commands.ts`).
6. Page wiring. `logic.$system.tsx` dispatch on `kripke`. Frame-class
   picker UI on the page (top of the panel, controlled state).
7. KaTeX rendering. Add the dep, render formula to the right of
   the editor.
8. Truth badge + designated-world ring. Static — uses
   `example.satisfied` directly.
9. Polish + work-history doc.

---

## Phase 2+ scope

Out of phase 1, in rough priority order:

1. **Multi-agent / indexed modalities.** `[a]p`, `K_a p`, `B_a p`.
   AST gains an agent index; model gains per-agent edges.
2. **Frame validation.** Warn when an example's `model` violates the
   declared `frameClass`'s constraints. Pure function over the model.
3. **Interactive model editing.** Drag worlds, click to toggle atoms,
   draw R-edges. Persists to local-storage-only initially.
4. **Recursive evaluator.** `eval(formula, model, world)` — small
   pure function, ~40 LOC. Replaces the static `satisfied` field.
5. **Formula → minimal-counterexample finder** (small models only —
   bounded search).
6. **Tableau proof rendering.**
7. **Quantified modal logic.** Constant vs varying domain selector.
8. **Lean integration** for verifying axiom derivations under chosen
   frame conditions.

---

## Open questions

### 1. `LogicIR` introduction — defer

`editor-and-ir.md` §1 anticipates a `LogicIR` discriminated union
with `ModalLogic` as one variant. Phase 1 deliberately does **not**
introduce it. Rationale: we still have only two systems with shipped
content (Peirce, Kripke), and the variation surface they expose
isn't enough to design `LogicIR` against without guessing. Revisit
when system #3 (likely Frege BS or Aristotelian) starts. Tracked
under `open-questions.md` §2.7.

### 2. CodeMirror reuse — copy first, extract second

`EgEditor.tsx` is 120 lines and has no system-specific logic except
the autocomplete source. Phase 1 copies it to `KripkeFormulaEditor`
and parameterizes the completion source. After phase 1 ships,
extract a `LogicCmEditor` shared component as a `REFAC` ticket.

### 3. ASCII vs Unicode in stored DSL

Examples are stored as ASCII in `logic-systems.ts` (`[]p -> p`)
because that's what users will type. KaTeX renders Unicode (`□p →
p`). The pretty-printer in `kripke-render.ts` is the bridge. No
round-trip from rendered Unicode back to DSL needed in phase 1.

### 4. `editor-and-ir.md` correction

That doc currently lists CodeMirror as "wrong" (§2.2). FEAT-005
shipped Peirce on CodeMirror and FEAT-006 will too. Update the doc
to "fine for the linear DSL surface; not the structural editor"
either as part of FEAT-006 polish or as a small `DOCS` ticket.

### 5. Truth badge — is "static `satisfied` field" honest?

Phase 1 stores `satisfied: boolean` in seed data. Risk: a future
content edit changes the model but forgets the badge. Mitigation: a
unit test that runs the (phase-2) evaluator over every example and
checks consistency. Acceptable risk for phase 1 because examples are
hand-curated and few.

---

## Relationship to existing docs

- [`notation-systems.md`](./notation-systems.md) §3 — comparison
  matrix; add a row for "Modal (Kripke)" once FEAT-006 ships.
- [`logic-explorer-tab.md`](./logic-explorer-tab.md) — provides the
  `/logic` surface this plugs into. No changes needed; the
  `LogicSystem` shape is extended additively.
- [`editor-and-ir.md`](./editor-and-ir.md) §1 — the eventual
  `LogicIR` union will gain a `ModalLogic` variant when that
  introduction happens (see Open Questions §1).
- [`open-questions.md`](./open-questions.md) — no new entries
  required; existing entries (§2.5 authoring model, §2.7 translation
  across systems) cover the unresolved threads.
