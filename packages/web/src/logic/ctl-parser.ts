import type { CtlFormula } from './ctl-types';

// Recursive-descent parser for CTL.
//
// Grammar:
//   iff     := impl   ( ('<->' | '↔') impl )*    left-assoc
//   impl    := disj   ( ('->'  | '→') impl  )?   right-assoc
//   disj    := conj   ( ('|'   | '∨') conj  )*   left-assoc
//   conj    := unary  ( ('&'   | '∧') unary )*   left-assoc
//   unary   := pathTemp | ('!' | '~' | '¬') unary | primary
//   pathTemp:= ('AX' | 'EX' | 'AF' | 'EF' | 'AG' | 'EG') unary
//            | 'A[' iff 'U' iff ']'
//            | 'E[' iff 'U' iff ']'
//   primary := atom | '(' iff ')'
//   atom    := identifier
//
// CTL's combined-operators (AX/EX/etc.) live at unary-precedence;
// A[…U…] and E[…U…] are bracketed forms.
//
// One subtlety: bare `A` and `E` at unary position are *not* valid CTL
// — every path quantifier must pair with a temporal operator. The
// parser enforces that by only accepting the listed two-letter prefixes
// or bracketed-U forms.

export type ParseError = { message: string; position: number };
export type ParseResult =
  | { ok: true;  formula: CtlFormula }
  | { ok: false; error: ParseError };

export function parseCtl(input: string): ParseResult {
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

const PATH_TEMP_KEYWORDS = ['AX', 'EX', 'AF', 'EF', 'AG', 'EG'] as const;
type PathTempKey = typeof PATH_TEMP_KEYWORDS[number];

class Parser {
  pos = 0;
  constructor(private src: string) {}

  atEnd() { return this.pos >= this.src.length; }
  peek() { return this.src[this.pos] ?? ''; }

  skipWs() {
    while (!this.atEnd() && /\s/.test(this.peek())) this.pos++;
  }

  // Match `lit` only when it isn't followed by an identifier character.
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

  parseIff(): CtlFormula {
    let left = this.parseImpl();
    while (this.tryLit('<->') || this.tryLit('↔')) {
      const right = this.parseImpl();
      left = { kind: 'iff', left, right };
    }
    return left;
  }

  parseImpl(): CtlFormula {
    const left = this.parseDisj();
    if (this.tryLit('->') || this.tryLit('→')) {
      const right = this.parseImpl();
      return { kind: 'implies', left, right };
    }
    return left;
  }

  parseDisj(): CtlFormula {
    let left = this.parseConj();
    while (this.tryLit('|') || this.tryLit('∨')) {
      const right = this.parseConj();
      left = { kind: 'or', left, right };
    }
    return left;
  }

  parseConj(): CtlFormula {
    let left = this.parseUnary();
    while (this.tryLit('&') || this.tryLit('∧')) {
      const right = this.parseUnary();
      left = { kind: 'and', left, right };
    }
    return left;
  }

  parseUnary(): CtlFormula {
    // Two-letter path/temporal keywords — try longest-first so
    // 'AX' wins over a bare 'A'.
    for (const kw of PATH_TEMP_KEYWORDS) {
      if (this.tryKeyword(kw)) {
        return { kind: kw as PathTempKey, body: this.parseUnary() };
      }
    }
    // Bracketed Until: A[ … U … ]  or  E[ … U … ].
    // We require the bracket to immediately follow the path quantifier
    // (no whitespace) so we don't shadow atoms named 'A' / 'E'.
    if (this.src.startsWith('A[', this.pos)) {
      this.pos += 2;
      const left = this.parseIff();
      if (!this.tryKeyword('U') && !this.tryLit('𝐔')) {
        throw new ParserError(`expected 'U' inside A[…U…]`, this.pos);
      }
      const right = this.parseIff();
      if (!this.tryLit(']')) {
        throw new ParserError(`expected ']' to close A[…U…]`, this.pos);
      }
      return { kind: 'AU', left, right };
    }
    if (this.src.startsWith('E[', this.pos)) {
      this.pos += 2;
      const left = this.parseIff();
      if (!this.tryKeyword('U') && !this.tryLit('𝐔')) {
        throw new ParserError(`expected 'U' inside E[…U…]`, this.pos);
      }
      const right = this.parseIff();
      if (!this.tryLit(']')) {
        throw new ParserError(`expected ']' to close E[…U…]`, this.pos);
      }
      return { kind: 'EU', left, right };
    }
    if (this.tryLit('!') || this.tryLit('~') || this.tryLit('¬')) {
      return { kind: 'not', body: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  parsePrimary(): CtlFormula {
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
