# feat: Logic Lab Description Logic — OWL syntax import

**Branch slug:** `feat/logic-lab-dl-owl-import`
**Status:** queued
**Size:** M
**Depends on:** `feat/logic-lab-description-logic` (ALC base);
ideally `feat/logic-lab-dl-shiq` so realistic ontologies parse
without a "feature unsupported" wall on every line.

## Why

The DL Lab's hand-rolled DSL is fine for teaching, but the
"description logic / OWL" framing only really pays off if the Lab
can consume real ontologies the user already has on disk
(`pizza.owl`, `family.owl`, fragments of SNOMED CT). Manchester
syntax is human-readable and OWL Functional syntax is the W3C
normative form; either is a tractable starting parser.

## Scope

**In:**
- **Manchester syntax parser.** OWL's human-readable surface;
  every Protégé export uses it. Keywords: `Class`, `SubClassOf`,
  `EquivalentTo`, `Individual`, `Types`, `Facts`, `ObjectProperty`,
  `DataProperty`, `Domain`, `Range`, etc. Block-structured;
  whitespace-sensitive in places.
- **OWL Functional syntax parser.** The W3C normative serialization
  (`Declaration(Class(:Foo))`, `SubClassOf(:Foo :Bar)`). Less
  pretty; trivially LR-parseable.
- **Internal mapping** Manchester / Functional → the in-memory
  TBox / ABox / RBox structures the reasoner already consumes.
- **Diagnostics**: when an axiom uses a feature outside the
  currently-supported DL fragment (e.g. nominals when only ALC is
  shipped), surface a clear "this needs SROIQ — see
  `feat-logic-lab-dl-sroiq.md`" message rather than silently
  dropping the axiom.
- A `/dl/import` panel in the Lab that takes pasted OWL text and
  produces the structured KB views (TBox table, ABox graph,
  classification).

**Out (captured separately):**
- **RDF/Turtle ingestion.** OWL-as-RDF triples need a triple
  parser plus an OWL-2 Mapping-to-RDF-Graphs reverse-mapper;
  bigger surface than Manchester. → `feat-logic-lab-dl-owl-rdf.md`
  (open this ticket file when starting that work).
- **OWL/XML.** Defer indefinitely; nobody hand-writes it and
  Manchester / Functional cover the human-and-machine cases.
- **Real-world performance.** Importing SNOMED CT is the EL
  profile's job — see `feat-logic-lab-dl-el-profile.md`.

## Build sketch

- `dl-manchester-parser.ts` — recursive-descent over Manchester's
  block syntax; tokenizer that respects keywords, IRIs, and
  comments.
- `dl-functional-parser.ts` — straightforward S-expression-style
  parser.
- `dl-owl-import.ts` — pure mapping from parsed AST to KB.
- Lab panel: a paste-area + "Import" button; the resulting KB
  drives the same TBox / ABox / classifier panels as the DSL.

## References

- W3C OWL 2 Manchester Syntax —
  https://www.w3.org/TR/owl2-manchester-syntax/
- W3C OWL 2 Functional-Style Syntax —
  https://www.w3.org/TR/owl2-syntax/
- The Pizza ontology (Stanford BioPortal) — small canonical
  example used in every OWL tutorial.
