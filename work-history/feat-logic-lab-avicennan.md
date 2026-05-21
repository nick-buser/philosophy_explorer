# feat — Logic Lab: Avicennan Modal Syllogistic (Ibn Sīnā)

**Branch:** `feat/logic-lab-avicennan`
**Merged:** TBD

Implements `.tickets/feat-logic-lab-avicennan.md` against the design
doc `docs/formal-logic/avicennan.md`. The first of the four
world-logic systems ticketed on 2026-05-20 to land after the survey
in `docs/formal-logic/world-logic-traditions.md`.

## What changed

- New Logic Lab system at `/logic/avicennan`. Extends the Lab's
  categorical surface (`aristotelian`) with a modality layer rather
  than refactoring it — a separate system slug, per design-doc open
  question #2.
- Types `avicennan-types.ts` — `Modality` (necessary / perpetual /
  absolute / possible), `Proposition` (quantity × quality × modality
  + two terms), `Syllogism` (major / minor / conclusion + derived
  middle + figure), the `SyllogismVerdict` ADT, and `letterOf` which
  projects a proposition onto its A/E/I/O letter (the bridge to the
  reused square).
- Parser `avicennan-parser.ts` — two surfaces through one entry point:
  a single modalized proposition (`necessary every animal is mortal`)
  and a `syllogism … end` block of three. Modality transliteration
  aliases accepted (`daruri`, `daima`, `mutlaqa`, `mumkina`), per the
  `indian-parser.ts` precedent. `--` and `#` line comments stripped.
  In the block, major/minor/conclusion are fixed by position; the
  middle term and figure are derived from term arrangement, mirroring
  `aristotelian-parser.ts`.
- Validity `avicennan-validity.ts` — `checkSyllogism` decides in two
  layers: (1) the assertoric skeleton (the A/E/I/O letters) must be a
  valid Aristotelian mood for the figure under the traditional
  existential-import reading; (2) the modality the conclusion
  inherits. Figure 1: the conclusion follows the **major** premise
  (Avicenna's de re result, against Theophrastus). Figures 2-4: only
  uniform-modality moods are decided; mixed-modality moods outside
  figure 1 are deferred to phase 2. The modality strength chain is
  necessary > perpetual > absolute; `possible` (two-sided) is
  incomparable to the other three.
- Render `avicennan-render.ts` — `MODALITY_INFO` (Arabic name +
  temporal-alethic gloss per modality), `formatProposition` (canonical
  round-trippable form), `glossProposition`, `formatSyllogism`.
- UI:
  - `AvicennanMoodTable.tsx` — the primary view. A figure-1
    modality-inheritance grid (major modality → conclusion modality)
    plus the valid assertoric skeletons grouped by figure, with the
    active syllogism's mood-figure cell highlighted.
  - The modal square **reuses `AristotelianSquare.tsx` unchanged** —
    `focused` is the parsed proposition's A/E/I/O letter, import fixed
    to `traditional` (Avicenna predates the Boolean reading).
  - `AvicennanEditor.tsx` wraps `LogicCmEditor`; `avicennan-commands.ts`
    supplies slash commands for the four modalities, the syllogism
    skeleton, and the seed examples.
  - `labs/AvicennanLab.tsx` — header / history / primitives /
    further-reading in the shared shape; editor + rendering panel with
    a verdict badge (`valid · inherits necessary` /
    `invalid · Fig N`); mood table and modal square below.
- Seed entry in `data/logic-systems.ts` — 7 examples:
  `necessary-barbara` (the contested LXL syllogism), `modal-fallacy`
  (assertorically valid Barbara, modally invalid), `weaker-conclusion`
  (an absolute major caps the conclusion at absolute), and one single
  proposition per modality for the modal square (each also focusing a
  different square corner).
- Route wiring in `routes/logic.$system.lazy.tsx` — `avicennan` slug
  routes to a lazy-loaded `AvicennanLab` chunk (~17 kB / 5.4 kB gz).
- Tests: `avicennan-parser.test.ts` (18), `avicennan-validity.test.ts`
  (18, including a hand-transcribed reconstruction cross-check),
  `avicennan-system-data.test.ts` (6).

## Why

Avicennan logic is the highest-rigor non-Western option after
Navya-Nyāya and — unusually for a historical system — is actively
being formalized today (Hodges, Street, Chatti), so the Lab leans on a
modern scholarly reconstruction rather than improvising. It deepens an
existing family: the categorical term-logic shape is shared with
`aristotelian`, while the modality layer and the distinct mood table
are genuinely new. See `docs/formal-logic/avicennan.md` for the full
rationale. No GitHub Issue was opened.

## Notes for future work

- **The mood table is deliberate phase-1 debt.** Validity is decided
  by rule rather than a derived semantics: figure 1 → conclusion
  follows the major; figures 2-4 → uniform modality only. This is the
  same conservative cut `medieval-validity.ts` made for mixed-mode
  figures 2-4, and the same "deliberate debt" the design doc's open
  question #1 names. The forcing function to build the real semantics
  is the first time the Lab needs an Avicennan countermodel.
- **Deviation from the design doc:** the doc proposed an optional
  `syllogism?` field on `LogicExample` (additive like Kripke's
  `model?`). It was *not* added — unlike a Kripke model, an Avicennan
  syllogism is fully derivable by parsing `ex.dsl`, so the field would
  be redundant. `avicennan-system-data.test.ts` keys expected verdicts
  by example slug in the test file instead, following the
  `indian-system-data.test.ts` precedent. `LogicExample` is untouched.
- **The figure-1 "follows the major" rule covers `possible`.** A
  figure-1 syllogism with a possible major yields a possible
  conclusion; with a necessary major it yields necessary even if the
  minor is possible. That last case is Avicenna's ampliated de re
  reading and is the contestable edge of the table — it is the part
  the two-dimensional (subject-side / copula-side) modality of phase 2
  is meant to make precise. The phase-1 single-token rule is faithful
  to Avicenna's *stated* mood verdicts; it is the *semantics* behind
  them that is deferred.
- **The modal square does not reflect modality.** `AristotelianSquare`
  shows the categorical A/E/I/O opposition only; the modality lives in
  the mood table and the verdict badge. A modality-aware square (the
  oppositions among modalized propositions genuinely differ — e.g.
  necessary-A and possible-O are not simple contradictories) would be
  a phase-2 component, not a reuse.
- **Phase 2 scope**, per the design doc: the hypothetical /
  conditional syllogistic (*qiyās sharṭī*), the semantic model checker
  over individuals × times, the two-dimensional modality, and a
  compare view against `aristotelian` anchored on the `modal-fallacy`
  example.
- Verified via `tsc --noEmit`, the full web test suite (1101 passing),
  and a production build. Not exercised interactively in a browser.
