# feat: Logic Lab Description Logic — SHIQ extensions

**Branch slug:** `feat/logic-lab-dl-shiq`
**Status:** queued
**Size:** M
**Depends on:** `feat/logic-lab-description-logic` (ALC base)

## Why

ALC alone covers the canonical decidable DL but leaves out the
expressivity every ontology-modelling course actually teaches and
every real ontology actually uses: inverse relations
(`hasParent ≡ hasChild⁻`), counting (`Person ⊑ ≤2 hasParent`),
generalized role inclusions (`hasFather ⊑ hasParent`), and
transitivity (`hasAncestor` transitively closes `hasParent`). Lifting
the Lab from ALC to SHIQ closes the gap to "the DL fragment people
write ontologies in" without committing to the full OWL 2 DL surface.

## Scope

**In:**
- Inverse roles `R⁻` in concept syntax (`∃hasChild⁻.Person`).
- Qualified number restrictions `≥n R.C`, `≤n R.C`, `=n R.C`.
- Role hierarchy axioms `R ⊑ S`.
- Transitive role declarations `Trans(R)` (the `S` of SHIQ).
- Tableau extension: pairwise / equality blocking (the simple
  subset blocking from the ALC ticket is unsound under inverse +
  number restrictions); merge rule for `≤n` violations.
- ~5 new examples illustrating each feature in isolation plus one
  small composite (a family-relations ontology).

**Out (captured separately):**
- Nominals, self-restriction, role chains → `feat-logic-lab-dl-sroiq.md`.
- Datatypes / concrete domains → `feat-logic-lab-dl-datatypes.md`.

## Build sketch

- AST: extend the `Concept` and `Role` types with inverse and
  number-restriction nodes.
- Parser: new prefix `≥n` / `≤n` / `=n` and postfix `⁻` for roles.
- Tableau:
  - Replace subset blocking with pairwise blocking (equal label
    sets at ancestor-descendant pairs), or equality blocking for
    SHIQ-completeness (Horrocks/Sattler 2007).
  - Number-restriction rules: `≥n R.C` creates `n` distinct
    `R`-successors with `C`; `≤n R.C` merges successors when more
    than `n` exist.
  - Inverse rules: propagate constraints back along role edges.
- Reasoner glue: classification still works because subsumption is
  reduced to (un)satisfiability of `C ⊓ ¬D`.
- Visualization: extend the ABox graph to render role-direction
  arrows for inverse and number-restriction edges.

## References

- Horrocks, Sattler, Tobies, *Practical Reasoning for Expressive
  Description Logics* (1999) — original SHIQ tableau.
- Horrocks, Sattler, *A Tableau Decision Procedure for SHOIQ*
  (2007) — the equality-blocking refinement.
- The ALC tableau lives in `packages/web/src/logic/dl-tableau.ts`
  (after the base ticket ships).
