# infra: Lean verification runner — connectivity spike

**Branch slug:** `infra/lean-runner-spike`
**Status:** queued
**Size:** M
**Depends on:** none

## Why

The project has been pointed at Lean integration for a long time —
`backend-logic-core.md` names it as the trigger that makes F# the AST
authority, `formal-verification.md` sketches the deep-embedding
approach, `lab-roadmap.md` carries it as the `lean-fitch` entry — and
none of it has touched a line of code. Before committing to a deep
embedding (the real work — see `formal-verification.md` §5), this
spike proves the *plumbing*: that the F# backend can invoke a
headless Lean, in local dev and in Woodpecker CI, and reliably tell
**verified** / **failed** / **timed-out** apart.

Deliberately **no embedding, no UI** — a trivial Lean file stands in
for a real proof. The spike exists to retire three unknowns before
Milestone 1 leans on them: (1) whether Woodpecker can get a Lean
toolchain at acceptable build time, (2) whether subprocess lifecycle
— timeout, kill, scratch files — behaves cleanly from ASP.NET, (3)
whether Lean's diagnostic output is stably parseable.

**Local footprint — flagged.** The dev machine is storage-tight, so
the spike fixes two footprint-bounding decisions up front: the Lean
library is **Mathlib-free** (Mathlib's `.olean` cache is multi-GB; a
bare embedding needs only Lean core), and the runner cleans up
per-run scratch rather than letting it accumulate. Pin one toolchain;
don't let `elan` collect versions. See `formal-verification.md` §7.

## Scope

**In:**

- `packages/lean/` — a new `lake` package (not an npm workspace).
  `lean-toolchain` pins one Lean 4 version; a `lakefile`; a `Sanity`
  module with three fixtures — a trivially true theorem
  (`theorem ok : True := trivial`), an ill-typed file, and a
  divergent term for the timeout path. No Mathlib dependency.
- `Logic/Lean/` in `PhilosophyExplorer.Api`:
  - `ILeanRunner` — interface, `verify : LeanJob -> Async<LeanResult>`,
    `LeanResult = Verified | Failed of Diagnostic list | Timeout
    | RunnerError of string`.
  - `SubprocessLeanRunner` — writes the job source into the lake
    package (so `import` resolves), spawns `lake env lean`, captures
    exit code + `--json` diagnostics, enforces a hard timeout (kills
    the process tree) and a memory ceiling, deletes scratch in a
    `finally`.
  - DI registration in `Program.fs`; new files added to the `.fsproj`
    `<Compile>` list in dependency order.
- A dev-gated `GET /api/lean/health` that runs the sanity fixture
  end-to-end — proves the HTTP path and gives a curl target. Folds
  into `/api/verify` in Milestone 1.
- Woodpecker: install `elan` + build `packages/lean/` so the
  Lean-touching integration tests run in CI. Wire it the simple way
  first — the spike's *deliverable* is the measured added CI time,
  which decides whether `.lake` / `~/.elan` caching or a custom CI
  base image is worth a follow-up.
- Integration tests at the HTTP / `ILeanRunner` boundary: sanity →
  `Verified`; ill-typed fixture → `Failed` + a line-located
  diagnostic; divergent fixture → `Timeout`. Tests **skip cleanly**
  when `lean` is absent from `PATH`, so a dev without the toolchain —
  and any CI step without it — stays green rather than red.
- `.gitignore` entry for `packages/lean/.lake/`; a `README` snippet
  with the `elan` install one-liner for local setup.

**Out (captured separately):**

- The ND deep embedding (`NDFormula` / `Deriv`), the `FitchProof →
  Deriv` emitter, the real `/api/verify`, the verify badge in
  `NaturalDeductionLab` — all Milestone 1, branch
  `feat/logic-lab-lean-nd` (ticket landed once this spike closes; see
  `formal-verification.md` §5).
- Extracting Lean into a separate service — a *contingency*, not a
  planned ticket; triggers in `formal-verification.md` §2.3.
  In-process is the intended home.
- Soundness theorems for the embedded calculi — a follow-up once an
  embedding exists.

## Build sketch

- Scaffold `packages/lean/` (`lake new`, or by hand), pin the
  toolchain, add the three fixtures; confirm `lake build` locally.
- `SubprocessLeanRunner`: scratch `.lean` written *inside* the lake
  package so `import` resolution works; `lake env lean <file>` via
  `System.Diagnostics.Process`, async; `--json` for diagnostics;
  timeout → kill the process tree; `try/finally` deletes scratch.
- Wire `ILeanRunner` into DI; add the dev-gated `/api/lean/health`
  route; add the new files to the `.fsproj` `<Compile>` list in order.
- Woodpecker: add `elan` install + `lake build` to (or just before)
  the `check` step — simplest wiring, no caching yet. Record the
  added wall-clock time in the work-history doc; that number drives
  the caching / custom-image decision.
- Gate the Lean integration tests on a `lean`-on-`PATH` probe so
  local and CI runs without the toolchain stay green.

## References

- `docs/formal-logic/formal-verification.md` — the Lean design doc:
  decided topology, the `ILeanRunner` seam, the milestone sequence
  this spike opens, the local-footprint policy.
- `docs/formal-logic/backend-logic-core.md` — F# as AST authority and
  Lean-runner owner; the migration triggers.
- `docs/formal-logic/lab-roadmap.md` §"Lean integration — Fitch-style
  ND" and `lab-status.md` §C — the roadmap entry this is step one of.
- `.woodpecker.yml` — the `check` step (`mcr.microsoft.com/dotnet/sdk:9.0`)
  to extend.
- Lean 4 manual and `lake` documentation — toolchain pinning,
  `lake env`, `--json` diagnostics.
