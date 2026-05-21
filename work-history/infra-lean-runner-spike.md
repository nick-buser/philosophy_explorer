# infra — Lean verification runner connectivity spike

**Branch:** `infra/lean-runner-spike`
**Merged:** _TBD_

Milestone 0 of the Lean verification integration
(`docs/formal-logic/formal-verification.md` §5). A connectivity spike:
no embedding, no UI — it proves the plumbing between the F# backend
and a headless Lean toolchain, in local dev and Woodpecker CI.

## What changed

- **`packages/lean/`** — a new Mathlib-free `lake` package (not an npm
  workspace):
  - `lean-toolchain` pins `leanprover/lean4:v4.29.1` — one toolchain,
    no `elan` version sprawl.
  - `lakefile.toml` — one `lean_lib`, `Sanity`.
  - `Sanity.lean` — the single built module, `theorem ok : True :=
    trivial`. A passing `lake build` produces the `.olean` that scratch
    jobs `import`.
  - `Fixtures/{Ok,IllTyped,Diverge}.lean` — the three connectivity
    fixtures (verified / ill-typed / non-terminating). Not part of the
    `lean_lib`, so `lake build` stays green.
- **`PhilosophyExplorer.Api/Logic/Lean/LeanRunner.fs`** — the
  `ILeanRunner` seam: `LeanJob`, `Diagnostic`, `LeanResult = Verified |
  Failed of Diagnostic list | Timeout | RunnerError of string`.
  `SubprocessLeanRunner` writes the job source to
  `packages/lean/.scratch/`, spawns `lake env lean --json`, parses the
  `--json` diagnostics, enforces a hard timeout with a process-tree
  kill, and deletes scratch in a `finally`.
- **`Routes/LeanRoutes.fs`** — `GET /api/lean/health`, dev-gated
  (registered only in the Development environment) and
  `.ExcludeFromDescription()`'d from the OpenAPI spec. Runs the sanity
  job end-to-end as a curl target; folds into `/api/verify` in M1.
- **`Program.fs`** — DI registration of `ILeanRunner` as a singleton;
  package dir (`LEAN_PACKAGE_PATH`) and timeout (`LEAN_TIMEOUT_SECONDS`)
  are env-configurable.
- **`PhilosophyExplorer.Tests/LeanRunnerTests.fs`** — three integration
  tests at the `ILeanRunner` boundary: sanity → `Verified`; ill-typed →
  `Failed` with a line-located diagnostic; divergent → `Timeout`. They
  skip (return green) when `lake`/`lean` are absent from `PATH`.
- **`.woodpecker.yml`** — the `check` step installs `elan`, then runs
  `lake build` on `packages/lean/`, before `dotnet test`. Wired the
  simple way — no caching.
- **`.gitignore`** — `packages/lean/.lake/` and `.scratch/`.
- **`README.md`** — a "Lean verification (optional)" section with the
  `elan` install one-liner.
- **`package.json`** — `dev:api` now also sets `LEAN_PACKAGE_PATH`
  (mirrors the existing `GRAPH_DATA_PATH`).

## Why

The project has pointed at Lean integration for a long time without
touching code. Before committing to the deep embedding (M1, the real
work), this spike retires three unknowns: (1) can Woodpecker get a Lean
toolchain at acceptable build time, (2) does subprocess lifecycle —
timeout, kill, scratch files — behave cleanly from ASP.NET, (3) is
Lean's `--json` diagnostic output stably parseable. All three are now
answered. See `.tickets/infra-lean-runner-spike.md`.

## Notes for future work

- **Memory ceiling — deviated from the ticket; deferred to M1.** The
  ticket scoped a memory ceiling, sketched as `ulimit -v`. The spike
  found `ulimit -v` non-viable: macOS rejects `setrlimit(RLIMIT_AS)`
  outright (`ulimit: virtual memory: cannot modify limit: Invalid
  argument`), and on Linux it bounds *virtual* address space — a poor
  proxy that risks killing legitimate runs, since Lean reserves
  multi-GB of virtual space it never resides. So `ulimit -v` and its
  `sh -c` wrapper were dropped; `SubprocessLeanRunner` spawns `lake`
  directly and **the hard timeout (process-tree kill) is the sole
  resource guard.** It is reliable and cross-platform. A real memory
  ceiling — RSS polling of the process tree, or a cgroup on the CI
  side — is an M1 follow-up; `LeanResult.RunnerError` can already carry
  such a verdict.
- **Cold start and the 60s timeout default.** A warm verification is
  ~0.2s; the first verify in a fresh API process ~3s; the first verify
  against a freshly-downloaded ("cold") toolchain exceeded 10s and
  tripped the original 10s default. The default is now 60s
  (`LEAN_TIMEOUT_SECONDS` overrides). M1 should consider a
  fire-and-forget warmup verify at API startup so the first real
  `/api/verify` request is not slow.
- **`--json` diagnostic shape.** `lean --json` emits one JSON object
  per message (JSON Lines) on stdout. The runner reads `severity`,
  `pos.line` (1-based), `pos.column` (0-based), and `data` (the
  message). Parsing held against the ill-typed fixture; M1's emitter
  maps `pos.line` back onto proof lines.
- **`/api/lean/health` is intentionally outside the API contract.** It
  is `.ExcludeFromDescription()`'d, so `gen:spec` / `gen:types` were
  deliberately not run and `packages/specs/openapi.json` is untouched.
  M1's real `/api/verify` will be a DTO'd contract endpoint that does
  go through codegen.
- **Tests skip rather than fail when the toolchain is absent**, so a
  dev without `elan` stays green. The hard toolchain gate is the
  Woodpecker `lake build` step — if the `elan`/toolchain install fails,
  that step fails and CI goes red. Trade-off: a skipped test currently
  shows as "passed" (kept zero-dependency — no `SkippableFact`
  package); the `lake build` canary covers the blind spot.
- **CI is uncached** — every `check` run installs `elan` and downloads
  the toolchain. Measured added wall-clock time on the `check` step:
  **_pending the first CI run; recorded as the final commit on this
  branch._** That number decides whether caching `~/.elan` / `.lake`
  or a custom CI base image is worth a follow-up.
- **M1 is unblocked.** `feat/logic-lab-lean-nd`: the `NDFormula` /
  `Deriv` deep embedding, the `FitchProof → Deriv` emitter, the real
  `/api/verify`, and the verify badge in `NaturalDeductionLab`. See
  `formal-verification.md` §5.
