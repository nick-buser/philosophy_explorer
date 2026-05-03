import type { FolFormula, FolTerm } from './fol-types';
import { isPropositional, substitute } from './fol-types';
import { renderUnicode, renderTermUnicode } from './fol-render';

// Two-tier validity check for modern FOL:
//
// 1. **Propositional fragment** — exact truth-table enumeration over
//    propositional atoms (zero-arg predicates plus ⊤/⊥). Decisive,
//    ~2^n cost where n is the number of distinct atoms.
//
// 2. **First-order fragment** — bounded semantic tableau. Tries to
//    refute ¬φ by case-splitting and quantifier instantiation. If
//    every branch closes (contradicts itself) within the step budget,
//    φ is valid. If some branch saturates without closing, φ is
//    invalid (with a countermodel extracted from the branch). If the
//    budget is exhausted before either, the answer is unknown.
//
// This matches the standard "tableau is semi-decidable for FOL"
// story: a sound method that answers definitively on the easy cases
// and admits its limit on the hard ones.
//
// Equality is propagated by maintaining a union-find over term keys
// from `eq` literals on the branch. This gives the closure check
// reflexivity, symmetry, transitivity, and the Leibniz substitution
// rule for atomic predicates. It does *not* propagate function
// congruence: a branch with `a = b` and `f(a) = c` won't conclude
// `f(b) = c` automatically. Phase-1 examples don't rely on that.

export type ValidityResult =
  | { kind: 'valid';   method: 'truth-table' | 'tableau' }
  | { kind: 'invalid'; method: 'truth-table' | 'tableau'; countermodel: Countermodel }
  | { kind: 'unknown'; method: 'tableau'; reason: 'budget-exhausted'; budget: number };

export type Countermodel =
  | {
      kind: 'valuation';
      atoms: string[];
      // ordered by `atoms`; values are the booleans that falsify the
      // formula at the top level.
      values: boolean[];
    }
  | {
      kind: 'first-order';
      // Constants (and skolem witnesses) appearing in the open branch.
      // Concrete enough to render as "domain = {a, b, c1}".
      domain: string[];
      // Atomic facts the open branch commits to. Each entry is a
      // pretty-printed literal — the renderer just lists them.
      positiveFacts: string[];
      negativeFacts: string[];
      // Equality assertions on the branch, separately listed because
      // they're the most common source of "huh?" in countermodels.
      equalities: string[];
      inequalities: string[];
    };

export type ValidityOptions = {
  budget?: number;          // total formula expansions allowed (default 200)
  maxConstants?: number;    // cap on δ-introduced constants (default 6)
};

const DEFAULT_BUDGET = 200;
const DEFAULT_MAX_CONSTANTS = 6;

export function checkValidity(formula: FolFormula, opts: ValidityOptions = {}): ValidityResult {
  if (isPropositional(formula)) {
    return checkPropositional(formula);
  }
  return checkTableau(formula, opts);
}

// ─────────────────────────────────────────────────────────────────────
// Propositional truth-table check.

function checkPropositional(formula: FolFormula): ValidityResult {
  const atoms = collectPropAtoms(formula);
  // Edge case: no atoms (purely ⊤/⊥). Just evaluate once.
  if (atoms.length === 0) {
    if (evalProp(formula, {})) {
      return { kind: 'valid', method: 'truth-table' };
    }
    return {
      kind: 'invalid',
      method: 'truth-table',
      countermodel: { kind: 'valuation', atoms: [], values: [] },
    };
  }
  const n = atoms.length;
  const total = 1 << n;
  for (let i = 0; i < total; i++) {
    const env: Record<string, boolean> = {};
    for (let j = 0; j < n; j++) {
      env[atoms[j]] = ((i >> j) & 1) === 1;
    }
    if (!evalProp(formula, env)) {
      return {
        kind: 'invalid',
        method: 'truth-table',
        countermodel: {
          kind: 'valuation',
          atoms: [...atoms],
          values: atoms.map(a => env[a]),
        },
      };
    }
  }
  return { kind: 'valid', method: 'truth-table' };
}

function collectPropAtoms(f: FolFormula): string[] {
  const set = new Set<string>();
  walk(f);
  return [...set].sort();

  function walk(g: FolFormula): void {
    switch (g.kind) {
      case 'top': case 'bot': return;
      case 'pred': set.add(g.name); return;
      case 'eq': return;       // unreachable in propositional fragment
      case 'not': walk(g.body); return;
      case 'and': case 'or': case 'implies': case 'iff':
        walk(g.left); walk(g.right); return;
      case 'forall': case 'exists':
        walk(g.body); return;
    }
  }
}

function evalProp(f: FolFormula, env: Record<string, boolean>): boolean {
  switch (f.kind) {
    case 'top': return true;
    case 'bot': return false;
    case 'pred': return env[f.name] ?? false;
    case 'eq':  return false;          // unreachable
    case 'not': return !evalProp(f.body, env);
    case 'and': return evalProp(f.left, env) && evalProp(f.right, env);
    case 'or':  return evalProp(f.left, env) || evalProp(f.right, env);
    case 'implies': return !evalProp(f.left, env) || evalProp(f.right, env);
    case 'iff': return evalProp(f.left, env) === evalProp(f.right, env);
    case 'forall': case 'exists':
      // unreachable in propositional fragment; treat as always-false
      // to remain a total function.
      return false;
  }
}

// ─────────────────────────────────────────────────────────────────────
// Semantic tableau for first-order formulas.
//
// We try to build a model for ¬φ. Each branch is a list of formulas
// the branch commits to. A formula is processed once and then marked
// done — except γ-formulas (universals on the branch, or negations of
// existentials), which can be re-applied with different terms. δ-
// formulas (existentials, or negations of universals) introduce a
// fresh constant. β-formulas split the branch.
//
// Closure: a branch is closed if it contains both A and ¬A for some
// formula A (modulo collapse of double negation), or contains ⊥, or
// ¬⊤, or ¬(t=t) for some t. Equality propagation is handled by a
// shallow rewriting step that substitutes one side of an `s = t`
// equation through the branch's atomic literals.

type Branch = {
  // All formulas added to this branch, in order. A formula may be
  // added multiple times (different γ-instantiations); duplicates are
  // de-duplicated by string key when checking "already there".
  formulas: FolFormula[];
  formulaKeys: Set<string>;
  // Indices of formulas already processed by an α/β/δ rule.
  processed: Set<number>;
  // For each γ-formula index, the set of term keys already used to
  // instantiate it. New constants make new pairs eligible.
  gammaSeen: Map<number, Set<string>>;
  // Constants currently on the branch (used as candidates for γ).
  // Includes both pre-existing constants and δ-introduced ones.
  constants: Set<string>;
  freshCounter: { n: number };
};

function checkTableau(formula: FolFormula, opts: ValidityOptions): ValidityResult {
  const budget = opts.budget ?? DEFAULT_BUDGET;
  const maxConstants = opts.maxConstants ?? DEFAULT_MAX_CONSTANTS;
  const negated: FolFormula = { kind: 'not', body: formula };
  const initialConstants = collectGroundConstants(negated);
  // The procedure needs at least one constant to instantiate ∀ over.
  if (initialConstants.size === 0) initialConstants.add('a');
  const fresh = { n: 0 };

  const initial: Branch = {
    formulas: [negated],
    formulaKeys: new Set([keyOf(negated)]),
    processed: new Set(),
    gammaSeen: new Map(),
    constants: initialConstants,
    freshCounter: fresh,
  };

  const stack: Branch[] = [initial];
  let steps = 0;

  while (stack.length > 0) {
    if (steps >= budget) {
      return { kind: 'unknown', method: 'tableau', reason: 'budget-exhausted', budget };
    }
    const branch = stack.pop()!;

    if (closed(branch)) {
      continue;
    }

    const work = pickWork(branch, maxConstants);
    if (!work) {
      // Saturated and open. Build a countermodel from the literals.
      return {
        kind: 'invalid',
        method: 'tableau',
        countermodel: extractCountermodel(branch),
      };
    }

    steps++;
    const expansions = expand(branch, work);
    for (const b of expansions) stack.push(b);
  }

  return { kind: 'valid', method: 'tableau' };
}

// ─── Branch utilities ────────────────────────────────────────────────

function keyOf(f: FolFormula): string {
  // Canonical string representation so we can de-dupe formulas on a
  // branch. The Unicode renderer is stable enough for this.
  return renderUnicode(f);
}

function termKey(t: FolTerm): string {
  switch (t.kind) {
    case 'var':   return `v:${t.name}`;
    case 'const': return `c:${t.name}`;
    case 'fn':    return `${t.name}(${t.args.map(termKey).join(',')})`;
  }
}

function addFormula(branch: Branch, f: FolFormula): boolean {
  const k = keyOf(f);
  if (branch.formulaKeys.has(k)) return false;
  branch.formulas.push(f);
  branch.formulaKeys.add(k);
  // Pick up any new ground constants from the formula.
  for (const c of collectGroundConstants(f)) branch.constants.add(c);
  return true;
}

function cloneBranch(b: Branch): Branch {
  return {
    formulas: [...b.formulas],
    formulaKeys: new Set(b.formulaKeys),
    processed: new Set(b.processed),
    gammaSeen: new Map([...b.gammaSeen.entries()].map(([k, v]) => [k, new Set(v)])),
    constants: new Set(b.constants),
    freshCounter: b.freshCounter,
  };
}

function freshConst(branch: Branch): FolTerm {
  branch.freshCounter.n++;
  let name = `c${branch.freshCounter.n}`;
  while (branch.constants.has(name)) {
    branch.freshCounter.n++;
    name = `c${branch.freshCounter.n}`;
  }
  branch.constants.add(name);
  return { kind: 'const', name };
}

// ─── Closure ─────────────────────────────────────────────────────────

function closed(branch: Branch): boolean {
  // Trivial closures: ⊥, ¬⊤.
  for (const f of branch.formulas) {
    if (f.kind === 'bot') return true;
    if (f.kind === 'not' && f.body.kind === 'top') return true;
  }
  // Build a union-find over term keys from every `eq` literal on the
  // branch. This gives us symmetry, transitivity, and the Leibniz
  // substitution rule "for free" when checking literal clashes
  // (modulo function congruence, which we don't propagate — see
  // module header).
  const uf = new UnionFind();
  for (const f of branch.formulas) {
    if (f.kind === 'eq') {
      uf.union(termKey(f.left), termKey(f.right));
    }
  }
  // Inequality of provably-equal terms closes the branch — this is
  // also what catches `¬(t = t)` since `t` is trivially equal to
  // itself in the union-find.
  for (const f of branch.formulas) {
    if (f.kind === 'not' && f.body.kind === 'eq') {
      if (uf.equiv(termKey(f.body.left), termKey(f.body.right))) return true;
    }
  }
  // Predicate-literal clashes, modulo equality.
  const positives: PredLit[] = [];
  const negatives: PredLit[] = [];
  for (const f of branch.formulas) {
    if (f.kind === 'pred') {
      positives.push({ name: f.name, argKeys: f.args.map(termKey) });
    } else if (f.kind === 'not' && f.body.kind === 'pred') {
      negatives.push({ name: f.body.name, argKeys: f.body.args.map(termKey) });
    }
  }
  for (const p of positives) {
    for (const n of negatives) {
      if (litEquiv(p, n, uf)) return true;
    }
  }
  return false;
}

type PredLit = { name: string; argKeys: string[] };

function litEquiv(a: PredLit, b: PredLit, uf: UnionFind): boolean {
  if (a.name !== b.name) return false;
  if (a.argKeys.length !== b.argKeys.length) return false;
  for (let i = 0; i < a.argKeys.length; i++) {
    if (!uf.equiv(a.argKeys[i], b.argKeys[i])) return false;
  }
  return true;
}

class UnionFind {
  parent = new Map<string, string>();
  find(k: string): string {
    if (!this.parent.has(k)) { this.parent.set(k, k); return k; }
    let p = this.parent.get(k)!;
    while (p !== this.parent.get(p)!) {
      const gp = this.parent.get(p)!;
      this.parent.set(p, this.parent.get(gp)!);
      p = this.parent.get(p)!;
    }
    return p;
  }
  union(a: string, b: string): void {
    const ra = this.find(a), rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
  equiv(a: string, b: string): boolean { return this.find(a) === this.find(b); }
}

function isLiteral(f: FolFormula): boolean {
  if (f.kind === 'pred' || f.kind === 'eq' || f.kind === 'top' || f.kind === 'bot') return true;
  if (f.kind === 'not') {
    const b = f.body;
    return b.kind === 'pred' || b.kind === 'eq' || b.kind === 'top' || b.kind === 'bot';
  }
  return false;
}

// ─── Work selection ──────────────────────────────────────────────────

type Work =
  | { kind: 'expand'; index: number; formula: FolFormula }
  | { kind: 'gamma';  index: number; formula: FolFormula; term: FolTerm };

function pickWork(branch: Branch, maxConstants: number): Work | null {
  // Priority order: α first (linear, never branch), then δ (linear,
  // adds a fresh constant), then β (branching), then γ (universal
  // instantiation, may need to be re-applied).
  const order: Array<'alpha' | 'delta' | 'beta' | 'gamma'> = ['alpha', 'delta', 'beta', 'gamma'];
  for (const phase of order) {
    for (let i = 0; i < branch.formulas.length; i++) {
      const f = branch.formulas[i];
      if (phase !== 'gamma' && branch.processed.has(i)) continue;
      const cls = classify(f);
      if (cls !== phase) continue;
      if (phase === 'gamma') {
        // Only apply γ when there's at least one constant we haven't
        // already used for this formula.
        const seen = branch.gammaSeen.get(i) ?? new Set<string>();
        // δ-rules are capped by maxConstants; γ shouldn't outpace
        // them. Allow γ to use any *current* constant on the branch,
        // bounded by the cap.
        const cands = [...branch.constants].slice(0, maxConstants);
        for (const cName of cands) {
          if (seen.has(cName)) continue;
          return { kind: 'gamma', index: i, formula: f, term: { kind: 'const', name: cName } };
        }
      } else {
        return { kind: 'expand', index: i, formula: f };
      }
    }
  }
  return null;
}

function classify(f: FolFormula): 'alpha' | 'beta' | 'gamma' | 'delta' | 'literal' {
  // α: deterministic, linear expansion.
  // β: branching.
  // γ: universal instantiation (re-applicable).
  // δ: existential (introduce fresh constant).
  switch (f.kind) {
    case 'top': case 'bot': case 'pred': case 'eq':
      return 'literal';
    case 'and':     return 'alpha';
    case 'or':      return 'beta';
    case 'implies': return 'beta';
    case 'iff':     return 'beta';
    case 'forall':  return 'gamma';
    case 'exists':  return 'delta';
    case 'not': {
      const b = f.body;
      switch (b.kind) {
        case 'top': case 'bot': case 'pred': case 'eq':
          return 'literal';
        case 'not':     return 'alpha';   // ¬¬A → A
        case 'and':     return 'beta';    // ¬(A∧B)
        case 'or':      return 'alpha';   // ¬(A∨B) → ¬A,¬B
        case 'implies': return 'alpha';   // ¬(A→B) → A,¬B
        case 'iff':     return 'beta';    // ¬(A↔B) split
        case 'forall':  return 'delta';   // ¬∀x.A ≡ ∃x.¬A
        case 'exists':  return 'gamma';   // ¬∃x.A ≡ ∀x.¬A
      }
    }
  }
}

// ─── Expansion ───────────────────────────────────────────────────────

function expand(branch: Branch, work: Work): Branch[] {
  if (work.kind === 'gamma') {
    const next = cloneBranch(branch);
    const seen = next.gammaSeen.get(work.index) ?? new Set<string>();
    seen.add((work.term as { name: string }).name);
    next.gammaSeen.set(work.index, seen);
    const f = work.formula;
    if (f.kind === 'forall') {
      addFormula(next, substitute(f.body, f.variable, work.term));
    } else if (f.kind === 'not' && f.body.kind === 'exists') {
      addFormula(next, { kind: 'not', body: substitute(f.body.body, f.body.variable, work.term) });
    }
    return [next];
  }

  const f = work.formula;
  const idx = work.index;

  // α-expansion: linear, single child branch.
  switch (f.kind) {
    case 'and': {
      const next = cloneBranch(branch);
      next.processed.add(idx);
      addFormula(next, f.left);
      addFormula(next, f.right);
      return [next];
    }
    case 'forall':
    case 'exists':
      // forall is γ-class, exists is δ-class — handled below or in γ
      break;
    case 'not': {
      const b = f.body;
      switch (b.kind) {
        case 'not': {                // ¬¬A → A
          const next = cloneBranch(branch);
          next.processed.add(idx);
          addFormula(next, b.body);
          return [next];
        }
        case 'or': {                 // ¬(A∨B) → ¬A, ¬B
          const next = cloneBranch(branch);
          next.processed.add(idx);
          addFormula(next, { kind: 'not', body: b.left });
          addFormula(next, { kind: 'not', body: b.right });
          return [next];
        }
        case 'implies': {            // ¬(A→B) → A, ¬B
          const next = cloneBranch(branch);
          next.processed.add(idx);
          addFormula(next, b.left);
          addFormula(next, { kind: 'not', body: b.right });
          return [next];
        }
        case 'forall': {             // ¬∀x.A → ∃x.¬A → δ
          const next = cloneBranch(branch);
          next.processed.add(idx);
          const c = freshConst(next);
          addFormula(next, { kind: 'not', body: substitute(b.body, b.variable, c) });
          return [next];
        }
        case 'and': {                // ¬(A∧B) → branch on ¬A | ¬B
          const left  = cloneBranch(branch);
          const right = cloneBranch(branch);
          left.processed.add(idx);
          right.processed.add(idx);
          addFormula(left,  { kind: 'not', body: b.left });
          addFormula(right, { kind: 'not', body: b.right });
          return [left, right];
        }
        case 'iff': {                // ¬(A↔B): (A,¬B) | (¬A,B)
          const left  = cloneBranch(branch);
          const right = cloneBranch(branch);
          left.processed.add(idx);
          right.processed.add(idx);
          addFormula(left,  b.left);
          addFormula(left,  { kind: 'not', body: b.right });
          addFormula(right, { kind: 'not', body: b.left });
          addFormula(right, b.right);
          return [left, right];
        }
        case 'exists':
          // γ-class — handled in pickWork's gamma branch
          break;
        default:
          // literal — should have been classified as 'literal'
          break;
      }
      break;
    }
    case 'or': {                     // A∨B branch
      const left  = cloneBranch(branch);
      const right = cloneBranch(branch);
      left.processed.add(idx);
      right.processed.add(idx);
      addFormula(left,  f.left);
      addFormula(right, f.right);
      return [left, right];
    }
    case 'implies': {                // A→B branch ¬A | B
      const left  = cloneBranch(branch);
      const right = cloneBranch(branch);
      left.processed.add(idx);
      right.processed.add(idx);
      addFormula(left,  { kind: 'not', body: f.left });
      addFormula(right, f.right);
      return [left, right];
    }
    case 'iff': {                    // A↔B: (A,B) | (¬A,¬B)
      const left  = cloneBranch(branch);
      const right = cloneBranch(branch);
      left.processed.add(idx);
      right.processed.add(idx);
      addFormula(left,  f.left);
      addFormula(left,  f.right);
      addFormula(right, { kind: 'not', body: f.left });
      addFormula(right, { kind: 'not', body: f.right });
      return [left, right];
    }
    default:
      break;
  }

  // δ-expansion for bare existentials and ¬∀ are handled above; this
  // catches the bare exists case explicitly.
  if (f.kind === 'exists') {
    const next = cloneBranch(branch);
    next.processed.add(idx);
    const c = freshConst(next);
    addFormula(next, substitute(f.body, f.variable, c));
    return [next];
  }

  // Should be unreachable for non-literal formulas. Mark processed
  // to avoid spinning.
  const next = cloneBranch(branch);
  next.processed.add(idx);
  return [next];
}

// ─── Constants harvest ───────────────────────────────────────────────

function collectGroundConstants(f: FolFormula): Set<string> {
  const out = new Set<string>();
  walk(f);
  return out;

  function walk(g: FolFormula): void {
    switch (g.kind) {
      case 'top': case 'bot': return;
      case 'pred': for (const t of g.args) walkT(t); return;
      case 'eq': walkT(g.left); walkT(g.right); return;
      case 'not': walk(g.body); return;
      case 'and': case 'or': case 'implies': case 'iff':
        walk(g.left); walk(g.right); return;
      case 'forall': case 'exists':
        walk(g.body); return;
    }
  }
  function walkT(t: FolTerm): void {
    switch (t.kind) {
      case 'var': return;
      case 'const': out.add(t.name); return;
      case 'fn': for (const a of t.args) walkT(a); return;
    }
  }
}

// ─── Countermodel extraction ─────────────────────────────────────────

function extractCountermodel(branch: Branch): Countermodel {
  const positiveFacts: string[] = [];
  const negativeFacts: string[] = [];
  const equalities:    string[] = [];
  const inequalities:  string[] = [];
  for (const f of branch.formulas) {
    if (!isLiteral(f)) continue;
    if (f.kind === 'pred')  positiveFacts.push(renderUnicode(f));
    else if (f.kind === 'eq') equalities.push(renderUnicode(f));
    else if (f.kind === 'not') {
      const b = f.body;
      if (b.kind === 'pred') negativeFacts.push(renderUnicode(b));
      else if (b.kind === 'eq') inequalities.push(`${renderTermUnicode(b.left)} ≠ ${renderTermUnicode(b.right)}`);
    }
  }
  return {
    kind: 'first-order',
    domain: [...branch.constants].sort(),
    positiveFacts: dedupe(positiveFacts),
    negativeFacts: dedupe(negativeFacts),
    equalities:   dedupe(equalities),
    inequalities: dedupe(inequalities),
  };
}

function dedupe(xs: string[]): string[] {
  return [...new Set(xs)];
}
