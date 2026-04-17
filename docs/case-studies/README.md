# Case Studies

**Status:** Draft — first-pass pattern, 2026-04-16

Deep-dive research on individual thinkers that drives seed data, detail-page
UX, and occasionally a feature-specific surface (e.g., the logic-systems
explorer tab for Peirce).

---

## What a case study is

A curated, multi-file research set on one thinker that:

1. **Curates the reading** — entry-point primary sources, a DAG of what
   depends on what, recommended paths by interest.
2. **Curates secondary literature** — orientation texts, interpretive
   monographs, reference works, with blurbs that explain the *shape* of
   each source.
3. **Maps intellectual context** — who influenced them, who they
   influenced, who their contemporaries were, with citations for each edge.
4. **Drives seed data** — the docs specify what gets added to
   `data/seed/*.json`; implementation tickets do the adding.
5. **Drives detail-page UX** — the docs specify what changes to
   `packages/web/src/routes/philosophers.$slug.tsx`; implementation
   tickets do the changing.
6. **Optionally anchors a feature** — e.g., Peirce anchors the logic-systems
   explorer because existential graphs are the first notation system we
   populate.

A case study is *narrative* — why this reading order, why this interpreter
is worth reading, what's contested. The `data/seed/` JSON is the structured
residue.

---

## When to open one

Open a case study when a thinker meets one of these:

- Pivotal for ≥2 surfaces of the app (e.g., Peirce: influence graph +
  formal-logic layer + comparison UI).
- Has a non-trivial reading curve worth mapping (most canonical figures).
- Anchors a feature we're building (their work is the motivating content
  for the feature).

Not every thinker needs one. Many are covered adequately by their `bioShort`
and a handful of influence edges.

---

## Template structure

Every case study is a folder under `docs/case-studies/<slug>/` with at
least:

| File | Purpose |
|---|---|
| `README.md` | Why this thinker, scope, sibling-file map, data-plan, detail-page-plan, feature-integration plan. |
| `reading-dag.md` | Primary-source reading DAG with blurbs; multiple recommended paths by interest. |
| `secondary-literature.md` | Intros, interpretive monographs, reference works. |
| `influences-and-context.md` | Influences in, influences out, contemporaries — with citations. |

Optional files for specialist threads:

- A scholarship-revival file (e.g., `existential-graph-scholarship.md`
  for Peirce) — for active research communities centered on the thinker.
- A feature-specific integration file if warranted (usually lives under
  `docs/formal-logic/` or similar, not here).

Each file opens with:

```
**Status:** Draft — first-pass notes, YYYY-MM-DD
```

---

## What lives where

| Layer | Content | Location |
|---|---|---|
| Narrative | Why, blurbs, context, citations, scholarship notes | `docs/case-studies/<slug>/` |
| Structured data | Nodes, edges, notes, typed records | `data/seed/*.json` |
| Rendering | How data is displayed | `packages/web/src/**` |

**Discipline:** don't put blurbs in seed data; don't put edge data in
docs. Narrative and structured data are separate concerns. A detail page
reads the structured data; a reader reads the narrative.

---

## Naming

- Folder name = philosopher slug.
- Philosopher slug = the `slug` field in `data/seed/philosophers.json`.
- That slug = the graph key suffix (`philosopher:<slug>`).

Keep the three aligned so a single string (the slug) takes you from doc
to data to graph key.

---

## Execution rhythm

Roughly:

1. Open a ticket `DOCS-###-case-study-<slug>` for the docs.
2. Write the case-study docs on a branch (what you're reading is the
   result for Peirce).
3. Merge docs; open a ticket `DB-###-seed-<slug>` for the seed additions
   the docs specify.
4. Merge seed; open a ticket `FEAT-###-<slug>-detail-page` for detail-page
   UX if the new seed content needs new rendering.
5. Optional: feature-specific tickets (e.g., logic-explorer integration).

Docs first means the seed and UI work has a stable spec to follow.

---

## Current case studies

- [`peirce/`](./peirce/README.md) — Charles Sanders Peirce. First case
  study; establishes the pattern.
