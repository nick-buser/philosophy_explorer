// Engines for the three Resolution-family modes.
//
//   refute(clauses, goal?) — propositional / FOL binary resolution.
//     Tries to derive ⊥ from the clause set (with the goal's
//     negation added if a goal clause is supplied). Returns a
//     resolution DAG: every derived clause records the two parents
//     and the unifier (for FOL) or selected complementary literal.
//
//   sld(rules, query) — SLD resolution for Horn programs.
//     Backward-chains the goal atoms, depth-first with iterative
//     deepening to keep the search bounded; returns the first
//     successful derivation as a tree, plus the answer
//     substitution restricted to the query's variables.
//
//   datalog(rules) — semi-naïve forward chaining for Datalog.
//     Iterates the immediate-consequence operator T_P until
//     fixpoint, recording the per-iteration delta (new ground
//     facts) so the renderer can show the strata.
//
// All three share the unifier and the standardise-apart machinery
// from `resolution-unify.ts`.

import type {
  Atom, Clause, Goal, Literal, Program, Rule, Substitution, Term,
} from './resolution-types';
import { atomIsGround, atomVars, literalEquals } from './resolution-types';
import {
  applyAtom, applyLiteral, compose, freshenLiteral,
  freshenRule, restrict, unifyAtoms,
} from './resolution-unify';

// ─────────────────────────────────────────────────────────────────────
// Resolution refutation (DAG)
// ─────────────────────────────────────────────────────────────────────

export type ClauseId = number;

export type DagSource =
  | { kind: 'input'; index: number }                     // input clauses[index]
  | { kind: 'goal'; goalIndex: number }                  // ¬goal[goalIndex] added by the engine
  | { kind: 'resolvent';
      left: ClauseId; right: ClauseId;
      // Indices of the literals chosen for resolution on each parent
      leftLit: number; rightLit: number;
      mgu: Substitution;
    };

export type DagNode = {
  id: ClauseId;
  clause: Clause;
  source: DagSource;
};

export type RefutationResult = {
  outcome: 'refuted' | 'saturated' | 'budget';
  dag: DagNode[];
  emptyClauseId: ClauseId | null;  // populated iff outcome === 'refuted'
};

// Negate a clause's literal-set: ¬(L1 ∨ L2 ∨ ...) ≡ ¬L1 ∧ ¬L2 ∧ ...
// In clausal form, that yields one unit clause per literal. Used
// when the user supplies a goal alongside the clause set.
function negateGoalToClauses(goal: Clause): Clause[] {
  return goal.literals.map(l => ({
    literals: [{ polarity: l.polarity === 'pos' ? 'neg' : 'pos', atom: l.atom }],
  }));
}

// Two literals are *complementary* if one is the negation of the
// other. After standardise-apart and unification, two literals from
// different parent clauses can be resolved iff the atoms unify and
// the polarities differ.
function clauseDedupe(c: Clause): Clause {
  const out: Literal[] = [];
  for (const l of c.literals) {
    if (!out.some(existing => literalEquals(existing, l))) out.push(l);
  }
  return { literals: out };
}

function clauseSignature(c: Clause): string {
  // Order-independent signature for clause-set membership.
  const parts = c.literals.map(l => {
    return (l.polarity === 'pos' ? '' : '~') + atomSig(l.atom);
  });
  parts.sort();
  return parts.join('|');
}

function atomSig(a: Atom): string {
  if (a.args.length === 0) return a.predicate;
  return `${a.predicate}(${a.args.map(termSig).join(',')})`;
}

function termSig(t: Term): string {
  if (t.kind === 'var') return `?${t.name}`;
  if (t.kind === 'const') return t.name;
  return `${t.functor}(${t.args.map(termSig).join(',')})`;
}

const REFUTE_BUDGET = 2000;

export function refute(clauses: Clause[], goals: Clause[]): RefutationResult {
  const dag: DagNode[] = [];
  const sigToId = new Map<string, ClauseId>();

  function addNode(clause: Clause, source: DagSource): ClauseId {
    const c = clauseDedupe(clause);
    const sig = clauseSignature(c);
    const existing = sigToId.get(sig);
    if (existing !== undefined) return existing;
    const id = dag.length;
    dag.push({ id, clause: c, source });
    sigToId.set(sig, id);
    return id;
  }

  // 1. Seed with input clauses.
  for (let i = 0; i < clauses.length; i++) {
    addNode(clauses[i]!, { kind: 'input', index: i });
  }
  // 2. Add goal-negation clauses for each goal supplied.
  //    ¬(L1 ∨ L2 ∨ …) ≡ ¬L1 ∧ ¬L2 ∧ … so each goal clause becomes
  //    one unit clause per literal.
  for (let gi = 0; gi < goals.length; gi++) {
    for (const c of negateGoalToClauses(goals[gi]!)) {
      addNode(c, { kind: 'goal', goalIndex: gi });
    }
  }

  // Quick exit on a literal ⊥ already present.
  for (const node of dag) {
    if (node.clause.literals.length === 0) {
      return { outcome: 'refuted', dag, emptyClauseId: node.id };
    }
  }

  // Saturation loop (set-of-support style; here, full saturation
  // bounded by REFUTE_BUDGET steps for didactic safety).
  let cursor = 0;
  let steps = 0;
  while (cursor < dag.length && steps < REFUTE_BUDGET) {
    const right = dag[cursor]!;
    for (let li = 0; li < cursor; li++) {
      const left = dag[li]!;
      const resolvents = resolveClausePair(left, right);
      for (const r of resolvents) {
        const beforeLen = dag.length;
        const id = addNode(r.clause, {
          kind: 'resolvent',
          left:  left.id,
          right: right.id,
          leftLit:  r.leftLit,
          rightLit: r.rightLit,
          mgu: r.mgu,
        });
        const isNew = dag.length > beforeLen;
        if (isNew && r.clause.literals.length === 0) {
          return { outcome: 'refuted', dag, emptyClauseId: id };
        }
        steps++;
        if (steps >= REFUTE_BUDGET) {
          return { outcome: 'budget', dag, emptyClauseId: null };
        }
      }
    }
    cursor++;
  }
  return { outcome: 'saturated', dag, emptyClauseId: null };
}

type Resolvent = { clause: Clause; leftLit: number; rightLit: number; mgu: Substitution };

function resolveClausePair(left: DagNode, right: DagNode): Resolvent[] {
  const out: Resolvent[] = [];
  // Standardise-apart: rename right's variables.
  const rightFresh: Clause = {
    literals: right.clause.literals.map(l => freshenLiteral(l, `_r${right.id}`)),
  };
  const leftFresh: Clause = {
    literals: left.clause.literals.map(l => freshenLiteral(l, `_l${left.id}`)),
  };
  for (let i = 0; i < leftFresh.literals.length; i++) {
    const lL = leftFresh.literals[i]!;
    for (let j = 0; j < rightFresh.literals.length; j++) {
      const rL = rightFresh.literals[j]!;
      if (lL.polarity === rL.polarity) continue;
      const mgu = unifyAtoms(lL.atom, rL.atom);
      if (!mgu) continue;
      const remaining: Literal[] = [];
      for (let k = 0; k < leftFresh.literals.length; k++) {
        if (k === i) continue;
        remaining.push(applyLiteral(mgu, leftFresh.literals[k]!));
      }
      for (let k = 0; k < rightFresh.literals.length; k++) {
        if (k === j) continue;
        remaining.push(applyLiteral(mgu, rightFresh.literals[k]!));
      }
      out.push({
        clause: clauseDedupe({ literals: remaining }),
        leftLit:  i,
        rightLit: j,
        mgu,
      });
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// SLD resolution (for Horn programs)
// ─────────────────────────────────────────────────────────────────────

export type SldNode = {
  // The selected goal at this node; the goal is the conjunction
  // [selected, ...rest]. The root has the user query as goal.
  goal: Atom[];
  // Children: one per attempted rule resolution. Successful children
  // carry the fresh rule, the MGU, and the new sub-goal.
  attempts: SldAttempt[];
};

export type SldAttempt = {
  rule: Rule;          // freshened copy actually used
  ruleIndex: number;   // index in the original program
  mgu: Substitution;
  // Resulting goal after substituting body atoms for the selected
  // atom and applying the MGU.
  child: SldNode | null;  // null if this attempt is a dead-end (no further node was explored)
  status: 'success' | 'dead-end' | 'pruned';
  // The selected atom from the parent goal (literal index 0 = leftmost).
  selectedIndex: number;
};

export type SldResult = {
  outcome: 'success' | 'failure' | 'budget';
  // Tree starting at the original query.
  root: SldNode;
  // Answer substitution restricted to query variables, only when
  // outcome === 'success'.
  answer: Substitution | null;
  steps: number;
};

const SLD_DEPTH = 32;
const SLD_BUDGET = 2000;

export function sld(rules: Rule[], query: Goal): SldResult {
  const queryVars = new Set<string>();
  for (const a of query.atoms) for (const v of atomVars(a)) queryVars.add(v);

  let stepCounter = 0;
  let freshCounter = 0;
  const root: SldNode = { goal: query.atoms, attempts: [] };

  function search(node: SldNode, currentSubst: Substitution, depth: number): Substitution | null {
    if (stepCounter >= SLD_BUDGET) return null;
    if (node.goal.length === 0) return currentSubst;
    if (depth >= SLD_DEPTH) return null;

    // Leftmost selection rule.
    const selected = node.goal[0]!;
    const rest = node.goal.slice(1);
    for (let i = 0; i < rules.length; i++) {
      stepCounter++;
      if (stepCounter >= SLD_BUDGET) return null;
      const fresh = freshenRule(rules[i]!, `_${++freshCounter}`);
      const mgu = unifyAtoms(selected, fresh.head);
      if (!mgu) continue;
      const newGoal = [
        ...fresh.body.map(a => applyAtom(mgu, a)),
        ...rest.map(a => applyAtom(mgu, a)),
      ];
      const child: SldNode = { goal: newGoal, attempts: [] };
      const attempt: SldAttempt = {
        rule: fresh,
        ruleIndex: i,
        mgu,
        child,
        status: 'success',
        selectedIndex: 0,
      };
      node.attempts.push(attempt);
      const composed = compose(mgu, currentSubst);
      const result = search(child, composed, depth + 1);
      if (result) return result;
      attempt.status = 'dead-end';
    }
    return null;
  }

  const final = search(root, new Map(), 0);
  if (final !== null) {
    return {
      outcome: 'success',
      root,
      answer: restrict(final, queryVars),
      steps: stepCounter,
    };
  }
  return {
    outcome: stepCounter >= SLD_BUDGET ? 'budget' : 'failure',
    root,
    answer: null,
    steps: stepCounter,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Datalog forward chaining (semi-naïve)
// ─────────────────────────────────────────────────────────────────────

export type DatalogStratum = {
  iteration: number;          // 0 = initial facts, 1+ = derived rounds
  newFacts: DatalogDerivation[];
};

export type DatalogDerivation = {
  fact: Atom;
  // null source = base fact (no rule derived it).
  source: null | { ruleIndex: number; binding: Substitution; bodyMatches: Atom[] };
};

export type DatalogResult = {
  strata: DatalogStratum[];
  factsByPredicate: Map<string, Atom[]>;
  totalFacts: number;
};

const DATALOG_BUDGET = 100000;

export function datalogForward(rules: Rule[]): DatalogResult {
  // All facts derived so far, keyed by their ground signature.
  const known = new Map<string, DatalogDerivation>();
  const strata: DatalogStratum[] = [];

  function add(d: DatalogDerivation): boolean {
    const sig = atomSig(d.fact);
    if (known.has(sig)) return false;
    known.set(sig, d);
    return true;
  }

  // Stratum 0: the EDB (extensional) facts.
  const stratum0: DatalogDerivation[] = [];
  for (const r of rules) {
    if (r.body.length === 0 && atomIsGround(r.head)) {
      const d: DatalogDerivation = { fact: r.head, source: null };
      if (add(d)) stratum0.push(d);
    }
  }
  strata.push({ iteration: 0, newFacts: stratum0 });

  // Iteratively apply non-fact rules until fixpoint. Each round
  // matches rule bodies only against facts that existed at the
  // start of the round, so stratum N+1 contains exactly the facts
  // derivable from stratum N (and earlier) — clean strata for
  // the renderer.
  let iter = 0;
  let totalSteps = 0;
  while (totalSteps < DATALOG_BUDGET) {
    iter++;
    const snapshot = new Map(known);
    const newDerivations: DatalogDerivation[] = [];
    for (let ri = 0; ri < rules.length; ri++) {
      const r = rules[ri]!;
      if (r.body.length === 0) continue;
      const match = matchBody(r.body, snapshot, 0, new Map(), totalSteps);
      totalSteps += match.steps;
      for (const m of match.bindings) {
        if (totalSteps >= DATALOG_BUDGET) break;
        const headFact = applyAtom(m, r.head);
        if (!atomIsGround(headFact)) continue;
        const sig = atomSig(headFact);
        if (known.has(sig)) continue;
        const bodyMatches = r.body.map(b => applyAtom(m, b));
        const d: DatalogDerivation = {
          fact: headFact,
          source: { ruleIndex: ri, binding: m, bodyMatches },
        };
        known.set(sig, d);
        newDerivations.push(d);
      }
      if (totalSteps >= DATALOG_BUDGET) break;
    }
    if (newDerivations.length === 0) break;
    strata.push({ iteration: iter, newFacts: newDerivations });
  }

  const byPred = new Map<string, Atom[]>();
  for (const d of known.values()) {
    const k = `${d.fact.predicate}/${d.fact.args.length}`;
    if (!byPred.has(k)) byPred.set(k, []);
    byPred.get(k)!.push(d.fact);
  }
  return { strata, factsByPredicate: byPred, totalFacts: known.size };
}

type BodyMatch = {
  bindings: Substitution[];
  steps: number;
};

function matchBody(
  body: Atom[],
  known: Map<string, DatalogDerivation>,
  i: number,
  s: Substitution,
  steps: number,
): BodyMatch {
  const out: Substitution[] = [];
  let local = 0;
  if (i >= body.length) return { bindings: [s], steps: 0 };
  const cur = applyAtom(s, body[i]!);
  for (const d of known.values()) {
    local++;
    if (steps + local > DATALOG_BUDGET) break;
    const m = unifyAtoms(cur, d.fact, s);
    if (!m) continue;
    const sub = matchBody(body, known, i + 1, m, steps + local);
    local += sub.steps;
    for (const b of sub.bindings) out.push(b);
    if (steps + local > DATALOG_BUDGET) break;
  }
  return { bindings: out, steps: local };
}

// ─────────────────────────────────────────────────────────────────────
// Tiny convenience wrappers to keep the lab page tidy.
// ─────────────────────────────────────────────────────────────────────

export type EngineOutput =
  | { kind: 'clauses'; result: RefutationResult }
  | { kind: 'horn';    result: SldResult }
  | { kind: 'datalog'; result: DatalogResult };

export function classify(program: Program): EngineOutput {
  if (program.mode === 'clauses') {
    return { kind: 'clauses', result: refute(program.clauses, program.goals) };
  }
  if (program.mode === 'horn') {
    return { kind: 'horn', result: sld(program.rules, program.query) };
  }
  return { kind: 'datalog', result: datalogForward(program.rules) };
}
