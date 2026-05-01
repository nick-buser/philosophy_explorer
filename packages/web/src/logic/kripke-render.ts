import type { ModalFormula } from './kripke-types';

// Pretty-print a ModalFormula. Two output forms share the same
// precedence/parenthesization logic:
//   renderUnicode → Unicode glyphs (□ ◇ ∧ ∨ → ↔ ¬) for plain text
//   renderKatex   → TeX source (\Box \Diamond \land …) for KaTeX
//
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

type Glyphs = {
  not: string;
  box: string;
  dia: string;
  and: string;
  or: string;
  implies: string;
  iff: string;
  paren: (s: string) => string;
};

const UNICODE: Glyphs = {
  not:     '¬',
  box:     '□',
  dia:     '◇',
  and:     '∧',
  or:      '∨',
  implies: '→',
  iff:     '↔',
  paren:   s => `(${s})`,
};

const KATEX: Glyphs = {
  not:     '\\neg ',
  box:     '\\Box ',
  dia:     '\\Diamond ',
  and:     '\\land',
  or:      '\\lor',
  implies: '\\to',
  iff:     '\\leftrightarrow',
  paren:   s => `\\left(${s}\\right)`,
};

export function renderUnicode(node: ModalFormula): string {
  return render(node, 0, UNICODE);
}

export function renderKatex(node: ModalFormula): string {
  return render(node, 0, KATEX);
}

function render(n: ModalFormula, minPrec: number, g: Glyphs): string {
  const { s, prec } = inner(n, g);
  return prec < minPrec ? g.paren(s) : s;
}

function inner(n: ModalFormula, g: Glyphs): { s: string; prec: number } {
  switch (n.kind) {
    case 'atom':
      return { s: n.name, prec: PREC.atom };
    case 'not':
      return { s: `${g.not}${render(n.body, PREC.unary, g)}`, prec: PREC.unary };
    case 'box':
      return { s: `${g.box}${render(n.body, PREC.unary, g)}`, prec: PREC.unary };
    case 'dia':
      return { s: `${g.dia}${render(n.body, PREC.unary, g)}`, prec: PREC.unary };
    case 'and':
      return {
        s: `${render(n.left, PREC.and, g)} ${g.and} ${render(n.right, PREC.and + 1, g)}`,
        prec: PREC.and,
      };
    case 'or':
      return {
        s: `${render(n.left, PREC.or, g)} ${g.or} ${render(n.right, PREC.or + 1, g)}`,
        prec: PREC.or,
      };
    case 'implies':
      return {
        s: `${render(n.left, PREC.impl + 1, g)} ${g.implies} ${render(n.right, PREC.impl, g)}`,
        prec: PREC.impl,
      };
    case 'iff':
      return {
        s: `${render(n.left, PREC.iff, g)} ${g.iff} ${render(n.right, PREC.iff + 1, g)}`,
        prec: PREC.iff,
      };
  }
}
