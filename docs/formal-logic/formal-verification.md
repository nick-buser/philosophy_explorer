# Formal Verification via Lean

**Status:** Draft — first-pass notes, 2026-04-16

Mediating Begriffsschrift-style proofs to a headless Lean instance,
without pretending Frege's system is Lean's system.

---

## 1. Goal

A user builds a proof in the Frege notation (or any supported system).
The backend ships that proof's AST to a headless Lean process, which
type-checks it against a formalization of the relevant system and
returns verified / unverified + error location.

The value is *honest* verification: proof steps are checked against
axioms and inference rules faithful to the historical system, not
against Lean's native classical logic.

---

## 2. What's tractable vs. subtle

A pass over Begriffsschrift's structure for what maps cleanly and what
requires interpretive choices.

### 2.1 Propositional fragment (Part I) — tractable

Frege's nine propositional axioms + modus ponens. Maps cleanly to
Lean's `Prop` with `→` and `¬`. Good first milestone:

- Prove modus ponens from Frege's formulation.
- Prove the system is complete for classical propositional logic.
- Verifies end-to-end that the AST → Lean pipeline works.

### 2.2 First-order / generality (Part II) — tractable

Deep-embed Frege's generality notation; interpret shallowly into Lean's
`∀`. Works for the standard use cases without getting into the Part III
subtleties.

### 2.3 Identity of content (Part III §§8, 24) — subtle

Frege's 1879 `≡` (content-identity) pre-dates the 1892 Sinn/Bedeutung
distinction but is already doing strange work. A faithful formalization
has to decide between:

- Pure Leibnizian identity (substitutivity salva veritate).
- Something coarser that respects "cognitive content" distinctions.
- Flagging it as an interpretive gap and offering multiple modes.

Open question; see `open-questions.md`.

### 2.4 Second-order generality and "functions" — subtle

Frege quantifies over functions, not only objects. Lean 4 supports this
via universe-polymorphic definitions, but you're committing to a modern
type-theoretic reading of Frege's "function." This is defensible but
not neutral.

---

## 3. Recommended approach: deep embedding

Do **not** translate Frege formulas directly into Lean propositions.
Instead:

1. Define Begriffsschrift syntax as a Lean inductive type:

   ```lean
   inductive BSFormula where
     | atom     : String → BSFormula
     | cond     : BSFormula → BSFormula → BSFormula      -- → / condition stroke
     | neg      : BSFormula → BSFormula                  -- negation tick
     | forall_  : String → BSFormula → BSFormula         -- generality concavity
     | ident    : BSFormula → BSFormula → BSFormula      -- ≡
   ```

2. Define Frege's axioms and inference rules as constructors of a
   `Deriv : List BSFormula → BSFormula → Type` judgment type.
3. Prove a soundness theorem: any `Deriv Γ φ` has a model in classical
   first-order logic.
4. The backend ships proofs as `Deriv` terms; Lean's kernel type-checks
   them against the inductive definition.

This gives real formal verification **of Frege's system as Frege's system**,
not "Frege-looking text translated into Lean's own logic." The soundness
theorem is a separable piece of mathematics that connects the two.

Same pattern applies to other systems (Peirce EG, Boolean algebra,
Aristotelian syllogistic if we mechanize it). Each gets its own
deep-embedded `*Formula` and `*Deriv`.

---

## 4. Plumbing — F# ↔ Lean

The F# backend already exists. Lean integration is a net-new component.

### 4.1 Protocol options

| Option | Use case | Notes |
|---|---|---|
| **Subprocess + batch `lake`** | Simple, stateless verification | Cold-start per call; high latency. Easy to implement. |
| **`lean --server` / LSP** | Interactive / incremental | Lower per-call latency; more setup. |
| **JSON-RPC to a long-running Lean service** | Production | Requires a custom Lean service. Best latency. Most infra. |

**Start with subprocess + batch `lake`.** Switch to long-running only
when latency or throughput forces it.

### 4.2 Caching

Compiled `.olean` files for axioms/inference rules should be cached
aggressively — they don't change between user proofs. Per-proof
`.olean` outputs are ephemeral. Content-hash the proof AST → cache
verification result so re-verifying an unchanged proof is O(1).

### 4.3 Sandboxing

Lean is a full programming language. Any user-supplied input becomes
untrusted code. Run Lean in a process-level sandbox (ulimit on CPU/memory,
no network, read-only filesystem except scratch) and enforce timeouts.

---

## 5. Note on Grundgesetze and Russell's paradox

Frege's 1879 Begriffsschrift is *not* the system that blew up in the
*Grundgesetze* (1893, 1903). The seed of the paradox is the later
Basic Law V, not the 1879 work. But:

- The 1879 treatment of generality and functions is second-order with
  unrestricted comprehension, which is already non-trivial.
- Any attempt to extend a Begriffsschrift formalization toward
  *Grundgesetze*-style content must either restrict comprehension
  (breaking fidelity) or ride the inconsistency (which a classical
  verifier will happily use to "prove" anything).

Flag this prominently wherever we expose the system in UI. "Frege's
system is inconsistent when pushed to Grundgesetze's scope; we
formalize the 1879 fragment faithfully but don't extend it."
