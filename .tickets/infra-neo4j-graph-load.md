# infra: Neo4j graph — repeatable Cypher load + constraints

**Branch slug:** `infra/neo4j-graph-load`
**Status:** queued
**Size:** S–M
**Depends on:** `infra/neo4j-connectivity-spike`

## Why

The spike loads data by hand; the service needs a committed, repeatable way to
(re)build the Neo4j graph from `data/graph-data.json` — the `graph:export-cypher`
script deferred in INFRA-002. The graph stays *sourced* from the JSON: Neo4j is a
rebuildable projection, not a system of record. This ticket is the data pipeline
only; the service code is separate.

## Scope

**In:**

- `graph:export-cypher` npm script: `graph-data.json` → Cypher (or an APOC-based
  load, per the spike's finding), emitting idempotent `MERGE` statements.
- Constraints/indexes as Cypher migration(s): unique node key per label,
  relationship-type indexes.
- Faithful mapping: graphology `attributes.label` / `attributes.type` → real
  Neo4j node labels + relationship types, preserving `slug` and the
  `{label}:{slug}` compound key (see scoping §5.2).
- Re-runnable refresh: loading twice does not duplicate nodes/edges.

**Out (captured separately):**

- Live relational→Neo4j dual-write — future ticket
  (`docs/graph-layer-design.md` §6.2); not queued.
- Service code → `.tickets/infra-neo4j-graph-service.md`.

## Build sketch

- Pick generator (custom ~50-line script) vs APOC import based on the spike.
- Emit constraints first, then node `MERGE`s, then relationship `MERGE`s.
- Wire the npm script; document the load/refresh command in `docs/`.
- Assert the loaded graph's stats match `MemoryGraphService` (274 nodes / 382
  edges) as the acceptance check.

## References

- `docs/neo4j-graph-backend-scoping.md` §4, §5.2 (the label/type mapping subtlety)
- `work-history/INFRA-002.md` — deferred `graph:export-cypher`, `pgraphs` note
- `data/graph-data.json` — the source of truth
</content>
