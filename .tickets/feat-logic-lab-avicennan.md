# feat: Logic Lab Avicennan logic — modal-temporal syllogistic, mood-validity engine, modal square

**Branch slug:** `feat/logic-lab-avicennan`
**Status:** queued
**Size:** M–L
**Depends on:** `none` (reuses the shipped `aristotelian` system's
validity-module and square-of-opposition patterns)

## Why

Avicenna (Ibn Sīnā, 980–1037) rebuilt Aristotle's syllogistic into a
**modal-temporal** system: every categorical proposition carries an
alethic modality *and* a temporal qualification, and the valid moods
differ from the assertoric ones. `world-logic-traditions.md`
§"Arabic / Avicennan logic" rates it the highest-rigor non-Western
option after Navya-Nyāya — and, unusually, it is *actively* being
formalized today (Hodges, Street, Chatti), so the Lab can lean on a
modern formal reconstruction rather than improvise one. It pairs with
the Lab's existing categorical-logic surface (`aristotelian`) without
being a refactor of it: the term-logic shape is shared, the modality
layer and the mood table are genuinely new.

## Scope

**In:**

- New Logic Lab system at `/logic/avicennan`.
- DSL: a modalized categorical proposition (quantity · quality ·
  modality · two terms) and a `syllogism … end` block of three such
  propositions; figure detected from term arrangement, as in
  `aristotelian-parser.ts`.
- Phase-1 modality set — a small enumerated token (`necessary`,
  `perpetual`, `absolute`, `possible`) — the most-used Avicennan
  modalized propositions. The two-dimensional subject-side/copula
  refinement (Hodges) is phase 2.
- Engine: `checkSyllogism` against the Avicennan valid-mood table
  (the Hodges/Street reconstruction) — verdict plus the modality the
  conclusion actually inherits. Structural lookup, not search.
- Renderers: a modalized **mood table** (the primary view) and a
  **modal square of opposition** reusing `AristotelianSquare.tsx`.
- 6–8 seed examples: an Avicennan-valid modal mood, a mood valid
  assertorically but invalid modally, a single proposition per
  modality for the square.

**Out (captured separately):**

- The hypothetical / conditional syllogistic (*qiyās sharṭī* —
  connective and disjunctive propositions) — phase 2 of
  `docs/formal-logic/avicennan.md`.
- The semantic model checker over individuals × times (countermodel
  search) — phase 2; phase 1 is mood-table lookup.
- Lean integration; compare view with `aristotelian` — cross-cutting
  / pollinator.

## Build sketch

- `avicennan-types.ts` — `Modality`, `Proposition` (quantity, quality,
  modality, subject, predicate), `Syllogism` (major, minor,
  conclusion, figure), verdict ADT.
- `avicennan-parser.ts` — modalized-proposition parser + `syllogism`
  block; figure detection mirrors `aristotelian-parser.ts`.
- `avicennan-validity.ts` — the Avicennan valid-mood table +
  `checkSyllogism`; sibling of `aristotelian-validity.ts`.
- `avicennan-render.ts` — proposition → display string.
- `AvicennanMoodTable.tsx`; modal square via `AristotelianSquare.tsx`;
  `AvicennanEditor.tsx`; `avicennan-commands.ts`;
  `labs/AvicennanLab.tsx`; route + `logic-systems.ts` entry.
- Tests: `avicennan-parser.test.ts`, `avicennan-validity.test.ts`
  (mood table cross-checked against the Street reconstruction),
  `avicennan-system-data.test.ts`.

## References

- Design doc: `docs/formal-logic/avicennan.md`.
- `docs/formal-logic/world-logic-traditions.md` §"Arabic / Avicennan
  logic".
- W. Hodges, *Mathematical Background to the Logic of Ibn Sīnā* (draft
  monograph) — the formal semantics and the modal-mood results.
- T. Street, "Arabic and Islamic Philosophy of Language and Logic"
  (SEP); Street on Avicenna's modal syllogistic.
- S. Chatti, *Arabic Logic from al-Fārābī to Averroes* (2019).
- `docs/formal-logic/aristotelian-syllogistic.md`,
  `docs/formal-logic/medieval-syllogistic.md` — the categorical-logic
  precedent this system extends.
