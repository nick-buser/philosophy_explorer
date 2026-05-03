import type { FolFormula } from './fol-types';
import { isPropositional } from './fol-types';
import { buildTableauTree } from './fol-tableau-tree';
import type { TableauOptions } from './fol-tableau-tree';

// Two-tier validity check for modern FOL:
//
// 1. **Propositional fragment** — exact truth-table enumeration over
//    propositional atoms (zero-arg predicates plus ⊤/⊥). Decisive,
//    ~2^n cost where n is the number of distinct atoms.
//
// 2. **First-order fragment** — delegates to `buildTableauTree`, which
//    runs a Smullyan-style semantic tableau and returns the full proof
//    tree. The verdict is read off the tree (every leaf closed → valid;
//    any open leaf → invalid + countermodel; otherwise budget-exhausted
//    → unknown).
//
// The tree-builder lives in `fol-tableau-tree.ts` so the Lab page can
// render the proof. This module exposes the legacy verdict-only API for
// callers that don't need the tree.

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

export type ValidityOptions = TableauOptions;

export function checkValidity(formula: FolFormula, opts: ValidityOptions = {}): ValidityResult {
  if (isPropositional(formula)) {
    return checkPropositional(formula);
  }
  const tree = buildTableauTree(formula, opts);
  switch (tree.verdict) {
    case 'valid':   return { kind: 'valid', method: 'tableau' };
    case 'invalid': return {
      kind: 'invalid',
      method: 'tableau',
      countermodel: { kind: 'first-order', ...tree.countermodel! },
    };
    case 'unknown': return {
      kind: 'unknown',
      method: 'tableau',
      reason: 'budget-exhausted',
      budget: tree.budget,
    };
  }
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
