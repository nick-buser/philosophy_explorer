# infra — extend extractor contract test for epistemic, intuitionistic, temporal

**Branch:** `infra/extractor-contract-epistemic-intuitionistic-temporal`
**Merged:** TBD

Mirrors three more deferred formalisms on the claim_extractor side
(`feat/mirror-epistemic-intuitionistic-temporal`) and extends the
cross-repo contract test in `extractor-contract.test.ts` so each of
the new wrappers gets the same structural assertions the previously-
mirrored formalisms already enjoy. No production code changed on this
side — the only diff is the contract test and this doc.

## What changed

### Contract test
- `packages/web/src/__tests__/extractor-contract.test.ts`:
  - Imports added: `EpistemicFormula`, `EpistemicModel`,
    `renderUnicodeE`, `intuitionisticDiagnostics`, `TemporalFormula`,
    `Trace`, `renderUnicodeT`.
  - `Extraction.primary` union extended with three new variants:
    `epistemic` (formula + optional model), `intuitionistic`
    (formula + optional model), `temporal` (formula + optional trace).
  - New `case 'epistemic'`: renders the formula via `renderUnicodeE`,
    walks every `know` / `consider` node asserting the agent string
    is non-empty, and (if a model is attached) checks that every edge
    references a known world *and* a declared agent, plus that the
    designated world (if set) exists. The TS eval side silently
    ignores edges with undeclared agents — the contract check is
    stricter so that drift surfaces here rather than vanishing.
  - New `case 'intuitionistic'`: renders the formula via the kripke
    `renderUnicode` (the formula reuses the `ModalFormula` AST on the
    TS side) *and* walks it to assert no `box` / `dia` node appears —
    those have no intuitionistic reading and `intuitionistic-eval.ts`
    raises on encounter. If a model is attached, world-endpoint /
    designated-world sanity matches the kripke case, and
    `intuitionisticDiagnostics(model)` is invoked so a drift in the
    diagnostic shape surfaces on the boundary.
  - New `case 'temporal'`: renders via `renderUnicodeT`, and if a
    trace is attached enforces the lasso-trace invariants
    (`0 ≤ loopBack < states.length`, non-empty states, optional
    `start` in range) plus state-id uniqueness — duplicate ids would
    silently collapse states on the visualization side.

### Test count
1059/1059 passing (was 1054/1054). The extractor-contract suite still
reports 6 tests because no extraction in the sibling repo currently
exercises the three new wrappers; the structural switch arms are in
place to assert the contract the moment one does.

## Why

The Pydantic side just landed mirrors for `epistemic`,
`intuitionistic`, and `temporal` (claim_extractor PR
`feat/mirror-epistemic-intuitionistic-temporal`). The contract test
is the cross-repo joint: if either side drifts on field names, kind
discriminators, or the structural invariants (lasso-trace shape,
intuitionistic-fragment closure, epistemic agent declaration), the
test fails on the boundary instead of silently producing broken
extractions that only break at render time.

Adding the case arms now keeps the test in lockstep with the schema
roster — same pattern used for `boolean` / `kripke` / `medieval`
(PR #25), `eg` (PR #26), and `frege` (PR #28).

## Notes for future work

### Open follow-ups

- **CTL contract case.** The remaining branching-time mirror on the
  deferred list is `ctl`. Same shape as `temporal` but with paired
  path quantifiers (AX / EX / AF / EF / AG / EG / A[U] / E[U]) over
  a Kripke structure. When the Pydantic side mirrors it, this test
  needs another switch arm.
- **Indian / Resolution contract cases.** Same story for the two
  remaining non-Kripke deferred mirrors — `indian` (Nyāya five-step)
  and `resolution`. Both have stable TS ASTs.
- **Common-knowledge / distributed-knowledge operators on
  `epistemic`.** Out of scope on both sides. When the TS AST adds
  `ck` / `dk` (least-fixed-point over the union of relations), the
  Pydantic mirror grows a corresponding `kind` and the contract test
  walker grows a case for it.

### Decisions made

- **Intuitionistic mirrors `ModalFormula` minus `box` / `dia`, not a
  fresh AST.** Considered defining an `IntuitionisticFormula` TS
  type to mirror the Pydantic-side narrower union. Rejected because
  (a) `intuitionistic-eval.ts` already accepts `ModalFormula` and
  throws on `box` / `dia` — a parallel narrower TS type would force a
  conversion at every call site for no semantic gain; (b) the
  contract test enforces the no-box / no-dia rule structurally on the
  extracted side, which is where the actual cross-repo guarantee is
  needed. The Lab's slash palette already keeps □ / ◇ out of the
  intuitionistic editor.

- **Stricter agent-declaration check than the TS eval.** TS-side
  `intuitionistic-eval`-style "silently ignore unknown agents" is the
  right runtime behavior — a half-broken model still renders. But
  for the contract boundary it would let the extractor produce edges
  the Lab never displays, with no signal. The contract test rejects
  edges that reference un-declared agents so this drift can't pass
  silently between the two repos.

- **State-id uniqueness check on traces.** Not enforced on the
  Pydantic side because duplicates aren't a structural error — two
  states with the same id are *valid Pydantic* but break the
  visualization (the renderer keys by id). Surfacing it on the
  contract boundary catches it before render rather than at it.

- **`intuitionisticDiagnostics` invoked but verdict not asserted.**
  The frame-shape diagnostics return `{ reflexive, transitive,
  monotone, isValidFrame }`. We invoke the function so its shape
  surfaces (a renamed field would break this test) but don't assert
  any particular verdict, because the Lab can close the frame on the
  fly and an extraction-time non-pre-order model is a legitimate
  payload for a passage that *argues about* the closure step.
