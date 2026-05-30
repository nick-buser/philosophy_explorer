# feat: Logic Lab Catuṣkoṭi — Nāgārjuna's tetralemma, four-corner evaluator and diagram

**Branch slug:** `feat/logic-lab-catuskoti`
**Status:** in-progress
**Size:** S
**Depends on:** none

## Why

Catuṣkoṭi — the "four corners" — is the tetralemma of Indian, and
especially Madhyamaka Buddhist, logic: for a proposition *A* the four
*koṭis* are *A*, ¬*A*, *A* ∧ ¬*A*, and ¬(*A* ∨ ¬*A*). Nāgārjuna uses
the schema in two opposite ways — to *affirm* a corner (the positive,
Abhidharma-style classificatory use) and, in the *prasaṅga* mode, to
*reject all four* (the famous treatment of the *avyākṛta*, the
unanswered questions, e.g. whether the Tathāgata exists after death).

`world-logic-traditions.md` §2 picks it as the smallest world-logic
candidate and the sharpest classical/non-classical contrast: a
genuinely non-classical structure with a tiny, exact state space —
four corners, each affirmable or deniable. It formalizes cleanly as a
four-valued, paraconsistent scheme (the four FDE values — true only,
false only, both, neither — the four subsets of {true, false}), and it
is a **diagrammatic foil to the square of opposition**: the Lab
already renders that for the Aristotelian system, so a four-corner
diagram joins an existing visualization family.

## Scope

**In:**

- New Logic Lab system at `/logic/catuskoti`.
- The four *koṭis* as a closed structure: each is one subset of
  {true, false} — `{true}`, `{false}`, `{true,false}`, `{}` — with
  Sanskrit name, modern formula, and gloss.
- DSL: a `proposition`, a `koti` (which corner), and an optional
  `reading` (`affirming` | `prasanga`). Aliases accepted.
- Engine: `evaluateCatuskoti` — a small fixed four-valued (FDE)
  evaluator. The proposition occupies a koṭi (its FDE value); the
  engine computes the FDE value of each of the four corner-formulas
  under that valuation, and the reading-dependent verdict (a corner
  *affirmed*, or all four *rejected*). Total, structural — no proof
  search.
- Renderer: a **four-corner diagram** — the proposition at the
  centre, the four koṭis at the corners, the selected koṭi
  highlighted, each corner carrying its corner-formula's evaluated
  value. A second view of the closed four-koṭi structure.
- A **reading toggle** (`affirming` / `prasaṅga`) in the Lab surface,
  in the `ImportToggle` idiom, rewriting the DSL `reading:` line.
- 6–8 seed examples — both readings, all four koṭis reached.

**Out (captured separately):**

- Compound-statement evaluation — building catuṣkoṭi statements out
  of connectives over the four values is a phase-2 item and the
  natural home of a shared *n*-valued substrate (see
  `docs/formal-logic/catuskoti.md` §"Phase 2+").
- Priest's five-valued extension (the added *ineffable* value) —
  flagged in the design doc, not built.
- Lean integration; compare view (the obvious pairing is
  catuṣkoṭi ↔ the Aristotelian square) — cross-cutting / pollinator.

## Build sketch

- `catuskoti-types.ts` — `TruthValue` (`true | false`), the
  `FOUR_KOTIS` constant (subset of {true,false} + Sanskrit + formula
  + gloss), `Proposition`, `Reading`.
- `catuskoti-parser.ts` — line-based `key: value`, koṭi/reading
  aliases, in the `saptabhangi-parser.ts` idiom.
- `catuskoti-engine.ts` — FDE connectives (¬, ∧, ∨) and
  `evaluateCatuskoti`: value the four corner-formulas, read off the
  verdict from the reading.
- `CatuskotiDiagram.tsx` (four-corner SVG); `CatuskotiEditor.tsx`;
  `catuskoti-commands.ts`; `labs/CatuskotiLab.tsx`; route +
  `logic-systems.ts` entry.
- Tests: `catuskoti-parser.test.ts`, `catuskoti-engine.test.ts` (the
  four-koṭi structure invariant; the FDE truth tables; all four
  koṭis reachable), `catuskoti-system-data.test.ts`.

## References

- Design doc: `docs/formal-logic/catuskoti.md`.
- `docs/formal-logic/world-logic-traditions.md` §2.
- `docs/formal-logic/aristotelian-syllogistic.md` — the
  square-of-opposition visualization family this foils.
- G. Priest & J. Garfield, "Nāgārjuna and the Limits of Thought"
  (in Priest, *Beyond the Limits of Thought*, 2002).
- G. Priest, "The Logic of the Catuṣkoṭi" (*Comparative Philosophy*,
  2010) — the five-valued extension, flagged for phase 2.
- J. Westerhoff, *Nāgārjuna's Madhyamaka* (OUP, 2009), ch. 4.
