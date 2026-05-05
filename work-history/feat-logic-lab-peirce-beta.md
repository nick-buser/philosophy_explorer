# feat — Logic Lab: Peirce EG Beta (lines of identity → FOL with identity)

**Branch:** `feat/logic-lab-peirce-beta`
**Merged:** TBD

Closes the "Peirce EG Beta" entry in `docs/formal-logic/lab-roadmap.md`
§Medium term and the `peirce-eg | Beta (lines of identity)` deferral
from `lab-status.md` §5. Brings Peirce up to first-order logic with
identity, completing it as a serious diagrammatic alternative to the
Modern FOL system rather than just a propositional curiosity.

## What changed

### AST
- `eg-ast.ts` — atoms now carry a `hooks: EgHook[]` field; an `eq`
  node represents the identity assertion (`x = y`). Old 0-ary atoms
  parse with `hooks: []`, so alpha shape is preserved through the
  same node kind. New helpers `collectHooks` and `isBeta` (used by
  the renderer to decide whether to draw lines of identity).

### Parser
- `eg-parser.ts` — after reading an identifier, optionally consume
  a hook list `(x, y, …)` *with no whitespace between the name and
  the opening paren*. The whitespace gate is what keeps `P (x)`
  parsing as the alpha juxtaposition `P · (x)` while `P(x)` is the
  unary predicate. Identity (`x = y`) is whitespace-tolerant and
  backtracks if the `=` doesn't materialise.

### EG → FOL translator
- `eg-fol.ts` (new) — two-pass translation:
  1. Build an *area tree* (sheet + cuts) and, for each line-of-
     identity name, record the set of areas where it is referenced.
  2. The line's binder area is the LCA of those areas in the cut-
     tree. Walk the tree bottom-up: each area emits the conjunction
     of its children, wrapped in `∃`-binders for lines whose LCA is
     that area, with cuts adding a final `¬`. Sheets give a
     conjunction; the empty sheet gives `⊤`; the empty cut gives
     `¬⊤`.
- Reuses the existing `FolFormula` AST so the translation can be
  fed straight into `fol-render.ts:renderKatex` for display.

### Layout + renderer
- `eg-layout.ts` — predicate atoms reserve space below the glyph
  for hook anchors, evenly spaced. Identity nodes lay out as a
  small `· = ·` widget. Atoms with no hooks render as before.
  New `collectHookAnchors(LaidOut)` returns a `Map<lineName,
  HookAnchor[]>` that the renderer uses to draw lines of identity.
- `EgRenderer.tsx` — overlays a heavy line connecting each
  shared-name hook anchor list, with small filled dots at each
  anchor. Drawn in foreground white at width 2.5, matching
  Peirce's convention of identity lines being noticeably heavier
  than cut boundaries.

### Lab page
- `labs/PeirceEgLab.tsx` — added a third panel under the editor +
  diagram showing the equivalent first-order formula via KaTeX.
  Header strap-line on the editor reads `alpha` or `beta`
  depending on whether `isBeta(tree)` flagged any hooks/identity.
  The footer hint covers the new beta primitives.

### System data
- Renamed the system to "Peirce's Existential Graphs (Alpha + Beta)";
  `keyPrimitive` now reads `cut · juxtaposition · line of identity`.
- Three new primitives in the side panel: line of identity, n-ary
  predicate, identity assertion.
- 10 new examples (`beta-existential` through `beta-distinct`)
  covering the canonical first-order shapes: ∃, ∀-via-scroll,
  identity, no-x, two-place predicates, self-relation, and the
  every-loves-some shape that exercises the LCA logic on the
  inner cut.

### Commands
- `eg-commands.ts` — slash commands `/predicate`, `/relation`,
  `/identity`, `/universal` for inserting beta templates.

### Tests
- `__tests__/eg-parser.test.ts` — updated assertions to include
  the `hooks: []` field on alpha atoms; added a `parseEg — beta
  hooks` block (predicates, repeated names, error paths) and a
  `parseEg — beta identity` block. Also added a regression test
  that `P (x)` (whitespace before `(`) still parses as juxtaposed
  atom + cut, not as a predicate.
- `__tests__/eg-fol.test.ts` (new) — covers the alpha translation
  shapes (atom, cut, juxtaposition, scroll, empty sheet, empty
  cut) plus the beta cases (∃ at the sheet, ¬∃ inside a single
  cut, shared line for ∃-conjunction, the every-man-mortal scroll
  with a line, two-place predicate, the every-loves-some shape
  with the inner cut binding `y`, identity, and self-relation
  via `Loves(x,x)`).

Test count after this ticket: **999/999 passing.** New tests: 26
(8 alpha-with-`hooks` regressions + 12 beta parser cases + 14
EG → FOL cases). `npx tsc --noEmit` is clean and `npm run build`
succeeds; the `PeirceEgLab` chunk grew from `~14kB` (alpha-only)
to `14.29 kB / 5.03 kB gzip`.

## Why

The roadmap entry is direct: Peirce Beta is the *largest visual
logic gap* in the Lab and a direct extension of existing
infrastructure. Alpha covers propositional logic; without Beta,
Peirce reads as a propositional toy rather than the system Peirce
himself regarded as his major contribution and that Shin (2002)
and the Logic of the Future edition treat as the substantive
logic. Adding lines of identity lifts the system to first-order
logic with identity, giving the Lab a diagrammatic FOL surface
that pairs naturally against the linear Modern FOL system.

The shape of this ticket fits the lab-roadmap §"Framing — system
× visualization matrix" point about pollinator work: the FOL
panel translates between the diagrammatic and linear notations
without forcing a shared editor, which is the cheapest way to
make the cross-notation pedagogy legible.

## Notes for future work

### Open follow-ups

- **Inference-rule engine.** Roberts (1973) §4 and Shin (2002)
  §6 spell out the EG-Beta proof rules: insertion / deletion in
  positive / negative areas, iteration / deiteration of a
  subgraph along an enclosing area, and double-cut. Today the
  Lab only translates EG → FOL; it does not yet *check* an EG
  proof. A future ticket could add a step-through view where the
  user applies rules to transform an EG to a target shape and
  the engine checks each step.

- **Line endpoint routing.** The current renderer connects hook
  anchors with straight polyline segments through whatever order
  the hooks appear during traversal. Peirce's own diagrams route
  identity lines along area boundaries — a line that needs to
  stay outside a particular cut bends around it. A faithful
  renderer would compute, per-line, the LCA area in the cut-tree
  (already known to the FOL translator) and route the line to
  hug that area's interior. The straight-segments approximation
  is fine for the current ~10-example library; it will start to
  break visually with more crowded examples.

- **Identity widget polish.** Right now `x = y` renders as a
  small "·=·" widget with two hook anchors. Peirce's notation
  used a heavy line bridging the two argument spots without an
  explicit `=` glyph (the line *is* the identity). Once the
  routing pass above lands, the `=` glyph should disappear in
  favour of the heavy line itself, which would also better
  illustrate how a hook of `Loves(x,y)` and a hook of `Phil(y)`
  participate in the same line of identity.

- **EG-Beta proof rules → Lean.** The `formal-verification.md`
  Lean integration motivation applies here too: a hand-rolled
  EG-Beta proof checker is a substantial implementation; if the
  Lean spike (FEAT-014 candidate) lands, EG-Beta proofs could
  go through Lean's metavariable / unification machinery rather
  than re-implementing them. Defer until Lean integration is
  scoped.

- **Compare view (FEAT-013 candidate).** Once the compare view
  lands, Peirce-Beta ↔ Modern FOL is the most natural pairing
  in the Lab: same fragment, two notations, with a translation
  that is now in-tree as `egToFol`.

### Decisions made

- **Hooks on the atom node, not a separate predicate node.**
  Considered splitting `atom` and `predicate` into separate AST
  kinds. Decided against because `atom` with `hooks: []` is the
  same shape as the old alpha atom, so the alpha → beta upgrade
  is a strict superset rather than a fork. Keeps `isBeta` a
  single-field check.

- **Whitespace-sensitive hook attachment.** `P(x)` is a
  predicate; `P (x)` is the alpha shape (atom `P` juxtaposed
  with cut around `x`). The alternative (skip whitespace before
  `(`) would have made `P (x)` ambiguous and forced a precedence
  decision. Whitespace-sensitive matches Peirce's visual
  convention — hooks are at the predicate's *spot* — and lets
  every existing alpha test pass unchanged.

- **Line-binder placement is by LCA, not by first occurrence.**
  Considered "bind ∃ at the area containing the first hook
  occurrence in source order." Rejected because it would give
  non-equivalent translations under reordering: `P(x) (Q(x))`
  and `(Q(x)) P(x)` should have the same FOL form. LCA in the
  cut-tree is the only placement that's invariant under area-
  internal reordering and matches Shin's formal semantics.

- **∃-binder ordering by sorted name.** Within a single area,
  multiple lines bound at that area emit their `∃`-binders in
  alphabetical order. Considered first-occurrence order;
  rejected because it makes the test assertions depend on
  visit order through the tree, which is a footgun if the
  layout pass ever changes traversal direction. Same-quantifier
  permutations are semantically equivalent (∃x.∃y.φ ≡ ∃y.∃x.φ),
  so the choice is purely cosmetic — pick the deterministic one.

- **Empty sheet is `⊤`, empty cut is `¬⊤`.** Could have
  introduced a `⊥` literal for the empty cut to match Peirce's
  reading. The translation produces `¬⊤` instead — same FOL
  formula, no special-casing in the translator. The
  `fol-render.ts` printer handles both shapes naturally.

- **No explicit "alpha vs beta" mode toggle.** The DSL is the
  same parser; `isBeta` is computed from the tree and only
  affects two cosmetic things (the editor strap-line and the
  FOL-panel label). A mode toggle would let the user *forbid*
  beta features when teaching alpha, but the existing alpha
  examples don't introduce any line names, so the natural-
  reading case still translates without ∃-binders.
