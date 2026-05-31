# Neo4j Graph Backend — Scoping & Findings

**Date:** 2026-05-31
**Ticket:** (proposed) INFRA — Neo4j graph backend
**Status:** Draft / Scoping
**Related:** [`graph-layer-design.md`](graph-layer-design.md) §3.3, §6.1, §7.1 ·
[`homelab-migration-plan.md`](homelab-migration-plan.md) ·
[`work-history/INFRA-002.md`](../work-history/INFRA-002.md)

---

## 1. Question

> How much work would it take to get set up with a Neo4j connection to our
> deployed local (homelab) instance?

This doc records what the codebase looks like today, what "connect to Neo4j"
can actually mean, and a grounded effort estimate for each interpretation. It is
a scoping document, **not** an accepted design — no code changes accompany it.

---

## 2. TL;DR

There are two genuinely different scopes hiding behind one question:

| Scope | What you get | Effort |
|---|---|---|
| **A — Connectivity + data load** | The homelab Neo4j is reachable over Bolt and holds the graph; prove it with one query | **~half a day** (mostly ops) |
| **B — Swappable `Neo4jGraphService`** | The F# API answers the existing `/api/graph/*` routes from Neo4j, selected by env var | **~3–4 focused days** |

Two caveats that should shape the decision before any code is written:

1. **There is no performance reason yet.** The design doc gates Neo4j on
   "concurrent writes or >10k edge traversals" ([`graph-layer-design.md`](graph-layer-design.md) §7.1).
   The current graph is **274 nodes / 382 edges**. Scope B is the planned
   *Phase 2 infrastructure step*, not a perf win.
2. **This is read-side only.** Connecting Neo4j does not solve relational→graph
   write sync. The graph would still be (re)built from `data/graph-data.json`,
   exactly as it is today. Live dual-write is a separate future ticket
   ([`graph-layer-design.md`](graph-layer-design.md) §6.2) and is **out of scope** here.

---

## 3. Current state

The graph layer was deliberately built Neo4j-ready in *shape* but not in
*wiring*.

### 3.1 What exists

- **`MemoryGraphService`** — `packages/api-fsharp/PhilosophyExplorer.Api/Graph/MemoryGraphService.fs`.
  An in-memory adjacency-list service loaded from `data/graph-data.json`
  (graphology JSON). Pure F#, no graph DB dependency.
- **Routes** — `packages/api-fsharp/PhilosophyExplorer.Api/Routes/GraphRoutes.fs`
  exposes 8 endpoints: `stats`, `node/{key}`, `neighbors/{key}`, `path`,
  `influence/{slug}`, `school/{slug}`, `curriculum/{slug}`, `influence-network`.
- **Design intent** — [`graph-layer-design.md`](graph-layer-design.md) §3 already
  specifies the dual-environment strategy pattern (memory for dev/test, Neo4j via
  Bolt for staging/prod) and the `GRAPH_DATABASE_URL` env-detection convention.
- **TS stub (reference only)** — the retired Hono backend
  (`packages/api/src/graph/index.ts`) has a factory that *throws* on a
  `bolt://`/`neo4j://` URL. No F# equivalent exists.

### 3.2 What does *not* exist yet

- No `IGraphService` interface. `GraphRoutes.register` binds the **concrete**
  `MemoryGraphService` type directly (`GraphRoutes.fs:43`), and `Program.fs:115`
  instantiates it directly.
- No `Neo4j.Driver` package reference in `PhilosophyExplorer.Api.fsproj`.
- No `GRAPH_DATABASE_URL` handling anywhere in the F# code.
- No Cypher export / load script (the deferred `graph:export-cypher`, see
  [`work-history/INFRA-002.md`](../work-history/INFRA-002.md) "Notes for future work").
- No committed Neo4j connection details — consistent with the homelab
  Keychain/`add-app-db-vars` secret flow, not a gap.

### 3.3 The two structural frictions

These are the reasons Scope B is days, not hours:

1. **No interface to implement.** Routes depend on the concrete class, so a
   second backend can't be slotted in without first extracting an
   `IGraphService` abstraction and re-pointing the routes and `Program.fs` at it.

2. **Sync vs async.** Every `MemoryGraphService` method is **synchronous** — it
   returns `GraphNode list` / `SerializedSubgraph` directly, because it's all
   in-memory. The **Neo4j .NET driver is async** (`IAsyncSession.ExecuteReadAsync`
   returns `Task`). A shared interface must therefore be `Task`-returning, which
   forces:
   - the in-memory methods to be wrapped (`Task.FromResult` — trivial), and
   - all 8 route handlers in `GraphRoutes.fs` to change from synchronous
     `Func<…, IResult>` lambdas to async ones that await the service —
     mechanical, but it touches every handler.

### 3.4 The pattern to mirror

The relational layer already solved the equivalent problem and is the template
to follow:

- **`Db/DbFactory.fs`** auto-detects dialect from `DATABASE_URL` by URL scheme
  (`file:` → SQLite, otherwise Postgres) and contains
  `toNpgsqlConnectionString`, a small parser that translates the homelab
  `postgresql://user:pw@host/db` URL form into the driver's native
  connection-string shape. The Neo4j equivalent needs the same: split
  `bolt://user:pw@host` into a URI + `AuthTokens.Basic(user, pw)`, because the
  driver takes auth separately from the URI.
- **`homelab-migration-plan.md`** shows how env vars reach the deployed app —
  Dokploy slot config + Ansible `*.env.*.j2` templates, with secrets sourced
  from Keychain. A future `GRAPH_DATABASE_URL` follows the same path as
  `DATABASE_URL` / `GRAPH_DATA_PATH`.

---

## 4. Scope A — Connectivity + data load

**Goal:** the homelab Neo4j is reachable, holds the graph, and answers a query.
No application behavior changes.

**Steps**

1. **Reach the box.** Confirm the deployed Neo4j is reachable over `bolt://`
   from the dev machine / deploy target; pull credentials from Keychain via the
   existing `add-app-db-vars` flow rather than committing them.
2. **Convert the data.** Generate Cypher `CREATE`/`MERGE` from
   `data/graph-data.json`, or use APOC's JSON import. The deferred
   `graph:export-cypher` script does not exist yet — a ~50-line converter (the
   JSON is already in graphology's regular `nodes`/`edges` shape) or APOC is
   enough.
3. **Constrain + load.** Apply uniqueness constraints on node keys and the
   per-label/relationship-type indexes, then load. At 274/382 the load is
   effectively instant.
4. **Verify.** Run a sample traversal (e.g. an influence ego-graph) directly in
   the Neo4j browser / `cypher-shell` to confirm node labels and relationship
   types round-tripped correctly.

**Effort:** ~half a day, dominated by ops/credentials rather than code.

**Value/limit:** proves the connection and the data model, and de-risks Scope B.
On its own it changes nothing the F# API serves.

---

## 5. Scope B — `Neo4jGraphService` behind the existing routes

**Goal:** the F# API answers `/api/graph/*` from Neo4j when
`GRAPH_DATABASE_URL` is a `bolt://`/`neo4j://` URL, and from memory otherwise —
mirroring the `DbFactory` strategy pattern. Same DTOs, same routes, same
response envelope.

### 5.1 Task breakdown

| # | Task | Size | Notes |
|---|---|---|---|
| 1 | Extract `IGraphService` interface | S | The 8 public members of `MemoryGraphService`; re-point `GraphRoutes.register` and `Program.fs` at the interface. No behavior change — safe to land on its own. |
| 2 | Sync → async refactor | M | Interface returns `Task<_>`. Wrap memory methods with `Task.FromResult`; convert all 8 handlers in `GraphRoutes.fs` from sync to async. Mechanical but pervasive. |
| 3 | Re-express the 8 methods as Cypher | **L** | The real work — see §5.2. |
| 4 | Factory + driver lifecycle | S | `GRAPH_DATABASE_URL` detection; register a singleton `IDriver`, disposed on shutdown. Mirror `DbFactory`. |
| 5 | Connection string / auth / secrets | S | Bolt URL → URI + `AuthTokens.Basic` split; add a `GRAPH_DATABASE_URL` env-contract entry to the homelab templates. |
| 6 | Package + `.fsproj` wiring | S | `Neo4j.Driver` `PackageReference` + `<Compile>` entries in correct order. |
| 7 | Tests / CI decision | M | See §5.3 — needs a live instance, which is a test-infra choice. |

### 5.2 The Cypher reimplementation (the time sink)

Each `MemoryGraphService` method is currently hand-written BFS/adjacency logic
over dictionaries. In Neo4j each becomes a Cypher query plus a mapping from
driver records back into the existing `GraphNode` / `GraphEdge` /
`Map<string, obj>` types.

| Method | Cypher difficulty | Note |
|---|---|---|
| `GetNode`, `FindNodes` | Easy | Direct `MATCH`. |
| `Stats` | Easy | `MATCH (n) … count`, relationship count. |
| `ShortestPath` | **Easier than today** | Neo4j has native `shortestPath()`; the hand-rolled BFS in `MemoryGraphService.fs:138` goes away. |
| `GetSubgraph` (neighbors) | Medium–Hard | Variable-depth `MATCH path = (n)-[*1..d]-()` with direction + edge-type filters; must reconstruct the de-duplicated `SerializedSubgraph` node/edge set from path results. |
| `GetInfluenceGraph` | Medium | Ego-graph over `INFLUENCED`; thin wrapper over subgraph logic. |
| `GetSchoolGraph` | Hard | Members of the school **plus** the inter-member `INFLUENCED` edges — two-part query. |
| `GetCurriculumGraph` | Hard | Prereq DAG **plus** `REFERENCES_WORK` / `REFERENCES_PHILOSOPHER` edges, scoped by curriculum-slug key prefix. |
| `GetFullInfluenceNetwork` | Medium | All `Philosopher` nodes + all `INFLUENCED` edges. |

**Mapping subtlety.** In graphology JSON the node `label` and edge `type` live
*inside* `attributes` (see `MemoryGraphService.fs:49,55`). In Neo4j they are
first-class — a node label and a relationship type. The record→F# mapping has to
reconcile that: rehydrate `label`/`type` into the `Attributes` map *and* the
top-level `GraphNode.Label` / `GraphEdge.Type` fields, and reconstruct the
`{label}:{slug}` compound key, so the wire shape stays byte-for-byte identical
to the in-memory backend. This is the kind of detail that eats time.

### 5.3 Tests / CI

Current `GraphServiceTests.fs` instantiate `MemoryGraphService` directly against
the JSON file — pure, no I/O, fast. Neo4j needs a live instance, which is a
decision:

- **Flag-gate against the homelab box** — cheap, but tests need network + creds
  and aren't hermetic.
- **Testcontainers-Neo4j** — hermetic and CI-friendly, but the Neo4j image is
  ~500 MB+. The dev machine is disk-constrained (noted preference), so this has a
  real footprint cost.

The HTTP-boundary contract tests (per CLAUDE.md testing guidance) can run against
*either* backend, which is the cleanest way to assert the two implementations are
interchangeable.

### 5.4 Effort summary

| Phase | Effort |
|---|---|
| Interface extraction (task 1) | ~half a day — independently landable |
| Async refactor (task 2) | ~half a day |
| `Neo4jGraphService` Cypher + mapping + factory + wiring (tasks 3–6) | ~1.5–2 days |
| Tests / CI (task 7) | ~half a day – 1 day |
| **Total** | **~3–4 focused days** |

---

## 6. Caveats before committing

1. **No perf need at this scale.** 382 edges. Scope B buys infrastructure
   maturity and the path toward Cypher pattern-matching for future formal-logic
   queries — not speed. Worth doing as a deliberate step, not as a fix.
2. **Read-side only.** The graph is still rebuilt from `graph-data.json`; Neo4j
   does not become a system of record. Relational entity CRUD stays in
   Postgres/SQLite ([`graph-layer-design.md`](graph-layer-design.md) §6.2).
3. **Dual-write is a separate ticket.** Keeping Neo4j in sync on
   `POST /api/philosophers` etc. is explicitly out of scope and listed as future
   work in INFRA-002's notes.
4. **Driver maturity is in our favor.** Per [`work-history/INFRA-003.md`](../work-history/INFRA-003.md),
   the .NET Neo4j driver is first-class (maintained by Neo4j Inc) — one of the
   reasons F# was chosen for the backend.

---

## 7. Recommended sequencing

1. **Scope A spike** — connect to the homelab instance and load the data. Half a
   day, de-risks everything, and is independently useful.
2. **Task 1 (interface extraction)** — a pure no-behavior-change refactor that
   can land on its own and makes the rest reviewable in isolation.
3. **Tasks 2–6** — the async refactor + `Neo4jGraphService`, behind
   `GRAPH_DATABASE_URL` so the default dev path stays on the in-memory backend.
4. **Task 7** — decide the test strategy once there's something to test against.

A natural first milestone is **Scope A + one Cypher-backed endpoint** as a spike
to see the homelab Neo4j answer a real query through the F# API — an afternoon,
not four days.

---

## 8. Open questions

- Is the deployed Neo4j a single shared instance, or per-environment
  (dev/prod) like the Postgres slots? Determines how many `GRAPH_DATABASE_URL`
  contract entries the homelab templates need.
- Testcontainers vs flag-gated tests, given the disk-footprint constraint.
- Do we want the Cypher load step (`graph:export-cypher` / APOC) as a committed
  script now, or hand-loaded for the spike and scripted later?
- Multi-DB vs single-DB on the homelab Neo4j (Community edition is single-DB) —
  affects dev/prod isolation strategy.

---

## 9. References

- [`docs/graph-layer-design.md`](graph-layer-design.md) — the dual-environment design (§3, §6, §7)
- [`docs/homelab-migration-plan.md`](homelab-migration-plan.md) — env/secret delivery pipeline
- [`work-history/INFRA-002.md`](../work-history/INFRA-002.md) — graph layer build + deferred Neo4j notes
- [`work-history/INFRA-003.md`](../work-history/INFRA-003.md) — F# backend rationale (driver maturity)
- `packages/api-fsharp/PhilosophyExplorer.Api/Graph/MemoryGraphService.fs` — the methods to re-implement
- `packages/api-fsharp/PhilosophyExplorer.Api/Routes/GraphRoutes.fs` — the 8 routes to keep stable
- `packages/api-fsharp/PhilosophyExplorer.Api/Db/DbFactory.fs` — the strategy/URL-parsing pattern to mirror
</content>
</invoke>
