# refac: extract IGraphService seam (async)

**Branch slug:** `refac/graph-service-interface`
**Status:** queued
**Size:** S
**Depends on:** none

## Why

`GraphRoutes.register` binds the **concrete** `MemoryGraphService`
(`GraphRoutes.fs:43`) and `Program.fs:115` instantiates it directly — there is no
seam for a second backend. Extract an async `IGraphService` interface and
re-point the routes + `Program.fs` at it.

Async **now**, because the eventual Neo4j driver is async (`Task`-returning):
doing it here means the Neo4j ticket is purely *additive* — a new file + factory
wiring, with zero route churn. No observable behavior change — identical wire
responses on the same data, verified by the existing graph contract tests staying
green. Lands safely on its own, ahead of any Neo4j work.

## Scope

**In:**

- `IGraphService` interface (`Task`-returning) covering the 8 public members of
  `MemoryGraphService`.
- `MemoryGraphService` implements it — wrap the existing synchronous bodies in
  `Task.FromResult` (logic unchanged).
- `GraphRoutes.register` takes `IGraphService`; the 8 handlers become async
  (`await` the service, then `Results.Json`).
- `Program.fs` depends on the interface; `.fsproj` `<Compile>` order updated
  (`IGraphService.fs` before `MemoryGraphService.fs`).

**Out (captured separately):**

- The Neo4j implementation → `.tickets/infra-neo4j-graph-service.md`.
- Backend-parity test changes → `.tickets/infra-neo4j-graph-tests.md`.

## Build sketch

- Add `Graph/IGraphService.fs`; declare the interface from the existing method
  signatures, `Task`-wrapped.
- `type MemoryGraphService(...) = ... interface IGraphService with ...`, bodies
  `Task.FromResult (...)`.
- Async-ify the 8 handlers in `GraphRoutes.fs`
  (`Func<..., Task<IResult>>`); keep response DTOs identical.
- Run `gen:spec` / `gen:types` (no DTO shape should move); confirm the graph
  contract tests are unchanged-green.

## References

- `docs/neo4j-graph-backend-scoping.md` §3.3, §5.1 (tasks 1–2)
- `packages/api-fsharp/PhilosophyExplorer.Api/Graph/MemoryGraphService.fs`
- `packages/api-fsharp/PhilosophyExplorer.Api/Routes/GraphRoutes.fs`
- `packages/api-fsharp/PhilosophyExplorer.Api/Program.fs:115`
</content>
