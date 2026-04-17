# Logic Systems Explorer — Tab Design

**Status:** Draft — first-pass notes, 2026-04-16

A new top-level app surface for browsing and comparing logical
notation systems. Sibling to the existing philosopher / work / school
detail pages. Peirce's existential graphs are the first populated
system.

Design context: [`notation-systems.md`](./notation-systems.md),
[`editor-and-ir.md`](./editor-and-ir.md), and the Peirce case study
(especially
[`../case-studies/peirce/existential-graph-scholarship.md`](../case-studies/peirce/existential-graph-scholarship.md)).

---

## Purpose

Give users a way to browse logical notation systems directly,
independently of which thinker invented which. The surface answers
three questions:

1. "What notation systems are out there, and what do they look like?"
   — the **index**.
2. "How does system X work?" — a **per-system page** with history,
   primitives, example formulas, scholarship pointers.
3. "What does the same proposition look like across systems?" — the
   **comparison view** (the pedagogical payoff).

This is an *exploration* surface, not an authoring surface. Editor
work is scoped separately in
[`editor-and-ir.md`](./editor-and-ir.md).

---

## Placement

### Recommended: top-level `/logic` route

Logical systems are not tied to individual thinkers. Boolean algebra
is bigger than Boole; modern first-order logic has many co-authors;
Aristotelian syllogistic is a tradition. The exploration surface
should reflect this — a distinct section in the app, parallel to
philosophers/works/schools.

Thinkers link *into* the logic explorer rather than containing it:
Peirce's detail page gets a "View in Logic Explorer" call-to-action
linking to `/logic/peirce-eg`.

### Rejected: nested `/philosophers/$slug/logic`

This would bind the surface to a thinker, which doesn't fit systems
like "Boolean algebra" or "modern FOL" that aren't anchored to one
thinker. It would also force the comparison view into an awkward
place ("comparison from whose perspective?").

---

## Information architecture

Three internal routes under `/logic`:

| Route | Purpose |
|---|---|
| `/logic` | Index — list of supported systems, one-line summary each, small preview rendering, filter by era / render-approach. |
| `/logic/$system` | Single system page — history, notation primitives, example formulas rendered, reading pointers, link to case study (if any). |
| `/logic/compare` | Multi-representation view — pick a proposition (from a curated list), see it rendered across every supported system, with lossiness annotations from [`editor-and-ir.md`](./editor-and-ir.md) §5. |

The three routes share a simple layout (`logic/__root.tsx` with nav
to index / compare / per-system). TanStack Router-native; no custom
tab state.

### Alternative: flat routes

Instead of a nested layout, `logic.$system.tsx` and `logic.compare.tsx`
as siblings of `logic.tsx`. Simpler if we don't need shared chrome.
Probably fine for phase 1; flag as open question for when/if shared
chrome becomes useful.

---

## System descriptor

Each system is described by a structured record. Initial shape:

```ts
type LogicSystem = {
  slug: string;                 // "peirce-eg", "frege-bs", "aristotelian", "boolean", "modern-fol"
  name: string;                 // "Peirce's Existential Graphs"
  shortDescription: string;     // one-liner for the index
  era: string;                  // e.g. "1880s–1900s"
  keyPrimitive: string;         // "cut + line of identity" (mirrors notation-systems.md matrix)
  renderApproach: "prose" | "katex" | "svg";
  thinkerRefs: string[];        // graph keys: ["philosopher:charles-peirce"]
  history: string;              // markdown body
  primitives: { name: string; description: string; render: string }[];
  exampleFormulas: {            // each example has an AST and a rendering
    natural: string;            // "Everyone loves someone"
    ast: unknown;               // system-specific AST type
    render: string;             // pre-rendered SVG or KaTeX string
  }[];
  readingPointers: {            // links to case study / docs
    title: string;
    href: string;
    kind: "case-study" | "doc" | "external";
  }[];
  scholarshipRef?: string;      // e.g., "docs/case-studies/peirce/existential-graph-scholarship.md"
};
```

Deliberately flat and JSON-friendly.

### Proposition records (for the compare view)

```ts
type Proposition = {
  slug: string;                 // "everyone-loves-someone"
  natural: string;              // "Everyone loves someone"
  renderings: Record<string, {  // keyed by system slug
    render: string | null;      // SVG / KaTeX / prose; null if system can't express
    note?: string;              // lossiness annotation
  }>;
};
```

When a system can't express the proposition, `render` is `null` and
`note` explains why (the "lossiness UX" from
[`editor-and-ir.md`](./editor-and-ir.md) §1).

---

## Storage

Initial approach: two new JSON files in `data/seed/`, loaded at build
time.

| File | Content |
|---|---|
| `data/seed/logic-systems.json` | Array of `LogicSystem` records. |
| `data/seed/logic-propositions.json` | Array of `Proposition` records for the comparison view. |

**Rationale:** Small (a handful of systems, maybe a dozen
propositions), non-relational, already aligned with the existing
seed-file pattern. No database work required for phase 1.

**Migration path:** Move to Postgres (`logic_systems`,
`logic_propositions`, join tables) when the content grows past
hand-editable scale, or when we want to allow user-authored
systems/propositions. Flag as
[open question](#open-questions).

---

## Rendering dependencies

Per [`editor-and-ir.md`](./editor-and-ir.md) §4:

| System | Renderer | Dep state |
|---|---|---|
| Peirce EG (alpha / beta) | Custom SVG from AST. Visual syntax per Shin (2002) — see [`../case-studies/peirce/existential-graph-scholarship.md`](../case-studies/peirce/existential-graph-scholarship.md). | None installed; pre-rendered static SVGs sufficient for phase 1. |
| Frege BS | Custom SVG from AST. Geometric spec per gfnotation paper. | None installed; deferred. |
| Boolean / Schröder / modern symbolic | KaTeX. | Not installed. Add when populating these systems. |
| Aristotelian / Stoic | Prose rendering (no math). | No new deps. |

Phase 1 ships pre-rendered SVGs for a few alpha-system EG examples.
Interactive rendering / edit-and-rerender is phase 2+.

---

## Phase 1 scope

First implementation ticket. Minimal viable surface:

- Top-level `/logic` route with a system index. Lists at least Peirce
  EG; optionally stubs for other systems marked "Coming soon" so the
  scope is visible.
- `/logic/peirce-eg` route with:
  - History section (drawing from the case study).
  - Primitives section (cuts, juxtaposition, lines of identity — per
    Shin 2002).
  - Two or three hand-authored alpha-system example formulas,
    rendered as pre-baked SVG.
  - Reading pointers (links to the Peirce case study).
- Deep link from Peirce's detail page (`/philosophers/charles-peirce`)
  to `/logic/peirce-eg`.
- No editor, no comparison view, no Lean integration, no interactive
  rendering.

Ticket name: `FEAT-###-logic-explorer-phase-1-peirce-eg`.

---

## Phase 2+ scope

Out of phase 1, roughly in priority order:

1. Frege Begriffsschrift as second system (custom SVG renderer).
2. `/logic/compare` route — populated with a handful of propositions
   including "All humans are mortal" and "Everyone loves someone"
   (the lossiness exemplar from
   [`editor-and-ir.md`](./editor-and-ir.md) §1).
3. KaTeX-based rendering for Boolean / Schröder / modern FOL.
4. Interactive rendering — SVG hit-testing, AST hover, click-to-
   navigate.
5. Structured editor (see
   [`editor-and-ir.md`](./editor-and-ir.md) §2.4).
6. Lean verification hook (see
   [`formal-verification.md`](./formal-verification.md)).

Each of these is its own ticket. None are committed; sequencing is
advisory.

---

## Open questions

Flagged for cross-reference from
[`open-questions.md`](./open-questions.md):

- **Storage migration** — when to move system and proposition
  records from seed JSON to Postgres.
- **Route shape** — nested layout (`logic/__root.tsx` with
  children) vs. flat sibling routes. Phase 1 can pick either; the
  choice affects how we share nav chrome.
- **How much of the SEP / scholarship to inline** — the per-system
  page is tempting to fill with depth. Recommend keeping the page
  tight and linking out to the case study / SEP for depth, so the
  surface doesn't become a textbook.

---

## Relationship to existing docs

- [`notation-systems.md`](./notation-systems.md) — provides the
  content for each system's history / primitives section.
- [`editor-and-ir.md`](./editor-and-ir.md) — provides the IR and
  lossiness framing for the compare view.
- [`formal-verification.md`](./formal-verification.md) — provides the
  Lean integration that phase 2+ can optionally expose as a "verify"
  button.
- [`../case-studies/peirce/existential-graph-scholarship.md`](../case-studies/peirce/existential-graph-scholarship.md)
  — provides the source material for the first populated system.
