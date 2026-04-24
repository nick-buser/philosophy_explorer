import type { ModalFormula } from './kripke-types';

// Pretty-print a ModalFormula to Unicode, with minimal parenthesization.
// Precedence scale (higher binds tighter):
//   atom / parens ... 100
//   unary (¬ □ ◇)  ...  90
//   ∧              ...  80
//   ∨              ...  70
//   →              ...  60   right-associative
//   ↔              ...  50   left-associative

const PREC = {
  atom: 100,
  unary: 90,
  and: 80,
  or: 70,
  impl: 60,
  iff: 50,
} as const;

export function renderUnicode(node: ModalFormula): string {
  return render(node, 0);
}

function render(n: ModalFormula, minPrec: number): string {
  const { s, prec } = inner(n);
  return prec < minPrec ? `(${s})` : s;
}

function inner(n: ModalFormula): { s: string; prec: number } {
  switch (n.kind) {
    case 'atom':
      return { s: n.name, prec: PREC.atom };
    case 'not':
      return { s: `¬${render(n.body, PREC.unary)}`, prec: PREC.unary };
    case 'box':
      return { s: `□${render(n.body, PREC.unary)}`, prec: PREC.unary };
    case 'dia':
      return { s: `◇${render(n.body, PREC.unary)}`, prec: PREC.unary };
    case 'and':
      return {
        s: `${render(n.left, PREC.and)} ∧ ${render(n.right, PREC.and + 1)}`,
        prec: PREC.and,
      };
    case 'or':
      return {
        s: `${render(n.left, PREC.or)} ∨ ${render(n.right, PREC.or + 1)}`,
        prec: PREC.or,
      };
    case 'implies':
      return {
        s: `${render(n.left, PREC.impl + 1)} → ${render(n.right, PREC.impl)}`,
        prec: PREC.impl,
      };
    case 'iff':
      return {
        s: `${render(n.left, PREC.iff)} ↔ ${render(n.right, PREC.iff + 1)}`,
        prec: PREC.iff,
      };
  }
}
