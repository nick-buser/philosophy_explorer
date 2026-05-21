# Saptabhaṅgī — System Design

**Status:** Phase 1 implemented on `feat/logic-lab-saptabhangi` (ticket
`.tickets/feat-logic-lab-saptabhangi.md`). Phase 2 scope below remains
open.
**Builds on:** the candidate survey
[`world-logic-traditions.md`](./world-logic-traditions.md) §3 and the
roadmap's many-valued logic item. Design context:
[`logic-explorer-tab.md`](./logic-explorer-tab.md),
[`notation-systems.md`](./notation-systems.md).

---

## Purpose

The Jain doctrine of *anekāntavāda* (non-one-sidedness) holds that any
predication is true only relative to a standpoint. *Syādvāda* is its
logical regimentation: every predication is qualified by *syāt* ("in
some respect"), and from three basic modes —

- *asti* — "is" (the predicate holds)
- *nāsti* — "is not" (the predicate fails)
- *avaktavya* — "inexpressible" (the predicate jointly holds-and-fails
  in the *same* respect, which cannot be asserted successively)

— exactly **seven** *bhaṅgas* arise: one for each non-empty subset of
the three modes. It is a genuine many-valued logic with a fixed,
closed, enumerable value space.

It earns a Lab slot because:

- **It is the historical, non-Western instance of many-valued logic.**
  The roadmap's `feat/logic-lab-many-valued` item builds the *n*-valued
  truth-table machinery; saptabhaṅgī is what that machinery is *for*,
  with a real tradition behind it.
- **Standpoint-relative predication is new.** No Lab system carries a
  truth that is indexed to a *respect*. Saptabhaṅgī makes the index
  first-class without leaving the algebraic/tabular family.
- **The seven values have visible structure.** The non-empty subsets
  of a 3-set form an inclusion lattice — three singletons, three
  pairs, one triple — which renders directly in the Boolean system's
  `HasseDiagram` idiom.

---

## The seven bhaṅgas

The closed structure. `avaktavya` is treated as a third *primitive*
mode (the Ganeri-style reconstruction — see §"Open questions" 1), so
the seven bhaṅgas are exactly the seven non-empty subsets of
`{asti, nāsti, avaktavya}`:

| # | Sanskrit | Subset | Reading |
|---|---|---|---|
| 1 | *syād asti* | {asti} | in some respect, is |
| 2 | *syād nāsti* | {nāsti} | in some respect, is not |
| 3 | *syād asti nāsti* | {asti, nāsti} | is (in one respect), is not (in another) |
| 4 | *syād avaktavya* | {avaktavya} | in some respect, inexpressible |
| 5 | *syād asti avaktavya* | {asti, avaktavya} | is; and inexpressible |
| 6 | *syād nāsti avaktavya* | {nāsti, avaktavya} | is not; and inexpressible |
| 7 | *syād asti nāsti avaktavya* | {asti, nāsti, avaktavya} | is; is not; and inexpressible |

---

## Out of scope (phase 1)

- **No compound-statement evaluation.** Phase 1 *classifies* a
  predication into its bhaṅga. It does not evaluate `¬`, `∧`, `∨`
  over the seven values — that is phase 2 and the natural home of the
  shared *n*-valued substrate (see §"Phase 2+").
- **No naya theory.** The sevenfold Jain doctrine of standpoints
  (*naigama, saṃgraha, vyavahāra, …*) is rich epistemology; phase 1
  treats a standpoint as an opaque label and reasons only about the
  *mode* asserted under it.
- **No Sanskrit-input editor**; ASCII DSL with IAST aliases.
- **No Lean integration, no compare view, no `LogicIR` migration** —
  same calls as the other world-logic systems.

---

## What ships in phase 1

A new system at `/logic/saptabhangi` with the shared Lab surface:

1. **DSL editor** — `LogicCmEditor` host with saptabhaṅgī commands.
2. **Parser** — line-based `key: value` predication with a standpoint
   list.
3. **Engine** — `classifyBhanga`: aggregate standpoint modes → the
   bhaṅga. Total and structural.
4. **Seven-cell table** — `SaptabhangiTable`, the seven bhaṅgas with
   the active one highlighted.
5. **Inclusion lattice** — `SaptabhangiLattice`, the seven subsets
   ordered by inclusion, reusing the `HasseDiagram` idiom; the active
   bhaṅga's node is ringed.
6. **Primitives panel** — *syāt*, the three modes, *naya*/standpoint.
7. **6–8 seed examples** — see §"Seed examples".

`thinkerSlug: null` — no Jain logician seeded yet; deep link deferred.

---

## DSL grammar (phase 1)

One authoring surface: a predication with one line per standpoint.

```
predication := "subject" ":" text
               "predicate" ":" text
               standpoint+
standpoint  := "standpoint" name ":" mode
mode        := "asti" | "nasti" | "avaktavya"
```

```
subject:   the pot
predicate: permanent
standpoint substance : asti        -- qua its clay substance, permanent
standpoint mode      : nasti       -- qua its present shape, not permanent
standpoint origin    : avaktavya   -- qua its coming-to-be, inexpressible
```

IAST aliases (`syād asti` ↔ `asti`, `dravya` ↔ `substance`) accepted
per the `indian-parser.ts` precedent; `--` / `#` comments and blank
lines skipped.

The engine unions the asserted modes: `{asti, nāsti, avaktavya}` here
→ **bhaṅga 7**, *syād asti nāsti avaktavya*.

---

## Data shapes

```ts
type BasicMode = 'asti' | 'nasti' | 'avaktavya';

type Bhanga = {
  n: 1|2|3|4|5|6|7;
  modes: BasicMode[];      // the non-empty subset, canonical order
  sanskrit: string;
  gloss: string;
};

// All seven, in subset order. The fixed structure of the system.
const SEVEN_BHANGAS: Bhanga[];

type Predication = {
  subject: string;
  predicate: string;
  standpoints: { name: string; mode: BasicMode }[];
};

// classifyBhanga(p): union the standpoint modes, look up the bhaṅga
// whose `modes` equals that set. An empty standpoint list is a parse
// error — a predication asserts at least one mode.
```

`SEVEN_BHANGAS` is to this system what `HETU_CAKRA` is to
`indian-buddhist`: a constant encoding the closed structure, with a
geometry-invariant test (`saptabhangi-engine.test.ts` asserts exactly
7 entries — 3 singletons, 3 pairs, 1 triple).

---

## File layout

New files in `packages/web/src/logic/` (prefix `saptabhangi`):

| File | Purpose |
|---|---|
| `saptabhangi-types.ts` | `BasicMode`, `Bhanga`, `SEVEN_BHANGAS`, `Predication`. |
| `saptabhangi-parser.ts` | Line-based predication parser. |
| `saptabhangi-engine.ts` | `classifyBhanga`. |
| `saptabhangi-commands.ts` | Slash commands: the three modes, `standpoint`, example skeleton. |
| `SaptabhangiEditor.tsx` | `LogicCmEditor` wrapper. |
| `SaptabhangiTable.tsx` | Seven-cell table, active cell highlighted. |
| `SaptabhangiLattice.tsx` | Inclusion lattice — reuses the `HasseDiagram` idiom. |
| `labs/SaptabhangiLab.tsx` | Lab page. |
| `__tests__/saptabhangi-parser.test.ts` | Modes, standpoints, aliases, errors. |
| `__tests__/saptabhangi-engine.test.ts` | All seven cells reachable; the 7-element invariant. |
| `__tests__/saptabhangi-system-data.test.ts` | Registered; every example parses to its claimed bhaṅga. |

`SaptabhangiLattice` should reuse `HasseDiagram.tsx` (shipped with the
Boolean-algebra system) rather than introduce a new graph component —
the seven subsets ordered by inclusion are a Hasse diagram by
construction. Route: a `saptabhangi` branch in
`routes/logic.$system.lazy.tsx`. Data: a `saptabhangi` entry in
`LOGIC_SYSTEMS` (`logic-systems.ts`), with an optional `predication?`
field on `LogicExample`, additive like Kripke's `model?`.

---

## Seed examples

Six to eight, at minimum one reaching each of the seven bhaṅgas:

- `pot-permanent` — the textbook predication; substance / modal /
  origin standpoints → bhaṅga 7.
- One example each landing in bhaṅgas 1–6 by varying which standpoints
  are asserted (drop standpoints from `pot-permanent` to fall back
  through the lattice).
- `soul-existence` — a classic Jain example (the soul *is* qua
  substance, *is not* qua a given body) → bhaṅga 3.

Honest framing in the Lab's history section: phase 1 commits to the
three-primitive reading of `avaktavya`; the truth-functionality debate
is flagged, not adjudicated (Open questions §1).

---

## Implementation order

1. Types + `SEVEN_BHANGAS` constant; the geometry invariant test.
2. Parser. `saptabhangi-parser.ts`, parser tests.
3. Engine. `classifyBhanga`, engine tests.
4. Seed examples (data only) — inert, not yet routed.
5. Table component. `SaptabhangiTable.tsx`.
6. Lattice component. `SaptabhangiLattice.tsx` reusing `HasseDiagram`.
7. Editor + commands.
8. Page wiring — `logic.$system.lazy.tsx`; bhaṅga verdict badge.
9. Polish + work-history doc.

---

## Phase 2+ scope

In rough priority order:

1. **Compound-statement evaluation.** Negation, conjunction, and
   disjunction over the seven values — the genuine many-valued
   logic. This is best built **alongside `feat/logic-lab-many-valued`**
   so the *n*-valued truth-table machinery (cells holding a set of
   values, parameterized connective tables) is written once and
   shared. `world-logic-traditions.md` §"Suggested sequencing" makes
   this pairing explicit.
2. **Naya theory** — surface the sevenfold standpoint doctrine, so a
   standpoint is a typed entity rather than an opaque label.
3. **Interactive standpoint editing** — add/remove a standpoint, watch
   the bhaṅga move through the lattice live.
4. **Compare view** with the roadmap's many-valued system — the same
   compound statement under Łukasiewicz/Kleene values beside the
   saptabhaṅgī reading. A pollinator ticket.
5. **Lean integration**, once any system gets Lean.

---

## Open questions

### 1. Is `avaktavya` a third primitive, or derived?

Phase 1 commits to `avaktavya` as a **third primitive mode**, making
the seven bhaṅgas the seven non-empty subsets of a 3-set — the clean,
enumerable reading (Ganeri 2002). The rival reading treats
`avaktavya` as the *simultaneous* joint assertion of `asti` and
`nāsti` (distinct from their *successive* assertion in bhaṅga 3),
which makes the value space a structure over `{asti, nāsti}` with a
modal "jointly" operator. Both yield seven; they differ on whether
the logic is truth-functional. Phase 1 picks the subset reading
because it is the one that renders as a lattice and classifies
mechanically — and says so in the Lab history. Priest (2008) is the
reference for the dispute; revisit if phase 2's compound evaluator
forces the question.

### 2. Standpoint conflict

Phase 1 unions the standpoint modes with no consistency check — two
standpoints may assert `asti` and the engine simply notes `asti` is
present. Whether the system should *detect* that the same standpoint
name carries two modes (a genuine error) or allow it (a re-assertion)
is a small phase-1-polish question; default to flagging a repeated
standpoint name as a parse error.

### 3. AST authority — TS-only

Same call as the other world-logic systems and Kripke phases 1–2
(see [`kripke-modal-logic.md`](./kripke-modal-logic.md) §"Open
questions" 1b). Parser, engine, renderers are TS-only and browser-
side; no forcing function has fired.

---

## Relationship to existing docs

- [`world-logic-traditions.md`](./world-logic-traditions.md) §3 — the
  scoping survey this doc expands.
- [`lab-roadmap.md`](./lab-roadmap.md) §"Many-valued logic" — the
  paired item; §"system × visualization matrix" Algebraic/tabular row
  gains saptabhaṅgī when this ships.
- The Boolean-algebra system — source of the `HasseDiagram` component
  the lattice view reuses.
- [`editor-and-ir.md`](./editor-and-ir.md) §1 — a future `LogicIR`
  union would gain a many-valued variant shared with the roadmap's
  many-valued logic; not triggered.
