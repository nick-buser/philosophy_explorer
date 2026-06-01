# FIX — aristotelian syllogism rows rendered identically

**Branch:** `fix/aristotelian-clause-rows`
**Merged:** (pending)

Follow-up to `feat/argument-dsl-viz` (#55, merged). The dedicated argument view
made the bug visible: every aristotelian syllogism showed the same line three
times (both verbal and symbolic columns).

## What changed

- `lib/argument-types.ts` — `clauseFormula` for the `aristotelian` case now maps
  each clause to its own proposition (conclusion by role; the two premises by
  position — 0 → major, 1 → minor) instead of returning the whole syllogism.
- `lib/__tests__/clause-formula.test.ts` (new) — asserts the three clauses map to
  major / minor / conclusion and are distinct; single-proposition formulas
  return themselves.
- `.playwright-flows/arguments/syllogism-rows.ts` (new) — browser regression: the
  three rows of a syllogism read distinctly.

## Why

`clauseFormula` returned `formalization.ast.formula` (the whole `Syllogism`) for
*every* clause, and `renderFormula` collapses a syllogism to its conclusion
proposition — so all three rows (premise, premise, conclusion) rendered the
conclusion. It went unnoticed until the argument browser surfaced syllogisms in a
clause table. (The DSL serializer added in #55 already mapped clauses correctly,
which is why its DSL block showed the three distinct lines all along.) Closes #NNN.

## Notes for future work

- Premise→major/minor mapping is positional (clause position 0/1), matching the
  `nd` case's `premises[position]` convention and the standard major-then-minor
  presentation order. If an extraction ever emits premises out of that order the
  two premises would swap; the conclusion is keyed on `role` so it's safe.
- Verified in a real browser (pw-validate, local stack): the Barbara example now
  shows "All man are animal" / "All individual man are man" / "All individual man
  are animal" across the three rows.
