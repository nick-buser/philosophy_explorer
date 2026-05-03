# Logic Lab — Roadmap

**Status:** Plan, 2026-05-03 — collated from two independent reviews
of "what's worth working on next" written just before FEAT-012.
**Snapshot it builds on:** `lab-status.md`. Six systems populated;
truth-tree and truth-table render shipped (FEAT-012); route-level
code-splitting shipped (INFRA-004). Spine of historically-major
*content* notations is in. The roadmap below covers what comes
next.

This doc is forward-looking. Per-system design lives in the matching
`docs/formal-logic/<system>.md` file; per-ticket detail lives in
`work-history/<slug>.md` after the branch merges.

---

## Framing — system × visualization matrix

The Lab implicitly operates on a 2D grid: **logical system** ×
**visualization family**. Pulling that grid out makes structural
gaps legible in a way the per-system list doesn't:

| Visualization family | In Lab now | Notable absent |
|---|---|---|
| Linear symbolic | Aristotelian, Modern FOL | Stoic, Polish, Boolean equations |
| 2D structural | Frege, Peirce EG Alpha | Peirce EG Beta/Gamma |
| Diagrammatic semantic | Venn (Aristotelian/medieval), square-of-opposition | Euler proper, Carroll, spider |
| Frame/world | Kripke (hand-authored) | Engine-derived Kripke; intuitionistic Kripke; temporal frames |
| Tree/graph proof | Truth-tree (FEAT-012) | Natural deduction (Fitch / Gentzen), sequent, resolution |
| Algebraic / tabular | Truth-table (FEAT-012) | Boolean algebra; Karnaugh maps; Hasse / lattice diagrams |
| Step-by-step textual | *(none)* | Indian/Buddhist five-membered, obligational disputation |

Two consequences fall out of this view:

1. **Picking a system gets you a visualization family for free, or
   doesn't.** Boolean algebra brings Karnaugh maps and lattice
   diagrams; natural deduction brings Fitch boxes and Gentzen trees;
   intuitionistic logic reuses Kripke with one constraint added.
   Prefer system tickets that ship a missing viz family with them.
2. **The Lab is currently strong at producers (per-system engines),
   weaker at decomposers (rendering proof shape) and pollinators
   (translating across systems).** FEAT-012 was a decomposer ticket;
   the compare view is a pollinator ticket. Future work should keep
   that balance in mind rather than only stacking more producers.

---

## Spine claim, audited

`lab-status.md` says "the spine of historically-major notation
systems is now complete." That's true on a narrow reading and
overstated on a broader one. What is covered is the *content*
spine: term logic (Aristotle), 2D quantificational (Frege),
linear modern (Russell/Peano), diagrammatic alternative (Peirce
Alpha), and the canonical 20th-century semantic move (Kripke).

What is **not** covered, even on a generous reading of "major
notation systems":

- **Boolean / algebraic-logic lineage** (Boole → De Morgan →
  Jevons → Schröder). Historical bridge between Aristotelian and
  modern; an entire notational tradition with its own
  visualizations (Karnaugh, Hasse).
- **Stoic propositional logic.** The propositional layer that
  *predates* Aristotelian predicate logic historically. Five
  indemonstrables, Diodorean / Philonian conditional debate.
- **Proof calculi as first-class.** The Lab tells you *whether*
  a formula is valid; with FEAT-012 it now also shows the tableau
  shape. It does not yet show natural-deduction or sequent-calculus
  proofs — the proof formats every undergrad logic course actually
  teaches.
- **Constructive / intuitionistic logic.** A canonical alternative
  to classical logic and the basis for the Curry-Howard / type-theory
  bridge.

The ticket plan below is organized to close these gaps in order of
leverage, not chronological-history order.

---

## Short term

Two tickets sized roughly for FEATs 005-011's shape. Independent;
pick by appetite.

### Compare view (`feat/logic-lab-compare-view`)

Route `/logic/compare?systems=…&formula=…` showing the same
content rendered in two notations side-by-side.

- **Why.** The Lab's six systems are currently isolated galleries.
  Compare is the *pollinator* role — translating between notation
  niches without forcing a shared vocabulary. Highest pedagogical
  payoff per LOC of the remaining cross-cutting work.
- **First pair.** Frege ↔ Modern FOL (same fragment, established
  translation; reuses both renderers). Second pair: Aristotelian
  ↔ Modern FOL (translation matrix from A/E/I/O to ∀/∃/∧/¬).
- **Build.** Either a shared core AST or a per-direction translation
  pass. Route + AST bridge are the new code; renderers are reused.
  Sketched in `logic-explorer-tab.md` §Comparison view.
- **Size.** S–M.

### Browser smoke / interaction tests (`infra/logic-lab-playwright-smoke`)

Verification across FEATs 005-011 has been vitest + tsc + build.
No Playwright pass on keyboard interaction, KaTeX overflow at long
formulas, narrow-viewport countermodel layout, or editor → render
→ re-parse round-trips.

- **Why.** Substrate-hygiene; not blocking but should land before
  the Lab is "done" by external standards.
- **Build.** Playwright config + smoke specs covering one happy path
  per system + a handful of regressions.
- **Size.** S.

### Truth-tree step-through (`feat/logic-lab-tableau-step-through`) — optional polish

`pickWork` / `expand` / `closureWitness` are pure and separable in
`fol-tableau-tree.ts`, so a "next step" button or "user picks the
next rule" mode is ~50 LOC plus a frontier-state model. Phase-2
polish; only worth doing if user testing surfaces it as confusing
that the tree appears all at once.

- **Size.** XS–S.

---

## Medium term — close the largest gaps

The ranked omissions, sized as ticket pairs (engine + viz where
applicable). Independent; pick by what's most exciting.

### Peirce EG Beta (`feat/logic-lab-peirce-beta`)

Lines of identity for predicates over Alpha cuts; reaches FOL with
identity. SEP describes Beta as equivalent to first-order logic
with identity, with lines filling the role of variables and
quantifiers.

- **Why.** Largest *visual* logic gap and a direct extension of
  existing infrastructure. Completes Peirce as a serious
  alternative to FOL, not just a propositional curiosity.
- **Build.** Extend the existing Alpha SVG renderer with line-of-identity
  primitives; extend the EG ↔ propositional translation to EG ↔ FOL;
  add ~10 examples.
- **Size.** M.

### Boolean algebra (`feat/logic-lab-boolean-algebra`)

A new system covering the algebraic-logic lineage that the spine
currently skips entirely.

- **Why.** Three new visualization families in one ticket: algebraic
  equations, Karnaugh maps, lattice / Hasse diagrams. Bridge to
  digital-logic and circuit-theory connections nothing else in the
  Lab provides. Historically the link between Aristotelian and
  Frege/Russell.
- **Build.** Boolean expression parser (small); simplification laws
  (de Morgan, absorption, distributivity); CNF/DNF/ANF normal forms;
  truth-table equivalence (reuses FEAT-012 machinery); Karnaugh-map
  renderer; lattice/Hasse renderer.
- **Size.** M–L. The "several visualizations in one system" property
  is an asset, not a cost.

### Natural deduction — Fitch + Gentzen tree (`feat/logic-lab-natural-deduction`)

Fitch-style line-numbered proofs with subproof boxes, plus
Gentzen-style tree rendering for the same proof.

- **Why.** Largest *proof-theoretic* gap. Almost every modern logic
  textbook teaches ND. The Lab can show that something is valid;
  it can't yet show *a proof of why*. The note in `lab-status.md`
  that Lean integration is needed for ND presentation slightly
  overstates the dependency: Lean is for *verification*; ND-as-output
  is for *presentation*. A hand-rolled backward-chaining ND prover
  plus Fitch renderer is meaningful on its own.
- **Build.** ND prover (proof search via backward chaining over
  introduction/elimination rules); Fitch renderer (numbered lines,
  justification column, subproof box); Gentzen renderer (tree of
  sequents); compare classical vs. intuitionistic variants by
  toggling rules.
- **Size.** L. Larger than Boolean; smaller than Lean integration.

### Intuitionistic logic (`feat/logic-lab-intuitionistic`)

Reuses the Kripke infrastructure with persistence (once true at a
world, true at all accessible worlds) and removes excluded middle
/ double-negation elimination from the proof rules.

- **Why.** Canonical alternative to classical logic, basis of
  constructive mathematics, and the Curry-Howard end of the
  type-theory bridge. Cheap given existing scaffolding; opens
  substantial conceptual surface (genuinely different conceptions
  of proof and truth).
- **Build.** Add intuitionistic Kripke semantics (monotone-world
  diagrams) to the existing engine; mark classically-valid-but-
  intuitionistically-invalid principles (excluded middle,
  double-negation, Peirce's law) with countermodels; pair naturally
  with Natural Deduction above for the rule-toggle UX.
- **Size.** M, much smaller if Natural Deduction lands first.

### Engine-derived Kripke (`feat/logic-lab-kripke-engine`)

Currently `kripke` evaluates hand-authored truth-at-designated-world
per (formula, frame, model). The deferred work is replacing that with
an engine that takes a frame + model + formula and computes
satisfaction, plus letting the user toggle frame conditions K/T/B/S4/S5
and see which axioms hold/fail.

- **Why.** Makes Kripke a real engine instead of a curated demo.
  Sets up the reusable substrate for epistemic / deontic / temporal
  variants later (no per-variant ticket needed for the engine, just
  for axiom-set + content).
- **Build.** Kripke satisfaction algorithm (well-understood);
  countermodel generation when a formula fails; UI for frame-condition
  toggle; axiom-schema validity check per frame.
- **Size.** M. Already flagged in FEAT-006 §Notes.

---

## Long term — historical and conceptual breadth

These are valuable but lower leverage than the medium-term items.
Sequence depends on which direction the project wants to lean
(historical breadth vs. computational depth).

### Stoic propositional logic (`feat/logic-lab-stoic`)

Chrysippus's five indemonstrables; the Diodorean / Philonian
conditional debate. Content-heavy, engine-light (mostly classical
propositional with a particular axiomatization). Built-in
Diodorean ↔ Philonian comparison is its own pedagogical hook.

- **Size.** S–M.

### Many-valued logic (`feat/logic-lab-many-valued`)

Łukasiewicz 3-valued, Kleene strong/weak, Post n-valued. Modifies
the truth-table machinery from FEAT-012 trivially (more values per
cell, different connective definitions). Cheapest extension on this
list; sets up paraconsistency and fuzzy logic without committing
to either.

- **Size.** S.

### Resolution / Horn / Datalog (`feat/logic-lab-resolution`)

Bridge from FOL to executable inference: clauses, unification,
proof search, derivation trees, query answering. Strategically
valuable given the project's broader knowledge-graph leanings —
naturally connects to Brandomian entailment / incompatibility
graphs and the existing entity graph layer.

- **Size.** M.

### Sequent calculus (`feat/logic-lab-sequent-calculus`)

Gentzen's other system; foundation of modern proof theory and
substructural logics. Pairs naturally with Natural Deduction, but
ND is the higher-leverage proof-theoretic addition first.

- **Size.** M.

### Indian / Buddhist logic (`feat/logic-lab-indian-buddhist`)

Nyāya five-membered syllogism (pratijñā / hetu / udāharaṇa /
upanaya / nigamana); Dignāga's hetu-cakra (wheel of reason,
nine inferential signs); trairūpya (three characteristics of valid
inference). Breaks the implicit Western-tradition frame; introduces
step-by-step textual presentation as a new visualization family on
the matrix above. Substantive content work; light engine.

- **Size.** M (mostly content).

### Modal expansion (`feat/logic-lab-modal-variants`)

Once Kripke is engine-derived: epistemic, deontic, temporal (LTL/CTL
on existing frame visualization), dynamic, counterfactual. Each is
small individually but only worth picking once the substrate is in
place.

- **Size.** S each, batched.

### Lean integration — Fitch-style ND (`feat/logic-lab-lean-fitch`)

The tableau gives the structure; Lean would render a canonical ND
derivation as numbered lines with rule justifications. Strictly
larger than the medium-term items and only worth doing if natural-
deduction-style proof presentation is a desired UX. If the hand-rolled
ND prover lands first, this becomes a *verification* layer rather
than a presentation prerequisite. Open design questions: sandboxing,
cold-start latency, embedding choice (`formal-verification.md` §3-4).

- **Size.** XL.

---

## Optional / lower-priority

Not spine-completing in the way the above items are; depth
investments in directions the spine already touches.

- Peirce EG Gamma (modal/higher-order)
- Description logic / OWL (semantic-web; more engineering than
  philosophical)
- Linear / relevance / substructural logics (niche but conceptually
  rich)
- Free logic, second-order logic (specialist)
- Euler diagrams proper, Lewis Carroll diagrams (visual-history depth)
- Full Frege higher-order system

---

## Per-system small deferrals

From `lab-status.md` §5. Each is ~half-day; pick up alongside
other work touching that system, not as standalone tickets unless
batched.

| System | Deferred item |
|---|---|
| `peirce-eg` | Beta (subsumed by `feat/logic-lab-peirce-beta` above) |
| `kripke` | Engine-derived satisfaction (subsumed by `feat/logic-lab-kripke-engine`) |
| `frege-bs` | Higher-order content; identity-of-content `≡` |
| `aristotelian` | Term-distribution diagnostics in invalid moods |
| `medieval` | Modal sorites; obligational disputation |
| `modern-fol` | Function congruence under equality (Nelson-Oppen, ~100 LOC); fairness-complete tableau strategy; budget knob in UI |

---

## Substrate / cross-cutting

Run on their own cadence; not competing with feature tickets.

- ✅ Route-level code-splitting (INFRA-004, shipped)
- Browser smoke / Playwright (covered in §Short term)
- Shared core AST vs. per-direction translators — decided when the
  compare view ships, not before
- Storage migration for `data/seed/logic-systems.json` /
  `logic-propositions.json` to Postgres — when content outgrows
  hand-editable scale or user-authored systems become a goal
  (`open-questions.md` §2.9)

---

## Note on ticket numbering

Branch-name management got chaotic somewhere around FEAT-010 and
the cost is now visible: tickets need numbers reserved before the
branch exists, numbers and titles drift apart when work re-scopes,
and the prefix-number-slug pattern fights every tool that wants to
suggest a branch name from an issue title.

Leaning toward dropping the numeric component for new tickets:
keep the prefix (`feat`, `infra`, `fix`, `refac`, `docs`, `db`)
because it sorts and signals scope, drop the number, let the
slug carry the identity. Branch names become e.g.
`feat/logic-lab-compare-view` rather than
`feat/FEAT-013-logic-lab-compare-view`. GitHub Issues still get
numbered automatically; the issue number lives in the PR
description, not the branch name.

Decision belongs to the next ticket that opens, not this doc.
The slugs above are written in the proposed format so they can
be used as-is if the change is adopted.

---

## References

- Snapshot of what ships: `lab-status.md`
- Per-system design: `aristotelian-syllogistic.md`,
  `medieval-syllogistic.md`, `frege-begriffsschrift.md`,
  `kripke-modal-logic.md`, `modern-fol.md`, plus
  `../case-studies/peirce/`
- Cross-cutting: `logic-explorer-tab.md`, `editor-and-ir.md`,
  `formal-verification.md`, `open-questions.md`
- Per-ticket history: `work-history/FEAT-005.md` through
  `FEAT-012.md`; `work-history/INFRA-004.md`
