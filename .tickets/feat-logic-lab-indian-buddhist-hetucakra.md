# feat: Logic Lab indian-buddhist deepening — Dharmakīrti hetu types, apoha panel, Nyāyapraveśa fault taxonomy

**Branch slug:** `feat/logic-lab-indian-buddhist-hetucakra`
**Status:** queued
**Size:** S–M
**Depends on:** `none` (extends the shipped `indian-buddhist` system)

## Why

The `indian-buddhist` system shipped Dignāga's core: the Nyāya
five-step, trairūpya, and the nine-cell hetu-cakra. Its own
work-history (`feat-logic-lab-indian-buddhist.md` §"Notes for future
work") flags three additive items that deepen the *existing* system
rather than warranting a new slug — and `world-logic-traditions.md`
§"Extensions to the existing `indian-buddhist` system" confirms they
should **not** get their own system tickets. This ticket bundles them:

1. **Dharmakīrti's three valid hetu types** — *svabhāva* (identity),
   *kārya* (effect), *anupalabdhi* (non-apprehension). A structural
   refinement that runs *after* a valid trairūpya verdict.
2. **Apoha** — Dignāga's exclusion semantics for the *sādhya* term;
   a descriptive side panel, not a classifier.
3. **Nyāyapraveśa fault taxonomy** — Śaṅkarasvāmin's 33-fault scheme
   (as systematized by Kuiji), which names the *hetu-cakra* verdicts
   precisely instead of the Lab's current coarse labels.

These are the genuine non-Western depth available here without a new
system; the survey ranks the seam-deepening over the thin East Asian
candidates.

## Scope

**In:**

- DSL: optional `hetu-type: svabhava | karya | anupalabdhi` key in
  `indian-parser.ts`. When present, the engine validates *coherence*
  (e.g. `anupalabdhi` requires the sādhya to be an absence); when
  absent, the panel still offers the three as informational readings.
- Engine: `classifyHetuType` in `indian-engine.ts` — runs only after
  a `valid` trairūpya verdict; returns the declared/coherent type or
  `undeclared`. A second column of verdict badges, per the work-history.
- Fault taxonomy: a `NYAYA_FAULTS` data table (33 entries — 9 pakṣa-
  ābhāsa, 14 hetv-ābhāsa, 10 dṛṣṭānt-ābhāsa) with Sanskrit name +
  gloss. The verdict panel maps each engine outcome (asiddha,
  anaikāntika varieties, viruddha) onto its named *hetvābhāsa*.
- Apoha side panel: for the parsed `sādhya`, a static panel framing
  its meaning as *anyāpoha* — exclusion of the counter-class. No
  engine logic.
- 2–3 new seed examples: one per Dharmakīrti hetu type (the existing
  `smoke-on-the-mountain` is already a `kārya` reason — reuse it).

**Out (captured separately):**

- Navya-Nyāya formalism — separate system,
  `feat-logic-lab-navya-nyaya.md`.
- Yīnmíng / inmyō (因明) East Asian commentarial layer beyond the
  33-fault scheme — `world-logic-traditions.md` §"Yīnmíng / inmyō"
  keeps this low-priority and out of scope.
- Lean integration — cross-cutting, per `formal-verification.md`.

## Build sketch

- `indian-types.ts` — add `HetuType` (`svabhava | karya |
  anupalabdhi`) and a `NyayaFault` record type; add `NYAYA_FAULTS`.
- `indian-parser.ts` — accept the optional `hetu-type:` key + IAST
  aliases; default `undeclared`.
- `indian-engine.ts` — `classifyHetuType`; extend the verdict to
  carry the named `hetvābhāsa` from `NYAYA_FAULTS`.
- `IndianBuddhistLab.tsx` — second badge column for the hetu type;
  the named fault beside the existing verdict; an apoha side panel.
- Seed: 2–3 examples in `data/logic-systems.ts`; extend the history
  section to mention Dharmakīrti, apoha, and the Nyāyapraveśa.
- Tests: extend `indian-engine.test.ts` (hetu-type coherence, fault
  naming) and `indian-system-data.test.ts`.

## References

- Design doc: `docs/formal-logic/indian-buddhist.md` (this ticket's
  companion — phase 1 recap + this extension as phase 2).
- `work-history/feat-logic-lab-indian-buddhist.md` §"Notes for future
  work" — the Dharmakīrti / apoha deferral notes.
- `docs/formal-logic/world-logic-traditions.md` §"Extensions to the
  existing `indian-buddhist` system", §"Yīnmíng / inmyō".
- Dharmakīrti, *Nyāyabindu* — the three-hetu doctrine.
- Śaṅkarasvāmin, *Nyāyapraveśa* — the 33-fault enumeration; Tucci's
  1930 translation. Kuiji's commentary for the East Asian
  systematization.
- D. Tillemans, work on Dharmakīrti; M. Siderits on apoha.
