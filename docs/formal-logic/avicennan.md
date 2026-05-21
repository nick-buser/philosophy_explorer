# Avicennan Logic — System Design

**Status:** Phase 1 implemented on `feat/logic-lab-avicennan` (ticket
`.tickets/feat-logic-lab-avicennan.md`). Phase 2 scope below remains
open.
**Builds on:** the candidate survey
[`world-logic-traditions.md`](./world-logic-traditions.md)
§"Arabic / Avicennan logic", and the categorical-logic precedent of
[`aristotelian-syllogistic.md`](./aristotelian-syllogistic.md) and
[`medieval-syllogistic.md`](./medieval-syllogistic.md).

---

## Purpose

Avicenna (Ibn Sīnā, 980–1037), in the *Qiyās* of the *Kitāb
al-Shifāʾ*, rebuilt Aristotle's categorical syllogistic into a
**modal-temporal** system. An Avicennan categorical proposition is not
just "every A is B" — it carries an alethic modality (necessary,
possible, …) *and* a temporal qualification (always, sometimes, while
the subject is the subject). The valid moods of the resulting
syllogistic differ from the assertoric ones.

It earns a Lab slot because:

- **It is the highest-rigor non-Western option after Navya-Nyāya**
  and — unusually for a historical system — it is *actively* being
  formalized. Hodges, Street, and Chatti have published modern formal
  semantics for it, so the Lab implements a reconstruction with
  scholarly authority behind it rather than improvising.
- **It extends the Lab's categorical surface without refactoring it.**
  `aristotelian` already ships term logic, the mood-figure table, and
  the square of opposition. Avicennan logic reuses that shape and adds
  the modality layer — a clean "deepen an existing family" move.
- **It is a genuinely original modal system**, not Aristotle in
  Arabic translation: the temporal dimension and the hypothetical
  syllogistic have no Aristotelian counterpart.

It sits outside the survey's two focus regions (South / East Asia);
`world-logic-traditions.md` includes it "so the survey is honest
about where the rigor actually is."

---

## Out of scope (phase 1)

- **No hypothetical / conditional syllogistic.** Avicenna's *qiyās
  sharṭī* — the logic of connective ("if … then") and disjunctive
  ("either … or") propositions — is a major, distinct sub-system. It
  is phase 2.
- **No semantic model checker.** Phase 1 decides validity by table
  lookup against the Hodges/Street reconstruction. A countermodel
  search over a domain of individuals × times is phase 2.
- **No two-dimensional modality.** Hodges reads each proposition with
  a *subject-side* and a *copula-side* temporal-modal parameter. Phase
  1 ships a single enumerated modality token; the two-dimensional
  refinement is phase 2.
- **No Lean integration, no compare view, no `LogicIR` migration** —
  same calls as the other world-logic systems.

---

## What ships in phase 1

A new system at `/logic/avicennan` with the shared Lab surface:

1. **DSL editor** — `LogicCmEditor` host with Avicennan commands.
2. **Parser** — a modalized categorical proposition, and a
   `syllogism … end` block of three; figure detected from term
   arrangement as in `aristotelian-parser.ts`.
3. **Validity engine** — `checkSyllogism` against the Avicennan
   valid-mood table; reports validity *and* the modality the
   conclusion inherits.
4. **Mood table** — `AvicennanMoodTable`, the primary view: the
   modalized moods with the active one highlighted.
5. **Modal square of opposition** — reuses `AristotelianSquare.tsx`;
   shows the oppositional relations among the modalized propositions.
6. **Primitives panel** — quantity, quality, the four modalities,
   figure.
7. **6–8 seed examples** — see §"Seed examples".

`thinkerSlug` points at Avicenna if seeded, else `null` (deep link
deferred, as for the other world-logic systems).

---

## DSL grammar (phase 1)

Two surfaces: a single modalized **proposition**, and a **syllogism**
block of three.

```
proposition := quantity quality modality term "is" term
quantity    := "every" | "some"
quality     := (affirmative implied) | "no" | "not"
modality    := "necessary" | "perpetual" | "absolute" | "possible"
syllogism   := "syllogism" prop prop prop "end"   -- major, minor, conclusion
```

```
syllogism
  necessary every animal is mortal      -- major
  absolute  every human  is animal      -- minor
  necessary every human  is mortal      -- conclusion
end
```

The four phase-1 modalities are the most-used Avicennan modalized
propositions:

| Token | Avicennan | Reading |
|---|---|---|
| `necessary` | *ḍarūrī* | necessarily B, while A exists |
| `perpetual` | *dāʾima* | always B, while A exists |
| `absolute` | *muṭlaqa ʿāmma* | B at some time, while A exists |
| `possible` | *mumkina* | possibly B (two-sided possibility) |

IAST/Arabic-transliteration aliases accepted as alternative tokens,
per the `indian-parser.ts` precedent. `--` / `#` comments skipped.

---

## Data shapes

```ts
type Quantity = 'universal' | 'particular';
type Quality  = 'affirmative' | 'negative';
type Modality = 'necessary' | 'perpetual' | 'absolute' | 'possible';

type Proposition = {
  quantity: Quantity;
  quality: Quality;
  modality: Modality;
  subject: string;
  predicate: string;
};

type Figure = 1 | 2 | 3 | 4;

type Syllogism = {
  major: Proposition;
  minor: Proposition;
  conclusion: Proposition;
  figure: Figure;          // derived from term arrangement
};

type SyllogismVerdict =
  | { kind: 'valid'; inheritedModality: Modality }
  | { kind: 'invalid'; reason: string }
  // `invalid` covers an unproductive mood OR a productive mood whose
  // stated conclusion modality is stronger than what follows.
  ;
```

The valid-mood table is the system's structural constant — analogous
to `aristotelian`'s mood-figure data and `indian-buddhist`'s
`HETU_CAKRA`. `avicennan-validity.test.ts` cross-checks it against the
Street reconstruction (a fixed list of (figure, premise-modalities,
premise-quantities) → verdict rows).

---

## File layout

New files in `packages/web/src/logic/` (prefix `avicennan`, mirroring
the `aristotelian-*` set):

| File | Purpose |
|---|---|
| `avicennan-types.ts` | `Proposition`, `Syllogism`, `Modality`, verdict ADT. |
| `avicennan-parser.ts` | Modalized-proposition + `syllogism` block parser; figure detection. |
| `avicennan-validity.ts` | The valid-mood table + `checkSyllogism`. Sibling of `aristotelian-validity.ts`. |
| `avicennan-render.ts` | `Proposition` → display string. |
| `avicennan-commands.ts` | Slash commands: quantities, modalities, `syllogism` skeleton. |
| `AvicennanEditor.tsx` | `LogicCmEditor` wrapper. |
| `AvicennanMoodTable.tsx` | The modalized-mood table, active mood highlighted. |
| `labs/AvicennanLab.tsx` | Lab page. |
| `__tests__/avicennan-parser.test.ts` | Modalities, figures, block parsing, errors. |
| `__tests__/avicennan-validity.test.ts` | Mood table vs the Street reconstruction. |
| `__tests__/avicennan-system-data.test.ts` | Registered; every example parses to its claimed verdict. |

The modal square of opposition **reuses `AristotelianSquare.tsx`**
rather than introducing a new component — the oppositional layout is
the same; only the proposition labels carry modality. Route: an
`avicennan` branch in `routes/logic.$system.lazy.tsx`. Data: an
`avicennan` entry in `LOGIC_SYSTEMS` (`logic-systems.ts`), with an
optional `syllogism?` field on `LogicExample`, additive like Kripke's
`model?`.

---

## Seed examples

Six to eight:

- `necessary-barbara` — an Avicennan-valid modal mood (necessary major,
  absolute minor → necessary conclusion).
- `modal-fallacy` — a mood valid *assertorically* (a plain Aristotelian
  Barbara) but **invalid** under Avicennan modality: the pedagogical
  payoff is showing the verdict diverge from `aristotelian`.
- `weaker-conclusion` — a productive mood where the stated conclusion
  is too strong (claims `necessary` where only `absolute` follows) →
  `invalid` with that reason.
- One single proposition per modality (`necessary` / `perpetual` /
  `absolute` / `possible`) for the modal square.

Honest framing in the Lab history: phase 1 implements the
single-token modality reading; the two-dimensional Hodges analysis
and the hypothetical syllogistic are named as deferred.

---

## Implementation order

1. Types + parser. `avicennan-types.ts`, `avicennan-parser.ts`,
   figure detection, parser tests.
2. Validity. `avicennan-validity.ts` — the mood table, then
   `checkSyllogism`; validity tests against the reconstruction.
3. Render. `avicennan-render.ts`.
4. Seed examples (data only) — inert, not yet routed.
5. Mood-table component. `AvicennanMoodTable.tsx`.
6. Modal square — wire `AristotelianSquare.tsx` with modalized labels.
7. Editor + commands.
8. Page wiring — `logic.$system.lazy.tsx`; verdict badge with the
   inherited modality.
9. Polish + work-history doc.

---

## Phase 2+ scope

In rough priority order:

1. **Hypothetical / conditional syllogistic** (*qiyās sharṭī*) —
   connective (*muttaṣil*) and disjunctive (*munfaṣil*) propositions
   and their moods. A substantial sub-system; the headline phase-2
   feature, and the part with no Aristotelian counterpart.
2. **Semantic model checker.** A domain of individuals existing
   across times; modalized propositions get truth conditions
   quantifying over individuals and times (the Hodges semantics).
   This makes the validity verdict *derived* rather than table-looked-
   up and yields countermodels for invalid moods — the same honesty
   move Kripke's phase 2 made for the truth badge.
3. **Two-dimensional modality.** The subject-side / copula-side
   temporal-modal parameters; the full ~13-proposition Avicennan
   inventory.
4. **Compare view** with `aristotelian` — the same mood judged
   assertorically and modally, side by side. A pollinator ticket; the
   `modal-fallacy` seed example is its natural anchor.
5. **Lean integration**, once any system gets Lean.

---

## Open questions

### 1. Mood table vs derived semantics

Phase 1 looks validity up in a table transcribed from the
Hodges/Street reconstruction. This is fast and citable but inert — it
cannot explain *why* a mood fails or produce a countermodel. Phase 2's
model checker fixes that. The phase-1 table is therefore deliberate
debt, exactly parallel to Kripke phase 1's hand-authored truth badge;
the forcing function to build the semantics is the first time the Lab
needs an Avicennan countermodel. Cross-check the table against the
published reconstruction in `avicennan-validity.test.ts` so drift is
caught.

### 2. Relationship to `aristotelian` — reuse vs separate

Avicennan logic shares the categorical shape with `aristotelian` and
reuses `AristotelianSquare.tsx`. It is nonetheless a **separate
system slug**, not a mode of `aristotelian` — same call the roadmap
makes for Stoic vs Aristotelian, and the work-history makes for
Navya-Nyāya vs `indian-buddhist`. The modality layer, the distinct
mood table, and the temporal dimension are too large to bolt onto the
assertoric system. A compare view (phase 2) is the right way to wire
the two together.

### 3. AST authority — TS-only

Same call as the other world-logic systems and Kripke phases 1–2 (see
[`kripke-modal-logic.md`](./kripke-modal-logic.md) §"Open questions"
1b). Parser, validity engine, renderers are TS-only and browser-side;
no forcing function has fired. The phase-2 model checker would be the
point to re-evaluate, especially if Lean integration arrives.

---

## Relationship to existing docs

- [`world-logic-traditions.md`](./world-logic-traditions.md)
  §"Arabic / Avicennan logic" — the scoping survey this doc expands.
- [`aristotelian-syllogistic.md`](./aristotelian-syllogistic.md) /
  [`medieval-syllogistic.md`](./medieval-syllogistic.md) — the
  categorical-logic precedent; source of the `AristotelianSquare`
  component the modal square reuses.
- [`lab-roadmap.md`](./lab-roadmap.md) §"system × visualization
  matrix" — the Linear symbolic / tabular rows gain Avicennan modal
  moods when this ships.
- [`kripke-modal-logic.md`](./kripke-modal-logic.md) — the Lab's other
  modal infrastructure; Avicennan modality is temporal-alethic over a
  domain × time model, *not* Kripke worlds, so the two do not share an
  engine — but the phase-2 semantics question rhymes with Kripke's.
