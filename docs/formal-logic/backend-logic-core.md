# Backend Logic Core — Strategy

**Status:** Draft — first-pass strategy, 2026-04-24

Where the logical core of the project should live, why, and how we
migrate toward that as the surface grows.

---

## Premise

The backend is in F# **on purpose.** Not because we needed an
ASP.NET CRUD server — we already had Hono/TS for that — but because
the project's direction (formal-logic systems, modal/temporal/deontic
semantics, Lean integration, argument graphs, Neo4j, eventually
proof-relevant work) is well-fit by an ML-family language with
discriminated unions, exhaustive pattern matching, and inference. F#
exists in this repo to manage **ontological representation of logical
invariants** and the manipulations on them.

That premise has consequences for where new code goes.

---

## Honest current state

Today the backend is *underutilized* relative to its purpose. The F#
service is a lookup layer over Dapper + an in-memory graph; the
Logic Lab (Peirce phase 1, Kripke phase 1 in progress) lives entirely
in TypeScript on the client. This is **deliberate debt**, taken to
ship visible UX faster while the AST shapes are still small and the
semantics are still trivial.

Two things follow from acknowledging it as debt:

1. We don't pretend the current shape is the target shape. The
   backend isn't supposed to stay a "funky CRUD layer with a thin DB
   lookup." The Logic Lab work is sketching what TS-only doesn't
   scale to.
2. We avoid moves that lock in TS-as-source-of-truth for things that
   ought to migrate. **Don't duplicate** TS-side logic on the F# side
   under the guise of "for now." Either it's TS-only and we plan to
   move it, or it's F#-authoritative and TS consumes from it. Never
   both authoritative copies.

---

## What "leveraging F#" looks like, concretely

A non-exhaustive list of things that *belong* on the F# side once
the Logic Lab grows past phase-1 toys:

| Concern | Why F# |
|---|---|
| Shared `LogicIR` discriminated union (`PropLogic`, `ModalLogic`, `PredicateLogic`, `PeirceEG`, …) | Recursive DUs + exhaustive matching are the right tool. Consumers (translators, evaluators, Lean emitter) are total functions over the union. |
| Recursive evaluators (`eval : Formula -> Model -> World -> bool`, satisfaction, validity) | Pure recursion over an AST. F# pattern matching is exactly this shape and the compiler enforces totality. |
| Frame validity / constraint checking (does this Kripke model satisfy S4?) | Set / relation algebra. Native F# data structures, easy to test. |
| Translation between systems (Peirce EG ↔ propositional, modern FOL ↔ Begriffsschrift) | Recursive DU → DU transformations with partial / lossy variants. The `Result` / `Option` types make lossiness explicit. |
| Canonical / normal-form computation (de Bruijn for binders, NNF, CNF) | Pure transformation over ASTs; easy to property-test with FsCheck. |
| Lean source emission (`Formula -> string`) and the Lean-runner protocol | Backend-side because Lean runs on the backend; AST authority lives with the side that talks to Lean. |
| Argument-graph reasoning (commitment closure, derivation-chain traversal) | Graph algorithms over typed nodes; benefits from F# DUs for the edge taxonomy. |
| Proposition-identity hashing for cross-source de-duplication | A single canonical normalizer must exist; it lives where the AST is authoritative. |

What stays in TypeScript indefinitely:

- React components, JSX, Tailwind class wiring.
- CodeMirror integration and its extensions (autocomplete sources,
  themes, keymaps).
- `@xyflow/react` model views, node renderers, drag interactions.
- SVG layout where the layout is tightly coupled to DOM measurement
  (e.g. text-width-driven sizing).
- Immediate-feedback parsing during keystrokes (latency budget
  matters; round-tripping to F# would be silly).

---

## Decision rule for new logic features

For any new piece of logic-system code, ask in order:

1. **Does it interact with the DOM, keystrokes, or rendering?**
   → TypeScript. Don't even think about F#.
2. **Is it a pure transformation / recursion over an AST or model?**
   → F#, *if* we have the F# AST in place. Otherwise: TS now, with a
   note that it migrates when the F# AST lands.
3. **Does the F# side already need to know the result?** (Lean,
   validation, persistence, cross-system translation)
   → F#, full stop.
4. **Is it a small lookup / mapping that doesn't really involve
   logic?** → Wherever it's most convenient; doesn't matter.

The honest answer for most of phase 1 is "(2) and the F# AST isn't
in place yet." That's fine. We note the migration in the ticket and
keep the TS implementation small and replaceable.

---

## Migration triggers

Concrete signals that it's time to move a piece of logic to F#:

- **Lean integration starts.** Once we wire `/api/verify`, F# becomes
  the AST authority for any system Lean accepts. Move the AST
  definition to F# *before* writing the Lean emitter, not after.
- **A second consumer needs the same logic.** If both the Compare
  view and a server-side normalization step want canonical form, the
  normalizer goes to F# and both sides consume.
- **The TS implementation grows past ~300 LOC of pure logic.** That's
  the rough threshold where "small enough to rewrite" stops being
  true and drift risk dominates.
- **A property test fails to express a real invariant in TS.** When
  you find yourself wanting `Result<'a, 'e>` or exhaustive matching
  to make a test honest, that's a sign the code wants to be in F#.
- **Cross-system translation enters the picture.** The `LogicIR`
  union is the moment to commit to F# authority, because every
  downstream translator should be a total function over it.

---

## The migration mechanics (when we get there)

Three layers, each with its own pipeline:

### Layer 1 — Wire types (already in place)

F# DTOs → Swashbuckle → `openapi.json` → `openapi-typescript` → TS
types. Used today for philosophers / works / graph nodes. Extends
naturally to logic DTOs (e.g. `ModalFormulaDto` as a
`[<JsonConverter>]`-tagged DU).

**Cost:** zero new toolchain. **Limit:** types only, not behavior.

### Layer 2 — Behavior accessed over HTTP

For server-authoritative computations (Lean verification, canonical
normalization, validity checks): F# implements; the frontend calls
via `useQuery`. Latency-tolerant operations only — anything in the
keystroke budget stays TS-side.

**Cost:** zero new toolchain. **Limit:** network round-trip;
not suitable for interactive feedback.

### Layer 3 — Behavior shared in-process via Fable

When we want the *same* F# function to run on the backend (Lean
emitter, batch jobs, persistence) **and** in the browser (live
validity hints, instant translation between systems without a server
round-trip), Fable compiles the relevant F# module to JS for the
client to consume directly.

**Cost:** Fable build step (`dotnet fable`), Fable runtime in the
bundle (~tens of KB), a TS-side wrapper to hide Fable's emitted
shape.
**Limit:** harder to debug in the browser; not idiomatic JS;
sourcemaps land in `.fs` files.

The trigger for adopting Fable is "a meaningful chunk of F# logic
needs to run interactively in the browser without a server round
trip." Until then, layers 1 + 2 cover everything. We do **not**
adopt Fable speculatively.

### Decision tree for a given piece of code

```
Does it need to run interactively in the browser?
├── Yes — does it need to be the same as the F# implementation?
│        ├── Yes → Fable (Layer 3)
│        └── No  → TS implementation, F# is authoritative for the type only (Layer 1)
└── No  → F# implementation, exposed over HTTP (Layer 2)
```

---

## Anti-patterns to avoid

These are the failure modes we're explicitly trying to avoid:

- **Two authoritative implementations of the same logic.** A TS
  parser and an F# parser both claiming to define the DSL grammar.
  Pick one source of truth; the other side either consumes the
  parsed AST or compiles from F# via Fable.
- **Schema drift via copy-paste.** Updating an AST shape on one side
  and forgetting the other. If the type is on both sides, it must
  travel through the codegen pipeline; never hand-author the same
  type twice.
- **TS-as-permanent-home for things that should be backend.**
  Convenience-driven decisions are fine when explicit and ticketed
  for migration. They become technical debt the moment the migration
  isn't named.
- **Speculative F# generality.** Building elaborate F# infrastructure
  before any consumer needs it. Parser combinators in FParsec for a
  DSL no F# code parses; Lean emitters for systems we haven't
  formalized. Build the F# infrastructure as the second consumer
  arrives, not the first.
- **Premature Fable.** Adopting Fable to "share types" when codegen
  already does that. Fable is for sharing *behavior*. Types-only is
  Layer 1.

---

## What this means for FEAT-006 (Kripke phase 1)

Concretely, for the ticket in flight:

- **Stays TS-only.** The AST, parser, renderer, model-view, and
  frame-class data all live in `packages/web/src/logic/`. Nothing on
  the F# side.
- **Tracked for migration.** The ticket's open-questions section
  references this doc. When a Lean integration ticket opens, that
  ticket is responsible for promoting the modal AST to F# and
  re-pointing TS at it via Layer 1 codegen.
- **Avoids cross-cutting commitments.** No `LogicIR` union introduced
  yet (per the existing open question §1). Any cross-system
  abstraction lands when ≥3 systems exist *and* the F# move starts —
  not before.

---

## Sequencing (advisory, not committed)

A plausible order for moving the logical center of gravity to F#,
once we're ready:

1. **Stand up an F# `Logic` namespace.** Empty modules:
   `Logic.Modal.Ast`, `Logic.Modal.Eval`, `Logic.Frames`. No
   consumers yet.
2. **Port the modal AST as a DTO.** `ModalFormulaDto` with tagged-DU
   JSON encoding, exposed via Swashbuckle. Re-emit as TS via
   existing pipeline. Frontend keeps its TS AST temporarily; tests
   check round-trip equality.
3. **Move the recursive evaluator.** F# implements
   `eval : Formula -> Model -> World -> bool`. Frontend calls
   `/api/logic/modal/eval` for the truth badge. Drops the TS-side
   evaluator (it was a stub anyway).
4. **Move frame-validity checking.** Same shape: F# is
   authoritative; frontend calls.
5. **Lean integration.** F# emits Lean source for the modal fragment;
   subprocess runs Lean; result returns via `useQuery`.
6. **Introduce `LogicIR` in F#.** Translation registry between
   `ModalLogic`, `PeirceEG`, `PropLogic`, etc. Used by the
   `/logic/compare` view.
7. **Argument-graph reasoning in F#.** Commitment closure /
   derivation-chain queries over the unified graph + logic IR.
8. **Adopt Fable** if step 6 or step 7 produces non-trivial logic
   that the browser needs to run without round-tripping.

Each step is its own ticket; none committed. The point of the list
is to make the migration *thinkable* so we don't keep accruing
TS-side ad-hocery by default.

---

## Open questions

- **When do we open the first F# logic ticket?** Strongest candidates:
  (a) the ModalFormulaDto + evaluator move once the truth-badge wants
  to be honest (currently a hand-authored static field), or (b) the
  Lean integration prototype. Either could plausibly be FEAT-008 or
  FEAT-009.
- **FParsec on the F# side?** If the F# AST eventually wants its own
  parser (for ingest of user-submitted DSL strings via API), FParsec
  is the right choice. Defer until we have that endpoint.
- **Fable vs hand-port for the evaluator.** When the evaluator first
  needs to run in the browser without round-tripping (e.g. for a
  drag-to-edit Kripke model UI), do we Fable-compile the F# evaluator
  or hand-port to TS? The F# evaluator will be ~40 LOC; a hand-port
  may be cheaper than the Fable toolchain. Decide at the time.

---

## Relationship to existing docs

- [`editor-and-ir.md`](./editor-and-ir.md) §1 — the `LogicIR` union
  ultimately implemented per Layer 2 / Layer 3 above.
- [`formal-verification.md`](./formal-verification.md) — Lean
  integration; the strongest forcing function for this strategy.
- [`open-questions.md`](./open-questions.md) §2.2 — Neo4j adoption
  timing; orthogonal but adjacent decision about backend
  responsibilities.
- [`kripke-modal-logic.md`](./kripke-modal-logic.md) — current
  consumer of the "TS-only by pragmatism" policy.
- `../../CLAUDE.md` "Key decisions" — the F#-for-the-backend
  rationale that this doc operationalizes.
