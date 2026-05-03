# Logic Lab — Status & Roadmap

**Last shipped:** FEAT-012 (`feat/FEAT-012-logic-lab-truth-tables-trees`),
2026-05-03 — truth-table view (propositional) and truth-tree /
semantic-tableau view (FOL) added to the Modern FOL Lab. Both pull
from the FEAT-011 validity engine; no new algorithm.
**Previously:** FEAT-011 — modern first-order logic in Peano/Russell
notation with truth-table + bounded semantic-tableau validity.
**Status:** six systems populated. Spine of historically-major
notation systems is now complete; remaining work is cross-cutting
(comparison view, code-splitting, proof-as-natural-deduction)
rather than "another system."

This doc is a snapshot, not a spec. Per-system design lives in
the matching `docs/formal-logic/<system>.md` file; per-ticket
detail lives in `work-history/FEAT-###.md`.

---

## What ships now

| System | Slug | Ticket | Validity engine | Visualisation |
|---|---|---|---|---|
| Peirce Existential Graphs (Alpha) | `peirce-eg` | FEAT-005 | structural normalisation + propositional check on translation | SVG cuts, juxtaposition, nested ovals |
| Kripke modal logic | `kripke` | FEAT-006 | hand-authored truth at designated world per (formula, frame, model) | xyflow frame diagram + truth badge |
| Frege Begriffsschrift | `frege-bs` | FEAT-007 | propositional truth-table on the linearised AST | 2D stroke-and-concavity SVG |
| Aristotelian syllogistic | `aristotelian` | FEAT-008 + FEAT-009 | mood/figure validity; existential-import toggle; square + immediate inferences | square-of-opposition diagram, Venn |
| Medieval modal syllogistic + sorites | `medieval` | FEAT-010 | de re / de dicto modal validity; sorites chain validation | modal-aware Venn + sorites chain |
| Modern first-order logic | `modern-fol` | FEAT-011 + FEAT-012 | two-tier: truth-table (propositional) + bounded semantic tableau (FOL) with union-find equality | KaTeX formula + countermodel panel + Lemmon-style truth table (propositional) + indented truth-tree / tableau view (FOL) |

Six systems × ~10 examples each, ~80 example inputs total.
Slash-command editor (`LogicCmEditor`) and shared chrome reused
across all six. Test count after FEAT-011: **384/384 passing.**

---

## What's *not* done — cross-cutting gaps

Each item below is a separate ticket, not a phase of one. They
were flagged across FEATs 005–011's "Notes for future work" and
remain open.

### 1. ~~Proof-tree / step-sequence rendering~~ — closed in FEAT-012

The truth-tree (FOL) and truth-table (propositional) panels now
render alongside the Modern FOL Lab editor. The tableau algorithm
moved to `fol-tableau-tree.ts:buildTableauTree`, which retains the
proof tree; `fol-validity.ts:checkValidity` is now a thin shim that
calls it and reads off the verdict.

Remaining proof-presentation work — natural-deduction translation
of the closed tableau into Fitch / Lemmon-style numbered lines —
is a separate proof-theoretic problem (see §C below) and likely
where Lean integration would earn its keep.

### 2. Cross-system "compare" view

`/logic/compare` was sketched in `logic-explorer-tab.md` and has
never been built. The natural first pair is
**Frege ↔ Modern FOL** (same fragment, two notations); the natural
second is **Aristotelian ↔ Modern FOL** (translation matrix from
A/E/I/O to ∀/∃/∧/¬). Requires either a shared core AST or a
per-direction translation pass. Not a research problem — a
build-it problem.

### 3. Bundle / route-level code-splitting

Flagged since FEAT-005 and unaddressed since. By FEAT-011 the web
build is ~1.37 MB pre-gzip / ~418 kB gzipped, with six Lab
systems' code shipped to every other route. The fix is route-level
code-splitting via TanStack Router's lazy loading; ~half-day
ticket.

### 4. Browser smoke / interaction testing

Verification across the Lab tickets has been `vitest` + `tsc
--noEmit` + `npm run build`. No human or Playwright pass on
keyboard interaction, KaTeX overflow at long formulas, the
narrow-viewport countermodel layout, or editor → render → re-parse
round-trips.

### 5. Per-system smaller deferrals

| System | Deferred item |
|---|---|
| `peirce-eg` | Beta (lines of identity) — FEAT-005 §Notes |
| `kripke` | Engine-derived satisfaction (currently hand-authored) — FEAT-006 §Notes |
| `frege-bs` | Higher-order content; identity-of-content `≡` — `frege-begriffsschrift.md` |
| `aristotelian` | Term-distribution diagnostics in invalid moods — FEAT-009 §Notes |
| `medieval` | Modal sorites; obligational disputation — FEAT-010 §Notes |
| `modern-fol` | Function congruence under equality (Nelson-Oppen, ~100 lines); fairness-complete tableau strategy; budget knob in UI — FEAT-011 §Notes |

---

## Natural next steps

Three tickets sized roughly for the same shape as FEATs 005–011.
Pick by appetite, not by dependency — they're independent.

### A. Truth-tree + truth-table visualisation — **shipped in FEAT-012**

Both panels now render in the Modern FOL Lab.

- ✅ **Truth-table view** — Lemmon-style, atoms first then
  subformula columns then the input formula (highlighted), one row
  per valuation, falsifying rows tinted rose. Built by
  `fol-truth-table.ts:buildTruthTable`.
- ✅ **Truth-tree view** — Smullyan tableau rendered as an indented
  vertical tree. Each node shows its rule class (α / β / γ / δ),
  introduced formula(s), and (for γ/δ) the term used. Closed
  leaves show ⊗ + closure witness; open leaves show inline
  countermodel; budget-exhausted leaves show ⌛. Built by
  `fol-tableau-tree.ts:buildTableauTree`, which `checkValidity`
  also delegates to for the verdict.
- ⏭ **Step-through / manual mode** — engine primitives
  (`pickWork`, `expand`, `closureWitness`) are pure and separable,
  so a "next step" button or a "user picks the next rule" mode
  would be ~50 LOC plus a frontier-state model. Phase-2 polish.

### B. Compare view (FEAT-013 candidate)

`/logic/compare?systems=frege-bs,modern-fol&formula=…` shows the
same content rendered in both notations. First pair: Frege ↔ Modern
FOL (same fragment, established translation). Reuses both
renderers; the new code is the AST bridge plus the route. Tracked
in `logic-explorer-tab.md` §Comparison view.

### C. Lean integration spike (FEAT-014 candidate, larger)

The remaining motivation for Lean is producing **Fitch-style
natural-deduction proofs** as the displayed output, not as
verification. The closed tableau gives the structure; Lean would
provide the canonical ND derivation rendered as numbered lines
with justification ("∀E on (1) with witness c"). Strictly larger
than A or B and only worth doing if ND-style proof presentation
is a desired UX, not an "is it valid" question — that's already
answered.

Sandboxing, cold-start latency, and the specific embedding choice
are the open design questions; see `formal-verification.md` §3-4.

---

## Recommended sequencing

1. ✅ **A** — done in FEAT-012.
2. **B** next — wraps the spine; turns six independent systems
   into a comparison surface.
3. Cross-cutting **3** (code-splitting) and **4** (browser smoke) —
   neither is blocking, both should land before the Lab is "done"
   by external standards.
4. **C** if and only if natural-deduction proof rendering is the
   next pedagogical target. Otherwise defer indefinitely; the
   tableau view from FEAT-012 already shows the proof structure
   directly.

---

## References

- Per-system design docs: `aristotelian-syllogistic.md`,
  `medieval-syllogistic.md`, `frege-begriffsschrift.md`,
  `kripke-modal-logic.md`, `modern-fol.md`. Peirce EG design
  lives in `../case-studies/peirce/`.
- Cross-cutting: `logic-explorer-tab.md` (route shape, compare
  view), `editor-and-ir.md` (shared editor + IR strategy),
  `formal-verification.md` (Lean integration), `open-questions.md`.
- Per-ticket history: `work-history/FEAT-005.md` through
  `FEAT-011.md`.
