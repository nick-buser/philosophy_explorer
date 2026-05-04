# feat — Natural deduction (Fitch + Gentzen)

**Branch:** `feat/logic-lab-natural-deduction`
**Merged:** 2026-05-04 (TBD on actual merge)

Second work-history entry filed under the slug-only convention
(`feat-natural-deduction.md`), following `feat-boolean-algebra.md`.
Closes the "Natural deduction" entry in
`docs/formal-logic/lab-roadmap.md` §Medium term.

## What changed

- New Logic Lab system at `/logic/natural-deduction`. Eighth system
  overall and the first proof-presentation system in the Lab —
  previous systems decided validity, this one *exhibits a proof*.
- AST + parser:
  - `nd-types.ts` — `Argument` (premises ⊢ conclusion), `Rule`
    enum (premise / assumption / Reit / ∧I/E / ∨I/E / →I/E /
    ↔I/E / ¬I/E / ⊥E / RAA), `FitchProof` (flat line list with
    `depth` markers, citations either single line numbers or
    `[start, end]` subproof spans), and `formulaKey` for stable
    in-scope deduplication. Reuses `FolFormula` from `fol-types`.
  - `nd-parser.ts` — turnstile DSL. `p, p -> q |- q` is the
    canonical shape; also accepts `⊢` and `therefore` as
    turnstiles, semicolons / newlines as premise separators, and
    a bare formula (no turnstile) as a no-premise argument. Splits
    on top-level commas only — `R(a, b)` doesn't fool the splitter.
    Each premise / conclusion is then handed to `parseFol` so the
    same FOL grammar (and KaTeX renderer) carries through.
- Prover `nd-prover.ts` — backward-chaining ND prover with mutable
  Fitch-line emission and snapshot/restore for failed branches.
  Strategy at each `prove(goal)` call:
  1. Saturate the current scope with cheap forward eliminations
     (∧E both sides, →E, ↔E both directions, ¬E into ⊥). This is
     idempotent and strictly forward-chaining, so it terminates.
  2. If goal already in scope, succeed immediately (Reit).
  3. Try goal-shape introduction (∧I, ∨I either side, →I via
     subproof, ↔I via two subproofs, ¬I via subproof to ⊥).
  4. ⊥E shortcut: if ⊥ is provable and goal isn't ⊥, derive goal
     by ex falso.
  5. *Backward chain through implications and biconditionals.*
     For each `A -> goal` (or `A <-> goal` / `goal <-> A`) in
     scope, try proving `A` so the elim rule fires. This is what
     unlocks currying and Peirce's law without the user having to
     think of intermediate lemmas.
  6. ∨E case analysis on each available disjunction, each side
     proved in its own subproof.
  7. Classical only: RAA — assume ¬goal, derive ⊥.

  Depth and budget gates protect against runaway recursion;
  defaults are `depth=6, budget=600` and were sufficient for every
  shipped example with headroom.
- Gentzen-tree builder `nd-gentzen.ts` — walks the Fitch proof
  from the conclusion line backward, producing a `GentzenNode`
  tree. Subproof spans become subtrees whose first matching
  `assumption`-rule leaf is marked `discharged: true` with the
  discharging rule attached, so the renderer can bracket
  discharged assumptions in the textbook style.
- Renderers:
  - `FitchProof.tsx` — line-numbered proof with subproof boxes
    rendered as left-bordered, tinted indents. Each line shows
    `[n.] formula  rule cites`, with rule colour coding
    (premise / Reit muted, intro/elim blue, RAA rose,
    `assumption` amber + a thin separator).
  - `GentzenTree.tsx` — indented vertical tree (matching the
    truth-tree panel's idiom). Each non-leaf node carries its
    rule label; leaves are premises or assumptions; discharged
    assumptions are line-throughed and bracketed with the
    discharging rule as a superscript.
- Editor + commands:
  - `NdEditor.tsx`, `nd-commands.ts` — slash commands for the
    turnstile, all connectives, `false`/⊥, and an example
    inserter sourced from the seed entry. Reuses
    `LogicCmEditor`.
- Lab page `NaturalDeductionLab.tsx`:
  - Header / history / primitives / further-reading sections
    matching the other Lab pages.
  - Editor on the left; an "Argument" summary panel on the right
    showing each premise as a numbered KaTeX line and the
    conclusion under a ∴.
  - Classical / intuitionistic mode toggle (radio group) sitting
    next to the editor header.
  - Status badge: `intuitionistic · proven` (emerald),
    `classical · proven` (violet), `out of scope` (grey, for
    quantified arguments), or `no proof · {mode}` (amber).
  - Below: Fitch panel, Gentzen panel. The "out of scope" panel
    appears when the argument is quantified, with a deep link to
    the Modern FOL Lab.
- Seed entry in `data/logic-systems.ts` — 13 examples spanning
  intuitionistically-valid (modus ponens, hypothetical syllogism,
  conjunction commutativity, currying, ∨-cases, contraposition
  forward, intuitionistic De Morgan, self-implication) and
  classical-only (LEM, double-negation elim, Peirce's law,
  reverse De Morgan, reverse contraposition). History note covers
  Gentzen 1934, Jaśkowski 1934, Fitch 1952, the classical /
  intuitionistic split via RAA, and the Curry-Howard hook.
  Reading pointers: SEP Proof Theory, SEP Development of Proof
  Theory, the Open Logic Project, Fitch's *Symbolic Logic*.
- Route wiring in `routes/logic.$system.lazy.tsx` — new
  `natural-deduction` slug routes to `NaturalDeductionLab`.
  Code-split chunk weighs in at 24.61 kB / 7.39 kB gzipped, in
  between Frege and Aristotelian.
- Tests: 27 new tests across `nd-parser` (9), `nd-prover` (14),
  and `nd-system-data` (4). Total now **490/490 passing** (was
  463 after Boolean).
- `lab-status.md` updated: 8th row added, last-shipped promoted,
  per-system deferrals row for `natural-deduction` added.
- `lab-roadmap.md` updated: Medium-term natural-deduction entry
  marked shipped.

### Files

| File | Change |
|------|--------|
| `packages/web/src/logic/nd-types.ts` | new — argument, rule, Fitch shapes, `formulaKey` |
| `packages/web/src/logic/nd-parser.ts` | new — turnstile DSL on top of `parseFol` |
| `packages/web/src/logic/nd-prover.ts` | new — backward-chaining ND prover |
| `packages/web/src/logic/nd-gentzen.ts` | new — Fitch → Gentzen-tree converter |
| `packages/web/src/logic/nd-commands.ts` | new — slash-command registry |
| `packages/web/src/logic/NdEditor.tsx` | new — `LogicCmEditor` wrapper |
| `packages/web/src/logic/FitchProof.tsx` | new — Fitch renderer |
| `packages/web/src/logic/GentzenTree.tsx` | new — Gentzen-tree renderer |
| `packages/web/src/logic/labs/NaturalDeductionLab.tsx` | new — Lab page |
| `packages/web/src/logic/__tests__/nd-parser.test.ts` | new (9 cases) |
| `packages/web/src/logic/__tests__/nd-prover.test.ts` | new (14 cases) |
| `packages/web/src/logic/__tests__/nd-system-data.test.ts` | new (4 cases) |
| `packages/web/src/data/logic-systems.ts` | + ND system entry, 13 examples |
| `packages/web/src/routes/logic.$system.lazy.tsx` | + lazy import + slug routing |
| `docs/formal-logic/lab-status.md` | promoted last-shipped; 8th row; deferrals row |
| `docs/formal-logic/lab-roadmap.md` | ND medium-term entry marked shipped |
| `work-history/feat-natural-deduction.md` | this file |

Verified: `npm run test:web` 490/490 (was 463 pre-ND, +27 new);
`tsc --noEmit` clean; `npm run build --workspace=packages/web`
clean (NaturalDeductionLab chunk: 24.61 kB / 7.39 kB gzipped).

## Why

`lab-roadmap.md` flagged natural deduction as the *largest
proof-theoretic gap* in the Lab — every other system either
decides validity (Aristotelian / Boolean / Modern FOL truth-table)
or builds a proof object the user doesn't read directly (Modern
FOL truth-tree, technically a refutation tableau). ND is what
every undergraduate logic textbook actually teaches, and the
Lab's "show your work" mode for proofs was visibly missing.

The ticket also resolved an ambiguity in `lab-status.md` §C: the
note there suggested Lean integration was needed to render
ND-style derivations, but Lean's role is *verification*, not
*presentation*. A hand-rolled backward-chaining prover plus Fitch
renderer is meaningful on its own and doesn't pre-commit to a
sandboxed-Lean architecture. If a future ticket wants Lean as a
verification layer, the proof object the prover produces is
already in a shape Lean would consume cleanly (premise-list ⊢
conclusion, with the ND rule names matching standard Lean tactic
names).

The Fitch / Gentzen pair is one ticket because the same proof
object drives both renderings — that's structurally the same
relationship the Modern FOL Lab has between
`buildTableauTree` (which produces the proof) and the two views
(which read it). Building both presentations together is cheaper
than building one and adding the other later.

The classical / intuitionistic toggle was the cheap pollinator:
the prover only needed a single guard (`ruleSet === 'classical'`
gates RAA; everything else is shared), and the toggle pre-empts
the next ticket on the medium-term list (`feat/logic-lab-
intuitionistic`) by making the rule-set difference visible
in-place rather than as a separate Lab. The intuitionistic Lab
ticket as scoped is now strictly about *adding intuitionistic
Kripke semantics*, not about ND rules.

## Notes for future work

- **Propositional only.** The prover refuses (with a "out of
  scope" panel) any argument containing a quantifier or a
  predicate over terms. Adding ∀I / ∀E / ∃I / ∃E is mechanical
  for the rules themselves, but proof search over quantifiers is
  open-ended (you have to invent witnesses and instances). A
  reasonable next step would lean on the Modern FOL tableau
  engine to *guide* the ND prover — close the tableau, then
  translate the closed tableau into ND moves. That's strictly
  larger than this ticket and probably the right shape for the
  long-term Lean-integration ticket.

- **Strategy is fixed, not user-driven.** The prover decides which
  rule to try at each step. There's no "pick the next rule"
  manual mode and no way to ask for *all* proofs (it returns the
  first one it finds, which is usually shortest because the
  introduction rules and forward-saturation come before backward
  search). The truth-tree's deferred manual-mode hook applies
  here too — `prove`, `proveSubproof`, and the saturation step
  are pure-ish (mutate but rollback cleanly) and a
  one-rule-at-a-time UI would reuse them.

- **Backward-chaining over implications can re-enter.** The added
  step "for each `A -> goal` in scope, try prove A" can in
  principle loop if a chain of implications keeps reducing the
  goal to itself. The depth gate stops it cheaply, but the search
  becomes exponential at the gate. None of the shipped examples
  hit this. If a user pastes a long chain, the prover will report
  "search budget exhausted" rather than hanging.

- **No countermodels for invalid arguments.** When the prover
  fails, the panel reads "no proof found" and points the user at
  the Modern FOL Lab's truth-table view for a falsifying
  valuation. Adding a quick truth-table check in the ND Lab
  itself would be ~10 LOC (reuse `buildTruthTable` from
  `fol-truth-table.ts`), but the routing-out has the side benefit
  of making the system boundary visible — ND is a *proof
  calculus*, not a decision procedure, and the current UX
  reflects that.

- **Gentzen tree is indented-vertical, not 2D.** Same trade-off
  the truth-tree panel made — a true 2D Gentzen tree (premises
  side-by-side under a horizontal inference bar) is the textbook
  layout but takes SVG geometry. The vertical layout is readable
  for the shipped examples (the deepest is Peirce's law at ~6
  nested levels). If demand surfaces for the textbook horizontal
  shape, the `GentzenNode` tree is already in the right shape to
  feed an SVG layout pass.

- **Same-formula re-use becomes Reit, not a DAG.** When the
  prover would re-derive a formula already in scope, it emits a
  `Reit` line instead of duplicating the derivation. That keeps
  Fitch line counts low but means the Gentzen tree shows the
  same subderivation twice if it's used twice. The textbook
  convention is to keep the tree truly tree-shaped, so this
  matches expectations; the DAG view (each subderivation drawn
  once with multiple parent links) would be a different visual
  paradigm — niche, deferred.

- **No discharge-line numbering on Gentzen leaves.** Discharged
  assumptions are bracketed and superscripted with the rule that
  discharged them, but not numbered (the textbook convention is
  to write a small numeric label that matches a label on the
  discharging rule). The mapping is preserved in the proof
  object — the `markDischarged` walker matches the assumption to
  the rule — but the renderer doesn't draw the numeric backlink.
  Adding it is ~20 LOC if the visual feedback is worth it.

- **Intuitionistic mode without ⊥E?** The Lab ships with ⊥E
  available in both modes, which matches the standard
  presentation (Heyting arithmetic includes ex falso). A *minimal*
  logic mode (intuitionistic minus ⊥E) would be a third toggle
  position; not currently scoped because the philosophical
  motivation is narrower than classical-vs-intuitionistic.

- **No browser smoke pass.** Verified via `tsc --noEmit`,
  `vitest` (490/490), and `npm run build`. A human pass should
  confirm: each shipped example renders without horizontal
  scroll at 1280-px width; the Gentzen tree at Peirce's law fits
  on a screen; the classical/intuitionistic toggle swap doesn't
  cause flicker; KaTeX doesn't overflow on the longer-formula
  examples (currying, Peirce). Same gap that
  `infra/logic-lab-playwright-smoke` tracks across the Lab.

- **Compare view (next ticket per roadmap).** Natural deduction
  doesn't have a natural "second pair" for compare — it's a
  proof calculus, not a notation. But Boolean ↔ Modern FOL or
  Frege ↔ Modern FOL would both pair naturally with a
  derivation-shaped third panel, and the Fitch shape is a
  candidate for the "render the same content as a proof" slot.
  Out of scope here.