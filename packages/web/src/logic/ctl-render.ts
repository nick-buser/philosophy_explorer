// Pretty-print a CTL formula. Same precedence scheme as the modal /
// LTL renderers; the eight CTL combined-operators sit at unary
// precedence; the bracketed Until forms wrap their operands.

import type { CtlFormula } from './ctl-types';

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
  ax: string; ex: string;
  af: string; ef: string;
  ag: string; eg: string;
  au: (l: string, r: string) => string;
  eu: (l: string, r: string) => string;
  and: string;
  or: string;
  implies: string;
  iff: string;
  paren: (s: string) => string;
};

const UNICODE: Glyphs = {
  not:     '¬',
  ax:      'AX ',
  ex:      'EX ',
  af:      'AF ',
  ef:      'EF ',
  ag:      'AG ',
  eg:      'EG ',
  au:      (l, r) => `A[${l} U ${r}]`,
  eu:      (l, r) => `E[${l} U ${r}]`,
  and:     '∧',
  or:      '∨',
  implies: '→',
  iff:     '↔',
  paren:   s => `(${s})`,
};

const KATEX: Glyphs = {
  not:     '\\neg ',
  ax:      '\\mathsf{AX}\\,',
  ex:      '\\mathsf{EX}\\,',
  af:      '\\mathsf{AF}\\,',
  ef:      '\\mathsf{EF}\\,',
  ag:      '\\mathsf{AG}\\,',
  eg:      '\\mathsf{EG}\\,',
  au:      (l, r) => `\\mathsf{A}[${l}\\,\\mathsf{U}\\,${r}]`,
  eu:      (l, r) => `\\mathsf{E}[${l}\\,\\mathsf{U}\\,${r}]`,
  and:     '\\land',
  or:      '\\lor',
  implies: '\\to',
  iff:     '\\leftrightarrow',
  paren:   s => `\\left(${s}\\right)`,
};

export function renderUnicodeCtl(node: CtlFormula): string {
  return render(node, 0, UNICODE);
}

export function renderKatexCtl(node: CtlFormula): string {
  return render(node, 0, KATEX);
}

function render(n: CtlFormula, minPrec: number, g: Glyphs): string {
  const { s, prec } = inner(n, g);
  return prec < minPrec ? g.paren(s) : s;
}

function inner(n: CtlFormula, g: Glyphs): { s: string; prec: number } {
  const ub = (b: CtlFormula) => render(b, PREC.unary, g);
  switch (n.kind) {
    case 'atom':
      return { s: n.name, prec: PREC.atom };
    case 'not':
      return { s: `${g.not}${ub(n.body)}`, prec: PREC.unary };
    case 'AX': return { s: `${g.ax}${ub(n.body)}`, prec: PREC.unary };
    case 'EX': return { s: `${g.ex}${ub(n.body)}`, prec: PREC.unary };
    case 'AF': return { s: `${g.af}${ub(n.body)}`, prec: PREC.unary };
    case 'EF': return { s: `${g.ef}${ub(n.body)}`, prec: PREC.unary };
    case 'AG': return { s: `${g.ag}${ub(n.body)}`, prec: PREC.unary };
    case 'EG': return { s: `${g.eg}${ub(n.body)}`, prec: PREC.unary };
    case 'AU':
      return { s: g.au(render(n.left, 0, g), render(n.right, 0, g)), prec: PREC.unary };
    case 'EU':
      return { s: g.eu(render(n.left, 0, g), render(n.right, 0, g)), prec: PREC.unary };
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
