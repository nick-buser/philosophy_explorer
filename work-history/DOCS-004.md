# DOCS-004 — Formal logic layer + Peirce case study planning docs

**Branch:** `docs/DOCS-004-formal-logic-peirce-notes`
**Merged:** 2026-04-17

## What changed

Purely additive documentation under `docs/`. No code, seed, or schema
changes. Two related doc sets landed together:

### `docs/formal-logic/` — first-pass design notes for the formal-logic dimension

- `README.md` — vision, threads, suggested sequencing, relationship to existing graph layer
- `notation-systems.md` — Frege Begriffsschrift rendering strategies + gfnotation citation + pre-Fregean systems (Aristotelian, Stoic, Leibniz, Boole, Peirce EG, Venn, Schröder) + comparison matrix
- `formal-verification.md` — Lean integration strategy: deep embedding of Begriffsschrift, plumbing options, caching, sandboxing, Grundgesetze caveat
- `argument-graph.md` — Toulmin / Brandomian inferential layer modeled as a second graph type on the existing infrastructure
- `editor-and-ir.md` — shared IR across logic systems, editor tech assessment (ProseMirror/CodeMirror rejected, custom AST + SVG recommended), parser combinator options, multi-representation UI sketch
- `open-questions.md` — scope-honesty / multi-year assessment + 80/20 alternative + open design questions + risk register + dependency-addition list
- `logic-explorer-tab.md` — new `/logic` top-level route design: index / per-system / compare sub-routes, system descriptor shape, phase-1 scope (Peirce EG alpha only)

### `docs/case-studies/` — reusable pattern + first case study (Peirce)

- `README.md` — case-study pattern: what, when, template structure, naming, execution rhythm
- `peirce/README.md` — why Peirce first, scope, current seed state, data plan, schema question (Option A recommended), detail-page UX plan, logic-explorer integration
- `peirce/reading-dag.md` — primary-source reading DAG with entry-point / intermediate / advanced tiers, paths by interest (pragmatism / logic / EGs / semiotics / philosophy-of-science), editions table
- `peirce/secondary-literature.md` — curated intros, interpretive monographs, reference works, essay collections, biographical
- `peirce/existential-graph-scholarship.md` — modern EG revival: Zeman (1964), Roberts (1973), Shin (2002), Stjernfelt, Pietarinen, Dau, Bellucci & Pietarinen's *Logic of the Future* editions
- `peirce/influences-and-context.md` — sourced in/out/contemporary edges for Peirce

### Cross-link edits to existing `docs/formal-logic/` files

- `README.md` — added logic-explorer row to the threads table; added "Related: case studies" pointer
- `notation-systems.md` §2.6 — forward-link to `peirce/existential-graph-scholarship.md`
- `open-questions.md` — two new entries: §2.8 (philosopher-detail schema extend vs. notes-only) and §2.9 (logic-explorer route shape / storage migration)

## Why

The project is taking on a substantially larger ambition: a formal-logic
dimension that renders historical and modern notation, compares systems
pedagogically, and optionally verifies proofs via Lean. Two long proposal
conversations produced dense first-pass thinking across notation
rendering, Lean integration, pre-Fregean systems, stack choices, and
sequencing. That thinking needed a durable home before any ticket opens
implementation.

The Peirce case study establishes the pattern for deep-dives on
individual thinkers. Peirce was chosen first because he sits at the
intersection of every major thread — influence graph, formal-logic
layer (existential graphs as the richest 2D-diagrammatic foil to Frege),
and pedagogical comparison UI. The modern EG revival scholarship is
specifically captured because it's active research, not settled
history, and the *Logic of the Future* edition (Bellucci & Pietarinen,
2019–) is transformational for that field.

Docs-first lets subsequent seed-expansion, detail-page-enrichment, and
logic-explorer-scaffolding tickets reference a stable spec rather than
re-derive intent.

## Notes for future work

- **No GitHub Issue was created** for DOCS-004 because the repo is
  local-only (no remote). When a remote is added, backfill an Issue
  or retire the GitHub-Issue-linkage aspect of the ticket convention
  for local-only work.
- **Next tickets in the implied sequence:**
  - `DB-###-seed-peirce` — expand Peirce in `data/seed/*.json` per
    `docs/case-studies/peirce/README.md` § "Data plan".
  - `REFAC-###-extract-detail-page-components` — move inline helpers
    (`WorkCard`, `PhilosopherLink`, `NoteBlock`, `SectionHeading`)
    from `packages/web/src/routes/philosophers.$slug.tsx` into
    `packages/web/src/components/`.
  - `FEAT-###-philosopher-influence-graph-section` — add the
    `@xyflow/react` subgraph section to the philosopher detail page.
  - `FEAT-###-logic-explorer-phase-1-peirce-eg` — scaffold `/logic`
    with Peirce EG as the first populated system.
- **Schema decision deferred** — philosopher-detail schema
  extension (structured `concepts` / `bibliography` / `readingOrder`
  fields) is planned as Option A (encode as notes) for now. Revisit
  after 2–3 case studies have accumulated, per
  `docs/formal-logic/open-questions.md` §2.8.
- **Scope honesty flagged** — the full surface sketched across
  `docs/formal-logic/` is a multi-year project if built to spec. The
  80/20 alternative is captured in
  `docs/formal-logic/open-questions.md` §1.1. No commitment made
  either way.
- **Line-number references** in `docs/case-studies/peirce/README.md`
  (e.g., "line ~298") are approximate and will drift as
  `packages/web/src/routes/philosophers.$slug.tsx` evolves. When
  implementation tickets land, refresh references against the
  current file.
- **`docs/formal-logic/notation-systems.md` cites the gfnotation
  paper** (Wermuth, TUGboat 36(3), 2015) as a geometric spec for a
  future Begriffsschrift renderer. The actual renderer is deferred.
