import type { BoolFormula } from './boolean-types';
import { collectVariables, evalBool } from './boolean-types';

// Sum-of-products (DNF) and product-of-sums (CNF) normal forms.
// Both are computed straight from the truth table — minterms for DNF,
// maxterms for CNF — which is the definitional construction every
// Boolean-algebra text uses. The output is structurally minimal in the
// sense that constants are folded (the DNF of a contradiction is `0`,
// the CNF of a tautology is `1`), but no Quine–McCluskey-style
// minimisation runs here. K-map grouping in `boolean-kmap.ts` does that.

export function toDnf(formula: BoolFormula): BoolFormula {
  const variables = collectVariables(formula);
  const minterms = enumerateMinterms(formula, variables, true);
  if (minterms.length === 0) return { kind: 'zero' };

  const conjunctions: BoolFormula[] = minterms.map(mt => mintermFormula(variables, mt));
  return chainOr(conjunctions);
}

export function toCnf(formula: BoolFormula): BoolFormula {
  const variables = collectVariables(formula);
  const maxterms = enumerateMinterms(formula, variables, false);
  if (maxterms.length === 0) return { kind: 'one' };

  const disjunctions: BoolFormula[] = maxterms.map(mt => maxtermFormula(variables, mt));
  return chainAnd(disjunctions);
}

// Algebraic normal form (Reed–Muller). Constant + sum (XOR) of distinct
// AND-monomials over uncomplemented variables. Computed by the standard
// Möbius transform over the truth table.
export function toAnf(formula: BoolFormula): BoolFormula {
  const variables = collectVariables(formula);
  const n = variables.length;
  const total = n === 0 ? 1 : 1 << n;

  // Truth table → bit array.
  const truth = new Array<boolean>(total);
  for (let i = 0; i < total; i++) {
    const env: Record<string, boolean> = {};
    for (let j = 0; j < n; j++) env[variables[j]!] = ((i >> j) & 1) === 1;
    truth[i] = evalBool(formula, env);
  }

  // Möbius transform — converts truth table to ANF coefficients.
  const anf = truth.slice();
  for (let step = 1; step < total; step <<= 1) {
    for (let i = 0; i < total; i++) {
      if ((i & step) !== 0) anf[i] = anf[i]! !== anf[i ^ step]!;
    }
  }

  // Build the formula: constant + XOR of monomials whose coefficient is 1.
  const monomials: BoolFormula[] = [];
  let constant = false;
  for (let i = 0; i < total; i++) {
    if (!anf[i]) continue;
    if (i === 0) { constant = true; continue; }
    const factors: BoolFormula[] = [];
    for (let j = 0; j < n; j++) {
      if ((i >> j) & 1) factors.push({ kind: 'var', name: variables[j]! });
    }
    monomials.push(chainAnd(factors));
  }
  if (monomials.length === 0) return { kind: constant ? 'one' : 'zero' };
  let acc = monomials[0]!;
  for (let i = 1; i < monomials.length; i++) {
    acc = { kind: 'xor', left: acc, right: monomials[i]! };
  }
  if (constant) acc = { kind: 'xor', left: { kind: 'one' }, right: acc };
  return acc;
}

// ---------- helpers ----------

// Returns the set of minterm indices (or maxterm indices, when wantTrue=false)
// for the given formula over the provided variables. Index encoding matches
// `boolean-truth-table.ts`: bit j of index = value of variables[j].
function enumerateMinterms(formula: BoolFormula, variables: string[], wantTrue: boolean): number[] {
  const n = variables.length;
  const total = n === 0 ? 1 : 1 << n;
  const out: number[] = [];
  for (let i = 0; i < total; i++) {
    const env: Record<string, boolean> = {};
    for (let j = 0; j < n; j++) env[variables[j]!] = ((i >> j) & 1) === 1;
    if (evalBool(formula, env) === wantTrue) out.push(i);
  }
  return out;
}

function mintermFormula(variables: string[], index: number): BoolFormula {
  const factors: BoolFormula[] = variables.map((name, j) => {
    const bit = (index >> j) & 1;
    return bit
      ? { kind: 'var', name }
      : { kind: 'not', body: { kind: 'var', name } };
  });
  return chainAnd(factors);
}

function maxtermFormula(variables: string[], index: number): BoolFormula {
  const terms: BoolFormula[] = variables.map((name, j) => {
    const bit = (index >> j) & 1;
    // Maxterm: variable appears complemented when its row has it set,
    // un-complemented when its row has it cleared. Inverse of minterm.
    return bit
      ? { kind: 'not', body: { kind: 'var', name } }
      : { kind: 'var', name };
  });
  return chainOr(terms);
}

function chainAnd(parts: BoolFormula[]): BoolFormula {
  if (parts.length === 0) return { kind: 'one' };
  let acc = parts[0]!;
  for (let i = 1; i < parts.length; i++) acc = { kind: 'and', left: acc, right: parts[i]! };
  return acc;
}

function chainOr(parts: BoolFormula[]): BoolFormula {
  if (parts.length === 0) return { kind: 'zero' };
  let acc = parts[0]!;
  for (let i = 1; i < parts.length; i++) acc = { kind: 'or', left: acc, right: parts[i]! };
  return acc;
}