import type { FolFormula, FolTerm } from './fol-types';

// Pretty-print a FolFormula. Two outputs share the precedence and
// parenthesization logic:
//   renderUnicode → Unicode glyphs (∀ ∃ ¬ ∧ ∨ → ↔) for plain text
//   renderKatex   → TeX source (\forall \exists \neg …) for KaTeX
//
// Precedence (higher binds tighter):
//   atom / parens ... 100
//   unary (¬)     ...  90
//   ∧             ...  80
//   ∨             ...  70
//   →             ...  60   right-assoc
//   ↔             ...  50   left-assoc
//   quantifier    ...   0   wide-scope (parenthesize in any binary slot)
//
// Quantifier scope convention: ∀x.φ and ∃x.φ extend rightward to the
// edge of the enclosing context. So `∀x. P(x) → Q(x)` parses (and is
// re-rendered) as ∀x.(P(x)→Q(x)). The renderer threads a `rightOpen`
// flag through every recursion: it's true when nothing follows the
// current sub-formula in the enclosing context, false otherwise. A
// quantifier needs parens iff `rightOpen` is false — when the right
// edge is open, the wide-scope absorption is benign and the parens
// are noise. So `P(a) → ∀x. Q(x)` renders without parens, but
// `(∀x. P(x)) → Q(a)` and `¬(∀x. P(x)) ∨ Q` both keep them.

const PREC = {
  atom:  100,
  unary:  90,
  and:    80,
  or:     70,
  impl:   60,
  iff:    50,
  quant:   0,
} as const;

type Glyphs = {
  not:     string;
  forAll:  (v: string) => string;
  exists:  (v: string) => string;
  and:     string;
  or:      string;
  implies: string;
  iff:     string;
  eq:      string;
  neq:     string;
  top:     string;
  bot:     string;
  paren:   (s: string) => string;
  applyP:  (name: string, args: string[]) => string;   // P(t1,...,tn) — predicate
  applyT:  (name: string, args: string[]) => string;   // f(t1,...,tn) — function
};

const UNICODE: Glyphs = {
  not:     '¬',
  forAll:  v => `∀${v}. `,
  exists:  v => `∃${v}. `,
  and:     '∧',
  or:      '∨',
  implies: '→',
  iff:     '↔',
  eq:      '=',
  neq:     '≠',
  top:     '⊤',
  bot:     '⊥',
  paren:   s => `(${s})`,
  applyP:  (n, args) => args.length === 0 ? n : `${n}(${args.join(', ')})`,
  applyT:  (n, args) => args.length === 0 ? n : `${n}(${args.join(', ')})`,
};

const KATEX: Glyphs = {
  not:     '\\neg ',
  forAll:  v => `\\forall ${v}.\\, `,
  exists:  v => `\\exists ${v}.\\, `,
  and:     '\\land',
  or:      '\\lor',
  implies: '\\to',
  iff:     '\\leftrightarrow',
  eq:      '=',
  neq:     '\\neq',
  top:     '\\top',
  bot:     '\\bot',
  paren:   s => `\\left(${s}\\right)`,
  applyP:  (n, args) => {
    // Multi-letter predicate names render in upright text — single
    // letters keep math-italic so `P(x)` stays the standard look.
    const head = n.length === 1 ? n : `\\mathrm{${n}}`;
    return args.length === 0 ? head : `${head}(${args.join(', ')})`;
  },
  applyT:  (n, args) => {
    const head = n.length === 1 ? n : `\\mathrm{${n}}`;
    return args.length === 0 ? head : `${head}(${args.join(', ')})`;
  },
};

export function renderUnicode(node: FolFormula): string {
  return renderFormula(node, 0, true, UNICODE);
}

export function renderKatex(node: FolFormula): string {
  return renderFormula(node, 0, true, KATEX);
}

export function renderTermUnicode(t: FolTerm): string {
  return renderTerm(t, UNICODE);
}

function renderFormula(n: FolFormula, minPrec: number, rightOpen: boolean, g: Glyphs): string {
  const { s, prec } = inner(n, rightOpen, g);
  return prec < minPrec ? g.paren(s) : s;
}

function inner(n: FolFormula, rightOpen: boolean, g: Glyphs): { s: string; prec: number } {
  switch (n.kind) {
    case 'top': return { s: g.top, prec: PREC.atom };
    case 'bot': return { s: g.bot, prec: PREC.atom };
    case 'pred': {
      const args = n.args.map(t => renderTerm(t, g));
      return { s: g.applyP(n.name, args), prec: PREC.atom };
    }
    case 'eq': {
      const l = renderTerm(n.left,  g);
      const r = renderTerm(n.right, g);
      return { s: `${l} ${g.eq} ${r}`, prec: PREC.atom };
    }
    case 'not': {
      // `¬(t = u)` collapses to `t ≠ u` — the standard mathematical
      // shorthand. Recognising this here keeps the AST canonical
      // (parser produces `not(eq)` for `!=`/`≠`).
      if (n.body.kind === 'eq') {
        const l = renderTerm(n.body.left,  g);
        const r = renderTerm(n.body.right, g);
        return { s: `${l} ${g.neq} ${r}`, prec: PREC.atom };
      }
      // Negation propagates `rightOpen` straight through — the body
      // is the rightmost thing under the negation in the enclosing
      // context.
      const bodyStr = renderFormula(n.body, PREC.unary, rightOpen, g);
      return { s: `${g.not}${bodyStr}`, prec: PREC.unary };
    }
    case 'and':
      return {
        s: `${renderFormula(n.left, PREC.and, false, g)} ${g.and} ${renderFormula(n.right, PREC.and + 1, rightOpen, g)}`,
        prec: PREC.and,
      };
    case 'or':
      return {
        s: `${renderFormula(n.left, PREC.or, false, g)} ${g.or} ${renderFormula(n.right, PREC.or + 1, rightOpen, g)}`,
        prec: PREC.or,
      };
    case 'implies':
      return {
        s: `${renderFormula(n.left, PREC.impl + 1, false, g)} ${g.implies} ${renderFormula(n.right, PREC.impl, rightOpen, g)}`,
        prec: PREC.impl,
      };
    case 'iff':
      return {
        s: `${renderFormula(n.left, PREC.iff, false, g)} ${g.iff} ${renderFormula(n.right, PREC.iff + 1, rightOpen, g)}`,
        prec: PREC.iff,
      };
    case 'forall':
      // When the right edge is open, a quantifier doesn't need parens
      // — its wide-scope absorption is benign. Otherwise, it has to
      // wrap to keep the AST round-trippable.
      return {
        s: `${g.forAll(n.variable)}${renderFormula(n.body, 0, rightOpen, g)}`,
        prec: rightOpen ? PREC.atom : PREC.quant,
      };
    case 'exists':
      return {
        s: `${g.exists(n.variable)}${renderFormula(n.body, 0, rightOpen, g)}`,
        prec: rightOpen ? PREC.atom : PREC.quant,
      };
  }
}

function renderTerm(t: FolTerm, g: Glyphs): string {
  switch (t.kind) {
    case 'var':
    case 'const':
      return g.applyT(t.name, []);
    case 'fn':
      return g.applyT(t.name, t.args.map(a => renderTerm(a, g)));
  }
}
