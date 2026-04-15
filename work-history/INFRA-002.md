# INFRA-002 — Unified Graph Layer

**Branch:** `infra/INFRA-002-unified-graph-layer`
**Merged:** 2026-04-15

## What changed

- Added `packages/api/src/graph/` with `GraphService` interface and `MemoryGraphService` (graphology-backed) implementation
- Added `src/graph/types.ts` defining node labels (Philosopher, Work, School, CurriculumItem), edge types (INFLUENCED, MEMBER_OF, AUTHORED, PREREQ_OF, REFERENCES_WORK, REFERENCES_PHILOSOPHER), and shared data types
- Added `src/graph/build-graph.ts` script that converts seed-data.ts + curriculum JSON into a unified graph-data.json (274 nodes, 382 edges)
- Added `src/graph/index.ts` factory with GRAPH_DATABASE_URL strategy pattern (memory vs future neo4j)
- Added `src/routes/graph.ts` with 8 OpenAPI endpoints for graph queries (stats, node lookup, neighbors, shortest path, influence/school/curriculum projections, full influence network)
- Added graph type shims for graphology under moduleResolution: NodeNext
- Added `npm run graph:build` script to root and api package.json
- Added 11 unit tests for MemoryGraphService and 8 route integration tests
- Fixed health test mock to use importOriginal (was fragile when new routes needed schema)
- Created `docs/graph-layer-design.md` comprehensive design document
- Updated CLAUDE.md with graph layer documentation
- Dependencies added: graphology, graphology-types, graphology-shortest-path, graphology-traversal, graphology-operators

## Why

The codebase had an implicit supergraph scattered across four disconnected storage mechanisms: philosopher influences (SQL join table), school memberships (SQL join table), authorship (FK), and curriculum prerequisites (frontend-only JSON). These shared node identities by slug but had no shared index, no cross-subgraph queries, and no path to graph-native operations like shortest path or ego-graph extraction.

This change establishes a centralized graph that:
1. Consolidates all relationships into a single typed, directed property graph
2. Uses graphology's JSON format which maps directly to Neo4j import (via pgraphs or Cypher generation)
3. Provides a service interface with a dev/prod strategy pattern matching the existing Postgres/SQLite pattern
4. Exposes graph queries through well-defined API endpoints that return self-contained subgraphs for frontend rendering

## Notes for future work

- **Neo4j implementation:** `Neo4jGraphService` is stubbed but not implemented. The `GRAPH_DATABASE_URL=bolt://...` codepath throws. Implement when concurrent writes or > 10k edge traversals are needed. The design doc covers the migration path.
- **pgraphs interop:** The `pgraphs` npm package converts graphology JSON ↔ Cypher CREATE statements. Add a `graph:export-cypher` script when Neo4j is configured.
- **FalkorDBLite:** Evaluated as an alternative dev backend (real Cypher in dev). Too immature at v0.2.0 — revisit at v1.0.
- **Dual-write sync:** When entities are created/updated via the relational API (POST /api/philosophers, etc.), the graph layer should be updated too. Currently the graph is only rebuilt via `npm run graph:build`. A future ticket should add graph-update hooks to the relational write path.
- **OpenAPI spec regeneration:** The graph routes are registered with zod-openapi but the spec file hasn't been regenerated yet (requires running API server). Run `npm run gen:spec` + `npm run gen:types` once the API server is running.
- **Frontend graph visualization:** The API returns `SerializedSubgraph` in a format ready for ReactFlow/Sigma.js rendering. A generic `<GraphView>` component could render any projection (influence, school, curriculum) with different node/edge styling.
- **Curriculum DB migration:** When curricula move from frontend JSON to DB tables, their PREREQ_OF edges are already in the unified graph. The DB migration should not create a separate dependency table — use the graph layer instead.
