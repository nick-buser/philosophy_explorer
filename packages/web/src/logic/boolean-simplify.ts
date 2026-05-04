import type { BoolFormula } from './boolean-types';
import { canonicalKey, structuralEq } from './boolean-types';

// Rule-based Boolean-algebra simplifier with a step trace.
//
// Each step records the rule name, the subterm replaced, and the new
// subterm. The simplifier picks the first applicable rule under a
// fixed traversal order so the trace is deterministic and stable
// across re-renders. Step cap of 64 to keep the trace UI readable;
// real-world Boolean expressions converge much faster.
//
// The rule set is the standard Boolean-algebra textbook list. It is
// not a complete decision procedure (no Quine–McCluskey, no SAT) —
// truth-table equivalence is the source of truth for "is this a
// tautology"; the simplifier exists to *show the work* the way a
// student would on paper.

export type SimplifyRule =
  | 'imp-elim'        // p → q ⇒ ¬p + q
  | 'iff-elim'        // p ↔ q ⇒ p·q + ¬p·¬q
  | 'xor-elim'        // p ⊕ q ⇒ p·¬q + ¬p·q
  | 'double-negation' // ¬¬p ⇒ p
  | 'demorgan-and'    // ¬(p·q) ⇒ ¬p + ¬q
  | 'demorgan-or'     // ¬(p+q) ⇒ ¬p · ¬q
  | 'and-identity'    // p·1 ⇒ p (also 1·p)
  | 'or-identity'     // p+0 ⇒ p
  | 'and-annihilator' // p·0 ⇒ 0
  | 'or-annihilator'  // p+1 ⇒ 1
  | 'and-idempotent'  // p·p ⇒ p
  | 'or-idempotent'   // p+p ⇒ p
  | 'and-complement'  // p·¬p ⇒ 0
  | 'or-complement'   // p+¬p ⇒ 1
  | 'absorption-or'   // p + p·q ⇒ p
  | 'absorption-and'  // p · (p+q) ⇒ p
  | 'not-zero'        // ¬0 ⇒ 1
  | 'not-one';        // ¬1 ⇒ 0

export type SimplifyStep = {
  rule: SimplifyRule;
  before: BoolFormula;
  after: BoolFormula;
};

export type SimplifyResult = {
  initial: BoolFormula;
  final: BoolFormula;
  steps: SimplifyStep[];
};

export function simplify(formula: BoolFormula, stepCap = 64): SimplifyResult {
  let current = formula;
  const steps: SimplifyStep[] = [];
  for (let i = 0; i < stepCap; i++) {
    const next = stepOnce(current);
    if (!next) break;
    steps.push({ rule: next.rule, before: current, after: next.formula });
    current = next.formula;
  }
  return { initial: formula, final: current, steps };
}

// One rewrite step. Walks the tree in pre-order and returns the first
// applicable rule. Returns null at a fixed point.
function stepOnce(f: BoolFormula): { rule: SimplifyRule; formula: BoolFormula } | null {
  const local = applyLocalRule(f);
  if (local) return { rule: local.rule, formula: local.formula };

  switch (f.kind) {
    case 'zero': case 'one': case 'var':
      return null;
    case 'not': {
      const inner = stepOnce(f.body);
      if (!inner) return null;
      return { rule: inner.rule, formula: { kind: 'not', body: inner.formula } };
    }
    case 'and': case 'or': case 'xor': case 'imp': case 'iff': {
      const left = stepOnce(f.left);
      if (left) return { rule: left.rule, formula: { kind: f.kind, left: left.formula, right: f.right } };
      const right = stepOnce(f.right);
      if (right) return { rule: right.rule, formula: { kind: f.kind, left: f.left, right: right.formula } };
      return null;
    }
  }
}

// Try to fire one rule at the root. Order matters — we prefer
// connective-elimination so subsequent rules see only AND/OR/NOT,
// then identity/annihilator/idempotence/complement, then absorption
// and De Morgan's, finally constant folding.
function applyLocalRule(f: BoolFormula): { rule: SimplifyRule; formula: BoolFormula } | null {
  // Connective elimination — surface AND/OR/NOT before the algebra
  // simplifications run on the result.
  if (f.kind === 'imp') {
    return {
      rule: 'imp-elim',
      formula: { kind: 'or', left: { kind: 'not', body: f.left }, right: f.right },
    };
  }
  if (f.kind === 'iff') {
    return {
      rule: 'iff-elim',
      formula: {
        kind: 'or',
        left:  { kind: 'and', left: f.left, right: f.right },
        right: { kind: 'and', left: { kind: 'not', body: f.left }, right: { kind: 'not', body: f.right } },
      },
    };
  }
  if (f.kind === 'xor') {
    return {
      rule: 'xor-elim',
      formula: {
        kind: 'or',
        left:  { kind: 'and', left: f.left, right: { kind: 'not', body: f.right } },
        right: { kind: 'and', left: { kind: 'not', body: f.left }, right: f.right },
      },
    };
  }

  // Negation pushes / constant folds.
  if (f.kind === 'not') {
    if (f.body.kind === 'zero') return { rule: 'not-zero', formula: { kind: 'one' } };
    if (f.body.kind === 'one')  return { rule: 'not-one',  formula: { kind: 'zero' } };
    if (f.body.kind === 'not')  return { rule: 'double-negation', formula: f.body.body };
    if (f.body.kind === 'and') {
      return {
        rule: 'demorgan-and',
        formula: {
          kind: 'or',
          left:  { kind: 'not', body: f.body.left },
          right: { kind: 'not', body: f.body.right },
        },
      };
    }
    if (f.body.kind === 'or') {
      return {
        rule: 'demorgan-or',
        formula: {
          kind: 'and',
          left:  { kind: 'not', body: f.body.left },
          right: { kind: 'not', body: f.body.right },
        },
      };
    }
    return null;
  }

  if (f.kind === 'and') {
    // Identity: p·1 ⇒ p (either side).
    if (f.left.kind === 'one')  return { rule: 'and-identity', formula: f.right };
    if (f.right.kind === 'one') return { rule: 'and-identity', formula: f.left };
    // Annihilator: p·0 ⇒ 0.
    if (f.left.kind === 'zero' || f.right.kind === 'zero') {
      return { rule: 'and-annihilator', formula: { kind: 'zero' } };
    }
    // Idempotence: p·p ⇒ p.
    if (structuralEq(f.left, f.right)) {
      return { rule: 'and-idempotent', formula: f.left };
    }
    // Complement: p·¬p ⇒ 0.
    if (f.right.kind === 'not' && structuralEq(f.left, f.right.body)) {
      return { rule: 'and-complement', formula: { kind: 'zero' } };
    }
    if (f.left.kind === 'not' && structuralEq(f.left.body, f.right)) {
      return { rule: 'and-complement', formula: { kind: 'zero' } };
    }
    // Absorption: p · (p + q) ⇒ p.
    if (f.right.kind === 'or' && (structuralEq(f.left, f.right.left) || structuralEq(f.left, f.right.right))) {
      return { rule: 'absorption-and', formula: f.left };
    }
    if (f.left.kind === 'or' && (structuralEq(f.right, f.left.left) || structuralEq(f.right, f.left.right))) {
      return { rule: 'absorption-and', formula: f.right };
    }
    return null;
  }

  if (f.kind === 'or') {
    // Identity: p+0 ⇒ p.
    if (f.left.kind === 'zero')  return { rule: 'or-identity', formula: f.right };
    if (f.right.kind === 'zero') return { rule: 'or-identity', formula: f.left };
    // Annihilator: p+1 ⇒ 1.
    if (f.left.kind === 'one' || f.right.kind === 'one') {
      return { rule: 'or-annihilator', formula: { kind: 'one' } };
    }
    // Idempotence: p+p ⇒ p.
    if (structuralEq(f.left, f.right)) {
      return { rule: 'or-idempotent', formula: f.left };
    }
    // Complement: p+¬p ⇒ 1.
    if (f.right.kind === 'not' && structuralEq(f.left, f.right.body)) {
      return { rule: 'or-complement', formula: { kind: 'one' } };
    }
    if (f.left.kind === 'not' && structuralEq(f.left.body, f.right)) {
      return { rule: 'or-complement', formula: { kind: 'one' } };
    }
    // Absorption: p + p·q ⇒ p.
    if (f.right.kind === 'and' && (structuralEq(f.left, f.right.left) || structuralEq(f.left, f.right.right))) {
      return { rule: 'absorption-or', formula: f.left };
    }
    if (f.left.kind === 'and' && (structuralEq(f.right, f.left.left) || structuralEq(f.right, f.left.right))) {
      return { rule: 'absorption-or', formula: f.right };
    }
    return null;
  }

  return null;
}

export const RULE_LABELS: Record<SimplifyRule, string> = {
  'imp-elim':         'p → q  =  ¬p + q',
  'iff-elim':         'p ↔ q  =  p·q + ¬p·¬q',
  'xor-elim':         'p ⊕ q  =  p·¬q + ¬p·q',
  'double-negation':  '¬¬p  =  p',
  'demorgan-and':     '¬(p·q)  =  ¬p + ¬q',
  'demorgan-or':      '¬(p+q)  =  ¬p · ¬q',
  'and-identity':     'p · 1  =  p',
  'or-identity':      'p + 0  =  p',
  'and-annihilator':  'p · 0  =  0',
  'or-annihilator':   'p + 1  =  1',
  'and-idempotent':   'p · p  =  p',
  'or-idempotent':    'p + p  =  p',
  'and-complement':   'p · ¬p  =  0',
  'or-complement':    'p + ¬p  =  1',
  'absorption-or':    'p + p·q  =  p',
  'absorption-and':   'p · (p+q)  =  p',
  'not-zero':         '¬0  =  1',
  'not-one':          '¬1  =  0',
};

// Used by tests to assert convergence to constants for tautologies and
// contradictions. Quietly silences canonical-key for callers that just
// want a string.
export function finalKey(result: SimplifyResult): string {
  return canonicalKey(result.final);
}