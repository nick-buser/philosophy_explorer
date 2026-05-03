# Medieval Syllogistic — System Design

**Status:** Phase 1 (FEAT-010) in progress, 2026-05-03
**Implementing ticket:** `FEAT-010-logic-lab-medieval-modal-sorites`

The fifth populated system in the Logic Lab, after Peirce EG, Kripke,
Frege Begriffsschrift, and Aristotelian syllogistic. Picks up the
medieval extensions of term logic that Aristotle either left
underdetermined (modal syllogistic, *Prior Analytics* I.8–22) or did
not address (sorites; the formal/material consequence distinction).
Background:
[`aristotelian-syllogistic.md`](./aristotelian-syllogistic.md),
[`notation-systems.md`](./notation-systems.md) §2.2.

---

## Purpose

The Aristotelian Lab page (FEAT-008/009) already covers assertoric
term logic — the four AEIO forms, the 24 valid moods, the square of
opposition, and the medieval immediate inferences. The genuinely
*new* medieval contributions sit one layer up:

- **Modal syllogistic.** A/E/I/O premises annotated with `□`
  (necessity) and `◇` (possibility), with two readings of the modal
  operator's scope: *de re* (the operator binds the predicate inside
  the proposition) and *de dicto* (the operator binds the proposition
  as a whole). Aristotle's *Prior Analytics* I.8–22 treats modal
  syllogisms but is famously inconsistent on which mixed moods come
  out valid; the medievals (Aquinas, Kilwardby, Albert the Great,
  Ockham, Buridan) inherited and tried to systematise that material.
  Buridan's *Tractatus de consequentiis* (c. 1335) and *Summulae de
  dialectica* (c. 1340) are the most consolidated medieval account
  and the source of truth this Lab adopts.
- **Sorites.** Multi-step term-logic chains where each adjacent pair
  of premises is itself a syllogism. Aristotelian sorites threads the
  conclusion of step *n* into the next premise as its subject;
  Goclenian sorites threads it as the predicate (and so reverses
  premise order). Pedagogically, the chain is a worked-out example
  of how syllogistic composition behaves under repeated application.

These belong on a separate page rather than on the Aristotelian page
because the AST is genuinely different (modal premises and N-premise
chains can't piggy-back on `CategoricalProposition` and `Syllogism`),
and because the page sits in a different historical register —
medieval term logic, not classical.

---

## Out of scope (phase 1)

- **Consequentiae** (formal vs material consequence). Distinct
  enough — and structurally more like a propositional calculus than
  a term logic — that it belongs on its own page if it ships at all.
  Listed as a deferred follow-up.
- **Suppositio theory.** The medieval theory of how terms refer
  inside propositions (formal/material/personal/simple/discrete
  supposition). Pedagogically interesting but not a validity engine;
  better as a doc/encyclopaedia entry than as a Lab interaction.
- **Obligationes / insolubilia.** Disputation theory and the
  liar/insoluble paradox tradition. Out of scope for a Lab.
- **Apodictic vs assertoric vs problematic distinction at full
  fidelity.** Aristotle's three modes (necessary / actual / possible)
  ramify into ~20 moods per figure when fully crossed. We collapse
  to two modes (necessity, possibility) and treat assertoric
  premises as the absence-of-modal case — which is Buridan's
  approach but not Aristotle's own.
- **Ampliation.** Buridan distinguishes ampliative from
  non-ampliative possibility (`Possibly all S is P` quantifying over
  *what could be S* vs *what actually is S*). We adopt the
  non-ampliative reading, which is closer to modern Kripke
  semantics and to introductory textbook treatments. This is
  flagged in the doc table for the Buridan-specific cases that
  differ.
- **Multi-step Lean / Neo4j integration.** As with the Aristotelian
  page, the validity check is a lookup table.

---

## What ships in phase 1

A new system at `/logic/medieval` with the same chrome as the other
four labs:

1. **DSL editor** — `LogicCmEditor` with medieval-specific slash
   commands.
2. **Renderer** — Venn (3-circle) for modal syllogisms, annotated
   with `□` / `◇` glyphs near each premise's affected regions; a
   linear chain diagram for sorites.
3. **Validity badge** — for modal syllogism input, displays the
   modal mood (e.g. `LAA`), figure (1–4), reading (de re / de dicto),
   and a colour-coded valid/invalid state. For sorites, displays
   "valid as Aristotelian sorites of length N" / "valid as Goclenian
   sorites" / "invalid at step k".
4. **Two toggles in the toolbar:**
   - *Modal reading*: `In sensu diviso (de re)` (default) /
     `In sensu composito (de dicto)`.
   - *Existential import*: `Traditional` (default) / `Boolean`,
     identical in semantics to FEAT-009's toggle on the Aristotelian
     page.
5. **Hand-authored examples** — modal Barbara LLL, modal Barbara LXL
   (necessity-major + assertoric-minor → necessity-conclusion, the
   contested case), an apodictic moods example that flips between
   readings, two sorites (Aristotelian and Goclenian), one invalid
   modal mood.
6. **Primitives panel** — necessity, possibility, modal proposition,
   modal mood, de re, de dicto, sorites.

---

## DSL grammar

### Modal proposition (long form)

A modal annotation may appear in either of two scopes:

```
modal-proposition := de-dicto-prefix proposition
                  |  de-re-proposition
                  |  proposition                    ; assertoric

de-dicto-prefix   := "Necessarily," | "Possibly,"

de-re-proposition := quantifier subject copula modal-modifier predicate
                  |  quantifier subject copula "not" modal-modifier predicate

modal-modifier    := "necessarily" | "possibly"
```

Examples:

| DSL                                    | Reading  | Modal mood letter |
|----------------------------------------|----------|-------------------|
| `All Greeks are Mortal`                | —        | `X`               |
| `Necessarily, all Greeks are Mortal`   | de dicto | `L`               |
| `All Greeks are necessarily Mortal`    | de re    | `L`               |
| `Possibly, no S is P`                  | de dicto | `M`               |
| `Some S is possibly not P`             | de re    | `M`               |

The page-level *modal-reading* toggle determines which mixing is the
default when the parser has to choose — but the DSL syntax is
unambiguous on its own (de-dicto-prefixed text vs. infix
*necessarily* / *possibly*). The toggle's job is to flip the
*validity* result, not the parse.

We use `X` for the assertoric (mode-less) case in the modal mood
letter, matching Buridan's own notation. So `LXL-1` is "necessary
A-major, assertoric A-minor, necessary A-conclusion in figure 1" —
the famously contested *modal Barbara* case.

### Modal syllogism (long form)

Three lines, each a (possibly modal) proposition, separated by an
optional `Therefore` / `So` / `Hence` keyword.

```
Necessarily, all M is P.
All S is M.
Therefore necessarily all S is P.
```

A syllogism is "modal" iff at least one of its three propositions
carries a modal annotation. A purely assertoric three-line input
parses as a non-modal syllogism (`XXX-figure`) and the page falls
through to the Aristotelian validity check.

### Compact form

```
modal-compact := modal-mood "-" figure "/" reading "/" S "," M "," P
modal-mood    := letter letter letter
letter        := "X" | "L" | "M"               ; X=assertoric, L=necessity, M=possibility
figure        := "1" | "2" | "3" | "4"
reading       := "de-re" | "de-dicto"
```

Example: `LXL-1/de-re/Greeks,Mortal,Wise` parses as the de-re modal
Barbara (necessary major, assertoric minor, necessary conclusion).

For an *assertoric* compact, the propositional letters in the mood
remain `A`/`E`/`I`/`O` (the Aristotelian compact form, retained
unchanged). The two compacts are distinguished by their first
character: assertoric starts with `[AEIO]`, modal starts with
`[XLM]`. The reading suffix is required for modal; assertoric
compacts don't take one.

### Sorites

A multi-line categorical chain (assertoric only in phase 1; mixing
modal into a sorites is real medieval territory but not the scope
here):

```
All A is B.
All B is C.
All C is D.
Therefore all A is D.
```

The parser:

1. Splits on newlines and the optional conclusion keyword.
2. Parses each line as a non-modal categorical proposition.
3. Detects the chain order:
   - **Aristotelian (forward)**: line *k* uses line *k-1*'s predicate
     as its subject (so the "spine" runs subject → predicate →
     subject → predicate ...).
   - **Goclenian (reverse)**: line *k* uses line *k-1*'s subject as
     its predicate.
4. Decomposes the chain into pairwise syllogism steps: lines
   1 + 2 produce intermediate conclusion *C₂*, lines *C₂* + 3
   produce *C₃*, and so on until the explicit conclusion line is
   reached.
5. Each pairwise step runs through the existing assertoric
   `checkSyllogism`. The chain is valid iff every step is valid;
   the first invalid step is reported.

Aristotelian sorites of length *N* is valid iff every step is
Barbara (and it usually is — it's the canonical sorites form).

## Validity (phase 1)

### Modal moods — validity table

The modal validity table is keyed by `{modalMood}-{figure}-{reading}`
where `modalMood` is a 3-letter string over `{X, L, M}` and
`reading` is `de-re | de-dicto`.

The phase-1 table contains entries for the canonical modal moods
in figures 1–4, sourced from Buridan's *Tractatus de consequentiis*
III. Coverage is roughly:

- **All-necessary moods (LLL).** A modal mood `LLL-figure` is
  valid iff the underlying assertoric mood is valid in that figure
  (under traditional import). Both readings agree.
- **All-possibly moods (MMM).** Same: valid iff the assertoric
  underneath is valid. Both readings agree.
- **Mixed L/X moods.** Aristotle held that an `LX` mix in figure 1
  yields an `L` conclusion (the famous "two Barbaras" doctrine).
  Theophrastus and Eudemus rejected this — they held the
  conclusion follows the *weaker* premise (*peiorem semper sequitur
  conclusio*). Buridan accepts the Aristotelian doctrine *under
  the de re reading* but flips to the Theophrastean reading
  *under de dicto*. Modal Barbara `LXL-1` is therefore the
  flagship "reading flips it" case in the table.
- **Mixed L/M moods.** Possibility-major + necessity-minor mostly
  collapses to possibility-conclusion across both readings.
- **Mixed X/M moods.** Most are invalid de re; a few are valid
  de dicto by virtue of treating the possibility as a wide-scope
  modal claim about the proposition.

Each entry has shape:

```ts
type ModalValidEntry = {
  // Buridan's name when the mood has a traditional name. Many do not
  // — only the assertoric Barbara, Celarent, etc. carry common names.
  // Some scholastic moods have informal "necessity-Barbara" labels
  // that we use sparingly.
  name?: string;
  // 'always' = valid under both readings in this figure
  // 'de-re-only' / 'de-dicto-only' for reading-dependent cases
  // (we still require an entry per reading for predictable lookup)
  weakened: boolean;     // depends on existential import (carries through to Boolean toggle)
  buridan: boolean;      // entry follows Buridan; false = Aristotle/Theophrastus split flagged in note
  note?: string;
};
```

The `weakened` flag composes with the existential-import toggle
exactly as in the assertoric table — a mood whose assertoric
underlying form is weakened becomes invalid under Boolean reading
*regardless of modality*.

### Sorites — chain check

`checkSorites(chain: SoritesChain, importSetting): SoritesResult`
decomposes the chain into pairwise syllogisms (Barbara in the
canonical case) and runs each through the existing
`checkSyllogism` from `aristotelian-validity.ts`. Returns:

```ts
type SoritesResult =
  | { valid: true;  shape: 'aristotelian' | 'goclenian'; length: number }
  | { valid: false; failedStepIndex: number; reason: string };
```

The chain shape (Aristotelian vs Goclenian) is determined at parse
time, not validity time — they're parser-disambiguated by which
term position chains.

---

## Visualisation

### Modal Venn (3-circle, annotated)

The 3-circle Venn from FEAT-008 is reused. The shading +
×-marking layer treats every modal premise as if it were
assertoric (i.e. `Necessarily all S is P` shades the same regions
as `All S is P`). On top of that, each premise carrying a modal
annotation gets a small `□` or `◇` glyph anchored near its shaded
region, with the position offset enough to remain legible against
the Venn shading.

This is the cleanest visual cue without committing to a separate
modal-region colour or texture; the badge carries the authoritative
mood/figure/reading/validity, the glyphs let the user see *which
premise* carries the modality.

### Sorites chain diagram

A linear chain of term-nodes connected by syllogism-step labels:

```
[A] ──Barbara──→ [C] ──Barbara──→ [D] ──Barbara──→ [E]
```

Term nodes are rounded rects with the term name; step labels are
small badges between nodes. An invalid step turns the affected
edge red and tags it with the failure reason.

The diagram does not attempt to render a Venn per step — that
would compress to illegibility past about 4 lines. The textual
chain is the right pedagogical fit.

---

## File layout

Following the FEAT-006/007/008 pattern:

| File | Purpose |
|---|---|
| `medieval-types.ts` | `ModalProposition`, `ModalSyllogism`, `SoritesChain`, `MedievalFormula`, `ModalReading`, modal mood letters |
| `medieval-parser.ts` | DSL → AST. Three top-level shapes: modal proposition, modal syllogism, sorites |
| `medieval-validity.ts` | Modal validity table + figure detection (reuses Aristotelian figure logic). `checkModalSyllogism`, `checkSorites` |
| `medieval-layout.ts` | Glyph placement on top of Aristotelian Venn; sorites chain layout |
| `MedievalRenderer.tsx` | SVG consumer of layout output |
| `medieval-commands.ts` | Slash commands |
| `MedievalEditor.tsx` | `LogicCmEditor` wrapper |
| `__tests__/medieval-parser.test.ts` | parser cases |
| `__tests__/medieval-validity.test.ts` | modal validity table round-trips |
| `__tests__/medieval-sorites.test.ts` | sorites chain checks |
| `__tests__/medieval-layout.test.ts` | layout assertions |
| `__tests__/medieval-system-data.test.ts` | descriptor sanity |

Route dispatch: one new branch in `routes/logic.$system.tsx`,
matching the existing labs.

---

## Open questions / deferred

- **Consequentiae** as a separate page: TBD ticket.
- **Suppositio** as a doc page (no Lab interaction).
- **Modal sorites.** Pedagogically real, parser-compatible, but
  validity is an open scholarly question (Buridan does not give a
  general rule). Deferred until someone asks.
- **Apodictic vs problematic distinction at full Aristotelian
  fidelity.** Phase 1 conflates "necessity" and "apodictic";
  refining is a separate ticket.
- **Ampliation toggle.** Buridan's ampliative possibility is a real
  medieval distinction. Not phase-1 — would add a third toggle
  alongside reading and import; UI cost outweighs payoff for now.
