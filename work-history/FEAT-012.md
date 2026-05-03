# FEAT-012 — Logic Lab (truth tables + truth trees for modern FOL)

**Branch:** `feat/FEAT-012-logic-lab-truth-tables-trees`
**Merged:** <unmerged>

## What changed

- Added two **"show your work" panels** to the Modern FOL Lab at
  `/logic/modern-fol`. Both pull from the existing validity engine
  rather than computing anything new — the engine already produced
  the data, FEAT-011 just discarded it.

  - **Truth-table panel** (propositional fragment): Lemmon-style
    table with one row per valuation and one column per distinct
    subformula. Atoms are leftmost; the input formula is the
    rightmost (highlighted) column. Falsifying rows are tinted
    rose; the panel header carries a `tautology` / `contradiction`
    / `contingent` badge derived from the table's main column.
  - **Truth-tree panel** (FOL fragment): renders the Smullyan
    semantic tableau as an indented vertical tree. Each node shows
    its rule class (α / β / γ / δ), the formula(s) it added, and
    (for γ/δ) the term used. Closed leaves carry the ⊗ marker plus
    the closure witness (predicate clash, ¬(t = t), ⊥, ¬⊤). Open
    leaves show the extracted countermodel inline. Branch sides
    are tagged `left` / `right`.

- **Tableau-tree refactor** (`fol-tableau-tree.ts`, new):
  - Ported the algorithm from `fol-validity.ts:checkTableau` to a
    tree-producing form. The closure / pickWork / classify / expand
    primitives are the same; the difference is that each rule
    application now creates explicit `TableauNode`(s) attached to
    the parent node, instead of pushing child branches onto an
    anonymous stack. Verdict is derived from the finished tree
    (every leaf closed → valid; any open leaf → invalid +
    countermodel from the first one found; otherwise budget-
    exhausted → unknown).
  - `expand()` returns `Expansion[]` records with rule, source
    formula, introduced formulas, optional γ-term, optional β-side,
    and the resulting branch — instead of just `Branch[]`. The
    extra fields are exactly what the renderer needs; the algorithm
    doesn't read them.
  - Co-located `ruleLabel` and `ruleClass` display helpers so the
    rule-name strings stay consistent between the algorithm and the
    UI.

- **`fol-validity.ts` simplified.** All the tableau internals
  moved to `fol-tableau-tree.ts`. `checkValidity` now delegates:
  truth-table for propositional, `buildTableauTree` + verdict-
  derivation for FOL. The legacy `Countermodel` shape (with the
  `kind: 'first-order'` discriminator) is preserved as a thin
  wrapper over the tree-builder's `TableauCountermodel` so
  callers don't need to change.

- **Truth-table data layer** (`fol-truth-table.ts`, new):
  - `buildTruthTable(formula): TruthTable | null` — null on
    non-propositional input. `TruthTable` carries atoms (sorted),
    subformulas (post-order, deduped by Unicode key), 2^n rows, and
    a precomputed `'tautology' | 'contradiction' | 'contingent'`
    status.
  - Subformula collection guarantees the input formula is the
    rightmost column even when it's an atom (degenerate "table for
    `p`" case).

- **Page wiring** (`routes/logic.$system.tsx`):
  - `ModernFolLabBody` now memoises `truthTable` (when
    propositional) and `tableauTree` (when first-order) alongside
    the existing `validity` result.
  - Two new components: `TruthTablePanel` and `TableauTreePanel` /
    `TableauNodeView` (recursive). Both render below the editor /
    rendering grid and above the existing footer.
  - The `CountermodelPanel` from FEAT-011 still renders for invalid
    formulas — it's the "concise verdict" display; the tree is the
    "show the proof" display. Both are useful at different reading
    distances.

### Files

| File | Change |
|------|--------|
| `packages/web/src/logic/fol-tableau-tree.ts` | new — tree-producing tableau engine |
| `packages/web/src/logic/fol-truth-table.ts` | new — Lemmon-style truth-table builder |
| `packages/web/src/logic/fol-validity.ts` | refactored — delegates FOL to `fol-tableau-tree.ts`; keeps propositional truth-table check + legacy types |
| `packages/web/src/logic/__tests__/fol-truth-table.test.ts` | new (11 cases) |
| `packages/web/src/logic/__tests__/fol-tableau-tree.test.ts` | new (11 cases) |
| `packages/web/src/routes/logic.$system.tsx` | + truthTable / tableauTree memos in ModernFolLabBody, + TruthTablePanel + TableauTreePanel + TableauNodeView |
| `docs/formal-logic/modern-fol.md` | proof-rendering deferral resolved; visualisation section expanded |
| `docs/formal-logic/lab-status.md` | proof-tree gap marked closed; truth-table view added to "what ships" |
| `work-history/FEAT-012.md` | this file |

Verified: `npm run test:web` 406/406 (was 384/384 pre-FEAT-012, +22
new — 11 truth-table + 11 tree-shape); `npm run build
--workspace=packages/web` clean (~1.38 MB pre-gzip / ~420 kB
gzipped, +8 kB pre-gzip / +2 kB gzipped over FEAT-011); `tsc
--noEmit` clean.

## Why

FEAT-011 shipped a Modern FOL Lab with a working validity engine
but no way to *see* how the verdict was reached. The propositional
truth-table check enumerated 2^n valuations and surfaced only the
single falsifying row (when invalid) or a green badge (when valid).
The FOL semantic tableau built and walked a multi-branch tree and
then threw it away — only the verdict and (for invalid) the open
branch's literals survived.

This was the largest unbuilt surface flagged in `lab-status.md` §1
and explicitly called out in FEAT-011 §Notes for future work as
*"a substantive UX upgrade and would give the lab a 'show your
work' mode the other Labs don't have."* It's also the most natural
pedagogical addition for a notation system whose whole point is
making proof structure legible.

The two views split cleanly along the validity engine's internal
fragment-detector boundary (`isPropositional`):

- For the propositional fragment, the right rendering is the truth
  table — exhaustive, decidable, and the standard textbook display
  format. The Smullyan tree on a propositional formula would be
  smaller than the table but harder to read.
- For first-order formulas, the right rendering is the truth tree
  itself — the table would be infinite (no fixed atom count once
  γ-rules can introduce new ground terms). The tableau is the
  proof object; rendering it is rendering the proof.

Lean integration was considered and deferred — the closed tableau
*is* a refutation of ¬φ, hence a proof of φ. Lean would only earn
its keep if the goal shifts to producing canonical Fitch / Lemmon
*natural-deduction* derivations as the displayed format. That's a
separate translation problem; the tree view doesn't need it. See
`lab-status.md` §C.

The orthogonality between visualisation and validity that the
issue ticket flagged is now structural: `expand()` is a pure rule
library, `closed()` is a pure literal-clash checker, and the
tree-builder threads them. A future "manual mode" where the user
picks the next rule (or the term for γ) would reuse exactly the
same primitives — that's tracked under `lab-status.md` §A as
phase-2 polish.

Closes #<issue-tbd>

## Notes for future work

- **β branching is still rendered as a vertical indented split,
  not a horizontal Y-shape.** A genuine 2D tree (with siblings
  side-by-side and the parent connected via two slanted lines) is
  the textbook layout but needs SVG geometry similar to the Frege
  renderer. The vertical layout reads fine for the shipped
  examples (the Drinker's paradox tree fits in a screen at
  ~depth 9). If the tree grows past ~3 β-splits, a horizontal
  layout would be a real upgrade; until then it's not worth the
  geometry.

- **Manual / step-through mode is not wired.** The engine supports
  it trivially — `pickWork` and `expand` are pure functions that
  take a branch and return work / expansions. A "next step" button
  driving a single expansion-at-a-time view would be ~50 LOC plus
  a tree-with-frontier state model. Not in this ticket's scope.

- **The truth table dedupes subformulas by Unicode-render key.**
  This is α-blind — two formulas that render identically share a
  column even if the AST nodes are distinct objects. For the
  propositional fragment this is exactly right (no binders means
  no α-equivalence concerns). If the table is ever extended to
  the FOL fragment with quantified subformulas, the keying will
  need to grow up to a proper α-equivalence canonicalisation.

- **The propositional truth table can grow large.** A formula with
  10 atoms produces 1024 rows; 16 atoms is 65 536. The shipped
  examples have ≤ 4 atoms, so the table is comfortable. There's
  no soft cap or virtualisation — if a future example has many
  atoms, the panel would benefit from a max-row threshold with a
  "show all" toggle. Out of scope here.

- **The tree's `id` field is just a monotone counter.** Stable
  across builds for a given formula but not across different
  formulas. That's intentional — IDs are display labels for
  cross-referencing nodes within a single tree, not persistent
  references. If the manual mode lands and we want
  selection-tracking across step-by-step expansions, IDs will
  need to be content-addressed instead.

- **`fol-validity.ts` lost ~400 lines.** The full FOL tableau
  algorithm now lives in `fol-tableau-tree.ts`. The two engines
  are not duplicated — `checkValidity` is a thin shim that calls
  `buildTableauTree` and converts the verdict + countermodel
  shape. Existing tests in `fol-validity.test.ts` cover the shim
  end-to-end so any future algorithm drift surfaces there.

- **Closure witnesses now carry display strings, not AST nodes.**
  This is a small ergonomics tradeoff: the renderer doesn't need
  to know about FolFormula, but tests can't pattern-match on
  AST shape. If a future test wants to assert "the closure pair
  is exactly P(a) and ¬P(a) modulo α", the witness type would
  need to grow back the underlying nodes. Currently fine because
  the shipped tests check by `kind` (`pred-clash` / `eq-self` /
  `bot` / `not-top`).

- **No browser smoke yet.** Verified via `tsc --noEmit`,
  `vitest` (406/406), and `npm run build`. A human pass should
  confirm: the truth table renders cleanly across the propositional
  shipped examples (modus ponens, contraposition, De Morgan); the
  tableau tree at the Drinker's paradox is readable without
  horizontal scroll at 1280-px width; the open-branch countermodel
  inline display doesn't run into the right gutter on the invalid
  converse-quantifier-swap example.

- **Bundle: +8 kB pre-gzip / +2 kB gzipped over FEAT-011.** Web
  build is ~1.38 MB pre-gzip / ~420 kB gzipped. The route-level
  code-splitting follow-up flagged since FEAT-005 still hasn't
  landed.
