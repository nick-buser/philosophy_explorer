# infra: Neo4j graph backend — parity tests + CI

**Branch slug:** `infra/neo4j-graph-tests`
**Status:** queued
**Size:** M
**Depends on:** `infra/neo4j-graph-service`

## Why

Prove the two backends are interchangeable and keep them so. The current
`GraphServiceTests` instantiate `MemoryGraphService` directly against the JSON
file — pure, no I/O. Neo4j needs a *live* instance, which is a test-infra
decision with a real footprint tradeoff on the storage-tight dev machine:
hermetic-but-heavy vs cheap-but-non-hermetic.

## Scope

**In:**

- Decide and record the test-instance strategy: **Testcontainers-Neo4j**
  (hermetic, CI-friendly, ~500 MB+ image) vs **flag-gated against the homelab
  box** (cheap, needs network + creds, non-hermetic). Default to flag-gated unless
  hermetic CI is required — the dev machine is storage-tight.
- HTTP-boundary contract tests parameterized over `{memory, neo4j}`: same
  request, assert identical response shape on the same loaded data (the parity
  guarantee).
- CI (Woodpecker): provision-or-skip the Neo4j step; tests **skip cleanly** when
  no instance is reachable, mirroring the lean-on-`PATH` probe — local and CI runs
  without an instance stay green, not red.

**Out (captured separately):**

- Service code → `.tickets/infra-neo4j-graph-service.md`.

## Build sketch

- Pick the test-instance strategy (footprint-bounded).
- Load the same `graph-data.json` into the test Neo4j (reuse `graph:export-cypher`
  from `infra/neo4j-graph-load`).
- Parameterize the graph contract tests over both backends; assert parity
  endpoint-by-endpoint.
- Wire/gate the CI step; confirm green with no instance present.

## References

- `docs/neo4j-graph-backend-scoping.md` §5.3
- `packages/api-fsharp/PhilosophyExplorer.Tests/GraphServiceTests.fs`
- `.tickets/infra-lean-runner-spike.md` — the PATH-probe skip pattern to reuse
- `.woodpecker.yml` — the `check` step to extend
</content>
