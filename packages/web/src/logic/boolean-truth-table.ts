import type { BoolFormula } from './boolean-types';
import { collectVariables, evalBool } from './boolean-types';
import { renderUnicode } from './boolean-render';

// Truth table for a Boolean-algebra formula. Behaves like the FOL
// truth-table builder but works directly on the Boolean AST — no need
// to translate. Returns one column per distinct subformula in
// post-order; the input formula is always the rightmost column.

export type BoolTruthTableRow = {
  valuation: Record<string, boolean>;
  values: boolean[];
  mainValue: boolean;
};

export type BoolTruthTable = {
  variables: string[];
  subformulas: BoolFormula[];
  rows: BoolTruthTableRow[];
  status: 'tautology' | 'contradiction' | 'contingent';
};

export function buildBoolTruthTable(formula: BoolFormula): BoolTruthTable {
  const variables = collectVariables(formula);
  const subformulas = collectSubformulasInOrder(formula);
  const mainKey = renderUnicode(formula);
  if (subformulas.length === 0 || renderUnicode(subformulas[subformulas.length - 1]!) !== mainKey) {
    subformulas.push(formula);
  }

  const rows: BoolTruthTableRow[] = [];
  const total = variables.length === 0 ? 1 : 1 << variables.length;
  for (let i = 0; i < total; i++) {
    const valuation: Record<string, boolean> = {};
    for (let j = 0; j < variables.length; j++) {
      valuation[variables[j]!] = ((i >> j) & 1) === 1;
    }
    const values = subformulas.map(s => evalBool(s, valuation));
    rows.push({
      valuation,
      values,
      mainValue: values[values.length - 1] ?? evalBool(formula, valuation),
    });
  }

  return { variables, subformulas, rows, status: classify(rows) };
}

function classify(rows: BoolTruthTableRow[]): BoolTruthTable['status'] {
  let anyTrue = false;
  let anyFalse = false;
  for (const r of rows) {
    if (r.mainValue) anyTrue = true; else anyFalse = true;
    if (anyTrue && anyFalse) return 'contingent';
  }
  if (anyTrue && !anyFalse) return 'tautology';
  if (anyFalse && !anyTrue) return 'contradiction';
  return 'contingent';
}

function collectSubformulasInOrder(f: BoolFormula): BoolFormula[] {
  const seen = new Set<string>();
  const out: BoolFormula[] = [];

  visit(f);
  return out;

  function visit(g: BoolFormula): void {
    switch (g.kind) {
      case 'zero': case 'one': case 'var':
        record(g); return;
      case 'not':
        visit(g.body); record(g); return;
      case 'and': case 'or': case 'xor': case 'imp': case 'iff':
        visit(g.left); visit(g.right); record(g); return;
    }
  }
  function record(g: BoolFormula): void {
    const k = renderUnicode(g);
    if (seen.has(k)) return;
    seen.add(k);
    out.push(g);
  }
}

// Two formulas are equivalent iff their truth tables agree row by row,
// and both range over a common variable set. The Lab uses this for the
// "equivalent to" badge when an example pairs LHS and RHS via <->.
export function areEquivalent(a: BoolFormula, b: BoolFormula): boolean {
  const variables = [...new Set([...collectVariables(a), ...collectVariables(b)])].sort();
  const total = variables.length === 0 ? 1 : 1 << variables.length;
  for (let i = 0; i < total; i++) {
    const env: Record<string, boolean> = {};
    for (let j = 0; j < variables.length; j++) {
      env[variables[j]!] = ((i >> j) & 1) === 1;
    }
    if (evalBool(a, env) !== evalBool(b, env)) return false;
  }
  return true;
}