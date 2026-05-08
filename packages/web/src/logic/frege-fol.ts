import type { FregeContent, FregeFormula } from './frege-types';

// Translate a Frege Begriffsschrift formula to a linear FOL/HOL string
// in either Unicode (for plain text) or KaTeX (for the FOL panel in
// the Lab). Mirrors the precedence/parenthesization machinery in
// `fol-render.ts` but kept separate because the Frege fragment differs
// in two ways:
//
//   1. Identity-of-content (`A ≡ B`) is its own connective. We render
//      it as `\equiv` rather than collapsing it to `\leftrightarrow`,
//      so the Frege side of the panel matches the Begriffsschrift's
//      own typographic distinction.
//   2. The bound variable's *sort* (individual vs. predicate) is
//      preserved on quantifiers; the rendered formula uses the same
//      `\forall` / `\exists` glyphs in both cases — we let the
//      uppercase variable letter carry the higher-order signal — but
//      the `order` chip in the Lab UI surfaces propositional /
//      first-order / higher-order separately.
//
// Precedence (higher binds tighter):
//
//   atom / parens ... 100
//   unary (¬)     ...  90
//   →             ...  60   right-assoc
//   ≡             ...  50   right-assoc, lower than →
//   quantifier    ...   0   wide-scope (parenthesize in any binary slot)

const PREC = {
  atom:  100,
  unary:  90,
  impl:   60,
  iden:   50,
  quant:   0,
} as const;

type Glyphs = {
  not:     string;
  forAll:  (v: string) => string;
  exists:  (v: string) => string;
  implies: string;
  iden:    string;
  paren:   (s: string) => string;
  applyP:  (name: string, args: string[]) => string;
};

const UNICODE: Glyphs = {
  not:     '¬',
  forAll:  v => `∀${v}. `,
  exists:  v => `∃${v}. `,
  implies: '→',
  iden:    '≡',
  paren:   s => `(${s})`,
  applyP:  (n, args) => args.length === 0 ? n : `${n}(${args.join(', ')})`,
};

const KATEX: Glyphs = {
  not:     '\\neg ',
  forAll:  v => `\\forall ${v}.\\, `,
  exists:  v => `\\exists ${v}.\\, `,
  implies: '\\to',
  iden:    '\\equiv',
  paren:   s => `(${s})`,
  applyP:  (n, args) => args.length === 0 ? n : `${n}(${args.join(', ')})`,
};

// ---------- Public entrypoints ----------

export function fregeToUnicode(formula: FregeFormula): string {
  return formatFormula(formula, UNICODE);
}

export function fregeToKatex(formula: FregeFormula): string {
  return formatFormula(formula, KATEX);
}

// ---------- Implementation ----------

function formatFormula(formula: FregeFormula, g: Glyphs): string {
  const inner = renderContent(formula.body, g, 0, true);
  if (formula.kind === 'judgment') {
    // The judgment-stroke ⊢ goes outside the content, matching the way
    // `frege-types.ts` keeps it as a wrapper rather than a connective.
    const turnstile = g === KATEX ? '\\vdash\\, ' : '⊢ ';
    return `${turnstile}${inner}`;
  }
  return inner;
}

// `parentPrec` is the binding strength of the surrounding context; if
// the current node binds *less* tightly than the parent, parentheses
// are needed. `rightOpen` is true when nothing follows the current
// sub-formula in the enclosing context — wide-scope quantifiers can
// then drop their otherwise-required parens.
function renderContent(
  c: FregeContent,
  g: Glyphs,
  parentPrec: number,
  rightOpen: boolean,
): string {
  switch (c.kind) {
    case 'atom':
      return g.applyP(c.name, c.args);

    case 'not': {
      const inner = renderContent(c.body, g, PREC.unary, rightOpen);
      return `${g.not}${inner}`;
    }

    case 'cond': {
      // Right-assoc: the right slot keeps the parent's rightOpen state
      // (it's still on the open right edge); the left slot must be
      // bracketed when its content is also a conditional.
      const left  = renderContent(c.antecedent, g, PREC.impl + 1, false);
      const right = renderContent(c.consequent, g, PREC.impl,     rightOpen);
      const out   = `${left} ${g.implies} ${right}`;
      return PREC.impl < parentPrec ? g.paren(out) : out;
    }

    case 'iden': {
      // Right-assoc; lower than ->.
      const left  = renderContent(c.left,  g, PREC.iden + 1, false);
      const right = renderContent(c.right, g, PREC.iden,     rightOpen);
      const out   = `${left} ${g.iden} ${right}`;
      return PREC.iden < parentPrec ? g.paren(out) : out;
    }

    case 'forall':
    case 'exists': {
      const head = c.kind === 'forall' ? g.forAll(c.variable) : g.exists(c.variable);
      const body = renderContent(c.body, g, PREC.quant, rightOpen);
      const out  = `${head}${body}`;
      // Wide-scope: only paren when the parent expected something
      // tighter AND there's something following us on the right.
      return rightOpen ? out : g.paren(out);
    }
  }
}
