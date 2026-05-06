# feat: Logic Lab Description Logic — Datatype properties

**Branch slug:** `feat/logic-lab-dl-datatypes`
**Status:** queued
**Size:** S–M
**Depends on:** `feat/logic-lab-description-logic` (ALC base) — does
*not* depend on SHIQ; the datatype layer is orthogonal.

## Why

Real ontologies always need to talk about numbers, strings, and
dates: `Adult ⊑ Person ⊓ ∃age.[≥18]`, `Book ⊑ ∃isbn.xsd:string`.
This is the `(D)` in SROIQ(D) and the difference between "toy DL
demo" and "anything an ontology engineer would actually use".

## Scope

**In:**
- Datatype concepts: `xsd:integer`, `xsd:decimal`, `xsd:string`,
  `xsd:dateTime`, `xsd:boolean` (the OWL 2 normative subset).
- Datatype restrictions:
  - Numeric range — `[≥18]`, `[<100]`, `[10..20]`.
  - String literals — `[="Foo"]`.
  - Datatype enumerations — `{1, 2, 3}`.
- Datatype-typed roles (data properties), distinguished from
  object properties at the AST level.
- A small concrete-domain solver per datatype:
  - Numeric: rational-arithmetic interval reasoning.
  - String: equality + finite-set membership.
  - Boolean: trivial.
  - DateTime: as numeric (POSIX-style) for v1.
- Tableau hooks: when a data-property assertion or restriction
  fires, run the concrete-domain solver to detect inconsistency.
- ~3 examples illustrating numeric range, enumeration, and
  string-equality restrictions.

**Out (captured separately):**
- `xsd:duration`, `xsd:hexBinary`, custom-defined datatypes — most
  ontologies don't use these and the OWL 2 spec leaves them for
  another day. Add only if a concrete example demands them.
- Decimal precision / IEEE float corner cases — out of scope for
  v1; rationals are sufficient.

## Build sketch

- AST: introduce `DataConcept`, `DataProperty`, `DataLiteral`
  alongside the object-side concepts and roles.
- Parser: `xsd:` prefix for datatype names; `[…]` for restrictions.
- Concrete-domain solver:
  - `numeric.ts` — interval intersection, gap detection.
  - `strings.ts` — finite-set membership.
  - `booleans.ts` — trivial.
- Tableau: per-individual map `dataProp → constraint set`; on
  expansion, intersect new constraint and check satisfiability via
  the appropriate solver.
- Reasoner: classification ignores datatype branches; instance
  checking honours them.

## References

- Horrocks & Sattler, *Decidability of SHIQ with Complex Role
  Inclusion Axioms* (2003) — establishes the datatype interface.
- W3C OWL 2 Datatype Maps —
  https://www.w3.org/TR/owl2-syntax/#Datatype_Maps.
