# feat — Logic Lab: Resolution · Horn · Datalog

**Branch:** `feat/logic-lab-resolution`
**Merged:** 2026-05-05 (TBD on actual merge)

Fourth work-history entry under the slug-only convention, after
`feat-boolean-algebra.md`, `feat-natural-deduction.md`, and
`feat-logic-lab-indian-buddhist.md`. Closes the
"Resolution / Horn / Datalog" entry in
`docs/formal-logic/lab-roadmap.md` §Long term and fills the
"resolution" cell in the roadmap matrix's Tree/graph proof row.

## What changed

- New Logic Lab system at `/logic/resolution`. Tenth system
  overall. Three engines under one DSL: clause-set refutation,
  SLD backward chaining, Datalog forward chaining.
- Types — `resolution-types.ts`:
  - Term (var / const / compound), Atom, Literal (polarity + atom),
    Clause (literal disjunction; `[]` is ⊥), Rule (Horn definite
    clause), Goal, Substitution.
  - Discriminated `Program` union over the three modes plus a
    pretty-printer set (`formatTerm` / `formatAtom` / `formatLiteral`
    / `formatClause` / `formatRule` / `formatGoal` /
    `formatSubstitution`).
  - Small structural helpers (`termEquals`, `atomEquals`,
    `literalEquals`, `freeVars`, `atomVars`, `clauseVars`,
    `ruleVars`, `termIsGround`, `atomIsGround`, `atomHasFunctor`).
- Unifier — `resolution-unify.ts`:
  - Robinson MGU with occurs check (`unifyTerms`, `unifyAtoms`).
  - `applyTerm` / `applyAtom` / `applyLiteral` / `applyRule`
    walk and substitute.
  - `compose(s1, s2)` — semantics: `compose(s1, s2)(t) = s1(s2(t))`.
  - `freshenTerm` / `freshenAtom` / `freshenLiteral` / `freshenRule`
    standardise-apart by suffixing every variable name.
  - `restrict(s, vars)` produces the answer substitution from the
    deepest composed substitution by chasing through s for each
    query variable.
- Parser — `resolution-parser.ts`:
  - Auto-detects mode from surface syntax: lines containing
    `|` / `∨` / `\\/` / `~` / `¬` / `not` / `⊢` / `|-` are
    clause-family; lines containing `:-` / `?-` are Horn-family;
    everything else (bare atom + period) is `unit` and folds into
    whichever family won.
  - Mixing clause-family and Horn-family lines → parse error.
    No-family inputs (only unit lines) → Datalog facts.
  - Continuation: a buffered statement that ends with `,` or
    `:-` consumes the next line. This wraps long Prolog rules
    cleanly and never accidentally glues clause-mode lines.
  - `%` and `#` start comments; blank lines skipped; line
    numbers preserved for error reporting.
  - Datalog enforcement: rejects compound function symbols
    when no `?-` query is present (instructing the user to add
    one to switch into Horn / SLD mode).
- Engine — `resolution-engine.ts`:
  - `refute(clauses, goals)` — saturating binary resolution
    DAG. Seeds the DAG with input clauses, then per-goal-clause
    adds one unit clause per literal as the goal negation.
    Standardise-apart on each pair (left/right per-clause-id
    suffix), then resolves every complementary literal pair.
    Resolvents enter the DAG with a clause-signature dedup;
    parents and the MGU are recorded for the renderer. Hard
    step budget = 2000.
  - `sld(rules, query)` — backward-chaining with leftmost
    selection and source-order rule attempts, depth-first to
    `SLD_DEPTH = 32` and step budget = 2000. Builds an SldNode
    tree where every attempt is recorded (success and dead
    ends), so the renderer shows backtracking shape rather than
    only the success spine. Returns the answer substitution
    composed along the success path, restricted to query vars.
  - `datalogForward(rules)` — semi-naïve-style forward chaining
    with a per-round snapshot. Stratum 0 = the EDB (ground
    facts). Round N matches every rule's body against the
    snapshot taken at the round's start; new ground head facts
    accumulate into stratum N. Stops when a round derives
    nothing new. Defensive `atomIsGround` check on every
    derived head.
  - Common `classify(program)` dispatches to the right engine.
- Renderers:
  - `ResolutionDag.tsx` — depth-stratified rows (depth = max(parent
    depth) + 1), each card showing the clause, source (input #N /
    ¬goal / `res(C_i, C_j) on lit a ↔ lit b` plus θ when non-
    empty). The empty-clause card is highlighted in rose.
    Tone-coded legend; explanatory caption.
  - `SldTree.tsx` — recursive node renderer with a precomputed
    "first success path" set; nodes on the path are styled green
    (and the leaf shows ⌷ for the empty goal). Off-path attempts
    are dimmed; dead-end attempts get an inline "× dead end"
    badge. Footer shows the answer substitution or a verdict-
    specific blurb.
  - `DatalogStrata.tsx` — one card per stratum showing the new
    facts and (for derived ones) the rule index, body match, and
    binding. A "final model" panel groups facts by `pred/arity`,
    sorted within. Tail caption explains the iteration semantics.
- Editor + commands:
  - `ResolutionEditor.tsx` wraps `LogicCmEditor` with the system's
    slash list.
  - `resolution-commands.ts` — slash commands for `∨`, `¬`, `⊢`,
    `head :- body.`, `fact.`, `?- query.`, `% comment`, plus
    example inserters generated from the seed entry.
- Lab page — `labs/ResolutionLab.tsx`:
  - Header / history / primitives / further-reading sections in
    the shared shape.
  - Editor on the left with a mode-badge (clauses / horn /
    datalog) showing what the parser inferred; verdict + summary
    panel on the right with mode-specific copy.
  - Mode-specific rendering panel below: DAG, SLD tree, or
    Datalog strata.
- Seed entry in `data/logic-systems.ts` — 8 examples spanning
  the three modes:
  - `modus-ponens-refutation` — propositional refutation classic
    (clauses).
  - `unsat-three-clauses` — UNSAT with no goal needed (clauses).
  - `transitivity-fol` — FOL refutation exercising the unifier
    (clauses).
  - `ancestor-sld` — recursive Horn ancestor query (horn).
  - `append-sld` — list append with cons / nil (horn, compound
    terms).
  - `transitive-closure-datalog` — TC by forward chaining
    (datalog).
  - `same-generation-datalog` — the classic same-generation
    pattern (datalog).
  - `reachability-with-query` — same edges as the TC example,
    but with `?-` to flip into SLD mode (horn). The pair makes
    the mode-vs-program-shape distinction visible.

  History note covers Robinson 1965, Kowalski/Colmerauer 1972–73
  (SLD + Prolog), and the database lineage that gave Datalog its
  semi-naïve evaluator. Reading pointers: the original 1965 JACM
  paper, SEP entries on Automated Reasoning and Logic Programming,
  and the Abiteboul/Hull/Vianu *Foundations of Databases*
  online edition.
- Route wiring in `routes/logic.$system.lazy.tsx` — new
  `resolution` slug routes to `ResolutionLab` (lazy-loaded chunk,
  ~34 kB / 10 kB gz).
- Tests:
  - `__tests__/resolution-unify.test.ts` — 15 tests. Identity,
    constant unification, variable binding, var-to-var,
    compound-term element-wise, predicate / arity rejection,
    occurs check, transitive walk through chained bindings,
    atom-level unification, apply, compose semantics, freshening.
  - `__tests__/resolution-parser.test.ts` — 22 tests. Mode
    detection across all three modes (∨, ¬, ⊢, `?-`, `:-`,
    bare facts), mixing rejection, datalog-without-functor
    enforcement, clause parsing including `|` / `\\/` / `∨`
    glyph aliases, FOL clauses, Horn rules / facts / queries,
    compound terms in queries, comment skipping, multi-line
    rule continuation, and line-numbered error reporting.
  - `__tests__/resolution-engine.test.ts` — 13 tests covering
    propositional refutation (literal contradiction, modus
    ponens, three-clause unsat, satisfiability), FOL refutation
    (unification engagement; satisfiable disjoint set), SLD
    (base rule, recursive ancestor, failure, append with
    compound terms), and Datalog (TC count + facts, per-stratum
    breakdown, fixpoint termination).
  - `__tests__/resolution-system-data.test.ts` — 4 tests
    verifying registration, parse-roundtrip on every seed, that
    every example produces a renderable engine output, and that
    each example's classify outcome matches the verdict its
    slug claims.

## Why

The roadmap (`docs/formal-logic/lab-roadmap.md` §Long term)
flagged Resolution / Horn / Datalog as the bridge from FOL to
executable inference, with the strategic note that it
"naturally connects to Brandomian entailment / incompatibility
graphs and the existing entity graph layer." The matrix in the
same doc placed "resolution" in the Tree/graph proof family
alongside natural deduction (FEAT-shipped) and sequent calculus
(still open). Closing that cell completes the proof-shape spine
the matrix laid out.

The user explicitly bundled the three modes into one lab at
branch creation (rather than splitting Datalog into a separate
ticket). The shared unifier + types + standardise-apart code
make it cheap, and the pedagogical point — the *gradient* from
refutation to backward chain to forward chain on essentially the
same logical material — only lands if the three live side by
side. The `transitive-closure-datalog` and
`reachability-with-query` example pair (same edges, same IDB
rules, only `?-` differs) is the canonical demonstration.

Closes the entry in `docs/formal-logic/lab-roadmap.md` §Long
term — though no GitHub Issue was opened for it.

### Files

| File | Change |
|------|--------|
| `packages/web/src/logic/resolution-types.ts` | new — Term/Atom/Literal/Clause/Rule/Goal/Program + pretty-printers |
| `packages/web/src/logic/resolution-unify.ts` | new — Robinson MGU + apply/compose/freshen |
| `packages/web/src/logic/resolution-parser.ts` | new — three-mode auto-detecting DSL parser |
| `packages/web/src/logic/resolution-engine.ts` | new — `refute` / `sld` / `datalogForward` + `classify` |
| `packages/web/src/logic/resolution-commands.ts` | new — slash-command registry |
| `packages/web/src/logic/ResolutionEditor.tsx` | new — `LogicCmEditor` wrapper |
| `packages/web/src/logic/ResolutionDag.tsx` | new — depth-stratified DAG renderer |
| `packages/web/src/logic/SldTree.tsx` | new — SLD tree with success spine + dead-ends |
| `packages/web/src/logic/DatalogStrata.tsx` | new — per-iteration strata + final-model |
| `packages/web/src/logic/labs/ResolutionLab.tsx` | new — Lab page |
| `packages/web/src/logic/__tests__/resolution-unify.test.ts` | new (15 cases) |
| `packages/web/src/logic/__tests__/resolution-parser.test.ts` | new (22 cases) |
| `packages/web/src/logic/__tests__/resolution-engine.test.ts` | new (13 cases) |
| `packages/web/src/logic/__tests__/resolution-system-data.test.ts` | new (4 cases) |
| `packages/web/src/data/logic-systems.ts` | + resolution system entry, 8 examples |
| `packages/web/src/routes/logic.$system.lazy.tsx` | + lazy import + slug routing |
| `docs/formal-logic/resolution.md` | new — design doc |
| `docs/formal-logic/lab-status.md` | promoted last-shipped; tenth row; deferrals row |
| `docs/formal-logic/lab-roadmap.md` | Resolution / Horn / Datalog entry marked shipped |
| `work-history/feat-logic-lab-resolution.md` | this file |

Verified: `npm run test:web` 567/567 (was 513 pre-resolution,
+54 new); `tsc --noEmit` clean; `npm run build
--workspace=packages/web` clean (ResolutionLab chunk:
34.17 kB / 9.99 kB gzipped). Vite dev server returns HTTP 200
for `/logic/resolution` and serves the lab module without
errors.

**Not verified manually:** no Playwright pass and no human
visual check on the rendered DAG / SLD tree / Datalog strata
panels in the browser. The unit tests cover the engines and
formatter outputs, and the React component code typechecks +
builds, but layout / interaction regressions in the rendered
panels are not covered. Browser smoke is tracked in
`lab-roadmap.md` §Short term as `infra/logic-lab-playwright-
smoke`.

## Notes for future work

- **Variable canonicalisation in clause signatures.** Resolvents
  that are alpha-equivalent currently de-dup only when the raw
  variable names match — and since standardise-apart suffixes
  are per-parent-id, two resolvents from different parent pairs
  reach the same clause modulo renaming and still both land in
  the DAG. Visible on larger FOL examples; for the seed set the
  duplication is small. A canonical BFS-renaming over the
  signature would catch them.
- **Iterative deepening for SLD.** Bounded DFS with a fixed
  depth cap is fine for the seed examples but loops on left-
  recursive programs (`anc(X,Z) :- anc(X,Y), parent(Y,Z).`).
  ID-DFS is ~30 LOC and would let the lab handle the textbook
  left-recursive ancestor without rule re-ordering. Pairs
  naturally with a "find all answers" toggle.
- **Multiple SLD answers.** The current renderer shows only the
  first success path. Continuing search past the first ⌷ would
  show the Prolog ";" semantics — a list of distinct answer
  substitutions for the same query.
- **Negation as failure.** `\+ atom` in the parser, stratified
  Datalog evaluation in Datalog mode, closed-world treatment in
  SLD. De-scoped on this branch but flagged in the design doc as
  the obvious next ticket — and the one that opens the door to
  the Brandomian entailment / incompatibility connection the
  roadmap hinted at.
- **Compound-term list syntax.** `cons(one, cons(two, nil))`
  could pretty-print as `[one, two | nil]` or `[one, two]` (when
  the tail is nil). Small renderer add; would make the `append`
  example legible at a glance.
- **Unification trace.** Each step shows the MGU but not how it
  was built. A click-to-expand "p(X) ≟ p(a) → X ↦ a; q(X, b) ≟
  q(a, Y) → Y ↦ b" trace would be a small UI add and is a
  natural pedagogical next polish.
- **Set-of-support / unit-preference for refutation.** The
  saturation is undirected — every pair gets resolved. SoS
  (only resolve clauses derived from the goal) would dramatically
  prune the DAG on FOL examples and is a few lines.
- **"Semi-naïve" misnomer.** The Datalog engine is technically
  *naïve* re-evaluation on a per-round snapshot, not true
  semi-naïve (which tracks per-predicate deltas and joins only
  against the delta on the recursive side). Same fixpoint, lower
  asymptotic cost; the rename should accompany the implementation
  change if it ever happens.
- **Compare-view bridge.** Compare with Modern FOL is the
  obvious cross-system pollination — the same `transitivity-fol`
  refutation can be shown alongside its Modern-FOL truth-tree.
  Tracked in `lab-roadmap.md` §Short term as
  `feat/logic-lab-compare-view`; this lab is now a candidate
  for the second pair (FOL ↔ Resolution) once that ticket
  starts.
- **Lean integration as a verification layer.** Same shape as
  the open Lean ticket for ND: the engine produces the proof
  structure (DAG / tree / strata), Lean would verify each step
  produced a valid resolvent / SLD goal-reduction. Strictly
  larger than this branch and only worth doing if the
  verification answer is a desired UX.
