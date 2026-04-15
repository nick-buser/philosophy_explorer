# Unified Graph Layer — Design Document

**Date:** 2026-04-15
**Ticket:** INFRA-002
**Status:** Accepted

---

## 1. Problem Statement

The philosophy-explorer codebase has an implicit supergraph spread across four
disconnected storage mechanisms:

| Subgraph | Storage | Nodes | Edges |
|---|---|---|---|
| Philosopher influences | Postgres/SQLite `philosopher_influences` table | Philosophers | `INFLUENCED` (directed, typed) |
| School memberships | Postgres/SQLite `philosopher_schools` table | Philosophers, Schools | `MEMBER_OF` (with role) |
| Authorship | Postgres/SQLite `works.philosopher_id` FK | Philosophers, Works | `AUTHORED` (implicit 1:M) |
| Curriculum prereqs | Frontend JSON files | CurriculumItems (works/secondary texts) | `PREREQ_OF` (directed) |

These subgraphs share node identities (philosopher slugs, work slugs) but have no
shared index, no referential integrity across subgraphs, and no way to query across
them. Adding "Kant influenced Hegel" doesn't automatically create the backlink
"Hegel was influenced by Kant" — it happens to work only because the API queries
both directions from the same `philosopher_influences` table, but the curriculum
dependency graph (which also encodes influence-like relationships between works)
is entirely disconnected.

**Goal:** Consolidate all relationship data into a single, typed, directed property
graph that:

1. Is the **single source of truth** for all entity relationships
2. Maps cleanly to Neo4j's labeled property graph model
3. Can be serialized to JSON for version control and dev persistence
4. Can be projected into local subgraph views for each use case
5. Supports a dev/prod strategy pattern (in-memory vs. Neo4j)

---

## 2. Unified Graph Model

### 2.1 Node Labels

Every entity in the domain becomes a graph node with a label and properties.
The `key` is the entity's slug, globally unique per label.

| Label | Key example | Properties |
|---|---|---|
| `Philosopher` | `immanuel-kant` | name, bornYear, diedYear, nationality, bioShort, era |
| `Work` | `critique-of-pure-reason` | title, originalTitle, workType, composedYear, language |
| `School` | `german-idealism` | name, periodStartYear, periodEndYear, description |
| `CurriculumItem` | `ancient-greek:plato-republic` | title, author, type (primary/secondary), curriculumSlug |

Node keys are composed as `{label}:{slug}` for global uniqueness in the graph.

### 2.2 Edge Types

All relationships become typed, directed edges with optional properties.

| Edge type | Source → Target | Properties | Cardinality |
|---|---|---|---|
| `INFLUENCED` | Philosopher → Philosopher | influenceType (direct/indirect/critical/revival), description | M:M |
| `MEMBER_OF` | Philosopher → School | role (founder/member/student/critic/associated) | M:M |
| `AUTHORED` | Philosopher → Work | | 1:M (from work's perspective) |
| `PREREQ_OF` | CurriculumItem → CurriculumItem | note | M:M, DAG |
| `REFERENCES_WORK` | CurriculumItem → Work | | 0..1:M |
| `REFERENCES_PHILOSOPHER` | CurriculumItem → Philosopher | | 0..1:M |
| `NOTE_ON` | Note → Philosopher \| Work \| School | noteType, sourceType | M:1 |

### 2.3 Invariants

1. **Influence edges are directional but queryable both ways.** The graph stores
   `A -[INFLUENCED]-> B`. "B was influenced by A" is derived by traversing incoming
   edges on B, never by storing a separate row.

2. **Slug uniqueness is per-label.** `philosopher:plato` and `school:platonism` are
   distinct nodes. The compound key `{label}:{slug}` is globally unique.

3. **Curriculum items reference but don't duplicate domain nodes.** A curriculum item
   that maps to a work has a `REFERENCES_WORK` edge, not a copy of the work's properties.

4. **All edges are directed.** "Bidirectional" queries are answered by traversing
   incoming edges, not by storing symmetric edge pairs.

### 2.4 Graphology JSON Format (dev persistence)

The canonical JSON format uses graphology's native `export()` shape:

```json
{
  "attributes": { "name": "philosophy-explorer-graph", "version": "1.0.0" },
  "options": { "type": "directed", "multi": true, "allowSelfLoops": false },
  "nodes": [
    {
      "key": "philosopher:immanuel-kant",
      "attributes": {
        "label": "Philosopher",
        "slug": "immanuel-kant",
        "name": "Immanuel Kant",
        "bornYear": 1724,
        "diedYear": 1804
      }
    }
  ],
  "edges": [
    {
      "key": "influenced:hume->kant:direct",
      "source": "philosopher:david-hume",
      "target": "philosopher:immanuel-kant",
      "attributes": {
        "type": "INFLUENCED",
        "influenceType": "direct",
        "description": "Hume awoke Kant from his dogmatic slumber."
      }
    }
  ]
}
```

This format:
- Is directly loadable by `graphology` via `graph.import()`
- Can be converted to Cypher CREATE statements via the `pgraphs` npm tool
- Is human-readable and diffable in version control
- Supports Neo4j import via APOC JSON procedures or Cypher generation

---

## 3. Dual-Environment Persistence Strategy

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────┐
│              GraphService interface          │
│  getNode · getNeighbors · getSubgraph       │
│  shortestPath · findByLabel · query         │
└──────────┬──────────────────────┬───────────┘
           │                      │
    ┌──────▼──────┐       ┌──────▼──────┐
    │  MemoryGraph │       │  Neo4jGraph  │
    │  (graphology)│       │ (neo4j-driver)│
    │  + JSON file │       │ + Bolt conn  │
    └─────────────┘       └─────────────┘
      dev / test            staging / prod
```

### 3.2 Dev Environment: graphology + JSON

**Dependencies:** `graphology`, `graphology-types`, `graphology-shortest-path`,
`graphology-traversal`, `graphology-operators`

**Persistence:** A single `graph-data.json` file in `packages/api/src/data/`.
Loaded into memory at startup, mutations written back on change (debounced).
For the seed workflow, a build script converts existing seed arrays into the
canonical graph JSON.

**Why not SQLite recursive CTEs?** The project already plans to outgrow CTEs
for deep traversal. Building new graph infrastructure on CTEs invests in a dead
end. Graphology gives us the actual graph algorithms (BFS, shortest path,
subgraph extraction) that CTEs struggle with, and its JSON format maps directly
to Neo4j import.

**Why not FalkorDBLite?** Promising (real Cypher in dev), but v0.2.0 with 5 GitHub
stars and 4 contributors. Too immature for a dependency we'd build a service layer
on. Worth revisiting at v1.0.

### 3.3 Prod Environment: Neo4j via Bolt

**Dependencies:** `neo4j-driver` (v5+)

**Persistence:** Full Neo4j server (self-hosted or Aura). Connected via Bolt
protocol. The same `GraphService` interface is implemented with Cypher queries.

**Migration path:** The dev JSON is the source of truth. A `graph:sync` script
converts the JSON to Cypher CREATE statements (via pgraphs or a custom generator)
and loads it into Neo4j. Schema constraints (unique node keys, relationship type
indexes) are applied via Cypher migration scripts.

### 3.4 Environment Detection

Mirrors the existing Postgres/SQLite pattern:

```typescript
// Detect from environment
const GRAPH_URL = process.env.GRAPH_DATABASE_URL;

// undefined or "memory" → graphology (dev)
// "bolt://..." or "neo4j://..." → neo4j-driver (prod)
```

### 3.5 Dev → Prod Data Flow

```
seed-data.ts  ──►  build-graph.ts  ──►  graph-data.json  ──►  graphology (dev)
                                              │
                                              ▼
                                     graph:export-cypher
                                              │
                                              ▼
                                    Neo4j Cypher import (prod)
```

---

## 4. Service Layer Design

### 4.1 GraphService Interface

```typescript
interface GraphService {
  // ── Node operations ──
  getNode(key: string): Promise<GraphNode | null>;
  findNodes(label: string, filter?: Record<string, unknown>): Promise<GraphNode[]>;

  // ── Edge operations ──
  getEdges(nodeKey: string, opts?: {
    direction?: 'in' | 'out' | 'both';
    edgeType?: string;
  }): Promise<GraphEdge[]>;

  // ── Traversal ──
  getNeighbors(nodeKey: string, opts?: {
    depth?: number;           // default 1
    direction?: 'in' | 'out' | 'both';
    edgeTypes?: string[];     // filter by edge type
    nodeLabels?: string[];    // filter neighbor labels
  }): Promise<GraphNode[]>;

  getSubgraph(rootKey: string, opts?: {
    depth?: number;
    direction?: 'in' | 'out' | 'both';
    edgeTypes?: string[];
  }): Promise<SerializedSubgraph>;

  shortestPath(
    fromKey: string,
    toKey: string,
    opts?: { edgeTypes?: string[]; maxDepth?: number }
  ): Promise<GraphPath | null>;

  // ── Projection (local context extraction) ──
  getInfluenceGraph(philosopherSlug: string, depth?: number): Promise<SerializedSubgraph>;
  getSchoolGraph(schoolSlug: string): Promise<SerializedSubgraph>;
  getCurriculumGraph(curriculumSlug: string): Promise<SerializedSubgraph>;
  getFullInfluenceNetwork(): Promise<SerializedSubgraph>;
}
```

### 4.2 Data Types

```typescript
interface GraphNode {
  key: string;             // "philosopher:immanuel-kant"
  label: string;           // "Philosopher"
  attributes: Record<string, unknown>;
}

interface GraphEdge {
  key: string;
  source: string;          // source node key
  target: string;          // target node key
  type: string;            // "INFLUENCED", "MEMBER_OF", etc.
  attributes: Record<string, unknown>;
}

interface GraphPath {
  nodes: GraphNode[];
  edges: GraphEdge[];
  length: number;
}

interface SerializedSubgraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

### 4.3 Projection Pattern (Central → Local)

The graph service provides **projection methods** that extract subgraphs for
specific UI contexts. This keeps the graph central while giving local consumers
exactly the shape they need:

| Consumer | Projection method | What it returns |
|---|---|---|
| Philosopher detail page | `getInfluenceGraph(slug, 1)` | 1-hop influence ego graph |
| School detail page | `getSchoolGraph(slug)` | All members + their inter-influences |
| Curriculum view | `getCurriculumGraph(slug)` | Prereq DAG with work/philosopher references |
| Full network viz | `getFullInfluenceNetwork()` | All philosophers + INFLUENCED edges |
| Work detail page | `getNode(key)` + `getEdges(key)` | Author, notes, curriculum references |

Each projection returns a `SerializedSubgraph` — a self-contained set of nodes
and edges that can be rendered directly by the frontend graph visualization
(ReactFlow/Sigma.js/etc.) without further server calls.

---

## 5. API Endpoints

### 5.1 Graph Query Endpoints

```
GET  /api/graph/node/:key
     → GraphNode
     Returns a single node by its compound key.

GET  /api/graph/neighbors/:key
     ?depth=1&direction=both&edgeTypes=INFLUENCED,MEMBER_OF&nodeLabels=Philosopher
     → SerializedSubgraph
     Returns the ego-graph around a node, filtered by depth/direction/type.

GET  /api/graph/path
     ?from=philosopher:plato&to=philosopher:brandom&maxDepth=6
     → GraphPath | null
     Returns the shortest path between two nodes.

GET  /api/graph/subgraph/:key
     ?depth=2&direction=out&edgeTypes=INFLUENCED
     → SerializedSubgraph
     Returns a rooted subgraph for visualization.
```

### 5.2 Projection Endpoints (Convenience)

These wrap the generic graph queries with domain-specific defaults:

```
GET  /api/graph/influence/:slug
     ?depth=1
     → SerializedSubgraph
     Influence ego-graph for a philosopher. Default depth 1.

GET  /api/graph/school/:slug
     → SerializedSubgraph
     School membership graph with inter-member influence edges.

GET  /api/graph/curriculum/:slug
     → SerializedSubgraph
     Curriculum prerequisite DAG with work/philosopher reference edges.

GET  /api/graph/influence-network
     ?era=modern&school=german-idealism
     → SerializedSubgraph
     Full or filtered influence network for large-scale visualization.
```

### 5.3 Response Envelope

All graph endpoints return:

```json
{
  "graph": {
    "nodes": [...],
    "edges": [...]
  },
  "meta": {
    "nodeCount": 12,
    "edgeCount": 18,
    "rootKey": "philosopher:immanuel-kant",
    "depth": 2
  }
}
```

The `meta` field gives the frontend enough info to render pagination controls or
"expand" buttons without needing the full node/edge payloads.

---

## 6. Migration Strategy

### 6.1 From Current State to Unified Graph

Phase 1 (this ticket):
1. Create `build-graph.ts` script that reads from seed-data.ts and curriculum JSON
2. Generates the canonical `graph-data.json`
3. Implement `MemoryGraphService` backed by graphology
4. Add graph API routes

Phase 2 (future ticket):
1. Add `Neo4jGraphService` implementation
2. Add `graph:export-cypher` script
3. Add Neo4j Docker compose for local testing
4. Add `graph:sync` CI step for prod deployment

### 6.2 Relationship to Existing Postgres Data

The unified graph does **not** replace the Postgres/SQLite relational tables.
Those remain the system of record for entity CRUD (creating/updating/deleting
philosophers, works, schools). The graph layer is a **read-optimized projection**
of relationships — a materialized view of the relational data optimized for
traversal queries.

When a new influence relationship is added via the API:
1. It's written to `philosopher_influences` (Postgres/SQLite) — the write path
2. The graph layer is notified and adds the edge — the read path
3. In dev: the in-memory graphology instance is updated; JSON is re-exported
4. In prod: a Cypher MERGE is executed against Neo4j

This dual-write is acceptable because:
- Writes are infrequent (adding influences is a manual curation step)
- The graph can always be rebuilt from the relational tables
- Eventual consistency between Postgres and Neo4j is fine for this domain

---

## 7. Future Considerations

### 7.1 Neo4j Migration (When Needed)

The graphology dev layer handles the current scale (< 1000 nodes) trivially.
Migrate to Neo4j when:
- You need multi-user concurrent writes to the graph
- Traversal queries exceed ~5 hops on a graph with > 10k edges
- You want Cypher's pattern matching for complex queries

### 7.2 Graph Visualization

The current ReactFlow-based curriculum visualization can be generalized to render
any `SerializedSubgraph`. The API returns the same shape for all projection types,
so a single `<GraphView>` component can render influence graphs, school graphs,
and curriculum DAGs with different node/edge styling.

### 7.3 Curriculum → DB Migration

When curricula move from frontend JSON to DB tables, their dependency edges should
be stored in the unified graph (with `PREREQ_OF` edge type) rather than in a
separate table. The graph layer already models this.
