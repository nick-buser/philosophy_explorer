import type { FolFormula } from './fol-types';
import { isPropositional } from './fol-types';
import { renderUnicode } from './fol-render';

// Lemmon-style truth table for the propositional fragment.
//
// Given a propositional formula (no quantifiers, no predicates with
// arguments, no equality), produce one row per valuation of its atoms
// and one column per *distinct* subformula in post-order (atoms first,
// then the compounds that depend on them, ending with the input
// formula in the rightmost column).
//
// Returns null for any formula outside the propositional fragment so
// the caller doesn't have to second-guess. The Modern FOL Lab uses the
// fragment detector to decide which view to render anyway.

export type TruthTableRow = {
  // Atom → boolean assignment for this row. Ordered to match `atoms`.
  valuation: Record<string, boolean>;
  // Value of every subformula in `subformulas` order.
  values: boolean[];
  // Convenience: value of the input formula (last column).
  mainValue: boolean;
};

export type TruthTable = {
  // Propositional atoms in canonical (sorted) order. Used to label the
  // leftmost columns and to drive the 2^n enumeration.
  atoms: string[];
  // All distinct subformulas in evaluation order: atoms first, then
  // compounds. The last entry is always the input formula. Indexes
  // align with `TruthTableRow.values`.
  subformulas: FolFormula[];
  // 2^n rows in lexicographic order (low bit = atoms[0]). Empty when
  // there are no atoms (then there's a single row representing the
  // sole {} valuation).
  rows: TruthTableRow[];
  // Verdict derivable from the table: tautology iff every mainValue
  // is true; contradiction iff every mainValue is false; contingent
  // otherwise. Computed once for badge / panel reuse.
  status: 'tautology' | 'contradiction' | 'contingent';
};

export function buildTruthTable(formula: FolFormula): TruthTable | null {
  if (!isPropositional(formula)) return null;

  const atoms = collectAtoms(formula);
  const subformulas = collectSubformulasInOrder(formula);
  // Make sure the input formula is the *last* column even when it's
  // an atom (degenerate "table for `p`" case).
  const mainKey = renderUnicode(formula);
  if (subformulas.length > 0 && renderUnicode(subformulas[subformulas.length - 1]) !== mainKey) {
    subformulas.push(formula);
  }

  const rows: TruthTableRow[] = [];
  const total = atoms.length === 0 ? 1 : 1 << atoms.length;
  for (let i = 0; i < total; i++) {
    const valuation: Record<string, boolean> = {};
    for (let j = 0; j < atoms.length; j++) {
      valuation[atoms[j]] = ((i >> j) & 1) === 1;
    }
    const values = subformulas.map(s => evalProp(s, valuation));
    rows.push({
      valuation,
      values,
      mainValue: values[values.length - 1] ?? evalProp(formula, valuation),
    });
  }

  const status = classify(rows);
  return { atoms, subformulas, rows, status };
}

function classify(rows: TruthTableRow[]): TruthTable['status'] {
  let anyTrue = false;
  let anyFalse = false;
  for (const r of rows) {
    if (r.mainValue) anyTrue = true;
    else anyFalse = true;
    if (anyTrue && anyFalse) return 'contingent';
  }
  if (anyTrue && !anyFalse) return 'tautology';
  if (anyFalse && !anyTrue) return 'contradiction';
  // Shouldn't reach here for non-empty rows.
  return 'contingent';
}

// Atoms = zero-arg predicate names. Sorted for stable column order.
function collectAtoms(f: FolFormula): string[] {
  const set = new Set<string>();
  walk(f);
  return [...set].sort();

  function walk(g: FolFormula): void {
    switch (g.kind) {
      case 'top': case 'bot': return;
      case 'pred': set.add(g.name); return;
      case 'eq': return;
      case 'not': walk(g.body); return;
      case 'and': case 'or': case 'implies': case 'iff':
        walk(g.left); walk(g.right); return;
      case 'forall': case 'exists': walk(g.body); return;
    }
  }
}

// Post-order traversal collecting every distinct subformula. "Distinct"
// is by Unicode string key — α-equivalent shapes that come out the same
// under the renderer share a column. Order is leaves-first so that any
// compound's children appear earlier in the list than the compound
// itself, which gives the table the standard left-to-right evaluation
// reading.
function collectSubformulasInOrder(f: FolFormula): FolFormula[] {
  const seen = new Set<string>();
  const out: FolFormula[] = [];

  visit(f);
  return out;

  function visit(g: FolFormula): void {
    switch (g.kind) {
      case 'top': case 'bot': case 'pred': case 'eq':
        record(g); return;
      case 'not':
        visit(g.body); record(g); return;
      case 'and': case 'or': case 'implies': case 'iff':
        visit(g.left); visit(g.right); record(g); return;
      case 'forall': case 'exists':
        // Unreachable in propositional fragment; keep the recursion
        // total so refactors stay safe.
        visit(g.body); record(g); return;
    }
  }

  function record(g: FolFormula): void {
    const k = renderUnicode(g);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(g);
  }
}

// Pure propositional evaluator. Mirrors the `evalProp` in
// fol-validity.ts but kept private here so the modules don't develop
// a dependency edge for one helper.
function evalProp(f: FolFormula, env: Record<string, boolean>): boolean {
  switch (f.kind) {
    case 'top': return true;
    case 'bot': return false;
    case 'pred': return env[f.name] ?? false;
    case 'eq':  return false;        // unreachable in propositional fragment
    case 'not': return !evalProp(f.body, env);
    case 'and': return evalProp(f.left, env) && evalProp(f.right, env);
    case 'or':  return evalProp(f.left, env) || evalProp(f.right, env);
    case 'implies': return !evalProp(f.left, env) || evalProp(f.right, env);
    case 'iff': return evalProp(f.left, env) === evalProp(f.right, env);
    case 'forall': case 'exists': return false;
  }
}
