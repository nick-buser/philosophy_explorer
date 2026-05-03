# Aristotelian Syllogistic — System Design

**Status:** Draft — phase-1 scope, 2026-05-03
**Implementing ticket:** `FEAT-008-logic-lab-aristotelian-syllogistic`

The fourth populated system in the Logic Lab, after Peirce EG, Kripke,
and Frege Begriffsschrift. Term logic with the four categorical
proposition forms (A/E/I/O) and the syllogism — two premises and a
conclusion sharing a middle term, validity decided by figure × mood.
Background context:
[`notation-systems.md`](./notation-systems.md) §2.1,
[`logic-explorer-tab.md`](./logic-explorer-tab.md).

---

## Purpose

Aristotelian syllogistic is the longest-lived formal logic in the Western
tradition (~350 BCE through the 19th century) and the natural foil to
the modern systems already in the Lab. Three things make it worth a
ticket:

- **Term logic, not propositional or modal.** Every other Lab system
  treats whole propositions or formulas as the units. Aristotelian
  logic's atomic unit is the *term* (subject / predicate / middle), and
  inference moves between terms via shared middle terms. The DSL,
  AST, and renderer all reflect this.
- **A real validity check.** Peirce, Kripke, and Frege ship parsers and
  renderers but no judging — every formula renders, valid or not.
  Syllogism validity is the first time the Lab says "this is invalid"
  on user input. The check is pedagogically the whole point: half the
  256 figure × mood combinations are invalid, and the diagrams show
  *why*.
- **2D Venn diagrams for syllogisms.** Three overlapping circles
  (S, M, P) with shading for emptiness (universals) and × marks for
  non-emptiness (particulars) is the modern textbook visualization of
  syllogism validity. Geometry is much simpler than Frege's stroke
  network or even Peirce's nested cuts — circles and intersections.

---

## Out of scope (phase 1)

To keep the ticket honest:

- **No square of opposition.** Contradictory / contrary / subcontrary /
  subaltern relationships among A/E/I/O on a single 2×2 diagram —
  pedagogically valuable, but a separate visualization. Phase 2.
- **No medieval refinements.** No suppositio (term-reference theory),
  no consequentia, no obversion / conversion / contraposition rules
  applied as derivations. Phase 1 is "ancient" — Aristotle's *Prior
  Analytics* through the standardized 24-valid-mood table that
  consolidated by the late medieval period.
- **No Stoic propositional logic.** "If A then B; A; therefore B" is
  whole-proposition reasoning, structurally closer to Frege /
  modern. Bundling it here would force two ASTs into one slug. If
  it's worth doing, it's a separate `stoic-propositional` system.
- **No Sorites / chain syllogisms.** Multi-step term-logic chains
  (A→B→C→D) are real Aristotelian moves but require an inference-step
  layer the Lab doesn't have yet. Phase 2.
- **No Lean integration.** The validity check is a 24-row lookup
  table; theorem-proving is unnecessary.
- **No existential-import policy switch.** We adopt the *traditional*
  reading where universal A and E carry existential import (so AAI
  in figure 1, "Barbari", is valid). The modern Boolean reading drops
  import and disqualifies the 9 "weakened" moods. Phase 1 picks one
  reading (traditional) and notes the issue; phase 2 could expose a
  toggle.

---

## What ships in phase 1

A new system at `/logic/aristotelian` with the same chrome as the
other three labs:

1. **DSL editor** — `LogicCmEditor` (the shared CodeMirror host from
   REFAC-001) with syllogism-specific slash commands.
2. **Venn renderer** — single 2-circle diagram for one categorical
   proposition; 3-circle diagram (S, M, P) for a syllogism, with
   shading for empty regions and × for non-empty regions.
3. **Validity badge** — for syllogism input, displays the figure
   (1–4), the mood (e.g. AAA), the traditional name (Barbara,
   Celarent, …) when valid, and `valid` / `invalid` next to it.
4. **Hand-authored examples** — the four Figure-1 perfect syllogisms
   (Barbara, Celarent, Darii, Ferio) plus a few from other figures
   and 1–2 invalid moods to demonstrate the checker catching them.
5. **Primitives panel** — A/E/I/O forms, syllogism shape, figures,
   middle term.

---

## DSL grammar (phase 1)

Two input modes, both supported by the same parser:

### Long form (prose)

```
proposition := quantifier subject copula [negation] predicate
quantifier  := "All" | "No" | "Some"
subject     := IDENT
predicate   := IDENT
copula      := "is" | "are"
negation    := "not"   ; only after copula, only with "Some"
IDENT       := [A-Za-z][A-Za-z0-9_-]*
```

The four canonical readings:

| Form | Prose                  | Quantity   | Quality     |
|------|------------------------|------------|-------------|
| A    | `All S is P`           | universal  | affirmative |
| E    | `No S is P`            | universal  | negative    |
| I    | `Some S is P`          | particular | affirmative |
| O    | `Some S is not P`      | particular | negative    |

### Compact form

A single line of three letters followed by the term assignment:

```
syllogism-compact := mood "-" figure "/" S "," M "," P
mood              := letter letter letter
letter            := "A" | "E" | "I" | "O"
figure            := "1" | "2" | "3" | "4"
```

Example: `AAA-1/Greeks,Mortal,Wise` parses as Barbara with subject
"Greeks", middle "Mortal", predicate "Wise" — i.e. *All Greeks are
Mortal; All Mortal are Wise; therefore all Greeks are Wise.* The
compact form is the autocomplete-friendly mode; the long form is the
human-readable mode.

### Syllogism (long form)

A syllogism is three propositions on three lines, separated by
optional `Therefore`:

```
All M is P.
All S is M.
Therefore all S is P.
```

The parser:

1. Splits on newlines and the optional `Therefore` / `So` / `Hence`
   keyword on the last line.
2. Parses each line as a proposition.
3. Identifies the **middle term** as the term appearing in both
   premises but not the conclusion.
4. Reports the **figure** from the placement of the middle term:

   | Figure | Position in major premise | Position in minor premise |
   |--------|---------------------------|---------------------------|
   | 1      | subject                   | predicate                 |
   | 2      | predicate                 | predicate                 |
   | 3      | subject                   | subject                   |
   | 4      | predicate                 | subject                   |

5. Reports the **mood** as the three letters (premise 1, premise 2,
   conclusion).
6. Looks up validity in the table.

Convention follows Aristotle's order: **major premise first**
(contains the predicate of the conclusion), **minor premise second**
(contains the subject of the conclusion), **conclusion last**.

---

## Validity (phase 1)

The traditional 24 valid moods, by figure:

| Figure | Valid moods                                                  | Names                                                 |
|--------|--------------------------------------------------------------|-------------------------------------------------------|
| 1      | AAA, EAE, AII, EIO, AAI, EAO                                 | Barbara, Celarent, Darii, Ferio, Barbari, Celaront    |
| 2      | EAE, AEE, EIO, AOO, AEO, EAO                                 | Cesare, Camestres, Festino, Baroco, Camestrop, Cesaro |
| 3      | AAI, IAI, AII, EAO, OAO, EIO                                 | Darapti, Disamis, Datisi, Felapton, Bocardo, Ferison  |
| 4      | AAI, AEE, IAI, EAO, EIO, AEO                                 | Bramantip, Camenes, Dimaris, Fesapo, Fresison, Camenop |

24 entries total. Encoded as a flat lookup map keyed by
`{mood}-{figure}` → `{ name, weakened: boolean }`. A syllogism not in
the map is reported as invalid with the figure and mood still shown.

The **9 "weakened" moods** (Barbari, Celaront, Cesaro, Camestrop,
Camenop, and the figure-3/4 subaltern variants) are valid only under
existential import. Phase 1 keeps them in the table and marks them
`weakened: true` so the UI can annotate them ("valid under
traditional reading"). This is honest about the philosophical
issue without forcing a setting toggle.

---

## Venn diagram rendering

### Single proposition (2 circles)

Two overlapping circles labelled S and P, plus the four regions:
S∖P, S∩P, P∖S, and the outside (universe).

| Form           | Visualization                                          |
|----------------|--------------------------------------------------------|
| `All S is P`   | Shade S∖P (S outside P is empty)                       |
| `No S is P`    | Shade S∩P (the overlap is empty)                       |
| `Some S is P`  | × in S∩P (the overlap has at least one element)        |
| `Some S is not P` | × in S∖P (S outside P has at least one element)     |

### Syllogism (3 circles)

Three overlapping circles labelled S, M, P arranged in the standard
Venn pattern (two on top, one on bottom or three-way symmetric — we
pick three-way symmetric for simplicity). Seven internal regions plus
the universe:

```
1: S only            5: S∩M only
2: M only            6: M∩P only
3: P only            7: S∩P only
4: S∩M∩P
```

The renderer:

1. Draws the three circles and labels.
2. **Shades** every region forced empty by either premise (universal
   propositions only).
3. **Marks ×** every region forced non-empty by either premise
   (particulars). For particulars, if the existence is forced into
   one of two sub-regions but neither alone — say "Some S is M" with
   no info about P — the × straddles the boundary between regions
   4 and 5 (the modern convention; pedagogically clear).
4. Does **not** apply the conclusion. The pedagogical point is to
   look at the diagram after applying the two premises and ask: is
   the conclusion's mark/shading already there?

The validity badge tells the user the answer; the diagram lets them
see why.

### Phase-1 simplification

For phase 1 we do **not** implement the boundary-straddling × for
ambiguous particulars in the 3-circle case. Instead we shade the
universal-premise regions completely, and for particular premises
we add a single × in the *most-specific compatible region* (often
the centre 4-region). This is geometrically simpler and the
validity badge already carries the authoritative answer; the diagram
is illustrative, not the source of truth. Phase 2 can add proper
boundary straddling if a user asks for it.

---

## File layout

Following the FEAT-006/007 pattern:

| File | Purpose |
|---|---|
| `aristotelian-types.ts` | `CategoricalProposition`, `Syllogism`, `Mood`, `Figure` types |
| `aristotelian-parser.ts` | DSL → AST, recursive descent, supports both long and compact form |
| `aristotelian-validity.ts` | 24-mood lookup table + figure detection from term placement |
| `aristotelian-layout.ts` | Geometry primitives for 2-circle and 3-circle Venn diagrams |
| `AristotelianRenderer.tsx` | SVG consumer of layout output |
| `aristotelian-commands.ts` | Slash commands (A/E/I/O templates + example slugs) |
| `AristotelianEditor.tsx` | 10-line `LogicCmEditor` wrapper |
| `__tests__/aristotelian-parser.test.ts` | parser cases |
| `__tests__/aristotelian-validity.test.ts` | all 24 valid + sampled invalid moods |
| `__tests__/aristotelian-layout.test.ts` | geometry assertions |
| `__tests__/aristotelian-system-data.test.ts` | descriptor sanity |

Route dispatch: one new branch in `routes/logic.$system.tsx` matching
the FregeBsLab / KripkeLab / PeirceEgLab pattern.

---

## Open questions

- **Existential import default.** Picked traditional. A future toggle
  could let the user switch to Boolean reading and watch the 9
  weakened moods become invalid. Phase 2.
- **Square of opposition as a separate visualization.** Worth a phase
  2 ticket; would slot into the same system page as a third panel.
- **Sorites.** Multi-step chains. Phase 2; needs an inference-step
  abstraction the Lab doesn't have yet.
- **Boundary-straddling ×.** Phase 2 if a user asks. The validity
  badge is the authoritative answer in phase 1; the diagram is a
  visual aid.
