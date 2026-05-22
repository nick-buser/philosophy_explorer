# feat — Logic Lab: Lean-verified natural deduction

**Branch:** `feat/logic-lab-lean-nd`
**Merged:** _TBD_

Milestone 1 of the Lean verification integration
(`docs/formal-logic/formal-verification.md` §3–5), building on the
Milestone 0 connectivity spike. The first *real* verification: a
propositional natural-deduction proof built in `NaturalDeductionLab` is
shipped to Lean, which type-checks it against a **deep embedding** of
ND — the system verified as itself, not reinterpreted into Lean's logic.

## What changed

- **`packages/lean/NaturalDeduction/`** — the ND deep embedding, joined
  to the `lake` build alongside `Sanity`:
  - `Formula.lean` — `NDFormula`: `atom / top / bot / neg / and / or /
    imp / iff`, the propositional fragment of `fol-types.ts`.
  - `Deriv.lean` — `RuleSet` (`intuitionistic` / `classical`) and the
    judgment `Deriv rs Γ φ`, one constructor per `nd-types.ts` rule. A
    well-typed `Deriv` term *is* a proof; `raa` is constructible only
    under `classical`.
  - `Examples.lean` — reference derivations in the `let`-per-line style
    the emitter produces.
- **`PhilosophyExplorer.Api/Logic/Nd/NdTypes.fs`** — F# DTOs: `Rule`,
  `RuleSet`, `FolFormula` (propositional fragment), `Cite`, `FitchLine`,
  `FitchProof`. F# is now authoritative for the `/api/verify` contract.
  `FolFormula` and `Cite` carry hand-written `JsonConverter`s, shared via
  `NdJson.options`, so the wire JSON matches `nd-types.ts` byte-for-byte.
- **`Logic/Nd/LeanEmitter.fs`** — the `FitchProof → Deriv` emitter: a
  structural fold producing a `.lean` file with one explicitly-typed
  `let` per proof line. `fitchLineOf` maps Lean diagnostic lines back
  onto proof line numbers.
- **`Routes/VerifyRoutes.fs`** — `POST /api/verify`: validates a
  `FitchProof`, emits Lean, runs it through `ILeanRunner`, and returns a
  verdict DTO (`verified | failed | timeout | error`) with diagnostics
  located on proof lines.
- **`/api/lean/health` retired** — `Routes/LeanRoutes.fs` deleted; the
  M0 spike placeholder is replaced by the real contract endpoint.
- **OpenAPI** — `Program.fs` `MapType`s `FolFormula` / `Cite` to opaque
  object schemas; `openapi.json` and `api-types.ts` regenerated.
- **`NaturalDeductionLab.tsx`** — a Lean-verification badge: when the TS
  prover yields a `FitchProof`, a TanStack Query call to `/api/verify`
  surfaces Lean's verdict, distinct from the prover's `ProofBadge`. A
  rejected proof opens a panel with the line-located diagnostics.
- **Tests** — `NdTypesTests.fs` (DTO JSON round-trip), `LeanEmitterTests.fs`
  (emitted proofs through `ILeanRunner`), `nd-verify-badge.test.tsx`
  (badge rendering), `verify-api-contract.test.ts` (the prover corpus →
  `/api/verify`, at the HTTP boundary).

## Why

Milestone 0 proved the F#↔Lean plumbing; M1 is the first verification
that means something. ND was the chosen first system: it already emits a
structured `FitchProof` and ships a prover whose every output is a free
test case. The *deep* embedding — rather than reusing Lean's native
logic — is the point: the user's calculus is checked as itself, so a
`verified` verdict certifies the proof in the embedded ND system, not in
some translation of it. See `.tickets/feat-logic-lab-lean-nd.md`.

## Notes for future work

- **DTO-promotion scope — option (b) was taken (ticket decision 3).** F#
  is authoritative for `FolFormula` / `FitchProof`, but the hand-authored
  `nd-types.ts` / `fol-types.ts` are *not* re-pointed onto the codegen'd
  types. `FolFormula` threads through the whole TS logic stack; re-pointing
  it is a wide mechanical refactor, explicitly a fast-follow `refac/`
  ticket rather than silent debt.
- **The DTO encoding deviates from the ticket's "externally-tagged"
  wording.** `nd-types.ts` `FolFormula` is *internally* tagged
  (`{ kind, … }`); the project's `JsonFSharpConverter` is registered
  external-tag, which cannot round-trip it. `FolFormula` and `Cite` got
  hand-written converters instead — the round-trip is pinned by
  `NdTypesTests`.
- **`FolFormula` / `Cite` are opaque in the OpenAPI spec.** Swashbuckle
  reflects F# DUs as their CLR shape (`tag`, `isXxx`); `MapType` overrides
  them to `{ type: object }`. The codegen'd `FitchProof` AST is therefore
  loosely typed — acceptable because the verify request body is sent as
  stringified JSON and the F# side owns deserialization. A faithful
  recursive schema belongs with the fast-follow re-point ticket.
- **The emitter emits one explicitly-typed `let` per line, never a single
  nested term.** This is load-bearing: `by decide` can only discharge the
  `∈` context lookups, and `Deriv.reit` lifts can only infer their
  prepended formula, when every intermediate context is concrete. A
  nested term leaves elimination-rule indices as metavariables. A
  citation of an enclosing-scope line is wrapped in one `Deriv.reit` per
  crossed subproof boundary.
- **`/api/verify` returns 200 for all four `LeanResult` cases** — the
  verdict field distinguishes them; 400 is only for a malformed request.
  A `RunnerError` (toolchain failure) surfaces as `verdict: "error"`.
- **The integration test needs the API running.** `verify-api-contract.test.ts`
  skips when `localhost:3001` is unreachable, mirroring the extractor
  contract test. CI does not currently start the API, so it skips there —
  a follow-up could add an API-up CI step so the contract is enforced.
- **The verify badge was not visually browser-checked** during this work
  (no browser tooling available). It is covered by a component test
  (`LeanVerifyBadge` rendering) and the live `/api/verify` integration
  test, and the module type-checks and transforms — but the rendered Lab
  UI itself should be eyeballed.
- **Soundness theorems remain out of scope** (`Deriv Γ φ → ⟦Γ⟧ ⊨ ⟦φ⟧`) —
  they would certify the embedding is faithful; a later ticket. Embeddings
  of other Logic Lab systems (Peirce EG, Boolean, Frege) are each their
  own later ticket.
