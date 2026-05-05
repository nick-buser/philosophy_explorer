// Pretty-print an LTL formula. Same precedence scheme as kripke-render
// with the four temporal operators added at unary-precedence.

import type { TemporalFormula } from './temporal-types';

const PREC = {
  atom: 100,
  unary: 90,
  and: 80,
  or: 70,
  impl: 60,
  until: 55,   // U binds looser than → in our grammar so it sits below impl
  iff: 50,
} as const;

type Glyphs = {
  not: string;
  next: string;
  eventually: string;
  always: string;
  and: string;
  or: string;
  implies: string;
  iff: string;
  until: string;
  paren: (s: string) => string;
};

const UNICODE: Glyphs = {
  not:        '¬',
  next:       'X ',
  eventually: 'F ',
  always:     'G ',
  and:        '∧',
  or:         '∨',
  implies:    '→',
  iff:        '↔',
  until:      'U',
  paren:      s => `(${s})`,
};

const KATEX: Glyphs = {
  not:        '\\neg ',
  next:       '\\mathsf{X}\\,',
  eventually: '\\mathsf{F}\\,',
  always:     '\\mathsf{G}\\,',
  and:        '\\land',
  or:         '\\lor',
  implies:    '\\to',
  iff:        '\\leftrightarrow',
  until:      '\\,\\mathsf{U}\\,',
  paren:      s => `\\left(${s}\\right)`,
};

export function renderUnicodeT(node: TemporalFormula): string {
  return render(node, 0, UNICODE);
}

export function renderKatexT(node: TemporalFormula): string {
  return render(node, 0, KATEX);
}

function render(n: TemporalFormula, minPrec: number, g: Glyphs): string {
  const { s, prec } = inner(n, g);
  return prec < minPrec ? g.paren(s) : s;
}

function inner(n: TemporalFormula, g: Glyphs): { s: string; prec: number } {
  switch (n.kind) {
    case 'atom':
      return { s: n.name, prec: PREC.atom };
    case 'not':
      return { s: `${g.not}${render(n.body, PREC.unary, g)}`, prec: PREC.unary };
    case 'next':
      return { s: `${g.next}${render(n.body, PREC.unary, g)}`, prec: PREC.unary };
    case 'eventually':
      return { s: `${g.eventually}${render(n.body, PREC.unary, g)}`, prec: PREC.unary };
    case 'always':
      return { s: `${g.always}${render(n.body, PREC.unary, g)}`, prec: PREC.unary };
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
    case 'until':
      return {
        s: `${render(n.left, PREC.until + 1, g)}${g.until}${render(n.right, PREC.until + 1, g)}`,
        prec: PREC.until,
      };
  }
}
