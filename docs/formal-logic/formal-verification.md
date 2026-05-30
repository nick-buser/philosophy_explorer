# Formal Verification via Lean

**Status:** Design — topology and first system decided 2026-05-21.
Supersedes the 2026-04-16 first-pass notes; the Frege-specific
analysis from that draft is preserved in §8, since Frege is a later
target than the one now chosen.

Shipping a proof built in a Logic Lab system to a headless Lean
instance that type-checks it against a faithful embedding of that
system — verification of the system *as itself*, not silently
reinterpreted into Lean's native classical logic.

---

## 1. Goal

A user builds a proof in a Logic Lab system. The backend ships that
proof's AST to a headless Lean process, which type-checks it against
a deep embedding of the relevant system and returns verified /
unverified + error location, mapped back onto the proof's lines.

The value is *honest* verification: proof steps checked against
axioms and inference rules faithful to the historical system — not
against Lean's native logic.

---

## 2. Decided architecture

Two questions were open: how to talk to Lean (*transport*), and where
the component that talks to it lives (*topology*). Both are now
settled.

### 2.1 Transport — batch `lake`

Lean's "headless mode", in practice, is the **batch CLI**: write a
`.lean` file, run `lake env lean` over it, read the exit code and
`--json` diagnostics. One process per check, stateless.

The alternatives — `lean --server` (LSP), or a long-running Lean
process exposing a custom RPC loop — are warmer and incremental, but
only earn their cost for *interactive, in-editor* proof checking. A
"verify this finished proof" button does not need them. Revisit only
if live per-keystroke checking becomes a goal.

### 2.2 Topology — one F#-owned adapter, in-process

There is no separate "middleman backend" to decide on, because the
middleman already exists: the F# API. `backend-logic-core.md` already
assigns it the job — Lean source emission and the Lean-runner
protocol are backend concerns, because *"AST authority lives with the
side that talks to Lean."*

So the adapter — emit Lean source, run it, parse results back onto
AST nodes — is F#'s. It runs **in-process**: the F# API spawns Lean
as a subprocess, behind an `ILeanRunner` interface.

```
proof AST (TS, e.g. FitchProof)
  → POST /api/verify
  → F#: validate + normalise        (F# is now the AST authority)
  → F#: emit .lean source           (the emitter)
  → ILeanRunner.verify              (SubprocessLeanRunner → lake env lean)
       ⇒ Verified | Failed | Timeout
  → F#: map diagnostics → proof lines
  → UI: verdict + line-highlighted errors
```

In-process is the **intended home**, not a stepping stone. The
`ILeanRunner` seam exists because it is cheap and good design — and
because it makes the contingency below a swap rather than a rewrite —
*not* because extraction is planned.

### 2.3 Topology contingency — a separate Lean service

Extracting Lean into its own service/container — a second
`HttpLeanRunner` behind the same seam — is a **contingency** gated on
concrete triggers, not a roadmap item:

- **Image / CI bloat hurts.** The Lean toolchain in the API runtime
  image bloats every API deploy and every Woodpecker build. If that
  cost becomes real, a separate image — rebuilt only when the Lean
  library changes — fixes it.
- **A verification hangs the API.** If slow or divergent checks start
  occupying API threads or DB connections, isolating Lean in its own
  failure domain (and making `/api/verify` an async job) fixes it.
- **Latency forces warm workers.** A pool of pre-loaded Lean
  processes has a natural home only in a dedicated service. While the
  embedding stays Mathlib-free (§7), cold start is sub-second — so
  this trigger is unlikely to fire early.

Until a trigger fires, in-process stays. Milestones 0 and 1 are also
the measurements that tell us whether any trigger is real.

---

## 3. First system — natural deduction

The first system wired to Lean is **propositional natural deduction**
(`natural-deduction`) — not Frege, even though §8 below is written
Frege-first. The reasons are practical:

- ND already emits a fully structured proof object — `FitchProof` in
  `nd-types.ts`: numbered lines, each carrying a `formula`, a `rule`
  from a closed union, and `cites`. That maps almost 1:1 onto a Lean
  `Deriv` inductive.
- ND already has a prover (`nd-prover.ts`) that *generates* those
  objects. Every proof it finds is a free verification test case —
  the property "prover succeeds ⇒ Lean accepts" is a strong, cheap
  correctness net.
- The classical / intuitionistic toggle the Lab already exposes
  becomes, in the embedding, a choice of which `Deriv` constructors
  are in scope. The mechanization mirrors the UI exactly.
- `frege-bs` has no validity engine today (render + translate only),
  and its generality / second-order embedding is the genuinely subtle
  part (§8.3–8.4). Highest fidelity payoff — but the worst *first*
  target.

It is also the roadmap's named target: `lab-roadmap.md` carries it as
`feat/logic-lab-lean-fitch`, and `lab-status.md` §C points the same
way.

---

## 4. Deep embedding — the approach

Do **not** translate Lab formulas into Lean's native propositions.
Deep-embed each system instead: define its syntax as a Lean
inductive, its rules as a derivation judgment, ship proofs as terms
of that judgment, and let Lean's kernel type-check them.

For natural deduction:

```lean
inductive NDFormula where
  | atom : String → NDFormula
  | top  : NDFormula
  | bot  : NDFormula
  | neg  : NDFormula → NDFormula
  | and  : NDFormula → NDFormula → NDFormula
  | or   : NDFormula → NDFormula → NDFormula
  | imp  : NDFormula → NDFormula → NDFormula
  | iff  : NDFormula → NDFormula → NDFormula

-- a derivation of φ from context Γ; one constructor per nd-types.ts Rule
inductive Deriv : List NDFormula → NDFormula → Type where
  | premise : φ ∈ Γ → Deriv Γ φ
  | andI    : Deriv Γ φ → Deriv Γ ψ → Deriv Γ (.and φ ψ)
  | andEL   : Deriv Γ (.and φ ψ) → Deriv Γ φ
  | impI    : Deriv (φ :: Γ) ψ → Deriv Γ (.imp φ ψ)    -- discharges φ
  | impE    : Deriv Γ (.imp φ ψ) → Deriv Γ φ → Deriv Γ ψ
  | raa     : Deriv (.neg φ :: Γ) .bot → Deriv Γ φ      -- classical only
  -- … orIL/orIR/orE, iffI/iffEL/iffER, notI/notE, botE, reit
```

A well-typed term of type `Deriv Γ φ` *is* the verification — a proof
of `φ` from `Γ` in the embedded calculus. The backend ships the term;
Lean's kernel checks it. This verifies the system **as itself**, not
"ND-looking text in Lean's logic."

The same pattern applies to every other system — each gets its own
`*Formula` + `*Deriv` (Peirce EG, Boolean algebra, Frege; see §8).

**Two design calls for Milestone 1:**

- *Context threading.* The discharge constructors (`impI`, `notI`,
  `raa`) extend `Γ`; `premise` looks it up. Built bottom-up, the
  emitter never has to compute `Γ` explicitly — Lean infers the
  indices by unification. Confirm that holds for the chosen `Deriv`
  shape; it is what keeps the emitter a clean structural fold.
- *Classical vs. intuitionistic.* Either two judgment types
  (`IDeriv` ⊂ `CDeriv`), or one `Deriv` parameterised by a `Logic`
  with `raa` requiring the classical case. Pick whichever keeps the
  emitter simplest.

**Soundness is separable.** A `theorem soundness : Deriv Γ φ → …`
connecting the calculus to a truth-functional semantics is what
certifies the *embedding itself* is faithful. It is not needed to
*check a proof* — the kernel does that against `Deriv` — so it is a
follow-up ticket, not Milestone 1. For propositional ND it is also
Mathlib-free.

---

## 5. Milestones

| # | Ticket | What |
|---|---|---|
| 0 | `infra/lean-runner-spike` | **Connectivity spike.** `packages/lean/` lake package (trivial fixtures — no embedding), `ILeanRunner` + `SubprocessLeanRunner`, Woodpecker Lean build, dev-gated `/api/lean/health`. Proves the plumbing; retires the CI / subprocess / diagnostics unknowns. Ticket: `.tickets/infra-lean-runner-spike.md`. |
| 1 | `feat/logic-lab-lean-nd` | **ND vertical slice.** `NDFormula` + `Deriv` embedding; promote the propositional `FolFormula` + `FitchProof` shapes to F# DTOs (per `backend-logic-core.md` Layer 1); `FitchProof → Deriv` emitter; real `/api/verify`; verify badge in `NaturalDeductionLab`. Ticket landed once M0 closes. |
| 2 | *(contingency)* | Extract a separate Lean service — only if a §2.3 trigger fires. |

Milestone 0 is a standalone ticket precisely so the embedding work in
Milestone 1 is never built on unproven plumbing.

---

## 6. Plumbing — F# ↔ Lean

### 6.1 Protocol — settled

| Option | Verdict |
|---|---|
| Subprocess + batch `lake` | **Chosen.** Simple, stateless. Cold start = loading the embedding's `.olean`s — sub-second while Mathlib-free. |
| `lean --server` / LSP | Deferred. Incremental / interactive; unnecessary for finished-proof checking. |
| Long-running Lean RPC service | The §2.3 contingency, if a trigger fires. |

### 6.2 Caching

The embedding library's compiled `.olean`s are stable between user
proofs — build once, reuse. Per-proof outputs are ephemeral scratch
(and must be cleaned up — §7). Content-hash the proof AST → cache the
verification result, so re-verifying an unchanged proof is O(1).

### 6.3 Sandboxing

Calibrated to the actual exposure, not a blanket "user input is
untrusted code":

- **Resource limits are non-negotiable, always.** Even an
  F#-generated `Deriv` term can be pathologically large and blow up
  elaboration. A hard timeout (kill the process tree) plus CPU /
  memory ceilings are mandatory from the spike onward.
- **Arbitrary-code risk is bounded *while* F# is the sole emitter.**
  If F# only ever emits `Deriv` constructor applications from a
  validated proof AST, the Lean input is constrained — not arbitrary
  user code. The full sandbox (no network, read-only FS except
  scratch, process isolation) becomes load-bearing the moment a
  looser path lands: a raw-Lean paste affordance, or the text-DSL
  ingest in `editor-and-ir.md` §3. Treat that as the trigger to
  harden — and as a further reason the §2.3 service extraction would
  double as a sandbox boundary.

---

## 7. Local development footprint

The dev machine is storage-constrained; the design is deliberately
disk-frugal, and should stay that way:

- **Mathlib-free.** The embeddings (`NDFormula` / `Deriv`, and later
  systems) need only Lean core. Mathlib's `.olean` cache is multi-GB;
  a bare embedding is a handful of small `.olean`s. Do not add a
  Mathlib dependency without a hard requirement and an explicit
  footprint decision.
- **One pinned toolchain.** `lean-toolchain` pins a single version;
  don't let `elan` accumulate toolchains (each is hundreds of MB).
- **Scratch is cleaned.** `SubprocessLeanRunner` deletes per-run
  `.lean` / `.olean` scratch in a `finally` — nothing accumulates
  across verifications.
- **`.lake/` is ignored and prunable.** The build directory is
  gitignored; `lake clean` reclaims it.

This is also why in-process (§2.2) is comfortable: a Mathlib-free Lean
toolchain is the only real disk cost, and it is one-time — not
per-deploy, not per-run.

---

## 8. Frege-specific notes (forward-looking)

Frege is a later target than ND. §4's pattern applies unchanged —
Frege gets a `BSFormula` inductive in place of `NDFormula`, and its
own `Deriv`:

```lean
inductive BSFormula where
  | atom     : String → BSFormula
  | cond     : BSFormula → BSFormula → BSFormula      -- → / condition stroke
  | neg      : BSFormula → BSFormula                  -- negation tick
  | forall_  : String → BSFormula → BSFormula         -- generality concavity
  | ident    : BSFormula → BSFormula → BSFormula      -- ≡
```

The notes below — preserved from the original 2026-04-16 draft —
catalogue where Frege's embedding stays mechanical and where it needs
interpretive choices.

### 8.1 Propositional fragment (Part I) — tractable

Frege's nine propositional axioms + modus ponens. Maps cleanly to
`cond` / `neg` over `BSFormula`. The tractable entry point when
Frege's turn comes: prove modus ponens from Frege's formulation; show
the system complete for classical propositional logic.

### 8.2 First-order / generality (Part II) — tractable

Deep-embed Frege's generality notation; interpret shallowly into
Lean's `∀`. Works for the standard use cases without reaching the
Part III subtleties.

### 8.3 Identity of content (Part III §§8, 24) — subtle

Frege's 1879 `≡` (content-identity) pre-dates the 1892 Sinn/Bedeutung
distinction but is already doing strange work. A faithful
formalization has to choose between pure Leibnizian identity
(substitutivity salva veritate), something coarser that respects
"cognitive content" distinctions, or flagging it as an interpretive
gap with multiple modes offered. Open question; see
`open-questions.md`.

### 8.4 Second-order generality and "functions" — subtle

Frege quantifies over functions, not only objects. Lean 4 supports
this via universe-polymorphic definitions, but that commits to a
modern type-theoretic reading of Frege's "function" — defensible, not
neutral.

### 8.5 Grundgesetze and Russell's paradox

Frege's 1879 Begriffsschrift is *not* the system that blew up in the
*Grundgesetze* (1893, 1903) — the seed of the paradox is the later
Basic Law V. But the 1879 treatment of generality and functions is
already second-order with unrestricted comprehension, and any
extension toward *Grundgesetze*-style content must either restrict
comprehension (breaking fidelity) or ride the inconsistency (which a
classical verifier will happily use to "prove" anything). Flag this
prominently wherever the system is exposed in UI: the 1879 fragment
is formalized faithfully and not extended.

---

## 9. References

- `backend-logic-core.md` — F# as AST authority; the Layer-1 codegen
  used for the M1 DTO promotion; the migration triggers.
- `editor-and-ir.md` — the `LogicIR` union; the text-DSL ingest path
  that is a future sandboxing trigger (§6.3).
- `lab-roadmap.md` §"Lean integration — Fitch-style ND" and
  `lab-status.md` §C — the roadmap placement.
- `.tickets/infra-lean-runner-spike.md` — Milestone 0.
- `packages/web/src/logic/nd-types.ts`, `nd-prover.ts` — the
  `FitchProof` shape and the prover that yields the free test corpus.
