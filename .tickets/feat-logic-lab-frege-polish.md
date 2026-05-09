# feat: Logic Lab Frege polish — remaining axioms, Greek glyphs, arity discipline

**Branch slug:** `feat/logic-lab-frege-polish`
**Status:** queued
**Size:** S
**Depends on:** `feat/logic-lab-frege-higher-order` (shipped 2026-05-08)

## Why

Three small follow-ups from the higher-order ticket that don't
individually warrant their own ticket but together close out the
residual surface for `frege-bs`. Batched because they all touch the
same files and ship cleanly together. Each one is ~half a day on its
own and the bundle stays small.

## Scope

**In:**

- **Remaining 5 of Frege's 9 Begriffsschrift axioms as named
  examples.** Currently 4/9 are in the example library
  (axioms 1, 41, 52, 54, 58). Add the missing five:
  - Axiom 2 — `(c → (b → a)) → ((c → b) → (c → a))` (distribution).
  - Axiom 8 — `(d → (b → a)) → (b → (d → a))` (commutation of
    antecedents).
  - Axiom 28 — `(b → a) → (¬a → ¬b)` (contraposition, distinct
    from `iden-contraposition` which states it as identity-of-
    content rather than an axiom).
  - Axiom 31 — `¬¬a → a` (companion to the existing `double-negation`,
    which is axiom 41 in the other direction).
  - One small composite — Frege's derived theorem 60
    (`∀a.f(a) → f(c)` proved from axioms — pairs with the existing
    `universal-instantiation` example and gives the Lab a
    pedagogical "this is derivable" companion to the axioms).
- **Greek capital glyphs for predicate-sort cavities.** Currently
  the renderer keeps the user's Latin capital with a cyan fill +
  bold weight. Replace with a Latin → Greek mapping table for the
  common predicate variables, falling back to Latin when no
  obvious Greek pair exists:

  | Latin | Greek | Rationale |
  |---|---|---|
  | F | Φ (Phi) | Frege's "F" was always Φ in his original |
  | G | Γ (Gamma) | uppercase Gamma is visually distinct |
  | P | Π (Pi) | Π for property |
  | Q | Ψ (Psi) | Ψ for the second predicate variable |
  | R | (Latin R) | no clean Greek pair; Latin fallback |
  | S | Σ (Sigma) | |
  | X / Y / Z | Ξ / Υ / Ζ | when used as predicate names |

  Variables without a mapping render in italic Latin capital with
  the same cyan fill (current behaviour).
- **Predicate-variable arity-coherence soft warning.** A
  bound predicate variable used inconsistently (e.g.
  `all F. F(a) -> F(a, b)`) is currently accepted by the parser.
  Add a post-parse arity-coherence check:
  - Walk the AST collecting `(name, arity)` pairs for every atom
    use whose head is a bound predicate variable.
  - When the same name appears with conflicting arities, surface
    a soft warning chip in the Lab next to the order chip.
  - Does *not* block parsing; the formula still renders.
  - Format: "F: arity 1 vs 2 at column 18 vs column 30".

**Out (captured separately):**

- Larger systematic re-typography (full Gothic font for individual
  variables; Greek lowercase for second-order individuals if
  Grundgesetze profile lands) — would be its own ticket once a
  font-loading strategy is decided.
- Validity-style verdict from arity errors — that's a strict-mode
  feature better handled by the validity engine →
  `feat-logic-lab-frege-hol-validity.md`.
- gfnotation's broader fidelity work →
  `feat-logic-lab-frege-gfnotation.md`.

## Build sketch

- Examples: extend the `frege-bs` block in
  `packages/web/src/data/logic-systems.ts` with the five new
  examples. Update the `frege-system-data.test.ts` so the order-
  coverage assertion still includes the propositional examples
  (most of these are propositional axioms).
- Greek glyphs: add a `GREEK_FOR_LATIN` table in `frege-layout.ts`
  next to the existing `LAYOUT_CONSTS`. The cavity primitive's
  `letter` field stays as the user's input (so the AST is unchanged
  and tests don't need to update); the renderer looks up the Greek
  substitute when `sort === 'predicate'` and renders that instead.
  Latin fallback when no entry exists.
- Arity check:
  - New `frege-arity.ts`: pure walker producing
    `Array<{ name: string; observedArities: Map<number, SourceSpan> }>`.
  - Source spans require parser support — currently the parser does
    not emit spans. Add a minimal `span: { start: number; end: number }`
    field to the `atom` AST kind (optional; defaulted to
    `{ start: 0, end: 0 }` for backward-compat) and populate it from
    the parser. Lab page uses spans for the warning's
    "at column N" detail.
  - Lab page: warning chip alongside the order chip.
- Tests:
  - Two new examples → covered by `frege-system-data.test.ts`
    (already verifies parsing + layout for every example).
  - `frege-layout.test.ts` — new case: `all F. F(a)` produces a
    cavity with `letter === 'F'` (unchanged AST) but the renderer
    test (a small DOM assertion via `@testing-library/react`) checks
    that the rendered SVG `<text>` contains "Φ" not "F".
  - `frege-arity.test.ts` (new) — coherent + incoherent cases plus
    the empty-tree base case.

## References

- Begriffsschrift §14–22 — Frege's original 9 axioms.
- Schlimm 2017 §3 — modern accounting of the axiom system.
- `packages/web/src/logic/frege-layout.ts` — `LAYOUT_CONSTS`
  block; cavity primitive.
- `packages/web/src/logic/FregeRenderer.tsx` — `cavity` case in
  `PrimitiveShape` is where the glyph swap lands.
- `packages/web/src/logic/frege-types.ts` — `FregeContent.atom`
  shape; the optional `span` field would land here.
