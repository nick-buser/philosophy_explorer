import type { EgHook, EgNode } from './eg-ast';

// Recursive-descent parser for the alpha+beta EG short-form DSL.
//
// Grammar (EBNF-ish):
//
//   sheet     := seq
//   seq       := node*
//   node      := atom | cut | identity
//   atom      := ident hookList?      (predicate with 0 or more hooks)
//   cut       := '(' seq ')'
//   identity  := ident '=' ident      (joins two lines of identity)
//   hookList  := '(' hook (',' hook)* ')'
//   hook      := ident
//   ident     := [A-Za-z_][A-Za-z0-9_]*
//
// Whitespace between nodes is the conjunction operator. The `=` form
// is recognised at top level so that an identity assertion can sit on
// the sheet alongside predicates.

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

const IDENT_HEAD = /[A-Za-z_]/;
const IDENT_TAIL = /[A-Za-z0-9_]/;

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
      out.push(this.parseNode());
    }
  }

  parseNode(): EgNode {
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
    if (IDENT_HEAD.test(ch)) {
      const name = this.parseIdent();
      // Hooks are whitespace-sensitive: `P(x)` is a unary predicate, but
      // `P (x)` is the alpha juxtaposition `P · ¬x`. This matches the
      // visual reading of EG-beta where hooks are anchored at the
      // predicate's own spot.
      const hooks = this.peek() === '(' ? this.parseHookList() : [];
      // Identity (`x = y`) tolerates surrounding whitespace; backtrack
      // if the `=` doesn't materialise so we don't over-consume.
      if (hooks.length === 0) {
        const save = this.pos;
        this.skipWs();
        if (this.peek() === '=') {
          this.pos++;
          this.skipWs();
          const right = this.parseIdent();
          return { kind: 'eq', left: name, right };
        }
        this.pos = save;
      }
      return { kind: 'atom', name, hooks };
    }
    throw new ParserError(`unexpected character '${ch}'`, this.pos);
  }

  parseIdent(): string {
    if (!IDENT_HEAD.test(this.peek())) {
      throw new ParserError(`expected identifier`, this.pos);
    }
    const start = this.pos;
    while (!this.atEnd() && IDENT_TAIL.test(this.peek())) this.pos++;
    return this.src.slice(start, this.pos);
  }

  parseHookList(): EgHook[] {
    const open = this.pos;
    this.pos++;                                                 // consume '('
    this.skipWs();
    const hooks: EgHook[] = [];
    if (this.peek() === ')') {
      this.pos++;
      return hooks;
    }
    hooks.push(this.parseIdent());
    this.skipWs();
    while (this.peek() === ',') {
      this.pos++;
      this.skipWs();
      hooks.push(this.parseIdent());
      this.skipWs();
    }
    if (this.peek() !== ')') {
      throw new ParserError(`expected ',' or ')' in hook list opened at ${open}`, this.pos);
    }
    this.pos++;
    return hooks;
  }
}
