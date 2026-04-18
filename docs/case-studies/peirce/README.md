# Charles Sanders Peirce — Case Study

**Status:** Draft — first-pass notes, 2026-04-16
**Subject:** Charles Sanders Peirce (1839–1914)
**Philosopher slug:** `charles-peirce`
**Graph key:** `philosopher:charles-peirce`

First in-depth case study. Establishes the pattern described in
[`../README.md`](../README.md).

---

## Why Peirce first

Peirce is the strongest choice for the first case study because he
sits at the intersection of every major thread this project is
developing:

- **Formal logic.** Independently of Frege, Peirce developed a fully
  general theory of quantification (1885). His *logic of relatives*
  (building on De Morgan) is the direct ancestor of modern relational
  algebra. His *existential graphs* (EGs, 1880s–1900s) are the richest
  2D-diagrammatic foil to Frege's Begriffsschrift — another system
  motivated by making logical structure visible, arriving at a
  completely different visual language.
- **Semiotics.** Peirce's sign / object / interpretant triad founded
  modern semiotics; still the dominant framework in the field.
- **Pragmatism.** Peirce coined "pragmatism" and published its first
  statement (1878). Later renamed his version "pragmaticism" to
  distance it from William James's popularization.
- **Philosophy of science.** Introduced *abduction* as a third mode of
  inference (alongside deduction and induction); argued for
  *fallibilism* as the epistemic stance of science; developed a
  probabilistic/evolutionary cosmology (tychism, synechism, agapism).
- **Living research.** Unusually for a 19th-century philosopher, work
  on Peirce is actively advancing: the *Logic of the Future*
  editions (Bellucci & Pietarinen, 2019–) are publishing his
  existential-graph manuscripts for the first time.

For this project specifically, he is important because:

1. He anchors the **influence graph** with rich in- and out-edges.
2. He is the first populated system in the **logic-systems explorer**
   (existential graphs).
3. He is the natural **contrast point for Frege** when the comparison
   UI lands.

---

## Scope of this case study

**Covered in depth:**

- Logic of relatives and quantification.
- Existential graphs (alpha, beta; gamma briefly).
- Pragmatism / pragmaticism.
- Semiotics (overview; Short (2007) is the authoritative deeper
  treatment).
- Intellectual context — especially the contrast with Frege and the
  relationship to Boole / De Morgan / Schröder.

**Covered lightly:**

- Phenomenology (phaneroscopy) and the Categories (Firstness,
  Secondness, Thirdness).
- Metaphysics / cosmology (tychism, synechism, agapism).

**Deferred:**

- Peirce's scientific work (geodesy, astronomy, color classification).
- His mathematical work beyond logic (continuity, infinitesimals).
- Biographical detail beyond what's needed to frame the intellectual
  development.

---

## Sibling documents

| File | Content |
|---|---|
| [`reading-dag.md`](./reading-dag.md) | Primary-source reading order with blurbs, organized into paths by interest (pragmatism, logic, EGs, semiotics, philosophy of science). |
| [`secondary-literature.md`](./secondary-literature.md) | Intros, interpretive monographs, reference works, essay collections. |
| [`existential-graph-scholarship.md`](./existential-graph-scholarship.md) | The modern EG revival (Zeman, Roberts, Shin, Pietarinen, Stjernfelt, Dau, Bellucci). |
| [`influences-and-context.md`](./influences-and-context.md) | Influences in and out, contemporaries, intellectual positioning. |
| [`seed-research.md`](./seed-research.md) | Concrete seed-ready compilation (dates, slugs, blurbs, edge citations, concept-summary drafts) for the `DB-001-seed-peirce` ticket. Also carries 2026 scholarship-status updates. |

---

## Current seed-data state

As of the start of this case study (verified 2026-04-16 against
`data/seed/`):

| File | Peirce entries |
|---|---|
| `philosophers.json` | 1 — basic record (1839, 1914, American, founder-of-pragmatism `bioShort`). |
| `works.json` | 1 — "How to Make Our Ideas Clear" (1878). |
| `philosopher-schools.json` | 1 role — founder of pragmatism. |
| `philosopher-influences.json` | 2 outgoing — Peirce → William James (direct), Peirce → C.I. Lewis (indirect). No incoming edges. |
| `notes.json` | 0 Peirce-specific notes. |

Skeleton only. The seed-expansion ticket (see below) will bring this
up to full case-study density.

---

## Data plan — what the seed ticket will add

This is the plan for the future `DB-###-seed-peirce` ticket, not for
this docs branch. Captured here so the seed ticket has a spec.

### `philosophers.json`

- Expand `bioShort` to a three-to-four-sentence summary capturing
  polymath scope (logic, semiotics, pragmatism, science).
- Add `alsoKnownAs`: `["C. S. Peirce"]`.
- Confirm dates and nationality.

### `works.json`

Add primary sources listed in [`reading-dag.md`](./reading-dag.md).
Target ~10–15 canonical works. At minimum:

- *On a New List of Categories* (1867)
- *Description of a Notation for the Logic of Relatives* (1870)
- *The Fixation of Belief* (1877)
- *How to Make Our Ideas Clear* (1878) — already present
- *The Doctrine of Chances* (1878)
- *The Probability of Induction* (1878)
- *The Order of Nature* (1878)
- *Deduction, Induction, and Hypothesis* (1878)
- *On the Algebra of Logic* (1880, 1885)
- *The Architecture of Theories* (1891)
- *The Law of Mind* (1892)
- Harvard Lectures on Pragmatism (1903)
- Lowell Lectures (1903)
- *What Pragmatism Is* (1905)
- *Prolegomena to an Apology for Pragmaticism* (1906)

### `philosopher-influences.json`

Add incoming edges (Peirce was influenced by) and additional outgoing
edges. Sourced per entry — see
[`influences-and-context.md`](./influences-and-context.md) for the
full list and citations.

Incoming: Kant, Duns Scotus, Aristotle, Boole, De Morgan, Whewell,
Hegel (limited), Darwin.

Outgoing (additions beyond existing): John Dewey, Josiah Royce, Frank
Ramsey, W.V.O. Quine, Hilary Putnam, Karl-Otto Apel, Jürgen Habermas,
Umberto Eco, Thomas Sebeok.

### `philosopher-schools.json`

- Confirm founder role in pragmatism.
- Consider adding membership in *scholastic realism* if we introduce
  it as a school (currently unclear if this school exists in seed).

### `notes.json`

Add concept-summary notes for each key concept:

- Semiotics (sign / object / interpretant)
- Pragmatic maxim / pragmaticism
- Abduction
- Fallibilism
- Logic of relatives
- Tychism (chance as cosmological principle)
- Synechism (continuity)
- Agapism (evolutionary love)

Also add bibliography notes per entry in
[`secondary-literature.md`](./secondary-literature.md).

---

## Schema question — stick vs. extend

Concept summaries, structured bibliography, and a structured reading
DAG don't have dedicated fields in `PhilosopherDetailDto` today.
Two options:

### Option A — stick with existing schema (recommended)

Encode concept summaries as `notes.json` entries with a new
`noteType: "concept_summary"`. Encode bibliography as
`notes.json` entries with `noteType: "bibliography"` (already exists).
Encode the reading DAG initially as a single contextual note
(detail page's existing "Reading Order" free-text section), with
structured-DAG support deferred.

- **Pro:** No F# changes, no OpenAPI regen, no seed format migration.
  Ships now.
- **Con:** Typed queries over "all concepts across philosophers" are
  awkward; the UI has to filter by `noteType`.

### Option B — extend schema

Add to `PhilosopherDetailDto` (`packages/api-fsharp/.../Domain/Dtos.fs`):

```fsharp
type ConceptSummaryDto = { slug: string; title: string; body: string }
type SecondarySourceDto = { citation: string; blurb: string; url: string option }
type ReadingOrderStepDto = { workSlug: string; tier: string; path: string; dependsOn: string[] }

// Add to PhilosopherDetailDto:
//   Concepts: ConceptSummaryDto[]
//   Bibliography: SecondarySourceDto[]
//   ReadingOrder: ReadingOrderStepDto[]
```

- **Pro:** Typed, queryable, surfaced cleanly in the UI without
  filtering.
- **Con:** F# DTO changes + query updates (`Queries.fs`) + OpenAPI
  regen + seed format extension. Bigger ticket.

### Recommendation

**Option A for this case study.** Peirce is our first; we don't know
yet what the right structured shape is after two or three more case
studies. Premature schema commitment is likely to be wrong.

Revisit after Peirce + one or two more case studies (whichever ones
come next — suggestions welcome in later planning).

Flagged in [`../../formal-logic/open-questions.md`](../../formal-logic/open-questions.md)
§ "Open design questions" for cross-project visibility.

---

## Detail-page UX plan

Concrete changes to `packages/web/src/routes/philosophers.$slug.tsx`
once the seed data lands. Each is a separate implementation ticket.

1. **Concepts & Ideas section** — between the hero (around line 298)
   and the Works section. Renders concept-summary notes as cards, one
   per key concept. Uses existing `NoteBlock` pattern.
2. **Influence Graph section** — between Works (around line 318) and
   the existing two-column Influences section. Renders a subgraph
   fetched from `GET /api/graph/influence/{slug}?depth=2` using
   `@xyflow/react` with `@dagrejs/dagre` layout. Default collapsed;
   "Expand graph" toggle. Keeps the existing text-list Influences
   section as a fallback and an accessible view.
3. **Structured Reading Order** — expand the existing Reading Order
   section. When structured-DAG data exists for the philosopher
   (initially Peirce only), render it as a DAG visualization with
   tiered paths. Otherwise fall back to the existing free-text note
   rendering so other philosophers still work unchanged.
4. **Component extraction prerequisite** — the inline helpers in
   `philosophers.$slug.tsx` (`WorkCard`, `PhilosopherLink`, `NoteBlock`,
   `SectionHeading`) get extracted into
   `packages/web/src/components/` so the new sections and future case
   studies can share them. This is a refactor ticket (REFAC) that
   should land before or with step 1.
5. **Logic-explorer link** — a small call-to-action linking from
   Peirce's detail page to `/logic/peirce-eg`. Added once the
   logic-explorer tab exists (see
   [`../../formal-logic/logic-explorer-tab.md`](../../formal-logic/logic-explorer-tab.md)).

---

## Logic-systems explorer integration

Peirce's EGs are the first populated system in the explorer. That
work lives in
[`../../formal-logic/logic-explorer-tab.md`](../../formal-logic/logic-explorer-tab.md).
The Peirce case study provides the source material:

- `reading-dag.md` → the EGs path (Lowell Lectures 1903, *Prolegomena…*
  1906, *Logic of the Future* manuscripts) populates the Sources
  section of the `/logic/peirce-eg` page.
- `existential-graph-scholarship.md` → populates the Further Reading
  section and cites the formal sources (Shin 2002 for visual syntax,
  Pietarinen for proof theory).
- The `exampleFormulas` for `peirce-eg` (alpha system) come from the
  case study, with rendering per the visual-syntax spec.

---

## Open questions specific to Peirce

- How deep do we go on semiotics in the detail page vs. deferring to
  a later specialized surface?
- Do we add a separate `school:scholastic-realism` node or handle this
  only as a note?
- Is the "James vs Peirce on pragmatism" distinction worth a
  dedicated note, a comparison rendering, or just a sentence in the
  pragmatism concept summary?

Non-blocking — resolved case-by-case during implementation.
