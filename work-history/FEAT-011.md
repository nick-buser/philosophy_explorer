# FEAT-011 — Logic Lab (modern first-order logic, Peano/Russell)

**Branch:** `feat/FEAT-011-logic-lab-modern-fol`
**Merged:** <unmerged>

## What changed

- Added the **`modern-fol` system** to the Logic Lab at
  `/logic/modern-fol`, alongside Peirce EG, Kripke, Frege,
  Aristotelian, and Medieval. Status flipped from `stub` to
  `available`. This is the sixth populated Lab page and the first
  whose validity check is a real engine across the FOL fragment
  (rather than a fixed table or a hand-authored truth value).

- **Parsing pipeline** (`fol-types.ts`, `fol-parser.ts`):
  - `FolFormula` AST: `top` / `bot` / `pred(name, args)` /
    `eq(left, right)` / `not` / `and` / `or` / `implies` / `iff` /
    `forall(variable, body)` / `exists(variable, body)`. `FolTerm`
    AST: `var` / `const` / `fn(name, args)`. Identity is a first-
    class node so the validity checker can apply identity rules
    directly without going through a "binary equality predicate"
    detour.
  - Recursive-descent parser accepting both ASCII (`forall x. P(x)
    -> Q(x)`) and Unicode (`∀x. P(x) → Q(x)`) input. Wide-scope
    quantifiers by convention (matches `frege-parser.ts`); use
    parens for narrow scope. Variables are determined by binder
    scope: a 0-arg term identifier is `var` iff currently bound by
    a `forall` / `exists`, else `const`. Function applications
    (`f(x)`) are always `fn` regardless of binding — first-order
    logic doesn't quantify over functions.
  - Predicate-vs-term disambiguation is one-token lookahead: parse
    an identifier-with-args, then if `=` / `!=` follows re-tag the
    parse as a term and continue with an equality atom; otherwise
    treat as a predicate atom.
  - Helpers: `isPropositional` (true for the truth-table-decidable
    sub-fragment), `freeVars`, `substitute` (capture-avoiding only
    in the trivial case the validity checker actually exercises —
    fresh-constant instantiation).

- **Renderer** (`fol-render.ts`):
  - `renderUnicode` and `renderKatex`, both driven from the same
    precedence/parenthesization logic. Multi-letter predicate
    names render in upright math (`\mathrm{Even}`) under KaTeX so
    they don't look like products of variables; single-letter
    names stay math-italic.
  - The wide-scope rule for quantifier parenthesization is encoded
    as a `rightOpen` flag threaded through every recursion: a
    quantifier needs parens iff the right edge of its enclosing
    context is *not* open. So `(∀x. P(x)) → Q(a)` and `¬(∀x. P(x))
    ∨ Q` both keep their parens, but `P(a) → ∀x. Q(x)` does not.
    `¬(t = u)` collapses to `t ≠ u` at the literal level.

- **Validity engine** (`fol-validity.ts`) — two-tier:
  - **Propositional fragment** (no quantifiers, no preds-with-
    args, no equality): exact truth-table enumeration over the
    2^n valuations. Always decisive: returns `valid` or `invalid`
    with a falsifying valuation as countermodel.
  - **First-order fragment**: Smullyan-style semantic tableau on
    the negation. α (linear), β (branching), γ (universal
    instantiation, re-applicable per `(formula, constant)` pair),
    δ (existential, fresh constant) rules. Default budget 200
    expansion steps with a cap of 6 δ-introduced constants. Three
    outcomes: `valid` (all branches close), `invalid` (a branch
    saturates without closing — countermodel extracted from the
    branch's literals), `unknown · budget exhausted` (the honest
    answer when the procedure runs out of steps before either).
  - Equality propagation via union-find on term keys built from
    every `eq` literal on the branch. This buys reflexivity,
    symmetry, transitivity, and Leibniz substitution on atomic
    predicates *at closure time* — no dedicated identity-tableau
    rules needed. Function congruence (`a = b → f(a) = f(b)`) is
    *not* derived; phase 1 examples are chosen to avoid relying
    on it.
  - Closure conditions: `⊥`, `¬⊤`, `¬(t = t)` (after equality
    propagation), and predicate-literal clashes `P(t̄)` vs `¬P(ū)`
    where the term keys are equivalent under the union-find.

- **Editor and commands** (`fol-commands.ts`, `FolEditor.tsx`):
  10 structural slash-commands (∀ / ∃ / ¬ / ∧ / ∨ / → / ↔ / = /
  ≠ / parens) plus the system descriptor's examples auto-derived
  as `example.<slug>` commands. The editor is the standard
  `LogicCmEditor` wrapper.

- **System descriptor** in `packages/web/src/data/logic-systems.ts`:
  status `available`, era `1889 →`, no thinker (the notation is
  too multi-author to attribute to one), six primitive
  descriptions (∀, ∃, predicate atom, identity, connectives,
  function term), ten examples (modus ponens, contraposition, De
  Morgan, ∀-instantiation, ∃-generalization, valid `∃∀ → ∀∃`,
  drinker's paradox, identity reflexivity, identity symmetry, the
  invalid converse `∀∃ → ∃∀`), and four reading pointers
  (Stanford Encyclopedia entries on classical logic and FO model
  theory, Smullyan's *First-Order Logic*, Peano's 1889 manuscript).

- **Page wiring** in `packages/web/src/routes/logic.$system.tsx`:
  new `ModernFolLab` and `ModernFolLabBody` components, a
  `FolValidityBadge` (green / red / amber for valid / invalid /
  unknown), and a `CountermodelPanel` that renders both shapes:
  propositional valuations as `atom = T/F` lists, first-order
  models as domain + positive atoms + negative atoms +
  equalities + inequalities. The lab body shows the tableau
  fragment label (`propositional` vs `first-order`) in the editor
  pane header so the user knows which engine ran.

- **Design doc:** `docs/formal-logic/modern-fol.md`, mirroring the
  FEAT-008 / FEAT-010 format — purpose, out-of-scope, what ships
  (DSL grammar, validity rules, examples, visualisation), file
  layout, open questions.

### Files

| File | Change |
|------|--------|
| `packages/web/src/logic/fol-types.ts` | new |
| `packages/web/src/logic/fol-parser.ts` | new |
| `packages/web/src/logic/fol-render.ts` | new |
| `packages/web/src/logic/fol-validity.ts` | new |
| `packages/web/src/logic/fol-commands.ts` | new |
| `packages/web/src/logic/FolEditor.tsx` | new |
| `packages/web/src/logic/__tests__/fol-parser.test.ts` | new (42 cases) |
| `packages/web/src/logic/__tests__/fol-render.test.ts` | new (10 cases) |
| `packages/web/src/logic/__tests__/fol-validity.test.ts` | new (20 cases) |
| `packages/web/src/logic/__tests__/fol-system-data.test.ts` | new (8 cases) |
| `packages/web/src/data/logic-systems.ts` | modern-fol descriptor flipped to `available` |
| `packages/web/src/routes/logic.$system.tsx` | + ModernFolLab branch + components |
| `docs/formal-logic/modern-fol.md` | new |
| `work-history/FEAT-011.md` | this file |

Verified: `npm run test:web` 384/384 (was 304/304 pre-FEAT-011, +80
new); `npm run build --workspace=packages/web` clean (~1.37 MB pre-
gzip / ~418 kB gzipped, +28 kB pre-gzip / +8 kB gzipped over
FEAT-010); `tsc --noEmit` clean.

## Why

Modern FOL was the only major historical system still listed as a
`stub` after FEATs 005–010, and the project's framing repeatedly
calls it out as the "default working notation of mathematics" — so
shipping it completes the spine of the Logic Lab. The other Labs
have always been comparing themselves *against* this notation: it
was time to actually populate it.

The two-tier validity engine is the meaningful design choice. FOL
validity is undecidable in general; an honest implementation has to
say so. Splitting on the propositional fragment buys exactness
where exactness is possible (truth tables are decidable and cheap
on the small atom counts that fit in a Lab example). The bounded
semantic tableau covers the rest — semi-decidable, sound on
`valid`, sound on `invalid` when it returns a countermodel,
explicit about `unknown` when it can't decide within the budget.

Identity ships in phase 1 because it's not strictly more complex
than the rest: the union-find equality propagator gives symmetry,
transitivity, and Leibniz substitution on atomic predicates with
about 30 lines of code at closure time. Without identity the lab
would be missing `forall x. x = x`, `forall x y. x = y → y = x`,
and the entire family of equality-driven examples — a strange gap
for a notation that historically debuted alongside Peano's
arithmetic axioms.

The wide-scope quantifier convention matches Frege's parser
(`frege-parser.ts`) and most introductory mathematical English. The
renderer's `rightOpen` flag is the small piece of mechanism that
makes the convention round-trippable: parse → render → parse
recovers the same AST without the renderer having to add
gratuitous parens around every quantifier.

Closes #<issue-tbd>

## Notes for future work

- **Function congruence under equality is not derived.** A branch
  with `a = b` and `f(a) = c` won't conclude `f(b) = c`. Phase 1
  examples don't rely on this. The right fix is Nelson-Oppen
  congruence closure on the same union-find structure, ~100 lines.
  None of the shipped examples need it; the design doc flags it
  in §Open questions.

- **Tableau strategy is "α before δ before β before γ" with a
  fairness cycle on (γ-formula, constant) pairs.** This is not
  provably complete by the textbook standard but it is correct on
  every shipped example and on most textbook tautologies. A
  principled fair iterative-deepening strategy (Smullyan §IX) would
  reduce the `unknown · budget exhausted` rate on harder formulas.

- **Default budget is 200 expansion steps and 6 δ-constants.**
  These thresholds were eyeballed against the shipped examples and
  the standard pedagogical tautologies. Drinker's paradox closes
  in well under 50 steps; the converse-quantifier-swap example
  saturates in similar range. The budget is a knob the page does
  not expose; phase 2 could.

- **No proof rendering.** The closed tableau structure is computed
  but discarded — only the verdict and (for `invalid`) the open
  branch's literals survive. A natural-deduction tree built from
  the closed branches would be a substantive UX upgrade and would
  give the lab a "show your work" mode the other Labs don't have.
  Tracked in the design doc.

- **Quantifier parenthesization is wide-scope-aware via the
  `rightOpen` flag.** The unusual decision is that we propagate
  `rightOpen` *through negation* — `¬∀x. P(x)` standalone has no
  parens, but `¬(∀x. P(x)) ∨ Q` does. This matches what re-parsing
  recovers. The render test file covers the four canonical shapes.

- **Multi-letter predicate names get `\mathrm{}` in KaTeX, single-
  letter names don't.** This means `Even(x)` reads correctly as a
  predicate while `P(x)` keeps the textbook math-italic look. If a
  later renderer wants to surface the convention for users (e.g.
  "Convention: capital identifiers are predicates, lowercase are
  terms"), the threshold is already there.

- **The renderer's `rightOpen` propagation through `not` is the
  subtle bit.** When negation is the left of a binary, its body
  inherits `rightOpen=false` and so does any quantifier under it
  — that's why `¬(∀x. P(x)) ∨ Q` keeps its parens. When negation
  is at top-level or on the right of a binary, the body inherits
  `rightOpen=true` — that's why `¬∀x. P(x)` standalone doesn't.

- **Identity examples cover reflexivity, symmetry, transitivity,
  and atomic-predicate Leibniz.** The shipped descriptor only
  surfaces reflexivity and symmetry as labelled examples, but the
  validity tests lock in transitivity and Leibniz too — they just
  weren't worth a slot in the curated example list. Add them to
  the descriptor if a phase-2 review wants more identity coverage
  visible to the user.

- **No "compare" view yet.** Frege Begriffsschrift and Modern FOL
  both encode the same fragment; a shared core AST plus a
  translation layer would let `/logic/compare` (when it lands)
  render the same formula in both notations. Tracked in
  `logic-explorer-tab.md` §Comparison view; out of scope for this
  ticket.

- **No browser smoke yet.** Verified via `tsc --noEmit`,
  `vitest` (384/384), and `npm run build`. A human pass should
  confirm: the validity badge transitions sensibly across editor
  edits (especially the propositional → first-order fragment
  switch); the countermodel panel for the invalid example reads
  cleanly at narrow widths; the KaTeX rendering at long formulas
  (the universal-instantiation example with parens) doesn't
  overflow.

- **Bundle: +28 kB pre-gzip / +8 kB gzipped over FEAT-010.** Web
  build is ~1.37 MB pre-gzip / ~418 kB gzipped. The route-level
  code-splitting follow-up flagged since FEAT-005 is now six Lab
  systems' worth of unused code on every other route — this
  should land soon.
