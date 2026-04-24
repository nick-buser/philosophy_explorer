import type { ModalFormula } from './kripke-types';

// Recursive-descent parser for modal propositional formulas.
//
// Grammar (lowest precedence first):
//   iff     := impl     ( ('<->' | '↔')        impl     )*       left-assoc
//   impl    := disj     ( ('->'  | '→')        impl     )?       right-assoc
//   disj    := conj     ( ('|'   | '∨')        conj     )*       left-assoc
//   conj    := unary    ( ('&'   | '∧')        unary    )*       left-assoc
//   unary   := ('!' | '~' | '¬' | '[]' | '□' | '<>' | '◇') unary
//            | primary
//   primary := atom | '(' iff ')'
//   atom    := [A-Za-z_][A-Za-z0-9_]*
//
// ASCII and Unicode spellings are both accepted. Multi-char literals
// ('[]', '<>', '->', '<->') are matched by longest-first lookahead.

export type ParseError = { message: string; position: number };
export type ParseResult =
  | { ok: true;  formula: ModalFormula }
  | { ok: false; error: ParseError };

export function parseModal(input: string): ParseResult {
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

  // Try to consume `lit` at the current position (after whitespace).
  // Returns true if matched, false otherwise. Does not advance on miss.
  tryLit(lit: string): boolean {
    this.skipWs();
    if (this.src.startsWith(lit, this.pos)) {
      this.pos += lit.length;
      return true;
    }
    return false;
  }

  parseIff(): ModalFormula {
    let left = this.parseImpl();
    while (this.tryLit('<->') || this.tryLit('↔')) {
      const right = this.parseImpl();
      left = { kind: 'iff', left, right };
    }
    return left;
  }

  parseImpl(): ModalFormula {
    const left = this.parseDisj();
    if (this.tryLit('->') || this.tryLit('→')) {
      const right = this.parseImpl();          // right-assoc
      return { kind: 'implies', left, right };
    }
    return left;
  }

  parseDisj(): ModalFormula {
    let left = this.parseConj();
    while (this.tryLit('|') || this.tryLit('∨')) {
      const right = this.parseConj();
      left = { kind: 'or', left, right };
    }
    return left;
  }

  parseConj(): ModalFormula {
    let left = this.parseUnary();
    while (this.tryLit('&') || this.tryLit('∧')) {
      const right = this.parseUnary();
      left = { kind: 'and', left, right };
    }
    return left;
  }

  parseUnary(): ModalFormula {
    // Check '<->' is NOT confused with '<>' — but parseUnary is called
    // in unary position where '<->' can't appear, so '<>' is safe to match.
    if (this.tryLit('[]') || this.tryLit('□')) {
      return { kind: 'box', body: this.parseUnary() };
    }
    if (this.tryLit('<>') || this.tryLit('◇')) {
      return { kind: 'dia', body: this.parseUnary() };
    }
    if (this.tryLit('!') || this.tryLit('~') || this.tryLit('¬')) {
      return { kind: 'not', body: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  parsePrimary(): ModalFormula {
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