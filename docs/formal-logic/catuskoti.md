# Catuṣkoṭi — System Design

**Status:** Phase 1 implemented on `feat/logic-lab-catuskoti` (ticket
`.tickets/feat-logic-lab-catuskoti.md`). Phase 2 scope below remains
open.
**Builds on:** the candidate survey
[`world-logic-traditions.md`](./world-logic-traditions.md) §2 and the
square-of-opposition visualization family of
[`aristotelian-syllogistic.md`](./aristotelian-syllogistic.md). Design
context: [`logic-explorer-tab.md`](./logic-explorer-tab.md),
[`notation-systems.md`](./notation-systems.md).

---

## Purpose

The *catuṣkoṭi* — "four corners" — is the tetralemma of Indian logic,
given its sharpest use in Nāgārjuna's Madhyamaka. For a proposition
*A*, the four *koṭis* are:

- *A* — it is
- ¬*A* — it is not
- *A* ∧ ¬*A* — it both is and is not
- ¬(*A* ∨ ¬*A*) — it neither is nor is not

The schema is used in two *opposite* ways, and a Lab system has to
hold both:

- **Affirming** (positive catuṣkoṭi). One corner is asserted of the
  proposition — the classificatory use, as in the Buddha's teaching
  of MMK 18.8 ("all is real, not real, both, neither").
- **Prasaṅga** (the Madhyamaka refutation). *All four* corners are
  denied. This is the treatment of the *avyākṛta* — the questions
  the Buddha set aside as not answerable — most famously whether the
  Tathāgata exists after death: not the first corner, nor the
  second, nor the third, nor the fourth.

It earns a Lab slot because:

- **It is a genuinely non-classical structure with a tiny, exact
  state space.** Four corners, each affirmable or deniable. It
  formalizes cleanly as a four-valued, paraconsistent scheme — the
  four values of First Degree Entailment (FDE): true only, false
  only, both, neither — which are exactly the four subsets of
  {true, false}.
- **It is a diagrammatic foil to the square of opposition.** The Lab
  already renders the Aristotelian square — four corners, classical
  relations. The catuṣkoṭi diagram is also four-cornered, but the
  corners are the *non-classical* extensions: the square's two
  classical contradictories *A* / ¬*A*, plus the *both* and *neither*
  corners that classical logic excludes. It joins an existing
  visualization family and invites a future compare-view pairing.
- **It carries the affirm/reject contrast no other Lab system has.**
  The same closed structure read two opposite ways — assert one
  corner, or reject every corner — is new.

---

## The four koṭis

The closed structure. Each koṭi is one subset of the two classical
truth values {true, false} — so the value space is exactly 2² = 4,
the four FDE values. `both` is the *glut* (true and false); `neither`
is the *gap* (neither true nor false).

| # | Sanskrit | Formula | Value ⊆ {T,F} | Reading |
|---|---|---|---|---|
| 1 | *asti* | *A* | {true} | it is |
| 2 | *nāsti* | ¬*A* | {false} | it is not |
| 3 | *asti ca nāsti ca* | *A* ∧ ¬*A* | {true, false} | it both is and is not |
| 4 | *naivāsti na nāsti* | ¬(*A* ∨ ¬*A*) | {} | it neither is nor is not |

The koṭi a proposition occupies *is* its FDE value: koṭi 1 is the
value `{true}`, koṭi 4 is the empty value `{}`. The four koṭis
partition the four-valued space — in the affirming reading exactly
one holds; in the prasaṅga reading all four are refused.

---

## The engine — a four-valued evaluator

`evaluateCatuskoti` is total and structural — no proof search. The
input fixes the proposition's FDE value *v*(*A*) to the selected
koṭi's value set. The engine then evaluates each of the four
corner-formulas under *v* using the FDE connective clauses:

```
¬X      true  ∈ v(¬X)     iff false ∈ v(X)
        false ∈ v(¬X)     iff true  ∈ v(X)
X ∧ Y   true  ∈ v(X∧Y)    iff true  ∈ v(X) and true  ∈ v(Y)
        false ∈ v(X∧Y)    iff false ∈ v(X) or  false ∈ v(Y)
X ∨ Y   true  ∈ v(X∨Y)    iff true  ∈ v(X) or  true  ∈ v(Y)
        false ∈ v(X∨Y)    iff false ∈ v(X) and false ∈ v(Y)
```

A corner-formula is **designated** (assertible) iff `true` is in its
value. The engine reports each corner-formula's value and whether it
is designated — this is the "evaluator over the four corners."

Two structural facts the evaluator surfaces, and which the Lab's
history section flags honestly rather than adjudicates:

- When the proposition is in koṭi 3 (*both*), **all four**
  corner-formulas come out designated — the glut makes every corner
  assertible at once.
- When the proposition is in koṭi 4 (*neither*), the corner-formula
  ¬(*A* ∨ ¬*A*) that *expresses* "neither" is itself **not**
  designated — the gap leaves the fourth corner unable to assert
  itself. This is the heart of the consistency dispute around the
  prasaṅga use (Priest & Garfield 2002; Priest 2010).

The **verdict** is read off the reading: `affirming` → the selected
koṭi is *affirmed*; `prasanga` → the selected koṭi, and with it all
four, is *rejected*.

---

## Out of scope (phase 1)

- **No compound-statement evaluation.** Phase 1 evaluates the four
  *fixed* corner-formulas of a single proposition. It does not parse
  or evaluate arbitrary formulas built from connectives over the
  four values — that is phase 2 and the natural home of a shared
  *n*-valued substrate (see §"Phase 2+").
- **No five-valued extension.** Priest (2010) adds a fifth,
  *ineffable* value to model the limit cases. Phase 1 commits to the
  four-valued FDE reconstruction and flags the extension, not builds
  it (see §"Open questions" 1).
- **No emptiness / two-truths apparatus.** The Madhyamaka doctrinal
  setting — *śūnyatā*, the *saṃvṛti* / *paramārtha* distinction — is
  rich philosophy; phase 1 is the *logic* of the four corners only.
- **No Lean integration, no compare view, no `LogicIR` migration** —
  same calls as the other world-logic systems.

---

## What ships in phase 1

A new system at `/logic/catuskoti` with the shared Lab surface:

1. **DSL editor** — `LogicCmEditor` host with catuṣkoṭi commands.
2. **Parser** — line-based `key: value`: `proposition`, `koti`, and
   an optional `reading`.
3. **Engine** — `evaluateCatuskoti`: FDE-value the four
   corner-formulas; the reading-dependent verdict. Total, structural.
4. **Four-corner diagram** — `CatuskotiDiagram`, the proposition at
   the centre and the four koṭis at the corners; the selected koṭi
   highlighted, each corner badged with its evaluated value; in the
   prasaṅga reading every corner struck through.
5. **Reading toggle** — `affirming` / `prasaṅga`, in the
   `ImportToggle` idiom, rewriting the DSL `reading:` line.
6. **Primitives panel** — the proposition, the four koṭis, the two
   readings.
7. **6–8 seed examples** — see §"Seed examples".

`thinkerSlug: 'nagarjuna'` if a Nāgārjuna node is seeded; otherwise
`null` with the deep link deferred — same call as saptabhaṅgī.

---

## DSL grammar (phase 1)

One authoring surface: a proposition, the koṭi under consideration,
and an optional reading.

```
catuskoti   := proposition-line koti-line reading-line?
proposition := "proposition" ":" text
koti        := "koti" ":" corner
reading     := "reading" ":" ("affirming" | "prasanga")
corner      := "affirmation" | "negation" | "both" | "neither"
```

```
proposition: the Tathāgata exists after death
koti:        affirmation
reading:     prasanga
```

`koti` aliases: `affirmation` ↔ `affirm` ↔ `is` ↔ `1`; `negation` ↔
`not` ↔ `2`; `both` ↔ `ubhaya` ↔ `3`; `neither` ↔ `anubhaya` ↔
`none` ↔ `4`. `reading` aliases: `affirming` ↔ `positive`;
`prasanga` ↔ `prasaṅga` ↔ `rejecting`. A missing `reading:` line
defaults to `affirming`. `--` / `#` comments and blank lines skipped.

---

## Data shapes

```ts
type TruthValue = 'true' | 'false';      // the two classical values

type KotiNumber = 1 | 2 | 3 | 4;

type Koti = {
  n: KotiNumber;
  values: TruthValue[];   // the subset of {true,false} — the FDE value
  sanskrit: string;
  formula: string;        // 'A', '¬A', 'A ∧ ¬A', '¬(A ∨ ¬A)'
  gloss: string;
};

// All four, koṭi 1..4. The fixed structure of the system.
const FOUR_KOTIS: Koti[];

type Reading = 'affirming' | 'prasanga';

type Proposition = {
  text: string;
  koti: KotiNumber;
  reading: Reading;
};

// evaluateCatuskoti(p): set v(A) to koṭi `p.koti`'s value set, FDE-
// value the four corner-formulas, and read the verdict off `reading`.
```

`FOUR_KOTIS` is to this system what `SEVEN_BHANGAS` is to
saptabhaṅgī: a constant encoding the closed structure, with a
geometry-invariant test (`catuskoti-engine.test.ts` asserts exactly 4
entries whose value sets are the 4 distinct subsets of a 2-set — one
empty, two singletons, one pair).

---

## File layout

New files in `packages/web/src/logic/` (prefix `catuskoti`):

| File | Purpose |
|---|---|
| `catuskoti-types.ts` | `TruthValue`, `Koti`, `FOUR_KOTIS`, `Reading`, `Proposition`. |
| `catuskoti-parser.ts` | Line-based `proposition` / `koti` / `reading` parser. |
| `catuskoti-engine.ts` | FDE connectives + `evaluateCatuskoti`. |
| `catuskoti-commands.ts` | Slash commands: the four koṭis, the readings, example skeleton. |
| `CatuskotiEditor.tsx` | `LogicCmEditor` wrapper. |
| `CatuskotiDiagram.tsx` | Four-corner SVG diagram. |
| `labs/CatuskotiLab.tsx` | Lab page, with the reading toggle. |
| `__tests__/catuskoti-parser.test.ts` | Koṭis, readings, aliases, errors. |
| `__tests__/catuskoti-engine.test.ts` | The FDE tables; the 4-koṭi invariant; all corners reachable. |
| `__tests__/catuskoti-system-data.test.ts` | Registered; every example parses to its claimed koṭi/reading. |

Route: a `catuskoti` branch in `routes/logic.$system.lazy.tsx`. Data:
a `catuskoti` entry in `LOGIC_SYSTEMS` (`logic-systems.ts`). No new
optional field on `LogicExample` is needed — the reading lives in the
example DSL.

---

## Seed examples

Six to eight, covering all four koṭis and both readings:

- Affirming, one per koṭi — a proposition asserted at each corner in
  turn (the classificatory use).
- Prasaṅga, covering the *avyākṛta*: the Tathāgata-after-death
  question refused at each of several corners — the canonical
  Madhyamaka use.

The `system-data` test maps each example slug to the koṭi and reading
it claims, and asserts the set of examples reaches all four koṭis and
both readings.

Honest framing in the Lab's history section: phase 1 commits to the
four-valued FDE reconstruction; the consistency of the prasaṅga
reading, and Priest's five-valued response, are flagged, not
adjudicated (Open questions §1).

---

## Implementation order

1. Types + `FOUR_KOTIS` constant; the geometry invariant test.
2. Parser. `catuskoti-parser.ts`, parser tests.
3. Engine. FDE connectives + `evaluateCatuskoti`, engine tests.
4. Seed examples (data only) — inert, not yet routed.
5. Diagram component. `CatuskotiDiagram.tsx`.
6. Editor + commands.
7. Page wiring — `logic.$system.lazy.tsx`; reading toggle; verdict
   badge.
8. Polish + work-history doc.

---

## Phase 2+ scope

In rough priority order:

1. **Compound-statement evaluation.** Connectives over the four
   values for arbitrary formulas — the genuine many-valued logic.
   Best built **alongside the roadmap's many-valued logic item** and
   saptabhaṅgī's phase 2 so the *n*-valued truth-table machinery is
   written once and shared.
2. **The five-valued extension** — Priest (2010) adds an *ineffable*
   value; surface it as an optional fifth corner once compound
   evaluation exists.
3. **Compare view** with the Aristotelian square — the same
   proposition's classical corners (*A* / ¬*A*) beside the
   catuṣkoṭi's full four. The pollinator ticket
   `world-logic-traditions.md` §2 anticipates.
4. **Lean integration**, once any system gets Lean.

---

## Open questions

### 1. Four-valued or five-valued?

Phase 1 commits to the **four-valued FDE** reconstruction — the four
koṭis are the four subsets of {true, false}, which is the clean,
enumerable reading and the one that renders as a four-corner diagram.
Priest (2010) argues the prasaṅga use of the catuṣkoṭi — rejecting
*all four* corners — cannot be consistently modelled in four values
and adds a fifth, *ineffable* value. Phase 1 picks the four-valued
reading because it is the one that classifies mechanically and
diagrams cleanly, and says so in the Lab history; revisit if phase
2's compound evaluator forces the question.

### 2. Is the prasaṅga reading consistent?

The engine reports — it does not adjudicate — that koṭi 4's
corner-formula ¬(*A* ∨ ¬*A*) is undesignated under the gap valuation,
and that koṭi 3 designates all four corners. Whether the prasaṅga
"reject all four" is therefore a genuine logical position or a
*pragmatic* refusal to assert is the live scholarly dispute (Priest &
Garfield 2002 read it as consistent paraconsistency; others read it
as transcending logic). Phase 1 surfaces the structural facts in the
diagram and leaves the interpretive question to the history section.

### 3. AST authority — TS-only

Same call as the other world-logic systems and Kripke phases 1–2
(see [`kripke-modal-logic.md`](./kripke-modal-logic.md) §"Open
questions" 1b). Parser, engine, renderer are TS-only and browser-
side; no forcing function has fired.

---

## Relationship to existing docs

- [`world-logic-traditions.md`](./world-logic-traditions.md) §2 — the
  scoping survey this doc expands; the suggested-sequencing list puts
  catuṣkoṭi first.
- [`aristotelian-syllogistic.md`](./aristotelian-syllogistic.md) —
  the square-of-opposition system the four-corner diagram foils; the
  natural compare-view partner.
- [`saptabhangi.md`](./saptabhangi.md) — the sibling world-logic
  system; catuṣkoṭi reuses its parser idiom and closed-structure
  constant pattern.
- [`lab-roadmap.md`](./lab-roadmap.md) §"Many-valued logic",
  §"system × visualization matrix" — the Diagrammatic-semantic row
  gains catuṣkoṭi when this ships.
