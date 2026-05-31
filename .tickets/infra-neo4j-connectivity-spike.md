# infra: Neo4j graph backend — connectivity spike

**Branch slug:** `infra/neo4j-connectivity-spike`
**Status:** queued
**Size:** M
**Depends on:** none

## Why

Mirror the lean-runner spike pattern: before building a real
`Neo4jGraphService`, prove the *plumbing* to the deployed homelab Neo4j and
retire the unknowns cheaply. The deliverable is a proven connection plus
measurements — not service code, not a UI. A throwaway hand-load stands in for
the productionized pipeline.

Three unknowns to retire before the service ticket leans on them: (1) is the box
reachable over Bolt from both the dev machine and the deploy target, with auth
sourced from Keychain; (2) is APOC available (decides JSON-import vs hand-rolled
Cypher) and is the instance Community single-DB (decides dev/prod isolation);
(3) does a loaded traversal return results identical to `MemoryGraphService` on
the same data.

**Local footprint — flagged.** No Neo4j container locally for the spike; talk to
the deployed instance directly so the storage-tight dev machine stays clean.

## Scope

**In:**

- Confirm `bolt://` reachability from dev machine + deploy target; pull
  credentials from Keychain via the existing `add-app-db-vars` flow (no committed
  secrets).
- One-off load of `data/graph-data.json` — APOC `apoc.import.json` if present,
  else a quick node/edge → Cypher `MERGE` converter.
- Apply a uniqueness constraint on node key; run a sample influence ego-graph
  (e.g. `philosopher:immanuel-kant`) via `cypher-shell` / Neo4j browser and
  eyeball it against `MemoryGraphService` output.
- Record findings (APOC yes/no, Community single-DB yes/no, auth shape, chosen
  load path, footprint/timing) in the work-history doc — these drive
  `infra/neo4j-graph-load` and `infra/neo4j-graph-service`.

**Out (captured separately):**

- Committed repeatable load script + constraints migration →
  `.tickets/infra-neo4j-graph-load.md`.
- The `IGraphService` seam → `.tickets/refac-graph-service-interface.md`.
- Service code → `.tickets/infra-neo4j-graph-service.md`.

## Build sketch

- Get the Bolt URL + creds from Keychain; `cypher-shell` smoke (`RETURN 1`).
- Quick converter (the JSON is already graphology `nodes`/`edges`) **or**
  `apoc.import.json`; map `attributes.label`/`attributes.type` to real node
  labels + relationship types.
- Constraint on key; load; verify a known ego-graph matches the memory backend.
- Write findings into `work-history/infra-neo4j-connectivity-spike.md`; they
  decide the load approach and isolation strategy for the next two tickets.

## References

- `docs/neo4j-graph-backend-scoping.md` §4
- `docs/graph-layer-design.md` §3.3, §6.1
- `packages/api-fsharp/PhilosophyExplorer.Api/Db/DbFactory.fs` — URL/auth-parsing pattern
- `.tickets/infra-lean-runner-spike.md` — the spike-first pattern this mirrors
</content>
