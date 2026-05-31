# infra: Neo4jGraphService behind GRAPH_DATABASE_URL

**Branch slug:** `infra/neo4j-graph-service`
**Status:** queued
**Size:** L
**Depends on:** `refac/graph-service-interface`, `infra/neo4j-graph-load`

## Why

The payload ticket: an `IGraphService` backed by Neo4j, selected by env var,
answering the existing `/api/graph/*` routes via Cypher. Mirrors the
`DbFactory` strategy pattern — the default dev path stays in-memory; a
`bolt://`/`neo4j://` `GRAPH_DATABASE_URL` routes to Neo4j. Purely additive on top
of the interface seam: no route changes, no DTO changes.

This is infrastructure maturity (the planned Phase 2), **not** a perf win — at
382 edges the in-memory backend is already instant (scoping §6).

## Scope

**In:**

- `Neo4j.Driver` `PackageReference` + `.fsproj` `<Compile>` wiring.
- `Neo4jGraphService : IGraphService` — Cypher per method (difficulty table in
  scoping §5.2): `GetNode`/`FindNodes`/`Stats` (easy), `ShortestPath` (native
  `shortestPath()`), `GetSubgraph` + the four projections
  (`Influence`/`School`/`Curriculum`/`FullInfluenceNetwork`).
- Record→F# mapping that rehydrates `label`/`type` into both the `Attributes`
  map and the top-level `GraphNode.Label`/`GraphEdge.Type`, and reconstructs the
  `{label}:{slug}` key — wire shape byte-for-byte identical to the memory backend.
- `GraphFactory`: `GRAPH_DATABASE_URL` detection (`bolt://`/`neo4j://` → Neo4j,
  else Memory), mirroring `DbFactory`.
- Bolt URL → URI + `AuthTokens.Basic(user, pw)` split (driver takes auth
  separately); singleton `IDriver` registered in DI, disposed on shutdown.
- `GRAPH_DATABASE_URL` env-contract entry in the homelab Ansible/Dokploy
  templates.

**Out (captured separately):**

- Parity tests + CI → `.tickets/infra-neo4j-graph-tests.md`.
- Data load / constraints → `.tickets/infra-neo4j-graph-load.md`.
- Relational→Neo4j dual-write → future ticket (`graph-layer-design.md` §6.2).

## Build sketch

- Add the package; `GraphFactory` in `Program.fs` selects the backend from
  `GRAPH_DATABASE_URL`, mirroring `DbFactory.dialect`.
- Implement Cypher in order: `GetNode`/`Stats`/`ShortestPath` first (cheap wins),
  then `GetSubgraph`, then the four projections (`School`/`Curriculum` are the
  fiddly two — members + inter-member edges, prereq DAG + reference edges).
- One mapping helper: Neo4j record → existing F# graph types, preserving the
  wire shape.
- Manually diff a few endpoints' JSON against the memory backend on the same
  loaded data before handing off to the tests ticket.

## References

- `docs/neo4j-graph-backend-scoping.md` §5 (esp. §5.2 difficulty table + mapping)
- `packages/api-fsharp/PhilosophyExplorer.Api/Db/DbFactory.fs` — the pattern to mirror
- `packages/api-fsharp/PhilosophyExplorer.Api/Graph/MemoryGraphService.fs` — semantics to match
- `docs/homelab-migration-plan.md` — env/secret delivery for `GRAPH_DATABASE_URL`
- Neo4j .NET driver docs — `IAsyncSession.ExecuteReadAsync`, `AuthTokens`, `shortestPath`
</content>
