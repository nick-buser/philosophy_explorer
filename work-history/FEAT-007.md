# FEAT-007 — Logic Lab (phase 3: Frege’s Begriffsschrift)

**Branch:** `feat/FEAT-007-logic-lab-frege-begriffsschrift`
**Merged:** <unmerged>

## What changed

- Added the Frege Begriffsschrift pipeline under `packages/web/src/logic/`:
  - `frege-types.ts` — `FregeContent` AST (atom/not/cond/forall) plus
    a `FregeFormula` wrapper distinguishing judgment from mere content.
    Per the design doc, judgment lives outside the content as an
    assertion mark, not as another connective.
  - `frege-parser.ts` — recursive-descent parser for the linear ASCII
    DSL: `|-`, `~`, `->`, `all x.`, `F(x, y)`. `->` is right-associative.
    `all x.` binds the entire content to its right (wide-scope, opt-in
    narrow scope via parens) so that `all x. F(x) -> G(x)` parses as
    `∀x. (F(x) → G(x))` — the reading that matches Frege’s diagrammatic
    convention where the concavity governs the full content stroke.
  - `frege-layout.ts` — two-pass geometry. Bottom-up `sizeContent`
    reports each subformula’s `(w, above, below)` measured around its
    leftmost stub point; top-down `placeContent` walks the sized tree
    and emits absolute drawing primitives. Composition rules: atoms
    right-anchor with a leftward content stroke; `not` adds a downward
    tick to the left of the body; `forall` inserts a U-shaped concavity
    carrying the bound variable; `cond` stacks consequent (top) above
    antecedent (bottom) joined by a vertical condition stroke at a
    common hub `x`; `judgment` adds a vertical bar at the leftmost
    stub.
  - `FregeRenderer.tsx` — dumb consumer of the layout primitives. SVG
    primitives only — no `foreignObject`, no KaTeX leaves. Atoms render
    as italic SVG `<text>`; the bound variable inside the concavity is
    italic Times in pale gold.
  - `frege-commands.ts` — slash-command registry: `/judgment`,
    `/negation`, `/conditional`, `/forall`, plus `example.*` slugs
    generated from the system descriptor’s example list.
  - `FregeEditor.tsx` — CodeMirror 6 host. Near-copy of `EgEditor` and
    `KripkeFormulaEditor`; differs only in the autocomplete source.
- Wired the `frege-bs` system end-to-end:
  - Flipped `LOGIC_SYSTEMS['frege-bs'].status` from `'stub'` to
    `'available'` in `packages/web/src/data/logic-systems.ts` and
    populated the entry: history string, five primitive descriptions,
    seven hand-authored examples (judgment of an atom, bare negation,
    bare conditional, double-negation elimination, Frege’s axiom 1,
    universal instantiation, transitivity-of-conditional under three
    universals), and four reading pointers (SEP, Wermuth TUGboat,
    Schlimm 2017, Frege 1879 English translation).
  - `routes/logic.$system.tsx` — added a `FregeBsLab` branch alongside
    `PeirceEgLab` and `KripkeLab` with the same chrome (header,
    primitives panel, history, reading pointers) plus the Lab body
    (toolbar, editor, live SVG renderer, parse-state badge).
- Test coverage:
  - `__tests__/frege-parser.test.ts` — 23 cases covering judgment
    parsing, atom argument lists, negation chains, quantifier
    keyword-vs-identifier disambiguation, `->` right-associativity,
    parenthesization, and 9 error paths.
  - `__tests__/frege-layout.test.ts` — 11 cases asserting that each
    primitive type appears for the expected source, the antecedent
    stub sits below the consequent stub, two condition strokes appear
    in `a -> b -> c`, the bbox grows with structure, every primitive
    lies inside the reported bbox, and every seeded example lays out
    successfully.
  - `__tests__/frege-system-data.test.ts` — 6 cases asserting the
    descriptor is `available`, has non-empty history/primitives/
    examples, has unique example slugs, and that every example DSL
    parses.
  - Total web suite: 141 tests (was 101 pre-FEAT-007); F# suite
    unchanged at 10. All passing.
- Renamed the design doc from
  `docs/formal-logic/fregean_begriffschriff.md` to
  `docs/formal-logic/frege-begriffsschrift.md` to fix two typos
  (missing inner `s`, terminal `f` instead of `t`) and align with the
  folder’s kebab-case convention. The original file was untracked at
  session start, so the rename appears in `git status` as a single
  `new file:` addition rather than a rename pair.

## Why

Continues the Logic Lab initiative and gives the Lab the first system
that genuinely stresses 2D layout. Peirce alpha is nested rectangles;
Kripke is a linear formula plus a separate xyflow graph. Frege’s
Begriffsschrift is a right-anchored multiline diagram with a stroke
network extending leftward — fundamentally different geometry, and the
strongest visual demonstration in the Lab of why historical notation
choices matter.

The phase-1 cut is deliberately narrow per the design doc:
propositional + universal quantifier only, no inference chains, no
formula numbers, no substitution forms, no Grundgesetze profile, no
gfnotation import-export, no Lean integration, no `LogicIR` migration.
The renderer is built fresh from a typed AST rather than ported from
gfnotation’s symbolic representation; gfnotation remains a *reference
oracle*, not the canonical model.

Closes #<issue-tbd>

## Reflection — relative complexity vs the earlier Logic Lab tickets

LOC totals (implementation + tests, just the per-system files in
`packages/web/src/logic/` and their `__tests__/`):

| Ticket | What | LOC |
|---|---|---|
| FEAT-005 Peirce alpha     | nested-rectangle SVG, tiny DSL                   |   517 |
| FEAT-006 Kripke modal     | linear formula + xyflow model graph              | 1,225 |
| FEAT-007 Frege Begriffsschrift | 2D right-anchored stroke network             | 1,115 |

In raw size FEAT-007 lands close to FEAT-006, but the work was
distributed differently and the *shape* of the difficulty was distinct.

**Where Frege was harder than expected:**

- **Layout discipline.** Peirce's geometry is "rectangle contains
  rectangles" — bottom-up sizing, top-down positioning, no constraints
  across siblings. Frege required tracking each subformula's *stub
  point* (the leftmost endpoint of its compound content stroke) and
  its asymmetric vertical extent (`above` vs `below` the stub). The
  conditional joins two stub points at a shared `hub_x` and emits a
  vertical condition stroke between them. Composing this needed the
  `(above, below)` split that Peirce's symmetric model didn't have.
- **Scope choice for `all`.** A recursive-descent grammar's natural
  default makes `all x.` a unary operator binding the next primary —
  narrow scope. Frege's diagrams have wide scope: the concavity
  governs the entire content stroke that follows it. The test for
  `|- all x. F(x) -> G(x)` flagged the mismatch immediately and
  forced a real design decision (now documented in the parser
  preamble). Neither Peirce nor Kripke had any equivalent scope
  question.
- **Conditional inversion.** `A -> B` reads left-to-right "if A then
  B" but Frege puts the consequent on top of the T-junction. The AST
  stores `{antecedent, consequent}` explicitly so the linear DSL and
  the 2D rendering can disagree about reading order without
  ambiguity. Easy in retrospect, but a place I had to be deliberate
  rather than letting the renderer follow the AST traversal order.
- **Cavity rendering.** Drawing the concavity as a multi-segment path
  (slope down, flat bottom, slope up) with a glyph centred inside is
  more than the Peirce or Kripke renderers do. The closest earlier
  analogue is FEAT-006's xyflow self-loop indicator — also small but
  visually loaded.

**Where Frege was easier than expected:**

- **No new dependencies.** FEAT-006 pulled in KaTeX and was the first
  xyflow consumer; FEAT-007 reused existing CodeMirror infrastructure
  and writes raw SVG primitives.
- **No second canvas.** FEAT-006 had to design the editor + model
  split (formula text + Kripke graph). Frege is one canvas, one
  renderer.
- **No parameterised semantics.** No frame classes, no truth badges,
  no per-example metadata beyond the optional `note`.
- **The system-descriptor shape was already right.** FEAT-006
  extended `LogicExample` and `LogicSystem` additively. FEAT-007
  added zero new fields.

**Pattern now solidified across three systems:**

| Concern              | File pattern                                                         |
|---|---|
| AST / types          | `<name>-types.ts`                                                    |
| Parser               | `<name>-parser.ts` (recursive descent, `ParseResult` ok/error union) |
| Pretty-printer       | `<name>-render.ts` *(only when output is text — Kripke)*              |
| Layout (non-trivial) | `<name>-layout.ts` *(Peirce, Frege)*                                  |
| Renderer             | `<Name>Renderer.tsx` (or `<Name>ModelView.tsx` for Kripke)            |
| Slash commands       | `<name>-commands.ts`                                                 |
| Editor               | `<Name>Editor.tsx` (CodeMirror host, near-identical across systems)  |
| System data          | flip the `LOGIC_SYSTEMS` entry from `'stub'` to `'available'`         |
| Route dispatch       | one new branch in `routes/logic.$system.tsx`                         |
| Tests                | `<name>-parser.test.ts` + `<name>-system-data.test.ts` + extras       |

The two genuine duplications across systems are the **CodeMirror host**
(`EgEditor` / `KripkeFormulaEditor` / `FregeEditor` — three
near-copies differing only in the autocomplete source) and the
**lab-page chrome** (header / primitives / history / reading-pointers
blocks, three near-copies in `routes/logic.$system.tsx`). FEAT-006's
note named the third-system threshold as the trigger to extract a
shared `LogicCmEditor`; FEAT-007 made that real. A small REFAC ticket
collapsing both duplications is the obvious next-up.

## Notes for future work

- **Wide-scope quantifier convention.** `all x. F(x) -> G(x)` parses
  as `∀x. (F(x) → G(x))`, matching Frege’s diagrammatic convention.
  `(all x. F(x)) -> G(a)` requires explicit parens for narrow scope.
  This is the opposite of the natural recursive-descent default (where
  unary binds primary), and was a real test failure during
  implementation that surfaced the design choice. Documented in the
  parser preamble.
- **Atom rendering is italic SVG `<text>`, not KaTeX.** Frege atoms can
  carry argument lists (`F(x, y)`) and ideally would have italic name +
  upright parens + italic args. Phase 1 italicises the whole string;
  KaTeX or per-tspan styling is a phase-2 polish.
- **Gothic/Fraktur for bound variables is approximated.** Real
  Begriffsschrift uses Fraktur letters inside the concavity. Phase 1
  uses italic Times in pale gold so the variable is visually
  distinguished without committing to a web-font fetch. Phase 2 can
  swap in a Fraktur subset (`KaTeX_Fraktur` is already loaded for the
  modal logic page).
- **No live browser test.** Per CLAUDE.md the rule is to verify UI in
  a browser. I verified via `tsc --noEmit` (clean), `npm run build`
  (clean, 1.28 MB pre-gzip / 394 kB gzipped), the full vitest suite
  (141 tests, all passing), the F# `dotnet test` suite (10/10), a
  Vite dev-server smoke test confirming `/logic/frege-bs` resolves and
  that each new module transforms without error, and a script that
  prints layout primitive counts and bbox dimensions for the seeded
  examples (numbers all reasonable; transitivity formula is 32
  primitives at 183×328). A human browser check should happen before
  merge — particularly the visual proportions of the conditional
  T-junction and the concavity letter placement at smaller widths.
- **Editor duplication.** `FregeEditor` is now a near-copy of
  `EgEditor` and `KripkeFormulaEditor` — three CodeMirror hosts
  differing only in their autocomplete source. Per the FEAT-006 note,
  Frege is the third system using CodeMirror, which was the explicit
  trigger for extracting a shared `LogicCmEditor`. That extraction is
  a small REFAC ticket.
- **AST is TS-only, by design.** Per
  `docs/formal-logic/backend-logic-core.md`, none of the migration
  triggers (Lean integration, `LogicIR`, computed evaluator) have
  fired yet. The Frege AST and parser stay in TypeScript with the
  same migration-when-it-fires posture as the modal AST.
- **gfnotation export is deferred.** The design doc proposes three
  adapters — native DSL → AST, gfnotation → AST, AST → gfnotation. We
  ship only the first. The other two are valuable mostly for testing
  fidelity against Wermuth’s typesetter and for TeX export; both can
  land later without disturbing the AST.
- **Inference chains are deferred.** Frege’s `\followswith`,
  `\substituting`, `\named`, formula numbers, and the multi-formula
  proof page belong to a separate phase. The current renderer
  deliberately renders one formula at a time and would need a
  containing layout engine for inference chains.
- **Bundle size.** Web build sits at ~1.28 MB pre-gzip (~394 kB
  gzipped), up marginally from FEAT-006’s 1.26 MB. The Vite
  >500 kB warning is the same one already noted as a follow-up in
  FEAT-005 / FEAT-006; route-level code-splitting for `/logic/$system`
  is still the obvious next move.
- **Reading-pointer wiring deferred.** No Frege philosopher entry
  exists in the seed data yet, so `system.thinkerSlug` is `null` and
  the detail-page CTA logic in `routes/philosophers.$slug.tsx`
  correctly hides itself. A future `DB-###-seed-frege` ticket would
  add a Frege philosopher node and wire the deep link.
