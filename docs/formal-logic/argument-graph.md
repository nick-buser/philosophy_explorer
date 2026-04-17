# Argument Graph Layer

**Status:** Draft — first-pass notes, 2026-04-16

A second graph type layered on top of the existing entity graph. Nodes
are propositions / formulas; edges are inferential relations.

---

## 1. Relationship to `../graph-layer-design.md`

The unified graph (INFRA-002) models **entity** relationships:
Philosopher, Work, School, CurriculumItem, with edges like `INFLUENCED`,
`AUTHORED`, `MEMBER_OF`, `PREREQ_OF`.

The argument-graph proposed here models **propositional** relationships:
nodes are formulas (or claims carrying formulas), edges are inferential
commitments between those formulas. The two are conceptually distinct
but can share infrastructure — both are labeled property graphs, both
use the `{label}:{slug}` key convention, both are well-served by Neo4j
when we get there.

Where they meet: a formula node can reference its author via an
`ASSERTED_BY` edge to a Philosopher, or its source via `APPEARS_IN` to
a Work. That's the seam between the two layers.

---

## 2. Modeling approaches

Two complementary traditions, pick the modeling that fits the use case.

### 2.1 Toulmin structure

The classical argument-mapping model (Stephen Toulmin, 1958):

```
Data ──→ Claim
          │
          ├── Warrant   (why data supports claim)
          ├── Backing   (why warrant is acceptable)
          ├── Qualifier (hedges: "usually", "presumably")
          └── Rebuttal  (conditions under which claim fails)
```

Good for mapping *rhetorical* or *informal* argument. Natural fit for
analyzing historical arguments in primary sources.

Node labels: `Claim`, `Datum`, `Warrant`, `Backing`, `Rebuttal`.
Edge types: `SUPPORTS`, `WARRANTS`, `BACKS`, `REBUTS`, `QUALIFIES`.

### 2.2 Brandomian inferential commitments

Robert Brandom's inferentialism (*Making It Explicit*, 1994): meaning
is use, use is normative-inferential, and inferential relations come in
three flavors:

- **Commits** — asserting A commits one to B. ("A ⇒ B")
- **Entitles** — asserting A entitles one to B. (A is *sufficient
  grounds* for B without forcing it.)
- **Precludes** — asserting A precludes B. ("A makes B unassertable.")

Fit for philosophy-explorer is especially strong: the existing domain
already models philosopher influences as a typed directed graph, and
Brandomian edges slot naturally into the same abstraction — with the
upgrade that *content*, not just attribution, is now graph-bearing.

Node labels: `Proposition` (with formula payload).
Edge types: `COMMITS_TO`, `ENTITLES_TO`, `PRECLUDES`.

### 2.3 Formal derivation edges

Where a formal proof connects premises to conclusion, surface that as
edges too:

- `DERIVES` — target follows from source(s) via a named inference rule.
- `AXIOM_OF` — proposition is an axiom of the named system.
- `VERIFIED_BY` — link to a Lean verification result (see
  `formal-verification.md`).

This is where the graph meets the verifier: every `DERIVES` edge can
optionally carry a verified Lean proof term.

---

## 3. Storage

Per CLAUDE.md, the current architecture uses an **in-memory graph
service** backed by `graph-data.json`, with **Neo4j** as the future
target. Postgres holds non-graph metadata.

Proposed split for argument-graph data:

| Data | Storage |
|---|---|
| Formula ASTs, proposition payloads | Postgres (JSONB column on `propositions`) |
| Provenance (source passage, translation, editor) | Postgres |
| Proposition nodes + inferential edges | Unified graph (in-memory today, Neo4j later) |
| Lean verification results | Postgres, content-hashed |

Graph traversal queries (find all commitments of X, find a derivation
chain from A to B) are where Neo4j earns its keep. Until then, the
in-memory `MemoryGraphService` extends cleanly — add new node labels
and edge types, reuse the existing adjacency-list infrastructure.

---

## 4. Prior art

Not inventing argument mapping. Reference points:

- **IBIS** (Issue-Based Information System, Rittel 1970) — issue /
  position / argument node types; well-established in design rationale.
- **Rationale** / **bCisive** — commercial argument mapping tools.
- **Araucaria** — academic argument-analysis system; XML-based scheme
  library.
- **AIF** (Argument Interchange Format) — standardized ontology for
  computational argument representation.

What's distinctive here is the **composition with formal
verification**: argument-graph edges can be promoted from informal
("A supports B") to formal ("A derives B via modus ponens, verified
by Lean"). The graph is the home for both.

---

## 5. Open modeling questions

- Should formulas be stored as ASTs (Postgres JSONB) or normalized
  (canonical-form hash + separate syntax tree)? Normalization enables
  de-duplication of equivalent propositions, but normalization is itself
  a hard logic problem.
- How do we handle *translation* between systems? A proposition in
  Aristotelian term logic and its Frege-predicate-logic counterpart
  are semantically related but syntactically incommensurable — one
  node with multiple renderings, or separate nodes with a
  `TRANSLATES_TO` edge?
- Toulmin vs. Brandom vs. both — is it one graph with mixed edge
  types, or separate graph projections sharing nodes?

See `open-questions.md`.
