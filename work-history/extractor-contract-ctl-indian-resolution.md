# infra — extend extractor contract test for ctl, indian, resolution

**Branch:** `infra/extractor-contract-ctl-indian-resolution`
**Merged:** TBD

Mirrors the final three deferred formalisms on the claim_extractor
side (`feat/mirror-ctl-indian-resolution`) and extends the cross-repo
contract test in `extractor-contract.test.ts` so each new wrapper gets
the same structural assertions the previously-mirrored formalisms
already enjoy. With this, every logic AST in `packages/web/src/logic/`
has both a Pydantic mirror in claim_extractor and a contract-test arm
here. No production code changed on this side — the only diff is the
contract test and this doc.

## What changed

### Contract test

- `packages/web/src/__tests__/extractor-contract.test.ts`:
  - Imports added: `CtlFormula`, `renderUnicodeCtl`; `Inference`,
    `fiveSteps`, `classify` (aliased `classifyIndian`); `Program`,
    `formatClause`, `formatRule`, `formatGoal`, `atomHasFunctor`.
  - `Extraction.primary` union extended with three new variants:
    `ctl` (formula + optional model), `indian` (inference),
    `resolution` (program).
  - New `case 'ctl'`: renders the formula via `renderUnicodeCtl`
    (total over the propositional kinds plus the uppercase
    path-quantified operators AX/EX/AF/EF/AG/EG/AU/EU). CTL reuses
    `KripkeModel`, so when a model is attached the same world-endpoint
    / designated-world checks as the `kripke` case apply. Frame
    seriality is *not* asserted — it is a Lab-side diagnostic
    (`ctlAxiomVerdicts`) and a non-serial model is a legitimate
    payload for a passage that argues about closing the frame.
  - New `case 'indian'`: calls `fiveSteps` (builds the pañcāvayava,
    the five-membered Nyāya inference) and asserts it returns exactly
    five steps in ordinal order; calls `classify` (runs trairūpya and
    places the hetu on Dignāga's nine-cell hetu-cakra) and asserts the
    verdict is one of the four kinds the engine emits
    (`valid` / `inconclusive` / `contradictory` / `unestablished`);
    and walks every example asserting its `side` is a declared
    `ExampleSide`. The engine's hetu counts silently skip an example
    with an unrecognised side, so that drift would otherwise vanish —
    the contract check surfaces it.
  - New `case 'resolution'`: narrows on the `mode` discriminator and
    renders every clause / rule / goal via the total `format*`
    helpers. For `datalog` mode it additionally enforces the
    function-symbol-free restriction via `atomHasFunctor` on every
    rule head, rule body atom, and query atom — datalog's semi-naïve
    evaluation relies on a finite Herbrand base that a compound
    functor breaks. The Pydantic mirror rejects this at validation;
    re-checking here catches a drift between the two checks.

### Test count

1059/1059 passing (unchanged). The extractor-contract suite still
reports 6 tests because no extraction in the sibling repo currently
exercises the three new wrappers — the structural switch arms are in
place to assert the contract the moment one does, the same dormant
state the `epistemic` / `intuitionistic` / `temporal` arms were left
in by PR #31.

## Why

The Pydantic side just landed mirrors for `ctl`, `indian`, and
`resolution` (claim_extractor PR `feat/mirror-ctl-indian-resolution`),
completing the mirror set — every `<name>-types.ts` AST now has a
1:1 Pydantic counterpart. The contract test is the cross-repo joint:
if either side drifts on field names, kind/mode discriminators, or the
structural invariants (CTL's uppercase operator tags, the Nyāya
example-side tags, datalog's function-symbol-free rule), the test
fails on the boundary instead of silently producing broken
extractions that only break at render time.

Adding the case arms now keeps the test in lockstep with the schema
roster — same pattern used for `boolean` / `kripke` / `medieval`
(PR #25), `eg` (PR #26), `frege` (PR #28), and
`epistemic` / `intuitionistic` / `temporal` (PR #31). This closes the
three "open follow-ups" recorded in
`work-history/infra-extractor-contract-epistemic-intuitionistic-temporal.md`.

## Notes for future work

### Open follow-ups

- **No deferred mirrors remain.** As of this branch every logic AST in
  `packages/web/src/logic/` is mirrored and contract-tested. The next
  contract-test arm is only needed when a *new* `<name>-types.ts`
  lands here — at which point claim_extractor mirrors it and this test
  grows another switch arm. The procedure is in claim_extractor's
  `docs/formalisms.md` §"Mirroring a new formalism".
- **The new arms are dormant.** They assert nothing until an
  extraction of that formalism exists in the sibling repo. The first
  real ctl / indian / resolution extraction will exercise them; if the
  assertions turn out too strict or too loose against real payloads,
  tune them then rather than speculatively now.

### Decisions made

- **CTL seriality is not a contract invariant.** CTL evaluation
  expects a serial frame (every state has a successor), and the Lab
  ships `ctlAxiomVerdicts` for that diagnostic. But an extraction can
  legitimately ship a non-serial model for a passage that *argues
  about* the seriality step, so the contract test checks only
  world-endpoint well-formedness — the same call the work-history doc
  for the `intuitionistic` arm made about pre-order frame shape.

- **`resolution` uses the `format*` renderers, not the engine.** The
  contract test could run `classify` from `resolution-engine.ts` (the
  strongest cross-check, the way the `eg` arm runs `egToFol`). It
  deliberately does not: `refute` and `sld` can run unboundedly on a
  pathological clause set, and a contract test that walks every
  extraction must terminate predictably. `formatClause` / `formatRule`
  / `formatGoal` are total renderers that exercise every Term `kind`
  and the `mode` discriminator — the same guarantee `renderUnicodeT`
  gives the `temporal` arm — without running a search.

- **Datalog function-symbol check is stricter than the TS engine
  needs.** `datalogForward` would simply loop or mis-derive on a
  program with function symbols; it does not raise. The Pydantic
  mirror rejects such a program at validation, and the contract test
  re-checks it via `atomHasFunctor` so a drift between the two
  function-freeness checks surfaces on the boundary rather than as a
  silent mis-evaluation.

- **`indian` mirrors only the `Inference` payload.** Dignāga's
  nine-cell hetu-cakra (`HETU_CAKRA`, `Cell`, `findCell`) is static
  wheel data plus a classification the engine derives — an extraction
  commits to an `Inference`, not to a wheel cell. The contract test
  invokes `classify` to confirm the engine still accepts the mirrored
  `Inference` shape, but asserts only that the verdict kind is one the
  engine recognises, not any particular verdict — the passage may
  argue a fallacious inference on purpose.
