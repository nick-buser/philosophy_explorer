# Modern First-Order Logic — System Design

**Status:** Phase 2 (FEAT-012) in progress, 2026-05-03 — proof-tree
+ truth-table visualisation added
**Implementing tickets:** `FEAT-011-logic-lab-modern-fol`,
`FEAT-012-logic-lab-truth-tables-trees`

The sixth populated system in the Logic Lab. Modern classical first-
order logic in Peano/Russell linear notation — the canonical working
notation of mathematics and analytic philosophy since the early 20th
century. It is, ironically, the *last* of the major historical
systems to land in the Lab: the surrounding ones (Frege's
Begriffsschrift, Aristotelian and medieval term logic, Kripke modal
logic, Peirce's EG) are all either older alternatives or later
extensions. This page completes the spine.

Background: [`notation-systems.md`](./notation-systems.md) §2,
[`frege-begriffsschrift.md`](./frege-begriffsschrift.md) (the 2D
predecessor with the same expressive power),
[`logic-explorer-tab.md`](./logic-explorer-tab.md) §System
descriptor.

---

## Purpose

Give a working linear notation for classical FOL with two axes that
the other Labs can't display the same way:

- **Linearised quantifier scope.** Frege's Begriffsschrift makes
  scope visible by 2D layout (the concavity dipping into the content
  stroke). Peano/Russell collapses that into a 1D string with
  punctuation discipline (`forall x.`) and a wide-scope convention.
  The lab demonstrates how the same content reads in both.
- **A real validity engine across the FOL fragment.** Truth-table for
  the propositional fragment (decidable, exact); a bounded semantic
  tableau for the quantified fragment (semi-decidable; reports
  `valid` / `invalid + countermodel` / `unknown (budget)` honestly).
  This is the first Logic Lab system whose validity check is *not*
  parameterised by an axiom or import setting — classical FOL is
  fixed.

---

## Out of scope (phase 1)

- **Sorted / many-sorted FOL.** Single domain only.
- **Definite descriptions / Russell's `ι`.** Available indirectly via
  examples but not as a first-class operator.
- **Lambda terms, second-order quantification, set comprehension.**
- **Function congruence under equality.** The union-find equality
  propagator handles symmetry, transitivity, and Leibniz substitution
  on atomic predicates, but `a = b ⊢ f(a) = f(b)` is *not* derived
  automatically. Phase 1 examples are chosen to avoid this; phase 2
  would need full congruence closure to lift the limitation.
- **Natural-deduction or sequent-calculus proof rendering.** The Lab
  reports validity and renders the *semantic-tableau* proof tree
  (FEAT-012) but does not translate it into Fitch / Lemmon-style
  natural-deduction lines. The closed tableau already constitutes a
  refutation of ¬φ, hence a proof of φ; rendering it as ND would be a
  separate translation. See `lab-status.md` §C.
- **A "compare-with-Frege" toggle** that takes the same AST and
  renders it in both notations. Mentioned in
  `logic-explorer-tab.md` §Comparison view; on the deferred list.

---

## What ships

### DSL

ASCII shorthand and Unicode glyphs are interchangeable on input. The
DSL accepts:

| Feature              | ASCII             | Unicode      |
|----------------------|-------------------|--------------|
| Universal quantifier | `forall x. φ`     | `∀x. φ`      |
| Existential q.       | `exists x. φ`     | `∃x. φ`      |
| Negation             | `~φ` `!φ` `not φ` | `¬φ`         |
| Conjunction          | `φ & ψ` `φ /\ ψ`  | `φ ∧ ψ`      |
| Disjunction          | `φ \| ψ` `φ \/ ψ` | `φ ∨ ψ`      |
| Implication          | `φ -> ψ`          | `φ → ψ`      |
| Biconditional        | `φ <-> ψ`         | `φ ↔ ψ`      |
| Identity             | `t = u`           | `t = u`      |
| Non-identity         | `t != u`          | `t ≠ u`      |
| Top / bottom         | `true` / `false`  | `⊤` / `⊥`    |

Predicates and functions are written as `Name(arg, ...)`. The
position determines whether an identifier-with-args is a predicate
atom or a function term — there's a one-formula lookahead that
re-tags the identifier as a term iff `=`/`!=` follows.

#### Variables vs. constants

A 0-arg term identifier is parsed as `var` if and only if it is
inside the scope of a `forall` / `exists` binder for that name;
otherwise as `const`. Function applications (`f(...)`) are always
`fn`, regardless of whether `f` matches a binder — first-order logic
doesn't quantify over functions.

#### Quantifier scope

Quantifiers bind wide-scope to the right by convention: `forall x.
P(x) -> Q(x)` reads as ∀x.(P(x) → Q(x)), matching mathematical
English and the parser semantics in `frege-parser.ts`. The renderer
preserves this: a quantifier is parenthesized iff the right edge of
its enclosing context is *not* open, so `(∀x. P(x)) → Q(a)` and
`¬(∀x. P(x)) ∨ Q` both keep their parens but `P(a) → ∀x. Q(x)` does
not.

### Validity check

Two-tier:

1. **Propositional fragment** — exact truth-table enumeration over
   the propositional atoms (zero-arg predicates plus `⊤` / `⊥`). The
   fragment-detector (`isPropositional`) returns true exactly when
   there are no quantifiers, no predicates with arguments, and no
   equalities. Cost: 2^n where n is the number of distinct atoms.
   Always decisive: returns `valid` or `invalid` with a falsifying
   valuation as countermodel.

2. **First-order fragment** — bounded semantic tableau (Smullyan-
   style). Negate the input, expand the negated formula by α (linear
   non-branching), β (branching), γ (universal instantiation, can be
   re-applied with new constants), and δ (existential, fresh
   constant) rules until either every branch closes (the original
   formula is valid), some branch saturates without closing
   (invalid + countermodel from the open branch), or the step budget
   is exhausted (unknown).

   Closure detects:
   - Trivial: `⊥`, `¬⊤`.
   - Equality: `¬(t = t)` after equality propagation. The branch
     maintains a union-find on term keys built from every `t = u`
     literal — this gives reflexivity, symmetry, transitivity, and
     Leibniz substitution on atomic predicates "for free" at closure
     time.
   - Contradictory atoms: a positive predicate literal `P(t̄)` and a
     negative one `¬P(ū)` clash if their term keys are equivalent
     under the union-find.

   Default budget: 200 expansion steps; default cap of 6 δ-introduced
   constants. These are enough for every shipped example and for
   typical textbook tautologies; pathological formulas (very deeply
   nested quantifier alternations) may report `unknown`.

### Examples

Ten hand-authored examples spanning propositional and FOL:

- Modus ponens, contraposition, De Morgan (propositional)
- Universal-instantiation and existential-generalization tautologies
- The valid `∃∀ → ∀∃` direction; the *invalid* converse
- Drinker's paradox — a Smullyan classic; classically valid via
  case-analysis on `∀y. P(y)`, fails intuitionistically
- Reflexivity and symmetry of identity
- An invalid example to demonstrate the countermodel display

Every example has a `dsl` field that the parser must accept; the
system-data test enforces that.

### Visualisation

Three coordinated panels:

1. **Linear KaTeX rendering** of the parsed formula in the rendering
   pane, alongside a validity badge. The badge shows:

   - `valid · truth-table` (green) — propositional tautology
   - `valid · tableau` (green) — FOL formula that closed all branches
   - `invalid · …` (red) — counterexample available, expanded into a
     countermodel panel below
   - `unknown · budget exhausted` (amber) — tableau ran out of steps;
     the user can simplify or lengthen the formula

   The countermodel panel handles both shapes:
   - **Propositional valuation** — atom names with T/F values.
   - **First-order model** — domain (the constants on the open
     branch), atomic positive facts, atomic negative facts,
     equalities, inequalities. Each list is de-duplicated and
     sorted for stability.

   Multi-letter predicate names like `Even` render in upright math
   (`\mathrm{Even}`) so they look like predicates rather than products
   of variables; single-letter names stay math-italic (`P`, `Q`).

2. **Truth table** (FEAT-012) — for the propositional fragment only.
   Lemmon-style: leftmost columns are the atoms (sorted), next
   columns are subformulas in evaluation order, rightmost is the
   input formula (highlighted). One row per valuation of the atoms,
   2^n total. Falsifying rows are tinted rose. Header carries a
   `tautology` / `contradiction` / `contingent` badge derived from
   the main column.

3. **Truth tree** (FEAT-012) — for the first-order fragment only.
   Renders the Smullyan semantic tableau as an indented vertical
   tree. Each node carries its rule class (α / β / γ / δ), the
   formula(s) it added, and (for γ/δ) the term used. Closed leaves
   show ⊗ + the closure witness; open leaves show the extracted
   countermodel inline; budget-exhausted leaves show ⌛. β-children
   are tagged `left` / `right` so the split is unambiguous. The
   tree is built by `fol-tableau-tree.ts:buildTableauTree`, which
   shares its rule library with `checkValidity`.

---

## File layout

| File | Purpose |
|------|---------|
| `packages/web/src/logic/fol-types.ts` | FolFormula and FolTerm AST; `isPropositional`, `freeVars`, `substitute` helpers. |
| `packages/web/src/logic/fol-parser.ts` | Recursive-descent parser, ASCII + Unicode. Wide-scope quantifiers; var/const determined by binder scope. |
| `packages/web/src/logic/fol-render.ts` | Pretty-printer (Unicode and KaTeX), wide-scope-aware parenthesization via `rightOpen` flag. |
| `packages/web/src/logic/fol-validity.ts` | Verdict-only API: truth-table for propositional, delegates FOL to `fol-tableau-tree.ts` and converts the verdict + countermodel shape. |
| `packages/web/src/logic/fol-tableau-tree.ts` | (FEAT-012) Tableau engine that retains the proof tree. Same rule library as the legacy `checkTableau` but each rule application produces explicit `TableauNode`s. `ruleLabel` / `ruleClass` display helpers co-located. |
| `packages/web/src/logic/fol-truth-table.ts` | (FEAT-012) Lemmon-style truth-table builder for the propositional fragment. |
| `packages/web/src/logic/fol-commands.ts` | Slash-command registry: connectives, quantifiers, identity, parens, examples. |
| `packages/web/src/logic/FolEditor.tsx` | LogicCmEditor wrapper. |
| `packages/web/src/data/logic-systems.ts` | `modern-fol` descriptor (status flipped from `stub` to `available`). |
| `packages/web/src/routes/logic.$system.tsx` | `ModernFolLab` branch + `FolValidityBadge` + `CountermodelPanel` components. |

---

## Open questions / deferred work

- **Function congruence under equality.** As above: the union-find
  doesn't propagate `a = b → f(a) = f(b)`. Phase 1 examples don't
  rely on it. The right fix is full congruence closure (Nelson-
  Oppen). About 100 lines.
- **Tableau strategy and fairness.** The current strategy is "α
  before δ before β before γ" with γ fairly cycling through
  `(γ-formula, constant)` pairs. This is not provably complete in
  the textbook sense, but is fine for the shipped examples. A more
  principled strategy (e.g. fair iterative deepening) would lift the
  `unknown` rate on hard formulas.
- **Proof rendering.** Resolved in FEAT-012 — the semantic tableau
  is now rendered as a truth-tree panel (and the propositional
  fragment as a Lemmon-style truth table). What remains: a
  natural-deduction translation of the closed tableau into Fitch /
  Lemmon-style numbered lines. The tree → ND translation is a
  separate proof-theoretic problem; tracked in `lab-status.md` §C.
- **Manual / step-through tableau mode.** The `fol-tableau-tree.ts`
  engine has pure `pickWork` and `expand` primitives, so a "next
  step" UI driven by user clicks would be ~50 LOC plus a frontier
  state model. Not in FEAT-012's scope; tracked in `lab-status.md`
  §A as phase-2 polish.
- **Frege ↔ FOL bridge.** Both notations encode the same fragment.
  A shared core AST (intersection of `FregeFormula` and
  `FolFormula`) plus a translation layer would let the
  `/logic/compare` route, when it lands, render the same formula in
  both. Tracked in `logic-explorer-tab.md` §Comparison view.
- **Interaction-mode toggles.** No phase-1 toggles. Phase 2
  candidates: classical-vs-intuitionistic (drops LEM), tableau step
  budget, "show steps" panel.

---

## References

- Smullyan, *First-Order Logic* (Springer 1968 / Dover reprint).
  The canonical reference for the semantic-tableau method this lab
  uses for validity.
- Beth, *Semantic Entailment and Formal Derivability* (1955) — the
  predecessor.
- Peano, *Arithmetices principia, nova methodo exposita* (1889) —
  the linear notation's debut.
- Russell & Whitehead, *Principia Mathematica* (1910–13) — the
  notation's diffusion.
- Stanford Encyclopedia of Philosophy: *Classical Logic*,
  *First-order Model Theory*.
