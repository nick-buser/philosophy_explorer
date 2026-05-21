import type { Koti, Proposition, Reading, TruthValue } from './catuskoti-types';
import { FOUR_KOTIS, TRUTH_VALUES, kotiByNumber } from './catuskoti-types';

// The catuṣkoṭi evaluator.
//
// `evaluateCatuskoti` is total and structural — no proof search. The
// input fixes the proposition's FDE value v(A) to the selected koṭi's
// value set; the engine then evaluates each of the four corner-
// formulas under v using the First Degree Entailment connective
// clauses, and reads the verdict off the reading.
//
// An FDE value is a *subset* of {true, false}, represented as a
// TruthValue[] in TRUTH_VALUES order.

// ---------- FDE connectives ----------

function has(v: readonly TruthValue[], tv: TruthValue): boolean {
  return v.includes(tv);
}

// Normalise an arbitrary value array into canonical TRUTH_VALUES order.
function canon(v: readonly TruthValue[]): TruthValue[] {
  return TRUTH_VALUES.filter(tv => v.includes(tv));
}

// ¬X — truth and falsity swap.
export function fdeNot(v: readonly TruthValue[]): TruthValue[] {
  const out: TruthValue[] = [];
  if (has(v, 'false')) out.push('true');
  if (has(v, 'true')) out.push('false');
  return canon(out);
}

// X ∧ Y — true iff both true; false iff either false.
export function fdeAnd(a: readonly TruthValue[], b: readonly TruthValue[]): TruthValue[] {
  const out: TruthValue[] = [];
  if (has(a, 'true') && has(b, 'true')) out.push('true');
  if (has(a, 'false') || has(b, 'false')) out.push('false');
  return canon(out);
}

// X ∨ Y — true iff either true; false iff both false.
export function fdeOr(a: readonly TruthValue[], b: readonly TruthValue[]): TruthValue[] {
  const out: TruthValue[] = [];
  if (has(a, 'true') || has(b, 'true')) out.push('true');
  if (has(a, 'false') && has(b, 'false')) out.push('false');
  return canon(out);
}

// ---------- Evaluation ----------

export type Verdict = 'affirmed' | 'rejected';

// One of the four corner-formulas, evaluated under v(A).
export type CornerEval = {
  koti: Koti;
  // The FDE value of this corner's *formula* under the valuation —
  // distinct from `koti.values`, which is the corner as a position.
  value: TruthValue[];
  // Designated (assertible) iff `true` is in the formula's value.
  designated: boolean;
};

export type Evaluation = {
  // The koṭi the input places the proposition at.
  koti: Koti;
  reading: Reading;
  // affirming → the koṭi is affirmed; prasanga → it (and all) rejected.
  verdict: Verdict;
  // v(A) — the proposition's FDE value, the selected koṭi's value set.
  propositionValue: TruthValue[];
  // The four corner-formulas — A, ¬A, A∧¬A, ¬(A∨¬A) — each evaluated
  // under v(A), in koṭi order.
  corners: CornerEval[];
};

// Evaluate the four corner-formulas under v(A) = the selected koṭi's
// value set. The formulas are fixed: A, ¬A, A∧¬A, ¬(A∨¬A).
export function evaluateCorners(vA: readonly TruthValue[]): CornerEval[] {
  const notA = fdeNot(vA);
  const formulaValue: Record<number, TruthValue[]> = {
    1: canon(vA),
    2: notA,
    3: fdeAnd(vA, notA),
    4: fdeNot(fdeOr(vA, notA)),
  };
  return FOUR_KOTIS.map(koti => {
    const value = formulaValue[koti.n]!;
    return { koti, value, designated: has(value, 'true') };
  });
}

export function evaluateCatuskoti(p: Proposition): Evaluation {
  const koti = kotiByNumber(p.koti);
  const propositionValue = canon(koti.values);
  return {
    koti,
    reading: p.reading,
    verdict: p.reading === 'affirming' ? 'affirmed' : 'rejected',
    propositionValue,
    corners: evaluateCorners(propositionValue),
  };
}
