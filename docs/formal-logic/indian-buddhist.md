# Indian / Buddhist Logic (Nyāya · Dignāga) — System Design

**Status:** Phase-1 shipped 2026-05-04 (`feat/logic-lab-indian-buddhist`)
— see `work-history/feat-logic-lab-indian-buddhist.md`. Phase-2
extension queued: `.tickets/feat-logic-lab-indian-buddhist-hetucakra.md`.
**Related:** the Navya-Nyāya successor is a *separate* system
([`navya-nyaya.md`](./navya-nyaya.md)); the candidate landscape is in
[`world-logic-traditions.md`](./world-logic-traditions.md).

This per-system doc was written retroactively alongside the phase-2
extension — the phase-1 system shipped without one. Phase-1 detail
lives in the work-history; this doc is concise on phase 1 and carries
the design weight on the phase-2 extension.

---

## Purpose

The first non-Western system in the Logic Lab, and the one that
introduced the **step-by-step textual** visualization family. It
covers classical Indian inferential logic (*anumāna*) from Gautama's
*Nyāya-sūtra* through Dignāga's 6th-century reform: the five-membered
inference, the trairūpya validity test, and the nine-cell hetu-cakra.

---

## What shipped (phase 1)

`/logic/indian-buddhist`. Full detail in
`work-history/feat-logic-lab-indian-buddhist.md`; in brief:

- **DSL** — line-based `key: value`: required `paksha`, `sadhya`,
  `hetu`; optional `sapaksha` / `vipaksha` example lists with `+` / `−`
  hetu-presence markers. IAST aliases accepted. (`indian-parser.ts`)
- **Engine** — `classify(inference)` runs the three trairūpya checks
  (pakṣa-dharmatā, sapakṣe sattvam, vipakṣe asattvam) and places the
  hetu on the wheel. Pakṣa-dharmatā gates the verdict: on failure the
  cell is still computed but the verdict is `asiddha`.
  (`indian-engine.ts`)
- **Renderers** — `FiveStepView` (the pañcāvayava: pratijñā · hetu ·
  udāharaṇa · upanaya · nigamana) and `HetuCakra` (the 3×3 wheel,
  active cell ringed). The nine cells, statuses, and Sanskrit fallacy
  names are the `HETU_CAKRA` constant in `indian-types.ts`.
- **Verdict** — `valid · sad-hetu`, `contradictory · viruddha`,
  `inconclusive · anaikāntika`, or `asiddha`.
- 7 seed examples covering six of the nine cells plus the asiddha gate.

Two things were explicitly de-scoped at phase 1: a compare-view bridge
and Lean integration. Both still hold.

---

## The extension (phase 2)

Ticket: `feat-logic-lab-indian-buddhist-hetucakra.md`. Three additive
items that deepen *this* system — none warrants its own slug, per the
work-history and `world-logic-traditions.md`
§"Extensions to the existing `indian-buddhist` system".

### 1. Dharmakīrti's three hetu types

Dignāga's trairūpya answers *is this hetu valid?*. Dharmakīrti's
*Nyāyabindu* answers the next question — *what kind of valid hetu is
it?* — by reducing every sound reason to three structural types:

| Type | Sanskrit | The hetu is… | Example |
|---|---|---|---|
| Identity | *svabhāva-hetu* | the essential nature of the sādhya | "it is a tree, because it is an oak" |
| Effect | *kārya-hetu* | an effect of the sādhya | "there is fire, because there is smoke" |
| Non-apprehension | *anupalabdhi-hetu* | the non-perception of something, proving an absence | "there is no pot here, because none is perceived" |

This is a **classifier that runs only after** the trairūpya verdict
returns `valid` — a second column of badges beside the existing
verdict, per the work-history's "roughly a half-day add" note.

The type cannot be inferred from the example domain alone — it
depends on the *relation* between hetu and sādhya. So the DSL gains an
optional key:

```
hetu-type: svabhava | karya | anupalabdhi
```

The engine's job is **coherence validation**, not inference: e.g.
`anupalabdhi` requires the sādhya to be stated as an absence; an
`anupalabdhi` declared on a positive sādhya is flagged. When the key
is absent the panel still lists the three as informational readings —
no verdict change.

### 2. Apoha — exclusion semantics

Dignāga's *apoha-vāda* holds that a general term does not name a
positive universal but *excludes its complement*: "cow" means
"not-non-cow". It is a **semantics for the property terms**, not part
of the inference engine — the work-history is explicit that the right
home is "a side panel that comments on what `sādhya` means rather than
another classifier."

Phase 2 ships exactly that: a static side panel that, for the parsed
`sādhya`, frames its content as *anyāpoha* (exclusion of the other) —
optionally drawing the double-negation structure ("fiery" = excluded
from non-fiery). No engine logic; no DSL change.

### 3. Nyāyapraveśa fault taxonomy

The phase-1 verdict names fallacies coarsely — `anaikāntika`,
`viruddha`, `asiddha` — drawn from the wheel cells. Śaṅkarasvāmin's
*Nyāyapraveśa* enumerates **33 named faults** (*ābhāsa*), and Kuiji's
commentary made that scheme the backbone of East Asian *yīnmíng*:

- 9 faults of the thesis — *pakṣābhāsa*
- 14 faults of the reason — *hetvābhāsa*
- 10 faults of the example — *dṛṣṭāntābhāsa*

Phase 2 adds a `NYAYA_FAULTS` data table (Sanskrit name + gloss) and
maps each engine outcome onto its precise *hetvābhāsa* — e.g. the
phase-1 `asiddha` verdict resolves to the specific *asiddha*
subvariety, `viruddha` to the named contradiction fault. This is a
**content extension to the existing taxonomy**, not new engine logic;
the survey rates it lower priority than items 1–2, so it ships last
within the ticket and can be dropped if the ticket runs long.

---

## DSL change summary

One additive, optional key — the phase-1 DSL is otherwise unchanged:

```
paksha:    the mountain
sadhya:    fiery
hetu:      smoky
hetu-type: karya          -- NEW (phase 2), optional
sapaksha:  kitchen, hearth
vipaksha:  lake
```

Back-compatible: every phase-1 example parses unchanged with
`hetu-type` defaulting to `undeclared`.

---

## Out of scope

- **Navya-Nyāya.** Gaṅgeśa's formalism is a separate system —
  [`navya-nyaya.md`](./navya-nyaya.md). Do not fold it here.
- **Yīnmíng / inmyō beyond the 33-fault scheme.** The East Asian
  transmission of Dignāga is not a separate invention; the only
  additive material is the commentarial fault layer (item 3).
  `world-logic-traditions.md` §"Yīnmíng / inmyō" keeps the rest out.
- **Lean integration / compare view.** Unchanged from phase 1.

---

## Open questions

### 1. Hetu-type inference vs declaration

Phase 2 makes `hetu-type` a *declared* key validated for coherence.
A more ambitious engine could infer the type from the hetu/sādhya
relation — but that needs a model of the entities richer than the
flat example-membership domain the system has. Declaration is the
honest phase-2 scope; inference is a phase-3 question and depends on
whether the system ever gains a typed entity model (cf. the
Navya-Nyāya relational model).

### 2. Apoha as a foil to Frege's sense/reference

The apoha panel is presentational in phase 2, but apoha is a genuine
rival semantics for general terms and pairs sharply with the Lab's
Fregean material. If a compare/essay layer ever lands, apoha-vs-sense
is a strong pedagogical pairing — note it, don't build it.

### 3. Cross-link to Navya-Nyāya

When `navya-nyaya` ships, this system's history section should gain a
one-line forward pointer — the Navya-Nyāya `vyāpti` calculus is the
formal descendant of the wheel-classified hetu. Symmetric to the
back-pointer carried in [`navya-nyaya.md`](./navya-nyaya.md) §"Open
questions".

---

## Relationship to existing docs

- `work-history/feat-logic-lab-indian-buddhist.md` — authoritative for
  phase-1 detail and the deferral notes this extension executes.
- [`world-logic-traditions.md`](./world-logic-traditions.md)
  §"Extensions to the existing `indian-buddhist` system" — the
  scoping rationale for keeping these three items inside this system.
- [`navya-nyaya.md`](./navya-nyaya.md) — the separate successor system.
- [`lab-roadmap.md`](./lab-roadmap.md) §"Indian / Buddhist logic" —
  notes Dharmakīrti's hetu types as open; update its status line when
  this ships.
