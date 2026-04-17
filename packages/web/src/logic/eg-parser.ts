import type { EgNode } from './eg-ast';

// Recursive-descent parser for the alpha-EG short-form DSL.
// Grammar (EBNF-ish):
//   sheet  := seq
//   seq    := atom*
//   atom   := ident | '(' seq ')'
//   ident  := [A-Za-z_][A-Za-z0-9_]*
// Whitespace between atoms is the conjunction operator.

export type ParseError = { message: string; position: number };
export type ParseResult =
  | { ok: true;  tree: EgNode }
  | { ok: false; error: ParseError };

export function parseEg(input: string): ParseResult {
  const p = new Parser(input);
  try {
    const children = p.parseSeq();
    p.skipWs();
    if (!p.atEnd()) {
      return { ok: false, error: { message: `unexpected '${p.peek()}'`, position: p.pos } };
    }
    return { ok: true, tree: { kind: 'sheet', children } };
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

  parseSeq(): EgNode[] {
    const out: EgNode[] = [];
    while (true) {
      this.skipWs();
      if (this.atEnd() || this.peek() === ')') return out;
      out.push(this.parseAtom());
    }
  }

  parseAtom(): EgNode {
    const ch = this.peek();
    if (ch === '(') {
      const open = this.pos;
      this.pos++;
      const children = this.parseSeq();
      this.skipWs();
      if (this.peek() !== ')') {
        throw new ParserError(`unclosed cut opened at position ${open}`, this.pos);
      }
      this.pos++;
      return { kind: 'cut', children };
    }
    if (/[A-Za-z_]/.test(ch)) {
      const start = this.pos;
      while (!this.atEnd() && /[A-Za-z0-9_]/.test(this.peek())) this.pos++;
      return { kind: 'atom', name: this.src.slice(start, this.pos) };
    }
    throw new ParserError(`unexpected character '${ch}'`, this.pos);
  }
}