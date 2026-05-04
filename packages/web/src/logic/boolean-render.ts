import type { BoolFormula } from './boolean-types';

// Two flavours of rendering: KaTeX for the main formula display, and
// a plain-Unicode form for short labels (K-map cell hover, simplifier
// trace lines, error messages). Both honour algebraic conventions —
// AND is juxtaposition, OR is +, complement is overline / postfix-prime.

// ---------- KaTeX (algebraic conventions) ----------

export function renderKatex(f: BoolFormula): string {
  return atIff(f);

  function atIff(g: BoolFormula): string {
    if (g.kind === 'iff') return `${atImp(g.left)} \\leftrightarrow ${atIff(g.right)}`;
    return atImp(g);
  }
  function atImp(g: BoolFormula): string {
    if (g.kind === 'imp') return `${atOr(g.left)} \\rightarrow ${atImp(g.right)}`;
    return atOr(g);
  }
  function atOr(g: BoolFormula): string {
    if (g.kind === 'or')  return `${atOr(g.left)} + ${atXor(g.right)}`;
    return atXor(g);
  }
  function atXor(g: BoolFormula): string {
    if (g.kind === 'xor') return `${atXor(g.left)} \\oplus ${atAnd(g.right)}`;
    return atAnd(g);
  }
  function atAnd(g: BoolFormula): string {
    // Render AND as juxtaposition when both operands are simple atoms;
    // use \cdot otherwise so the boundaries stay visible. This matches
    // how Boolean-algebra texts actually print expressions.
    if (g.kind === 'and') {
      const l = atAnd(g.left);
      const r = atUnary(g.right);
      const simpleLeft  = isSimple(g.left);
      const simpleRight = isSimple(g.right);
      return simpleLeft && simpleRight ? `${l}\\,${r}` : `${l} \\cdot ${r}`;
    }
    return atUnary(g);
  }
  function atUnary(g: BoolFormula): string {
    if (g.kind === 'not') {
      // Render the complement of a single atom or paren group as an
      // overline; otherwise wrap the body and add a postfix prime so
      // tall expressions don't blow the line.
      if (isSimple(g.body) || g.body.kind === 'and' || g.body.kind === 'or') {
        return `\\overline{${atIff(g.body)}}`;
      }
      return `\\left(${atIff(g.body)}\\right)'`;
    }
    return atAtom(g);
  }
  function atAtom(g: BoolFormula): string {
    switch (g.kind) {
      case 'zero': return '0';
      case 'one':  return '1';
      case 'var':  return g.name;
      default:     return `\\left(${atIff(g)}\\right)`;
    }
  }
}

function isSimple(g: BoolFormula): boolean {
  return g.kind === 'var' || g.kind === 'zero' || g.kind === 'one'
      || (g.kind === 'not' && (g.body.kind === 'var' || g.body.kind === 'zero' || g.body.kind === 'one'));
}

// ---------- Unicode (compact, label-friendly) ----------

export function renderUnicode(f: BoolFormula): string {
  return atIff(f);

  function atIff(g: BoolFormula): string {
    if (g.kind === 'iff') return `${atImp(g.left)} ↔ ${atIff(g.right)}`;
    return atImp(g);
  }
  function atImp(g: BoolFormula): string {
    if (g.kind === 'imp') return `${atOr(g.left)} → ${atImp(g.right)}`;
    return atOr(g);
  }
  function atOr(g: BoolFormula): string {
    if (g.kind === 'or')  return `${atOr(g.left)} + ${atXor(g.right)}`;
    return atXor(g);
  }
  function atXor(g: BoolFormula): string {
    if (g.kind === 'xor') return `${atXor(g.left)} ⊕ ${atAnd(g.right)}`;
    return atAnd(g);
  }
  function atAnd(g: BoolFormula): string {
    if (g.kind === 'and') {
      const l = atAnd(g.left);
      const r = atUnary(g.right);
      return isSimple(g.left) && isSimple(g.right) ? `${l}${r}` : `${l}·${r}`;
    }
    return atUnary(g);
  }
  function atUnary(g: BoolFormula): string {
    if (g.kind === 'not') {
      if (isSimple(g.body)) return `${atAtom(g.body)}′`;
      return `(${atIff(g.body)})′`;
    }
    return atAtom(g);
  }
  function atAtom(g: BoolFormula): string {
    switch (g.kind) {
      case 'zero': return '0';
      case 'one':  return '1';
      case 'var':  return g.name;
      default:     return `(${atIff(g)})`;
    }
  }
}