# Resolution · Horn · Datalog — design

**Status:** shipped 2026-05-05 (`feat/logic-lab-resolution`).
**Slug:** `resolution`. Tenth Logic Lab system.

This doc covers the design choices behind the lab. Per-ticket
narrative lives in `work-history/feat-logic-lab-resolution.md`;
the broader roadmap entry that motivated it is in
`lab-roadmap.md` §Long term.

---

## Scope

One lab, three closely-related engines, mode picked from surface
syntax:

| Mode      | Surface marker                | Visualization     | Engine                    |
|-----------|-------------------------------|-------------------|---------------------------|
| `clauses` | `\|`, `∨`, `\\/`, `~`/`¬`, `⊢`/`\|-` | Resolution DAG    | Binary resolution refutation (set saturation) |
| `horn`    | `?- query.`                   | SLD derivation tree | Goal-directed backward chaining (depth-first with bound) |
| `datalog` | (Horn rules with no `?-`)     | Per-iteration strata | Forward chaining to fixpoint (snapshot per round) |

Rationale for one lab over three: the unifier, term/atom/clause
types, and standardise-apart machinery are shared, the three
engines are pedagogically a gradient (refutation → backward chain
→ forward chain), and the parser auto-detection keeps the user-
facing experience uncluttered.

Out of scope on this branch (called out at branch creation):
- Negation as failure / stratified Datalog with `not`
- Aggregation, magic sets, recursive aggregates
- Full first-order resolution with skolemisation beyond what
  the example fragment needs
- Compare-view bridge to Modern FOL (separate ticket)
- Lean verification (separate ticket; would land as a presentation
  layer over the existing engine output, not a replacement)

---

## DSL

Lines are statements. A statement is normally one line; a
buffered statement that ends with `,` or `:-` consumes the
following line, so wrapped Prolog rules work but standalone
clause-mode lines never accidentally glue. `%` and `#` start
comments.

Variables: identifier with uppercase or `_` initial.
Constants: lowercase identifier or numeric literal.
Compound terms: `functor(t1, …, tn)` — n ≥ 1.

| Mode      | Syntax                         | Example |
|-----------|--------------------------------|---------|
| Clauses   | `~p ∨ q ∨ ~r`                  | `p` ; `~p \| q` ; `\|- q` |
| Horn rule | `head :- body1, body2.`        | `ancestor(X, Y) :- parent(X, Y).` |
| Horn fact | `head.`                        | `parent(alice, bob).` |
| SLD query | `?- atom1, atom2.`             | `?- ancestor(alice, Z).` |

Parser dispatch:
1. Tag each statement: `clause` (has `\|`/`∨`/`\\/`/`¬`/`~`/`not`),
   `goal-clause` (`⊢`/`\|-`), `goal-horn` (`?-`), `horn-rule`
   (contains `:-`), or `unit` (none of those — a bare atom).
2. If both clause-family and Horn-family lines appear → parse error
   (mixing). Otherwise dispatch into the family that won.
3. `unit` lines fold into whichever family won; if neither family
   appears (purely unit lines), the program is treated as a Datalog
   set of facts.

This means a single `p` parses as Datalog `p.` (a fact). A
`p\n~q` parses as the clauses `{p}, {¬q}`.

---

## Engine 1 — propositional / FOL refutation

`refute(clauses, goals)` in `resolution-engine.ts:refute`.

- Seed the DAG with the input clauses, then add unit clauses for
  the negation of every goal literal:
  ¬(L1 ∨ L2 ∨ … ∨ Ln) ≡ ¬L1 ∧ ¬L2 ∧ … ∧ ¬Ln, so each goal clause
  becomes one unit clause per literal.
- Saturation loop: at each step, take a clause "right" from the
  cursor and resolve it against every "left" clause already
  processed. Each successful resolvent enters the DAG with the
  parents recorded.
- Standardise-apart: every literal in left and right is renamed
  with a per-clause-id suffix before unification, so the same
  source clause can be reused without variable capture.
- Dedup: clauses are stored under an order-independent literal-
  set signature, so resolving twice into the same clause is a
  no-op. Variable names in the signature are not yet alpha-
  normalised — see "Notes for future work".
- Termination: a hard step budget (`REFUTE_BUDGET = 2000`)
  protects against runaway saturation in pathological inputs.
  Reaching the empty clause ⊥ ends the loop early.

The DAG-renderer (`ResolutionDag.tsx`) lays out clauses by
*derivation depth* (max(parent depth) + 1), one row per depth,
with each card showing the clause, its source (`input #N`,
`¬goal`, or `res(C_left, C_right) on lit i ↔ lit j`), and the
unifier when non-empty.

---

## Engine 2 — SLD resolution

`sld(rules, query)` in `resolution-engine.ts:sld`.

- Backward-chains the query against the program with the leftmost
  selection rule and source-order rule selection (the simplest,
  most predictable strategy — and what undergraduate Prolog
  textbooks teach).
- Depth bound: `SLD_DEPTH = 32`. Step budget: `SLD_BUDGET = 2000`.
  Both are loose for the lab's small examples and tight enough to
  prevent the demo locking the page on left-recursive programs.
- The search is constructed as a tree with both successful and
  dead-end attempts recorded — `SldTree.tsx` renders the actual
  *backtracking shape*, not just the success path. Dead-end
  attempts are dimmed; the success spine is highlighted.
- Answer substitution is composed along the success path and
  restricted to query variables for display.

Trade-off: depth-first without iterative deepening can miss
solutions on left-recursive programs (`anc(X,Z) :- anc(X,Y),
parent(Y,Z).` loops before reaching the base rule). The lab's
seed examples avoid left-recursion; users typing left-recursive
programs see a "budget exhausted" verdict — accurate but not
ideal.

---

## Engine 3 — Datalog forward chaining

`datalogForward(rules)` in `resolution-engine.ts:datalogForward`.

- Stratum 0 = the EDB facts (rules with empty body and ground
  head).
- Each subsequent round: snapshot the current fact set, then for
  every rule with a non-empty body, find every body-match against
  the snapshot, derive the head fact, and accumulate any not yet
  known. Append the round's new facts as a new stratum.
- Stop when a round derives nothing new.
- Snapshot-per-round semantics — not naïve "all rules apply
  immediately to whatever's known" — keeps the strata clean: a
  fact in stratum N+1 is exactly the set of facts derivable from
  the snapshot at the start of round N+1, which is the strata at
  N and earlier.
- Datalog parser-side guarantee: no compound function symbols, so
  unification on rule heads can never introduce a non-ground term
  in the conclusion. The engine still asserts `atomIsGround` on
  every derived head as a defensive check.

`DatalogStrata.tsx` renders one card per stratum (with body-match
and θ shown for derived facts), then a final-model panel grouped
by `predicate/arity`.

---

## Layout — how the three views compose

The lab mounts:

```
┌────────────────────────────────────────────────────┐
│  Editor (DSL + slash menu)   │  Verdict + badge    │
│                              │  + summary          │
├──────────────────────────────┴─────────────────────┤
│  Mode-specific panel:                              │
│    • Resolution DAG  (clauses)                     │
│    • SLD tree        (horn)                        │
│    • Datalog strata  (datalog)                     │
└────────────────────────────────────────────────────┘
```

Switching modes is a parse, not a UI toggle: edit the DSL so the
parser picks a different family, and the panel below swaps
without explicit user action.

---

## Examples shipped

Eight examples covering the three modes:

| Slug                              | Mode    | Purpose |
|-----------------------------------|---------|---------|
| `modus-ponens-refutation`         | clauses | textbook propositional refutation |
| `unsat-three-clauses`             | clauses | unsat clause set with no explicit goal |
| `transitivity-fol`                | clauses | first-order resolution with unification |
| `ancestor-sld`                    | horn    | recursive Horn program, ancestor query |
| `append-sld`                      | horn    | SLD with compound terms (cons / nil) |
| `transitive-closure-datalog`      | datalog | TC by forward chaining on edges |
| `same-generation-datalog`         | datalog | the classic same-generation pattern |
| `reachability-with-query`         | horn    | same edge program as `transitive-closure-datalog`, but with `?-` → SLD |

The last pair (TC vs reachability) is on purpose: identical EDB,
identical IDB rules, only the presence of `?-` flips the mode.
Useful for showing the gradient.

---

## Files

| File | Purpose |
|------|---------|
| `packages/web/src/logic/resolution-types.ts` | Term / Atom / Literal / Clause / Rule / Goal / Program; pretty-printers and small predicates |
| `packages/web/src/logic/resolution-unify.ts` | Robinson MGU, occurs check, substitution composition, `freshenRule` for standardise-apart |
| `packages/web/src/logic/resolution-parser.ts` | Auto-detecting three-mode parser |
| `packages/web/src/logic/resolution-engine.ts` | `refute` / `sld` / `datalogForward`; common `classify` dispatch |
| `packages/web/src/logic/ResolutionEditor.tsx` | `LogicCmEditor` wrapper |
| `packages/web/src/logic/resolution-commands.ts` | Slash-command registry |
| `packages/web/src/logic/ResolutionDag.tsx` | Resolution DAG renderer (depth-stratified rows) |
| `packages/web/src/logic/SldTree.tsx` | SLD derivation tree with success spine + dead ends |
| `packages/web/src/logic/DatalogStrata.tsx` | Per-iteration strata + final model |
| `packages/web/src/logic/labs/ResolutionLab.tsx` | Lab page |

---

## Notes for future work

- **Variable canonicalisation in clause signatures.** Two
  resolvents that are alpha-equivalent (same clause modulo
  variable renaming) currently land as separate DAG nodes
  because the signature uses raw variable names with the
  per-parent suffix. For the lab's small examples this is
  visible but not problematic; for larger refutations a
  BFS-canonical renaming would let the dedup catch them.
- **Set-of-support / unit-preference strategies.** The current
  saturation is undirected — every pair gets resolved. Adding a
  set-of-support flag (only resolve clauses that derive from the
  goal) would dramatically prune the DAG on FOL examples and is
  cheap to add.
- **Iterative deepening for SLD.** Bounded DFS with a fixed depth
  cap is fine for the seed examples but misses solutions on
  left-recursive programs. ID-DFS would be ~30 LOC and would let
  the lab handle the textbook left-recursive ancestor without
  the user re-ordering rules.
- **Multiple SLD answers.** The current renderer shows the
  *first* answer and the dead-ends visited en route. A "find all
  answers" mode (continue search after the first success) would
  be a small add and would show what Prolog calls ";" semantics.
- **Negation as failure.** Adding `\+ atom` (NAF) to the parser,
  with stratified evaluation in Datalog mode and the standard
  closed-world treatment in SLD, is the obvious next ticket and
  was de-scoped from this branch.
- **Magic sets / semi-naïve in the engine name.** The lab calls
  the engine "semi-naïve" for the snapshot-per-round
  presentation, but technically *naïve* re-evaluation on the
  snapshot is what's implemented — true semi-naïve evaluation
  would track per-predicate deltas and only join against the
  delta on the recursive side. Same fixpoint, lower
  asymptotic cost; the rename should accompany that change if
  it ever happens.
- **Unification trace.** Each resolution / SLD step shows the
  resulting MGU but not *how* it was built. A click-to-expand
  trace ("p(X) ≟ p(a) → bind X ↦ a, p(X, b) ≟ p(a, Y) → bind
  Y ↦ b") would be straightforward and is a natural next polish.
- **Compound-term renderer.** Currently `cons(one, cons(two,
  nil))` displays as the raw functor expression. A list-syntax
  pretty-printer (`[one, two | nil]` or `[one, two]`) would make
  the `append` example easier to read and is a small add.
