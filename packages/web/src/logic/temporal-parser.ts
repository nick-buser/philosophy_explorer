import type { TemporalFormula } from './temporal-types';

// Recursive-descent parser for LTL formulas.
//
// Grammar (lowest precedence first):
//   iff     := until   ( ('<->' | '↔') until )*    left-assoc
//   until   := impl    ( ('U' | '𝐔')   impl  )*    right-assoc
//   impl    := disj    ( ('->' | '→')  impl  )?    right-assoc
//   disj    := conj    ( ('|' | '∨')   conj  )*    left-assoc
//   conj    := unary   ( ('&' | '∧')   unary )*    left-assoc
//   unary   := ('X' | '◯' | '○' | 'F' | '◇' | 'G' | '□') unary
//            | ('!' | '~' | '¬') unary
//            | primary
//   primary := atom | '(' iff ')'
//   atom    := identifier  (but not the reserved letters X, F, G, U)
//
// The reserved single-letter operators (X, F, G, U) are recognised
// only when they are *not* the prefix of a longer identifier — e.g.
// `Xy` parses as the atom 'Xy', not 'X y'.

export type ParseError = { message: string; position: number };
export type ParseResult =
  | { ok: true;  formula: TemporalFormula }
  | { ok: false; error: ParseError };

export function parseTemporal(input: string): ParseResult {
  const p = new Parser(input);
  try {
    p.skipWs();
    if (p.atEnd()) {
      return { ok: false, error: { message: 'empty input', position: 0 } };
    }
    const formula = p.parseIff();
    p.skipWs();
    if (!p.atEnd()) {
      return { ok: false, error: { message: `unexpected '${p.peek()}'`, position: p.pos } };
    }
    return { ok: true, formula };
  } catch (e) {
    if (e instanceof ParserError) {
      return { ok: false, error: { message: e.message, position: e.pos } };
    }
    throw e;
  }
}

class ParserError extends Error {
  constructor(message: string, public pos: number) { super(message); }
}

class Parser {
  pos = 0;
  constructor(private src: string) {}

  atEnd() { return this.pos >= this.src.length; }
  peek() { return this.src[this.pos] ?? ''; }

  skipWs() {
    while (!this.atEnd() && /\s/.test(this.peek())) this.pos++;
  }

  // Match `lit` only if it isn't followed by an identifier character —
  // so the keyword 'X' won't consume the leading 'X' of 'Xs'.
  tryKeyword(lit: string): boolean {
    this.skipWs();
    if (!this.src.startsWith(lit, this.pos)) return false;
    const after = this.src[this.pos + lit.length];
    if (after !== undefined && /[A-Za-z0-9_]/.test(after)) return false;
    this.pos += lit.length;
    return true;
  }

  tryLit(lit: string): boolean {
    this.skipWs();
    if (this.src.startsWith(lit, this.pos)) {
      this.pos += lit.length;
      return true;
    }
    return false;
  }

  parseIff(): TemporalFormula {
    let left = this.parseUntil();
    while (this.tryLit('<->') || this.tryLit('↔')) {
      const right = this.parseUntil();
      left = { kind: 'iff', left, right };
    }
    return left;
  }

  parseUntil(): TemporalFormula {
    const left = this.parseImpl();
    if (this.tryKeyword('U') || this.tryLit('𝐔')) {
      const right = this.parseUntil();        // right-assoc
      return { kind: 'until', left, right };
    }
    return left;
  }

  parseImpl(): TemporalFormula {
    const left = this.parseDisj();
    if (this.tryLit('->') || this.tryLit('→')) {
      const right = this.parseImpl();
      return { kind: 'implies', left, right };
    }
    return left;
  }

  parseDisj(): TemporalFormula {
    let left = this.parseConj();
    while (this.tryLit('|') || this.tryLit('∨')) {
      const right = this.parseConj();
      left = { kind: 'or', left, right };
    }
    return left;
  }

  parseConj(): TemporalFormula {
    let left = this.parseUnary();
    while (this.tryLit('&') || this.tryLit('∧')) {
      const right = this.parseUnary();
      left = { kind: 'and', left, right };
    }
    return left;
  }

  parseUnary(): TemporalFormula {
    if (this.tryKeyword('X') || this.tryLit('◯') || this.tryLit('○')) {
      return { kind: 'next', body: this.parseUnary() };
    }
    if (this.tryKeyword('F') || this.tryLit('◇')) {
      return { kind: 'eventually', body: this.parseUnary() };
    }
    if (this.tryKeyword('G') || this.tryLit('□')) {
      return { kind: 'always', body: this.parseUnary() };
    }
    if (this.tryLit('!') || this.tryLit('~') || this.tryLit('¬')) {
      return { kind: 'not', body: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  parsePrimary(): TemporalFormula {
    this.skipWs();
    const ch = this.peek();
    if (ch === '(') {
      const open = this.pos;
      this.pos++;
      const inner = this.parseIff();
      this.skipWs();
      if (this.peek() !== ')') {
        throw new ParserError(`unclosed group opened at position ${open}`, this.pos);
      }
      this.pos++;
      return inner;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const start = this.pos;
      while (!this.atEnd() && /[A-Za-z0-9_]/.test(this.peek())) this.pos++;
      return { kind: 'atom', name: this.src.slice(start, this.pos) };
    }
    throw new ParserError(
      this.atEnd() ? 'unexpected end of input' : `unexpected character '${ch}'`,
      this.pos,
    );
  }
}
