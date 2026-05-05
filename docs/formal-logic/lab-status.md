# Logic Lab — Status & Roadmap

**Last shipped:** Engine-derived Kripke
(`feat/logic-lab-kripke-engine`), 2026-05-05 — Kripke satisfaction
algorithm + frame-constraint diagnostics + per-axiom verdicts (K, T,
4, 5, B, D) + R-closure under any frame class. Closes the FEAT-006
§Notes "engine-derived satisfaction" deferral and the
`kripke-modal-logic.md` §5 "is the static `satisfied` field honest?"
question. Substrate for intuitionistic Kripke, the next ticket.
**Previously:** Resolution · Horn · Datalog
(`feat/logic-lab-resolution`, 2026-05-05); Indian / Buddhist logic
(`feat/logic-lab-indian-buddhist`, 2026-05-04); natural deduction
(`feat/logic-lab-natural-deduction`, 2026-05-04); Boolean algebra
(`feat/logic-lab-boolean-algebra`, 2026-05-03); INFRA-004 —
route-level code-splitting; FEAT-012 — truth-table + truth-tree
views in Modern FOL.
**Status:** ten systems populated, with the modal-logic system now
engine-driven rather than hand-authored. The historical spine
includes the algebraic-logic lineage (Boole → Schröder), the
proof-theoretic spine (ND, Fitch + Gentzen), a non-Western-tradition
system (Nyāya / Dignāga), and the executable-inference spine
(resolution, SLD, Datalog). Cross-cutting work continues per
`lab-roadmap.md`.

This doc is a snapshot, not a spec. Per-system design lives in
the matching `docs/formal-logic/<system>.md` file; per-ticket
detail lives in `work-history/FEAT-###.md`.

---

## What ships now

| System | Slug | Ticket | Validity engine | Visualisation |
|---|---|---|---|---|
| Peirce Existential Graphs (Alpha) | `peirce-eg` | FEAT-005 | structural normalisation + propositional check on translation | SVG cuts, juxtaposition, nested ovals |
| Kripke modal logic | `kripke` | FEAT-006 + `feat/logic-lab-kripke-engine` | engine-derived satisfaction (atoms / ¬ / ∧ / ∨ / → / ↔ pointwise; □ / ◇ over R-successors); per-world truth chips; frame-constraint diagnostics (reflexive / symmetric / transitive / serial / euclidean) with violation witnesses; per-axiom verdict table (K, T, 4, 5, B, D) with substitution + failing-world witnesses; R-closure under any frame class | xyflow frame diagram with per-world ⊨/⊭ chips + designated-world truth badge + model-validity badge + frame-diagnostics grid + axiom-verdict table |
| Frege Begriffsschrift | `frege-bs` | FEAT-007 | propositional truth-table on the linearised AST | 2D stroke-and-concavity SVG |
| Aristotelian syllogistic | `aristotelian` | FEAT-008 + FEAT-009 | mood/figure validity; existential-import toggle; square + immediate inferences | square-of-opposition diagram, Venn |
| Medieval modal syllogistic + sorites | `medieval` | FEAT-010 | de re / de dicto modal validity; sorites chain validation | modal-aware Venn + sorites chain |
| Modern first-order logic | `modern-fol` | FEAT-011 + FEAT-012 | two-tier: truth-table (propositional) + bounded semantic tableau (FOL) with union-find equality | KaTeX formula + countermodel panel + Lemmon-style truth table (propositional) + indented truth-tree / tableau view (FOL) |
| Boolean algebra | `boolean` | `feat/logic-lab-boolean-algebra` | truth-table classification + rule-based simplifier + Quine–McCluskey prime implicants | KaTeX algebraic formula + Karnaugh map (≤ 4 vars, prime-implicant cover) + Hasse / lattice diagram (≤ 4 vars) + truth table + DNF / CNF / ANF + step-trace simplifier |
| Natural deduction | `natural-deduction` | `feat/logic-lab-natural-deduction` | backward-chaining ND prover (propositional) with classical / intuitionistic rule-set toggle | Fitch-style line-numbered proof with subproof boxes + Gentzen-style derivation tree (discharged assumptions bracketed) |
| Indian / Buddhist logic (Nyāya · Dignāga) | `indian-buddhist` | `feat/logic-lab-indian-buddhist` | trairūpya checks (pakṣa-dharmatā / sapakṣe sattvam / vipakṣe asattvam) + Dignāga hetu-cakra cell placement; pakṣa-dharmatā gates the verdict (asiddha) | Five-membered textual inference (pratijñā · hetu · udāharaṇa · upanaya · nigamana) + 3×3 hetu-cakra wheel highlighting the active cell + trairūpya verdict panel |
| Resolution · Horn · Datalog | `resolution` | `feat/logic-lab-resolution` | three engines under one DSL: binary resolution refutation (saturation, MGU, occurs check) + SLD backward chaining (leftmost selection, depth-bounded DFS, answer substitution) + semi-naïve forward chaining to fixpoint | Mode-detected from syntax: depth-stratified resolution DAG (clauses); SLD derivation tree with success spine + dead ends (horn); per-iteration strata + final-model panel (datalog) |

Ten systems × ~10 examples each, ~100 example inputs total.
Slash-command editor (`LogicCmEditor`) and shared chrome reused
across all ten. Test count after engine-derived Kripke:
**648/648 passing.**

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

### 3. ~~Bundle / route-level code-splitting~~ — closed in INFRA-004

Route-level code-splitting via TanStack Router's lazy loading shipped
in INFRA-004 (2026-05-03). Lab systems now load on demand rather
than shipping to every other route.

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
| `kripke` | ~~Engine-derived satisfaction~~ — shipped in `feat/logic-lab-kripke-engine`. Multi-agent indexed modalities (`[a]p`, `K_a p`); B / D / K4 / KD45 axiom-set additions (now data-only — `kripke-frames.ts` + `kripke-axioms.ts` are open for new entries); tableau-style countermodel finder when a formula isn't model-valid |
| `frege-bs` | Higher-order content; identity-of-content `≡` — `frege-begriffsschrift.md` |
| `aristotelian` | Term-distribution diagnostics in invalid moods — FEAT-009 §Notes |
| `medieval` | Modal sorites; obligational disputation — FEAT-010 §Notes |
| `modern-fol` | Function congruence under equality (Nelson-Oppen, ~100 lines); fairness-complete tableau strategy; budget knob in UI — FEAT-011 §Notes |
| `natural-deduction` | Quantifier rules (∀I/∀E/∃I/∃E); Lean-validated alternative renderer; horizontal Gentzen layout — see `work-history/feat-natural-deduction.md` §Notes |
| `resolution` | Variable canonicalisation in clause signatures; iterative-deepening SLD; multiple SLD answers; negation-as-failure; list-syntax pretty-printer for `cons`/`nil`; unification trace; set-of-support strategy — see `work-history/feat-logic-lab-resolution.md` §Notes |

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
2. ✅ Cross-cutting **3** (code-splitting) — done in INFRA-004.
3. **B** next — wraps the spine; turns six independent systems
   into a comparison surface.
4. Cross-cutting **4** (browser smoke) — not blocking, should land
   before the Lab is "done" by external standards.
5. Beyond B + browser smoke, see **`lab-roadmap.md`** for the
   medium- and long-term plan (Peirce Beta, Boolean algebra,
   natural deduction, intuitionistic logic, engine-derived Kripke,
   Stoic/many-valued/Indian-Buddhist breadth, Lean integration).

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
