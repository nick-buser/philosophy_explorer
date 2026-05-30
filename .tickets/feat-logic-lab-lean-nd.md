# feat: Logic Lab — Lean-verified natural deduction

**Branch slug:** `feat/logic-lab-lean-nd`
**Status:** queued
**Size:** L
**Depends on:** `infra/lean-runner-spike` (Milestone 0 — the `ILeanRunner`
plumbing; PR #45)

## Why

Milestone 0 proved the plumbing: F# can drive a headless Lean and tell
verified / failed / timed-out apart. This milestone is the first *real*
verification — the ND vertical slice from `formal-verification.md`
§3–5. A user builds a propositional natural-deduction proof in
`NaturalDeductionLab`; the backend ships it to Lean, which type-checks
it against a **deep embedding** of natural deduction — the system
verified *as itself*, not reinterpreted into Lean's native logic.

ND is the chosen first system (`formal-verification.md` §3): it already
emits a fully structured `FitchProof`, it already has a prover
(`nd-prover.ts`) whose every output is a free verification test case,
and its classical / intuitionistic toggle maps cleanly onto a choice of
which `Deriv` constructors are in scope.

## Scope

**In:**

- **`packages/lean/` — the ND deep embedding.** New Mathlib-free Lean
  modules, joined to the lake build alongside `Sanity`:
  - `NaturalDeduction/Formula.lean` — `NDFormula` inductive: `atom`,
    `top`, `bot`, `neg`, `and`, `or`, `imp`, `iff`.
  - `NaturalDeduction/Deriv.lean` — `Deriv`, one constructor per
    `nd-types.ts` `Rule`. A well-typed `Deriv … Γ φ` term *is* a proof
    of φ from Γ in the embedded calculus. `raa` is well-typed only
    under the classical rule set.
- **F# AST authority — `FolFormula` + `FitchProof` as DTOs.** Per
  `backend-logic-core.md` Layer 1 and its migration trigger ("move the
  AST to F# *before* writing the Lean emitter"):
  - `Logic/Nd/NdTypes.fs` — F# `FolFormula` (propositional fragment),
    `Rule`, `FitchProof` / `FitchLine` / `Cite`, as DUs and records
    with the project's externally-tagged `JsonFSharpConverter` encoding.
  - Surfaced through the OpenAPI spec; `gen:spec` + `gen:types`
    regenerate `packages/specs/openapi.json` and `api-types.ts`.
- **`Logic/Nd/LeanEmitter.fs` — the `FitchProof → Deriv` emitter.** A
  structural fold over the proof: each `FitchLine` becomes a `Deriv`
  constructor application; context (`Γ`) is left implicit for Lean's
  unifier; `premise` / `assumption` / `reit` citations become
  `List.Mem` witnesses. Emits a complete `.lean` file that imports the
  embedding and asserts the proof term has type `Deriv … Γ conclusion`.
- **`POST /api/verify`** — takes a `FitchProof` + rule set; F#
  validates, emits Lean source, calls `ILeanRunner`, maps the
  `LeanResult` diagnostics back onto proof line numbers, returns a
  verdict DTO. Retires the dev-gated `/api/lean/health` placeholder.
  Goes through `gen:spec` / `gen:types`.
- **Verify badge in `NaturalDeductionLab`.** When the TS prover
  produces a `FitchProof`, a TanStack Query call to `/api/verify`
  surfaces a Lean-verification badge — distinct from the existing
  `ProofBadge`, which reports the *prover's* result, not Lean's. A
  Lean-rejected proof shows the line-located diagnostic.
- Integration tests: the `nd-prover.ts` corpus → `/api/verify` →
  `Verified`; a deliberately mis-cited proof → `Failed` at the right
  line; an RAA proof under `intuitionistic` → `Failed`.

**Out:**

- First-order ND (quantifier rules). The embedding and DTOs are the
  propositional fragment only — `eq` / `forall` / `exists` stay out,
  matching what the Lab supports.
- Soundness theorems (`Deriv Γ φ → ⟦Γ⟧ ⊨ ⟦φ⟧`) — certify the embedding
  is faithful; a follow-up, not needed to *check* a proof
  (`formal-verification.md` §4).
- Embeddings of other systems (Peirce EG, Boolean, Frege) — each its
  own later ticket.
- A full re-point of the TS logic stack onto codegen'd types — see
  design decision 3.

## Design decisions

1. **Classical vs. intuitionistic — one parameterised `Deriv`.**
   `Deriv` is parameterised by the rule set; `raa` is constructible
   only under `classical` (`formal-verification.md` §4, option b).
   Rationale: the emitter emits the same constructor vocabulary either
   way and just sets the parameter — simpler than two judgment types it
   must branch between. An RAA proof checked as intuitionistic then
   fails at the kernel, which is the correct verdict.
2. **Context threading is implicit.** Built bottom-up, the emitter
   never computes `Γ`; Lean infers the list indices by unification.
   `premise` citations compile to `List.Mem` witnesses (`.head` /
   `.tail …`) derived from the proof's scope structure
   (`formal-verification.md` §4).
3. **DTO promotion scope — the open decision.** F# becomes
   authoritative for the propositional `FolFormula` + `FitchProof`. The
   question is the TS re-point: (a) within M1, replace the
   hand-authored `fol-types.ts` / `nd-types.ts` formula + proof types
   with the codegen'd ones and fix every consumer; or (b) M1 adds the
   F# DTOs + `/api/verify` only, the Lab's verify call uses the
   codegen'd type, and the TS-stack re-point is a fast-follow `refac/`
   ticket. **Recommendation: (b)** — `FolFormula` threads through the
   whole TS logic stack (parser, prover, renderers, every Lab);
   re-pointing it is a wide mechanical refactor that should not ride in
   the same PR as the embedding. M1 still satisfies the migration
   trigger: F# *is* authoritative, and the residual TS copy is
   explicitly ticketed rather than silent debt.

## Build sketch

- Lean embedding first — `NDFormula`, then `Deriv`; confirm
  `lake build`; hand-write one `Deriv` term per rule to check the
  constructors typecheck.
- F# DTOs + a JSON round-trip test (TS `FitchProof` ⇄ F# `FitchProof`),
  then `gen:spec` / `gen:types`.
- The emitter as a structural fold; unit-test the emitted source
  against the embedding through `ILeanRunner`.
- `/api/verify`; retire `/api/lean/health`.
- The badge; browser-test the Lab.

## References

- `docs/formal-logic/formal-verification.md` §3–5 — the embedding
  approach, the `Deriv` sketch, the milestone table.
- `docs/formal-logic/backend-logic-core.md` — Layer 1 DTO promotion;
  the "AST to F# before the emitter" migration trigger.
- `work-history/infra-lean-runner-spike.md` — Milestone 0; the
  `ILeanRunner` seam this builds on.
- `packages/web/src/logic/nd-types.ts`, `fol-types.ts`, `nd-prover.ts`
  — the `FitchProof` / `FolFormula` shapes and the free test corpus.
- `packages/lean/` — the lake package; the embedding modules join
  `Sanity`.
