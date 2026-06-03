# FEAT — DSL + model visualization for the 5 modal formalisms

**Branch:** `feat/argument-viz-modal`
**Merged:** (pending)

Phase 2b — the last batch. Wires the five model-bearing formalisms
(`kripke` / `ctl` / `intuitionistic` / `epistemic` / `temporal`) into the
argument browser. With this merged, **every formalism that appears in the
corpus** renders DSL + a visualization (fol/nd/aristotelian #55, boolean/indian
#57, these 5 now).

## What changed

- `logic/ModalArgumentViz.tsx` (new) — the shared model explorer. Each modal
  argument already carries its own hand-authored model (`{ formula, model }`) or
  trace (`{ formula, trace }`), so that's the default render. A config map per
  formalism supplies `{ examples, satisfaction, view, frames }`:
  - **view**: `KripkeModelView` (kripke/ctl/intuitionistic), `EpistemicModelView`
    (epistemic), `TraceView` (temporal) — the same components the labs use.
  - **satisfaction**: `satisfactionMap`/`forcesMap`/`satisfactionMapC/E/T` — the
    formula's per-world truth, fed to the view's overlay (highlighted = holds).
  - **model switcher**: a dropdown of [the argument's own model] + the lab
    system's example models (`example.model`/`epistemicModel`/`trace`).
  - **frame classes** (kripke only): a K/T/S4/S5 dropdown that re-closes R via
    `closeUnderFrame`, so you see how the formula behaves under each modal system.
  - a "holds at N/M states" summary.
- `lib/argument-types.ts` — typed `KripkeAst`/`CtlAst`/`IntuitionisticAst`/
  `EpistemicAst`/`TemporalAst` added to the `Formalization` union.
- `lib/argument-dsl.ts` — five formula serializers (`renderUnicode` /
  `renderUnicodeCtl/E/T`); round-trip through `parseModal`/`parseCtl`/etc.
- `components/ArgumentCard.tsx` — modal cases in `FormalizationVisual`; added to
  `VISUAL_ONLY_FORMALISMS`.
- The five labs (`KripkeLab`, `TemporalCtlLab`, `IntuitionisticLab`,
  `EpistemicLab`, `TemporalLtlLab`) accept `initialDsl` for the `?dsl=` prefill.
- Tests: `argument-dsl.test.ts` +5 round-trip cases (and the dispatch test's
  "returns null" example moved off `kripke`, now wired, onto `resolution`).
  `.playwright-flows/arguments/viz-modal.ts` browser walkthrough.

## Why

The whole point is seeing real arguments under a logic and reasoning about them.
The sea-battle (kripke) now shows the branching model with the formula's truth
per world and a frame-class toggle; Hobbes's WARRE (temporal) shows the LTL trace;
Descartes's cogito (epistemic) shows the agent's accessibility model. The
user asked for a model-switcher dropdown and frame-class exploration — both
delivered, on top of the faithful stored-model render. Confirmed scope/UX with
the user before building. Closes #NNN.

## Notes for future work

- **The model is in the extraction.** The user had expected to specify models
  later; they're already hand-authored per argument. Future work could let
  `claim_extractor` emit alternative models, or let users author one in-app.
- **Frame-class closure is kripke-only.** ctl (branching) and temporal (linear)
  have no K/T/S4/S5; epistemic's "systems" are agent-relation properties (S5 for
  knowledge). For those the exploration is the model switcher. `KINDS[f].frames`
  gates the frame dropdown — flip it on if a meaningful closure is added.
- **`ModalArgumentViz` casts at the dispatch boundary** (`as never` on the
  eval/view calls). The public boundary is typed via the `Formalization` union;
  the casts are confined to the per-formalism config where formalism↔model
  pairing is guaranteed. Verified end-to-end in a real browser.
- All formalisms in the corpus are now covered. eg/frege/medieval/avicennan/
  catuskoti/saptabhangi/mohist/resolution/deontic have renderers but don't appear
  in any formalization yet — wire them the same way (config entry + union member +
  serializer + lab `initialDsl`) if/when extractions use them.
