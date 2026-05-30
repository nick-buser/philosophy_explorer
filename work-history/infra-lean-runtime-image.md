# infra — Bake the Lean toolchain into the runtime image

**Branch:** `infra/lean-runtime-image`
**Merged:** _TBD_

Milestone 1 shipped `POST /api/verify`, but the deployed image could
not actually verify anything — the runtime Docker image had no Lean
toolchain. This branch puts one in it.

## What changed

- **`Dockerfile`** — a new build stage and runtime wiring:
  - **`lean-build`** stage, `FROM mcr.microsoft.com/dotnet/aspnet:9.0`
    (the same base as `runtime`). Installs `elan`, pin-installs the
    toolchain named in `packages/lean/lean-toolchain`
    (`leanprover/lean4:v4.29.1`), copies `packages/lean/`, runs
    `lake build`. `lean-toolchain` is copied and the toolchain
    installed *before* the package sources, so an embedding-only
    change reuses the cached toolchain layer.
  - **`runtime`** stage (renumbered Stage 3 → 4) copies `/root/.elan`
    (the toolchain) and `/app/packages/lean` (sources + the built
    `.lake/` oleans) from `lean-build`, and adds
    `LEAN_PACKAGE_PATH=/app/packages/lean` plus `/root/.elan/bin` on
    `PATH`.
- **`.dockerignore`** — excludes `packages/lean/.lake/` and
  `packages/lean/.scratch/`.

| File | Change |
|------|--------|
| `Dockerfile` | + `lean-build` stage; runtime copies the toolchain + embedding, sets `LEAN_PACKAGE_PATH` / `PATH` |
| `.dockerignore` | + `packages/lean/.lake/`, `packages/lean/.scratch/` |
| `work-history/infra-lean-runtime-image.md` | this file |

## Why

`SubprocessLeanRunner` (Milestone 0) spawns `lake env lean` as a
subprocess; `/api/verify` (Milestone 1) is built on it. The Dockerfile,
however, predates all of the Lean work — it was written for
`infra/dockerize-monorepo` and never revisited. In the deployed
container `lake` is not on `PATH`, the runner's `try/with` catches the
spawn failure and returns `RunnerError`, and `/api/verify` answers
`200 {verdict:"error"}` for every proof. The route was live; the
verification was a no-op.

Two ways to fix it: bake the toolchain into the runtime image (F# keeps
invoking `lake` directly, exactly as in local dev), or split Lean into
a separate service behind the `HttpLeanRunner` contingency named in
`formal-verification.md` §2.3. We took the bake-in — one runner code
path shared by dev and prod, no second service to deploy or monitor.
The cost is a larger image and a slower `publish-main` build; accepted.

## Notes for future work

- **`lean-build` shares the runtime's base image on purpose.** Both
  are `dotnet/aspnet:9.0`, so the toolchain's shared-library
  dependencies are guaranteed present at runtime — no cross-base
  surprises from copying `/root/.elan` between stages. If the runtime
  base ever changes, `lean-build` must change with it.
- **The buildx steps have no registry cache.** The Dockerfile caches
  the toolchain as its own layer, but `infra/woodpecker-pipeline` left
  buildx uncached, so a fresh CI runner still re-downloads the
  toolchain every build. Wiring buildx `cache-from`/`cache-to` (or a
  prebuilt CI base image) would cut the most expensive layer — a
  worthwhile follow-up now that the layer is large.
- **The `.dockerignore` excludes are correctness, not hygiene.** Dev
  builds run on macOS, so a host `packages/lean/.lake/` holds Mach-O
  oleans; copying them into the Linux `lean-build` stage risks
  `lake build` tripping over cross-platform artifacts. The stage must
  build from clean source.
- **Image size not measured.** The toolchain (stdlib oleans +
  binaries) adds a few hundred MB over the ~250 MB base noted in
  `infra-dockerize-monorepo.md`. Measure after the first
  `publish-main` build; revisit if it matters.
- **Runs as root.** No `USER` directive (inherited from the existing
  Dockerfile), so `elan` lives at `/root/.elan` and the runner can
  create `/app/packages/lean/.scratch/`. A future non-root `USER`
  would need both the `.elan` path and the scratch-dir write
  permission revisited.
- **Not built locally.** The image was not built on the dev machine
  (disk-constrained; a multi-GB build). The `lean-build` stage running
  `lake build` is itself the validation: a green `publish-main` build
  proves the toolchain runs on the base. The dev deploy is the
  end-to-end acceptance test.
- **`.woodpecker.yml` unchanged.** The `check` step still installs its
  own `elan` for the `LeanRunner` integration tests; `publish-main`
  builds target `runtime`, which now transitively builds `lean-build`.
- **First-verify latency.** In the baked image the toolchain is
  pre-installed and `.lake` pre-built, so the first verify is
  "warm-ish" (~3s, per the M0 work-history). The M0-suggested
  startup warmup verify is still a reasonable follow-up if that
  latency matters.
- **Broader Lean-verification follow-ups** (verify-badge browser
  check, the TS DTO re-point, a runner memory ceiling, a CI API-up
  step) are tracked in `work-history/feat-logic-lab-lean-nd.md` — left
  as post-deploy cleanup.
