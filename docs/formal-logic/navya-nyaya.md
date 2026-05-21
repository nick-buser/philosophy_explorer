# Navya-Nyāya — System Design

**Status:** Design doc, not yet shipped. Implementing ticket queued:
`.tickets/feat-logic-lab-navya-nyaya.md` (`feat/logic-lab-navya-nyaya`).
**Builds on:** the `indian-buddhist` system (`docs/formal-logic` has no
per-system doc for it; see `work-history/feat-logic-lab-indian-buddhist.md`)
and the candidate survey `world-logic-traditions.md` §1. Design context:
[`logic-explorer-tab.md`](./logic-explorer-tab.md),
[`editor-and-ir.md`](./editor-and-ir.md),
[`notation-systems.md`](./notation-systems.md).

---

## Purpose

Gaṅgeśa Upādhyāya's *Tattvacintāmaṇi* (c. 1325) reformed Nyāya into
**Navya-Nyāya** — "New Nyāya" — a regimented technical language for
stating relational and cognitive structure with no residual ambiguity.
It uses no symbols, but it is symbolic in spirit: a fixed vocabulary of
relational abstracts, limitors, and relata-roles, composed by strict
nesting. Ingalls (1951) and Ganeri (2001) showed its expressions parse
as nested **qualificand–qualifier–relation** triples — it was, in
effect, designed to have an AST.

It is a strong system for the Lab because it stresses parts that
`indian-buddhist` did not:

- **A structural surface, not a sentential one.** Every prior system —
  including `indian-buddhist`, whose DSL is a flat `key: value` form —
  authors a *formula* or a *table*. A Navya-Nyāya expression is a
  recursively nested term. It is the first system whose primary
  artifact is a parse tree, and it earns the relational-abstract
  **dependency-tree** rendering the matrix flags as absent.
- **A decidable check over a model.** `vyāpti` (pervasion / invariable
  concomitance) is checkable: over a finite domain of loci, "wherever
  the *hetu*, there the *sādhya*" either holds or has a deviation
  (*vyabhicāra*) witness. This is a structural check — no proof search —
  but it is honest verification, unlike a hand-authored badge.
- **Limitors (*avacchedaka*).** Navya-Nyāya's signature device: a
  qualifier that bounds *which* property a term contributes. No prior
  system has scoped-qualifier nodes; they make the AST genuinely
  nested rather than flat.

This is the highest-payoff non-Western candidate after the cheap
Catuṣkoṭi pick — see `world-logic-traditions.md` §"Suggested
sequencing".

---

## Out of scope (phase 1)

To keep the ticket honest:

- **No competing vyāpti definitions.** Gaṅgeśa's *siddhānta-lakṣaṇa*
  and the five rejected *pūrvapakṣa* definitions are the heart of the
  *Vyāpti-pañcaka*; phase 1 ships **one** operational definition
  (no-deviation-over-the-domain). Selectable definitions are phase 2.
- **No proof search.** The engine decides vyāpti and scans for an
  *upādhi* over the *given* domain. It does not search for a domain,
  derive new loci, or chain inferences.
- **No Sanskrit-input editor.** DSL is ASCII with IAST *aliases*
  accepted (as in `indian-parser.ts`); the editor face is not
  re-typeset for diacritics.
- **No bridge to `indian-buddhist` or Aristotelian.** Navya-Nyāya is a
  separate system slug, presented standalone. A compare view is a
  later pollinator ticket.
- **No Lean integration.** Cross-cutting, per
  [`formal-verification.md`](./formal-verification.md).
- **No `LogicIR` migration.** Same call as Kripke phase 1 — see
  [`kripke-modal-logic.md`](./kripke-modal-logic.md) §"Open questions".

---

## What ships in phase 1

A new system at `/logic/navya-nyaya` with the shared Lab surface:

1. **DSL editor** — `LogicCmEditor` host with Navya-Nyāya slash
   commands (the post-FEAT-006 shared editor, not a copy).
2. **Relational-abstract parser** — recursive-descent for the nesting
   expression grammar, plus a line-based `vyapti … end` block.
3. **vyāpti engine** — `checkVyapti` over the locus domain: verdict
   `pervades` / `deviates` with *vyabhicāra* witness loci, plus an
   *upādhi* scan.
4. **Dependency-tree panel** — `NavyaParseTree` renders the
   qualificand → relation → qualifier nesting, limitors as labelled
   side-branches. New rendering in the Tree/graph family.
5. **Condition panel** — vyāpti verdict badge plus a per-condition
   readout (positive concomitance *anvaya*, negative concomitance
   *vyatireka*, upādhi-free), in the idiom of the `indian-buddhist`
   trairūpya panel.
6. **Primitives panel** — entity, abstract (`-tva`), relation,
   limitor, absence, pervaded/pervader.
7. **6–8 seed examples** — see §"Seed examples".

Deep link from a Gaṅgeśa philosopher page is **deferred** — not
seeded yet (`thinkerSlug: null`), same as `indian-buddhist`.

---

## DSL grammar (phase 1)

Two authoring surfaces, like Kripke (formula + model): a **relational-
abstract expression** and a **vyāpti judgment** with its locus domain.

### Relational-abstract expression

```
expr      := atom ( "[" qual ( "," qual )* "]" )?
qual      := relation ":" expr ( "{" "limitor" ":" expr "}" )?
atom      := entity | abstract | absence
abstract  := entity ( "-ness" | "-tva" )
absence   := "absence" "(" expr ")"
entity    := [a-z][a-z0-9_-]*
relation  := "contact" | "inherence" | "svarupa" | "qualification"
           | identifier         -- saṃyoga / samavāya / svarūpa …
```

The nesting `[ … ]` is the qualifier list of the entity to its left;
each `qual` names the relation by which a (recursively parsed) target
qualifies it, and may carry one `{limitor: …}`.

| DSL | Reading |
|---|---|
| `mountain [ contact: fire ]` | the mountain, qualified by fire via contact |
| `pot [ inherence: color {limitor: blue-ness} ]` | the pot bearing colour delimited by blue-ness — "the blue pot" |
| `ground [ svarupa: absence(pot) {limitor: pot-ness} ]` | the ground qualified by a pot-absence whose counterpositive is delimited by pot-ness |

The qualificand is the leftmost atom (tree root); each `qual` is a
child edge labelled by its relation; a limitor hangs off its qualifier
as a labelled side-branch.

### vyāpti judgment

```
vyapti
  pervaded:  <entity>            -- the hetu / vyāpya
  pervader:  <entity>            -- the sādhya / vyāpaka
  locus <name> : <entity>*       -- one line per locus; listed = present
  ...
end
```

```
vyapti
  pervaded: smoke
  pervader: fire
  locus kitchen   : smoke fire
  locus hearth    : smoke fire
  locus iron-ball : fire            -- fire without smoke: fine
  locus lake      :                 -- neither
end
```

IAST aliases (`vyāpya:`, `vyāpaka:`, `pakṣa:`) and English glosses
(`pervaded:` ↔ `reason:`, `pervader:` ↔ `target:`) are accepted, per
the `indian-parser.ts` precedent. Comment (`--` or `#`) and blank
lines are skipped.

---

## Data shapes

```ts
type NavyaExpr = {
  kind: 'entity' | 'abstract' | 'absence';
  head: string;            // entity name; for absence, the counterpositive's name
  inner?: NavyaExpr;        // absence(...) payload
  quals: Qualification[];
};

type Qualification = {
  relation: string;        // contact | inherence | svarupa | ...
  target: NavyaExpr;
  limitor?: NavyaExpr;     // avacchedaka — scopes the qualifier
};

type Vyapti = {
  pervaded: string;        // hetu / vyāpya
  pervader: string;        // sādhya / vyāpaka
  loci: { name: string; properties: string[] }[];
};

type VyaptiVerdict =
  | { kind: 'pervades' }
  | { kind: 'deviates'; witnesses: string[] }     // vyabhicāra loci
  ;

type UpadhiReport =
  | { kind: 'none' }
  | { kind: 'found'; property: string };           // tracks sādhya, not hetu
```

`NavyaExpr` and `Vyapti` are independent — an example may carry either
or both. Deliberately small and JSON-friendly; no back-reference from
`Vyapti` into a `NavyaExpr` tree.

### The engine

```
checkVyapti(v): every locus with `pervaded` also has `pervader`?
  yes → { pervades }
  no  → { deviates, witnesses: loci with pervaded ∧ ¬pervader }

findUpadhi(v): a property U (from the union of locus properties,
  ≠ pervaded, ≠ pervader) such that
    (pervader ⇒ U) holds on every locus, AND
    (pervaded ⇒ U) fails on some locus.
  Such a U is an upādhi: it accompanies the sādhya invariably but
  not the hetu — the mark of an accidental concomitance.
```

Both are total functions over the finite domain — a structural check,
matching the survey's "the engine itself is a structural check, not
proof search."

---

## File layout

New files in `packages/web/src/logic/` (prefix `navya`, mirroring the
`indian-*` set):

| File | Purpose |
|---|---|
| `navya-types.ts` | `NavyaExpr`, `Qualification`, `Vyapti`, verdict ADTs. |
| `navya-parser.ts` | Recursive-descent expression parser + `vyapti` block parser. |
| `navya-engine.ts` | `checkVyapti`, `findUpadhi`. |
| `navya-render.ts` | `NavyaExpr` → layout tree (qualificand at root). |
| `navya-commands.ts` | Slash commands: relations, `-tva`, `absence(`, `limitor`, `vyapti` skeleton. |
| `NavyaEditor.tsx` | `LogicCmEditor` wrapper with the command list. |
| `NavyaParseTree.tsx` | Hierarchical SVG/CSS tree — `GentzenTree` idiom. |
| `labs/NavyaNyayaLab.tsx` | Lab page: header / history / primitives / further reading. |
| `__tests__/navya-parser.test.ts` | Nesting, limitors, absence, `vyapti` block, errors. |
| `__tests__/navya-engine.test.ts` | vyāpti verdicts, vyabhicāra witnesses, upādhi scan. |
| `__tests__/navya-system-data.test.ts` | System registered; every example parses and yields its claimed verdict. |

The parse tree is a **strict tree, not a DAG** — render it in the
`GentzenTree.tsx` SVG/CSS idiom; `@xyflow/react` (used for Kripke
worlds and the resolution DAG) is unnecessary here.

Route: add a `navya-nyaya` branch in
`packages/web/src/routes/logic.$system.lazy.tsx`.
Data: add the `navya-nyaya` entry to `LOGIC_SYSTEMS` in
`packages/web/src/data/logic-systems.ts`. No descriptor type change is
needed — `LogicExample` already carries optional per-system fields;
the Navya-Nyāya expression + vyāpti payloads attach the same way
(add `navyaExpr?` / `vyapti?` optional fields, as Kripke added
`model?`).

---

## Seed examples

Six to eight, covering both surfaces and every verdict:

- `smoke-fire` — the textbook vyāpti; `pervades`, no upādhi.
- `wet-fuel-smoke` — *upādhi* case: fire is pervaded by smoke **only
  where the fuel is wet**; `findUpadhi` returns `wet-fuel`. The
  classic Navya-Nyāya counterexample to a naive vyāpti.
- `deviating-reason` — a hetu present in a locus lacking the sādhya;
  `deviates` with a witness.
- `blue-pot` — pure expression: `pot [ inherence: color {limitor:
  blue-ness} ]`, exercising a limitor.
- `pot-absence` — `ground [ svarupa: absence(pot) {limitor: pot-ness}
  ]`, exercising `absence` + counterpositive limitor.
- `qualified-cognition` — a two-level nesting, to stress the tree
  renderer's depth.

`world-logic-traditions.md` notes the Priest/Ganeri-style scholarly
debates belong in the doc, not the engine; the relevant honest note
here is that phase 1 commits to **one** vyāpti definition and says so
in the Lab's history section.

---

## Implementation order

Each step independently testable:

1. Types + expression parser. `navya-types.ts`, `navya-parser.ts`
   (expression grammar first), parser unit tests.
2. `vyapti` block parser — extend `navya-parser.ts`; tests.
3. Engine. `navya-engine.ts` — `checkVyapti`, then `findUpadhi`;
   tests.
4. Tree layout. `navya-render.ts` — `NavyaExpr` → layout tree.
5. Seed examples (data only). Add the `navya-nyaya` system to
   `LOGIC_SYSTEMS`. Inert — not yet routed.
6. Tree component. `NavyaParseTree.tsx`, unit-tested separately.
7. Editor + commands. `NavyaEditor.tsx`, `navya-commands.ts`.
8. Page wiring. `logic.$system.lazy.tsx` dispatch; verdict +
   condition panel on `NavyaNyayaLab`.
9. Polish + work-history doc (`work-history/feat-logic-lab-navya-nyaya.md`).

---

## Phase 2+ scope

In rough priority order:

1. **Selectable vyāpti definitions.** Gaṅgeśa's *siddhānta-lakṣaṇa*
   and the five *pūrvapakṣa* definitions as a picker — the
   *Vyāpti-pañcaka* made interactive. Each definition is a predicate
   over the same `Vyapti` model; the picker is a data edit, the
   pedagogical payoff is large. The natural headline phase-2 feature.
2. **Paryāpti** — the numerical-completion relation (the analysis of
   number / "two-ness" residing in a collection by *paryāpti-sambandha*).
   A second relation kind with its own small checker.
3. **Anuyogin / pratiyogin role labels** on the tree — surface the
   subjunct / counterpositive roles of each relation edge explicitly.
4. **Interactive domain editing** — add a locus, toggle a property,
   watch the verdict update. Local-storage only initially.
5. **Compare view** with `indian-buddhist`: the Dignāga hetu-cakra
   verdict beside the Navya-Nyāya vyāpti verdict for the same
   inference — a pollinator ticket.
6. **Lean integration** for vyāpti definitions, once any system gets
   Lean.

---

## Open questions

### 1. Relation vocabulary — fixed list vs open

Phase 1 accepts a fixed relation set (`contact`, `inherence`,
`svarupa`, `qualification`) plus arbitrary identifiers. Navya-Nyāya's
real relation inventory (*saṃyoga*, *samavāya*, *svarūpa-sambandha*,
*svarūpa*, *kālika*, *daiśika* …) is larger and load-bearing — some
relations are themselves analysed. Phase 1 treats relations as opaque
edge labels and does not reason about them. Whether the engine ever
needs relation *semantics* (e.g. inherence is asymmetric and
non-transitive) is a phase-2 question; flag it, don't pre-build it.

### 2. Limitor scope — display only, or load-bearing?

Phase 1 renders the limitor as a labelled side-branch but the vyāpti
engine ignores it (the domain model is flat property membership). A
faithful treatment would let a limitor *restrict* which occurrences of
a property count — e.g. "fire delimited by kitchen-fire-ness". That is
genuinely part of how Navya-Nyāya blocks bad inferences. Deferred, but
it is the most likely phase-2 correctness gap — note it in the Lab's
history section so the limit is honest.

### 3. AST authority — TS-only, F# migration not triggered

Same call as Kripke phases 1–2 (see
[`kripke-modal-logic.md`](./kripke-modal-logic.md) §"Open questions"
1b). The parser, tree layout, and vyāpti engine are TS-only and
browser-side. The forcing functions — Lean integration, `LogicIR`
introduction — have not fired. Revisit if Navya-Nyāya gets Lean, or
if `LogicIR` lands.

### 4. `indian-buddhist` cross-link

Both systems analyse inference from concomitance; vyāpti is the
Navya-Nyāya descendant of Dignāga's wheel-classified *hetu*. Phase 1
does **not** wire a compare view, but the `indian-buddhist` history
section should gain a one-line forward pointer to `navya-nyaya` when
this ships — symmetric to the back-pointer this doc carries.

---

## Relationship to existing docs

- [`world-logic-traditions.md`](./world-logic-traditions.md) §1 — the
  scoping survey this doc expands; no change needed there.
- [`lab-roadmap.md`](./lab-roadmap.md) §"system × visualization
  matrix" — the Tree/graph proof row gains a "relational-abstract
  dependency tree" entry when this ships; §"Indian / Buddhist logic"
  notes Navya-Nyāya as the open follow-up — update its status line.
- `work-history/feat-logic-lab-indian-buddhist.md` §"Notes for future
  work" — the Navya-Nyāya deferral note this doc executes.
- [`editor-and-ir.md`](./editor-and-ir.md) §1 — a future `LogicIR`
  union would gain a `RelationalTerm` variant; not triggered (Open
  questions §3).
