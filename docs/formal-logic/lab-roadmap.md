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
| Frame/world | Kripke (engine-driven); intuitionistic pre-orders; deontic / epistemic Kripke; LTL lasso traces; CTL branching frames | Sphere semantics (Lewis counterfactuals); labelled transition systems (dynamic logic) |
| Tree/graph proof | Truth-tree (FEAT-012), natural deduction (Fitch + Gentzen), resolution DAG, SLD tree | Sequent calculus |
| Algebraic / tabular | Truth-table (FEAT-012) | Boolean algebra; Karnaugh maps; Hasse / lattice diagrams |
| Step-by-step textual | Indian/Buddhist (Nyāya five-step + Dignāga hetu-cakra) | Obligational disputation |

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

### ~~Peirce EG Beta~~ — shipped 2026-05-05 (`feat/logic-lab-peirce-beta`)

Lines of identity for predicates over Alpha cuts; reaches FOL with
identity. **Status:** shipped 2026-05-05 — predicates take hooks
(`P(x)`, `R(x,y)`); identity is `x = y`; the translator binds each
line of identity by `∃` at the LCA of the cut-areas it touches,
making the every-loves-some shape come out as `∀x. Person(x) → ∃y.
Loves(x,y)` and the no-x shape as `¬∃x. Phil(x) ∧ Fool(x)`. The
renderer overlays a heavy line through shared hook anchors and adds
an EG → FOL KaTeX panel. Ten new beta examples. EG-Beta proof
rules / inference engine and faithful line-routing along area
boundaries remain open per the work-history notes.

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

### ~~Natural deduction — Fitch + Gentzen tree~~ — shipped 2026-05-04 (`feat/logic-lab-natural-deduction`)

Fitch-style line-numbered proofs with subproof boxes, plus
Gentzen-style tree rendering for the same proof. **Status:** shipped
2026-05-04 in the propositional fragment with a classical /
intuitionistic toggle. Quantifier rules and an explicit Lean
verification layer remain open per the work-history notes.

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

### ~~Intuitionistic logic~~ — shipped 2026-05-05 (`feat/logic-lab-intuitionistic-modal-pack`)

Pre-order Kripke forcing with persistence; classical-only-vs-
intuitionistically-valid axiom panel showcasing LEM, DNE, Peirce,
weak LEM, and the non-intuitionistic half of De Morgan as failures
on a 2-world chain / 3-world fork. **Status:** shipped 2026-05-05 as
part of the intuitionistic + modal-variant pack — `intuitionistic-eval`
treats → and ¬ as universal-future quantifiers over the reflexive-
transitive closure of R, with a frame-shape diagnostic and a "fix
frame" affordance that lifts atoms upward to monotonicity. First-order
quantifier rules and a Heyting-algebra / Curry-Howard view remain
open per the work-history notes.

### ~~Engine-derived Kripke~~ — shipped 2026-05-05 (`feat/logic-lab-kripke-engine`)

Replaces hand-authored `satisfied: boolean` per example with a
recursive `satisfies(formula, model, world)` over the existing
ModalFormula AST. **Status:** shipped 2026-05-05 — engine + frame-
constraint diagnostics (reflexive / symmetric / transitive / serial /
euclidean with violation witnesses) + per-axiom verdict table (K, T,
4, 5, B, D, with substitution + failing-world witnesses) + R-closure
under any frame class via a "fix model" affordance. Per-world ⊨ / ⊭
chips on the model view; designated-world truth badge and
model-validity badge derived live from the editor formula. Closes
the FEAT-006 §Notes "engine-derived satisfaction" deferral and the
`kripke-modal-logic.md` §Open question 5 ("is the static field
honest?") — answer: no longer, it's now computed.

- **Why.** Made Kripke a real engine instead of a curated demo.
  Set up the reusable substrate for the next ticket (intuitionistic
  Kripke) and for future epistemic / deontic / temporal variants —
  per-variant work is now a data edit (axiom-set + content), not a
  new engine.
- **Size.** M (as scoped). Multi-agent indexed modalities, tableau-
  style countermodel finder, and B / D / K4 / KD45 frame-class
  additions remain open per the work-history notes.

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

### ~~Resolution / Horn / Datalog~~ — shipped 2026-05-05 (`feat/logic-lab-resolution`)

Bridge from FOL to executable inference: clauses, unification,
proof search, derivation trees, query answering. **Status:**
shipped 2026-05-05 — three engines under one DSL with
mode-detection from syntax: binary resolution refutation
(DAG), SLD backward chaining (derivation tree with backtracking
visible), and semi-naïve Datalog forward chaining (per-iteration
strata + final model). Closes the "resolution" cell of the
matrix's Tree/graph proof row. Negation as failure, magic sets,
iterative-deepening SLD, and the compare-view / Lean integration
remain open per the work-history notes.

- **Size.** M.

### Sequent calculus (`feat/logic-lab-sequent-calculus`)

Gentzen's other system; foundation of modern proof theory and
substructural logics. Pairs naturally with Natural Deduction, but
ND is the higher-leverage proof-theoretic addition first.

- **Size.** M.

### ~~Indian / Buddhist logic~~ — shipped 2026-05-04 (`feat/logic-lab-indian-buddhist`)

Nyāya five-membered syllogism (pratijñā / hetu / udāharaṇa /
upanaya / nigamana); Dignāga's hetu-cakra (wheel of reason,
nine inferential signs); trairūpya (three characteristics of valid
inference). **Status:** shipped 2026-05-04 — first step-by-step
textual viz in the Lab. Compare-view scope and Lean integration
were explicitly de-scoped at branch creation. Dharmakīrti's three
structural hetu types are now ticketed as an extension
(`feat-logic-lab-indian-buddhist-hetucakra`, bundled with apoha and
the Nyāyapraveśa fault taxonomy — see `indian-buddhist.md`); the
Navya-Nyāya formalism is ticketed as its own separate system
(`feat-logic-lab-navya-nyaya` — see `navya-nyaya.md`).

- **Size.** M (mostly content).

### ~~Modal expansion~~ — partially shipped 2026-05-05 (`feat/logic-lab-intuitionistic-modal-pack`)

Bundled with the intuitionistic ticket as five new systems on the
freshly-merged Kripke engine. **Status:** four of the six anticipated
modal variants shipped 2026-05-05 — deontic (KD on serial frames,
with a new D frame class), epistemic (multi-agent indexed K_a with
per-agent S5 / KD45 axiom verdicts), LTL (lasso traces, X / F / G / U
with closed-form fixed points), and CTL (branching frames, eight
paired path-quantifier-plus-temporal operators with a Clarke / Emerson
/ Sistla labelling algorithm). Two variants remain in their own
follow-up tickets:

- **Dynamic logic** (`feat/logic-lab-dynamic`). Needs an action AST
  (α; β, α ∪ β, α\*, ?φ) and a labelled-transition-system frame —
  different enough from Kripke proper to warrant separate scoping.
- **Lewis counterfactuals** (`feat/logic-lab-counterfactuals`). Needs
  Lewis sphere semantics or Stalnaker selection functions — a
  different semantic substrate from Kripke; not a content addition.

Originally pegged at "S each, batched" — accurate for deontic
(content + axiom-pack) but understated for epistemic (multi-agent
AST) and the temporal logics (new engines). The four shipped
amount to ~2k LOC together.

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

## Description-logic family

A staged build-out of decidable description logic, moving from the
canonical core (ALC) up to OWL 2 DL. Each stage is its own ticket
with a queue file under `.tickets/`; pick by appetite once the base
ALC ticket lands.

| Stage | Ticket | What | Size |
|---|---|---|---|
| Base | `feat/logic-lab-description-logic` | ALC concept language + TBox + ABox + tableau reasoner + concept-hierarchy / ABox-graph / tableau-tree visualisations + ~10 examples. | L |
| SHIQ | [`.tickets/feat-logic-lab-dl-shiq.md`](../../.tickets/feat-logic-lab-dl-shiq.md) | Inverse roles, qualified number restrictions, role hierarchies, transitivity. Tableau gets pairwise / equality blocking. | M |
| SROIQ | [`.tickets/feat-logic-lab-dl-sroiq.md`](../../.tickets/feat-logic-lab-dl-sroiq.md) | Nominals, self-restriction, role chains, role properties — completes OWL 2 DL. | M |
| Datatypes | [`.tickets/feat-logic-lab-dl-datatypes.md`](../../.tickets/feat-logic-lab-dl-datatypes.md) | xsd primitives + datatype restrictions; concrete-domain solver. The `(D)` in SROIQ(D). | S–M |
| OWL import | [`.tickets/feat-logic-lab-dl-owl-import.md`](../../.tickets/feat-logic-lab-dl-owl-import.md) | Manchester + Functional syntax parsers; ingest real `.owl` files. | M |
| EL profile | [`.tickets/feat-logic-lab-dl-el-profile.md`](../../.tickets/feat-logic-lab-dl-el-profile.md) | Polynomial-time consequence-based reasoner for OWL 2 EL (SNOMED CT-class ontologies). | S–M |
| Justification | [`.tickets/feat-logic-lab-dl-justification.md`](../../.tickets/feat-logic-lab-dl-justification.md) | "Why does this entailment hold?" — minimal-axiom-subset explanations. | S |

Compare-view pairing (DL ↔ Modern FOL via the standard ALC → FOL
translation) lands as part of `feat/logic-lab-compare-view` — does
not need its own DL ticket.

---

## Frege follow-ups (post-higher-order)

The higher-order ticket (`feat/logic-lab-frege-higher-order`,
shipped 2026-05-08) closes Begriffsschrift Part III. Five follow-ups
are queued — independent, pick by appetite. Each has its own
`.tickets/` file with build sketch + references.

| Stage | Ticket | What | Size |
|---|---|---|---|
| Base (shipped) | `feat/logic-lab-frege-higher-order` | Identity-of-content (`≡`), existential as derived ¬∀¬, higher-order quantification over predicate variables, Frege → FOL/HOL translation panel, propositional / first-order / higher-order order chip. | L (shipped) |
| HOL validity | [`.tickets/feat-logic-lab-frege-hol-validity.md`](../../.tickets/feat-logic-lab-frege-hol-validity.md) | Bounded Henkin model checker over a small finite domain; ⊨/⊭ verdict + countermodel panel. The one big functional gap vs Modern FOL. | M |
| Inference chains | [`.tickets/feat-logic-lab-frege-inference-chains.md`](../../.tickets/feat-logic-lab-frege-inference-chains.md) | Formula numbers, cited references, substitution tables, inference rule lines — Frege's actual proof presentations from *Begriffsschrift*. Layout fidelity, not proof checking. | M–L |
| Grundgesetze | [`.tickets/feat-logic-lab-frege-grundgesetze.md`](../../.tickets/feat-logic-lab-frege-grundgesetze.md) | Value-ranges, Basic Law V (with a flagged Russell-paradox demo), definite description, function abstraction, profile toggle. Completes the Frege corpus end-to-end. | L |
| gfnotation interop | [`.tickets/feat-logic-lab-frege-gfnotation.md`](../../.tickets/feat-logic-lab-frege-gfnotation.md) | Import/export Wermuth's TeX short-form. Round-trip test corpus from TUGboat + GFnotation-doc. | M |
| Polish | [`.tickets/feat-logic-lab-frege-polish.md`](../../.tickets/feat-logic-lab-frege-polish.md) | Remaining 5 of Frege's 9 axioms as examples; Greek capital glyphs in predicate-sort cavities; predicate-variable arity-coherence soft-warning chip. Batched. | S |

Compare-view pairing (Frege ↔ Modern FOL) lands as part of
`feat/logic-lab-compare-view` — does not need its own Frege ticket.
Lean integration for proof checking (`feat/logic-lab-lean-fitch` in
§Long term) is the natural pair for *Inference chains* once both
ship.

---

## Optional / lower-priority

Not spine-completing in the way the above items are; depth
investments in directions the spine already touches.

- Peirce EG Gamma (modal/higher-order)
- Description logic / OWL (in progress — see §Description-logic
  family below)
- Linear / relevance / substructural logics (niche but conceptually
  rich)
- Free logic, second-order logic (specialist)
- Euler diagrams proper, Lewis Carroll diagrams (visual-history depth)
- ~~Full Frege higher-order system~~ — base shipped 2026-05-08 in
  `feat/logic-lab-frege-higher-order` (Begriffsschrift Part III).
  Five follow-up tickets (Grundgesetze, inference chains, HOL
  validity, gfnotation interop, polish) queued under §Frege
  follow-ups (post-higher-order) above.

---

## Per-system small deferrals

From `lab-status.md` §5. Each is ~half-day; pick up alongside
other work touching that system, not as standalone tickets unless
batched.

| System | Deferred item |
|---|---|
| `peirce-eg` | ~~Beta (lines of identity)~~ — shipped 2026-05-05 in `feat/logic-lab-peirce-beta`. Remaining: EG-Beta proof rules / inference engine; faithful line-routing along area boundaries (currently straight polylines); identity rendered as a heavy line rather than a `·=·` widget |
| `kripke` | ~~Engine-derived satisfaction~~ — shipped 2026-05-05 in `feat/logic-lab-kripke-engine`. ~~Multi-agent indexed modalities~~ — shipped as the `epistemic` system in `feat/logic-lab-intuitionistic-modal-pack`. ~~D axiom-set addition~~ — shipped as the `deontic` system. K4 / KD45 frame-class additions and a tableau-style countermodel finder remain open |
| `intuitionistic` | First-order quantifier rules; Heyting-algebra view; Curry-Howard term display |
| `deontic` | Dyadic / conditional deontic; STIT-style agent operators; KD45 belief variant; full Chisholm scenarios |
| `epistemic` | Common-knowledge `C` (least fixed point of "everyone knows"); distributed-knowledge `K_D`; Muddy Children / coordinated-attack scenarios |
| `temporal-ltl` | Past-time operators (Y / O / H / S); LTL → Büchi automaton view; CTL\* superset |
| `temporal-ctl` | Custom dagre layout for branching frames; CTL\* (path formulas inside A / E); µ-calculus; counterexample-as-trace witness |
| `frege-bs` | ~~Higher-order content; identity-of-content `≡`~~ — shipped 2026-05-08 in `feat/logic-lab-frege-higher-order`. Remaining: Grundgesetze profile (value-ranges, Basic Law V, definite description); HOL validity engine; Greek-glyph cavity letters; gfnotation export |
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
  `kripke-modal-logic.md`, `modern-fol.md`, `indian-buddhist.md`,
  plus `../case-studies/peirce/`. Queued (design doc precedes
  implementation): `navya-nyaya.md`, `saptabhangi.md`, `avicennan.md`.
- Cross-cutting: `logic-explorer-tab.md`, `editor-and-ir.md`,
  `formal-verification.md`, `open-questions.md`
- Non-Western candidate systems: `world-logic-traditions.md` —
  tickets now queued: `feat-logic-lab-navya-nyaya`,
  `feat-logic-lab-saptabhangi`, `feat-logic-lab-avicennan`,
  `feat-logic-lab-indian-buddhist-hetucakra`
- Per-ticket history: `work-history/FEAT-005.md` through
  `FEAT-012.md`; `work-history/INFRA-004.md`
