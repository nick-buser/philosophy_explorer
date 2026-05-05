// Pretty-print an EpistemicFormula. Same precedence scaffolding as
// kripke-render, plus K_a / M_a as agent-indexed unary operators.

import type { EpistemicFormula } from './epistemic-types';

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
  and: string;
  or: string;
  implies: string;
  iff: string;
  know: (agent: string, body: string) => string;
  consider: (agent: string, body: string) => string;
  paren: (s: string) => string;
};

const UNICODE: Glyphs = {
  not:     '¬',
  and:     '∧',
  or:      '∨',
  implies: '→',
  iff:     '↔',
  know:    (a, b) => `K_${a} ${b}`,
  consider:(a, b) => `M_${a} ${b}`,
  paren:   s => `(${s})`,
};

const KATEX: Glyphs = {
  not:     '\\neg ',
  and:     '\\land',
  or:      '\\lor',
  implies: '\\to',
  iff:     '\\leftrightarrow',
  know:    (a, b) => `K_{${a}}\\,${b}`,
  consider:(a, b) => `\\langle ${a}\\rangle\\,${b}`,
  paren:   s => `\\left(${s}\\right)`,
};

export function renderUnicodeE(node: EpistemicFormula): string {
  return render(node, 0, UNICODE);
}

export function renderKatexE(node: EpistemicFormula): string {
  return render(node, 0, KATEX);
}

function render(n: EpistemicFormula, minPrec: number, g: Glyphs): string {
  const { s, prec } = inner(n, g);
  return prec < minPrec ? g.paren(s) : s;
}

function inner(n: EpistemicFormula, g: Glyphs): { s: string; prec: number } {
  switch (n.kind) {
    case 'atom':
      return { s: n.name, prec: PREC.atom };
    case 'not':
      return { s: `${g.not}${render(n.body, PREC.unary, g)}`, prec: PREC.unary };
    case 'know':
      return { s: g.know(n.agent, render(n.body, PREC.unary, g)), prec: PREC.unary };
    case 'consider':
      return { s: g.consider(n.agent, render(n.body, PREC.unary, g)), prec: PREC.unary };
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
