# feat: Logic Lab Frege higher-order validity — bounded Henkin model checker

**Branch slug:** `feat/logic-lab-frege-hol-validity`
**Status:** queued
**Size:** M
**Depends on:** `feat/logic-lab-frege-higher-order` (shipped 2026-05-08)

## Why

`frege-bs` has parsing, 2D rendering, and a Frege → FOL/HOL
translation panel — but no validity engine. Every other system in
the Lab tells you whether the input is valid (Modern FOL via
truth-table + tableau, Kripke + variants via the model checker,
resolution via SLD/refutation, etc.). Without a verdict, Frege reads
as a *viewer* rather than a *working logic*. The order chip
externalises the prop / FO / HO classification but the question
"is this true in every Henkin model?" is not yet answered.

Higher-order validity is undecidable, so any engine here is
necessarily incomplete. A *bounded* Henkin-style model checker —
small finite domain, exhaustive enumeration of predicate-variable
interpretations — gives sound rejections (verified countermodel)
and partial validity verdicts (no countermodel found within the
bound). This matches the pattern Modern FOL already uses for its
bounded tableau search.

## Scope

**In:**

- New `frege-validity.ts`:
  - Henkin model: `domain: T[]`, `individualEnv: Map<string, T>`,
    `predicateEnv: Map<string, Set<T[]>>` (parameterised on the
    domain element type — start with strings).
  - Recursive `evaluate(formula, model, env)` over `FregeContent`:
    - `atom` looks the predicate up in `env`; checks tuple
      membership.
    - `not`, `cond` evaluate their subformulas.
    - `iden` evaluates as Boolean equivalence at sentence level
      and as identity at term level (two interpretations gated
      by whether the operands are atomic terms or compound
      contents — match the parser's polymorphism).
    - `forall` / `exists` over individuals iterate over `domain`.
    - `forall` / `exists` over predicates iterate over the
      power-set of `domain^arity` (arity inferred from atom usage,
      see below).
- Bounded enumeration:
  - Domain size knob (1, 2, 3) — default 2.
  - For each free atomic predicate, enumerate interpretations.
    For each free individual, enumerate domain elements.
- Verdict + countermodel:
  - `{ kind: 'valid', searchedSize: n }` — no falsifier within the
    bound. UI surfaces "no countermodel up to size n" rather than
    a definite ⊨.
  - `{ kind: 'invalid', countermodel: HenkinModel, environment: ... }`
    — concrete falsifying assignment.
  - `{ kind: 'budget-exhausted', searchedSize: n }` — for very
    large formulas where even size-2 enumeration blows the budget.
- Lab page: verdict pill alongside the order chip; expandable
  "countermodel" panel mirroring the Modern FOL countermodel layout.
- Tests:
  - Frege axioms 1, 41, 52, 54, 58 should report valid (no
    countermodel up to size 3).
  - Russell-paradox-style underivable shapes (e.g.
    `|- exists F. all x. F(x) <-> ~F(x)`) report invalid with a
    domain-size-1 countermodel.
  - Leibniz indiscernibility should report valid up to size 3.

**Out (captured separately):**

- Verdict for Grundgesetze constructs (value-ranges, abstraction) —
  picks up automatically once `frege-validity.ts` learns those
  AST kinds; the engine itself is the same →
  `feat-logic-lab-frege-grundgesetze.md` extends.
- Soundness for non-Henkin (full standard) HOL semantics —
  implementation is Henkin only; full standard HOL is undecidable
  even modulo the bound.
- Validity for full FO with equality not currently in Frege but in
  Modern FOL — that's `fol-validity.ts` territory.

## Build sketch

- Arity inference pass: walk the AST, build a `Map<atomName, arity>`
  by inspecting atom uses. Conflicting arities surface as a soft
  warning (and shipped already as a separate `polish` ticket — see
  `feat-logic-lab-frege-polish.md`).
- Pure evaluator in `frege-validity.ts`. Avoid mutable state:
  evaluate at each `(formula, env)` and return the Boolean result
  + (when false) the witnessing valuation.
- Enumeration: small generators over `domain^k` and over the
  `2^(domain^k)` power-set of relations of arity `k`. Cap arity at
  3 for the default budget.
- Budget control: total-evaluations counter; abort with
  `budget-exhausted` past the cap.
- Lab page: extract the existing FOL panel + chip layout into a
  small grid container so the verdict pill sits next to them
  without crowding the rendering panel header.

## References

- Andrews, *An Introduction to Mathematical Logic and Type Theory*
  §51–53 — Henkin semantics; the relevant completeness result.
- Henkin, *Completeness in the Theory of Types* (JSL 1950) —
  original.
- `packages/web/src/logic/fol-validity.ts` — bounded tableau the
  Modern FOL Lab uses; same pattern of sound-rejection + bounded-
  validity.
- `packages/web/src/logic/fol-tableau-tree.ts` — countermodel
  surface for the Lab's existing verdict panel.
- `packages/web/src/logic/frege-fol.ts` — translator already
  produces a linear form; the validity engine works directly on the
  Frege AST so the translator is a peer, not a dependency.
