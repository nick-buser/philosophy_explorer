# Formal Logic Layer — Design Notes

**Status:** Draft — first-pass notes, 2026-04-16
**Scope:** Multi-thread, multi-ticket initiative. No tickets open yet.

---

## Vision

Philosophy-explorer gains a *formal-logic* dimension. It renders historical
and modern logical notation (Aristotelian through Frege through modern
symbolic), lets users compare systems on the same proposition, models
argument structure as a graph, and optionally verifies proofs by mediating
to a headless Lean instance.

The point is not "yet another proof assistant frontend." It's to make the
*historical and structural* differences between logical systems legible —
to show what Frege's Begriffsschrift was reacting against, why it was a
step-change, and where its descendants (Lean, modern type theory) sit in
that lineage.

---

## Threads

This folder decomposes the effort into threads that can evolve
independently. Each file is first-pass notes, not a committed spec.

| Thread | File | Summary |
|---|---|---|
| Notation systems | [`notation-systems.md`](./notation-systems.md) | Rendering Frege's Begriffsschrift and pre-Fregean systems (Aristotelian, Stoic, Leibniz, Boole, Peirce EG, Venn, Schröder). |
| Logic explorer tab | [`logic-explorer-tab.md`](./logic-explorer-tab.md) | New top-level app surface for browsing and comparing notation systems. |
| Formal verification | [`formal-verification.md`](./formal-verification.md) | Lean integration — deep embedding of Begriffsschrift, headless-Lean proof-checking pipeline. |
| Argument graph | [`argument-graph.md`](./argument-graph.md) | Meta-level graph where formulas are node payloads and edges are inferential relations (Toulmin / Brandomian). |
| Editor & IR | [`editor-and-ir.md`](./editor-and-ir.md) | Shared intermediate representation across logic systems; structured formula editor; parser strategy. |
| Open questions | [`open-questions.md`](./open-questions.md) | Unresolved decisions, scope-cut alternatives, risk register. |

**Related:** [`../case-studies/`](../case-studies/) — in-depth case studies on individual thinkers. Charles Sanders Peirce is the first; his existential graphs are the first populated system in the logic explorer.

---

## Suggested sequencing

A pragmatic order, not a commitment. Each step opens its own ticket.

1. **AST + parser** for a Frege short-form DSL (see `editor-and-ir.md`).
2. **SVG renderer** for the AST, geometry cribbed from the gfnotation paper.
3. **Lean propositional fragment** — formalize Begriffsschrift Part I,
   expose a `/api/verify` endpoint that ships AST → Lean, gets back
   verified/unverified.
4. **Argument-graph layer** — formulas as node payloads in the unified
   graph, inference relations as typed edges.
5. **Peirce existential graphs** as a second notation — reuses the SVG
   infrastructure, gives a genuine 2D-diagrammatic foil to Frege.
6. **Boolean / Schröder** — trivial KaTeX add once the comparison
   framework is in place.

Aristotelian and scholastic material probably lives as *prose notes with
schema diagrams*, not as a mechanized system — unless we specifically
want syllogistic validity-checking. See `open-questions.md`.

---

## Relationship to existing work

- **`../graph-layer-design.md` (INFRA-002)** — the base unified graph
  consolidates philosopher / work / school / curriculum relationships.
  The *argument-graph* proposed here is a second graph type sitting on
  the same infrastructure: formulas as node payloads, inferences as
  typed edges. They may share Neo4j storage but model different things.
- **Seed data (`data/seed/`)** — currently covers philosophers, works,
  schools, influences, notes. No dedicated entries for Frege or Peirce
  yet; those will land when the notation work opens. Existing schema
  has room for them via the `Philosopher` node type.
- **Installed web deps** — `@xyflow/react` and `@dagrejs/dagre` are
  installed and would be used for the argument-graph view. No math
  rendering (KaTeX/MathJax), Lean, or parser-combinator deps yet.

---

## Reading order

Start with `notation-systems.md` — it frames what "formal logic" means
here and what we're rendering. Then branch by interest:

- Care about proof-checking? → `formal-verification.md`.
- Care about argument structure / graph modeling? → `argument-graph.md`.
- Care about authoring UX / how this gets built? → `editor-and-ir.md`.
- Looking for what's *unsettled*? → `open-questions.md`.
