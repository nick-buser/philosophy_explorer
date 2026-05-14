import type { FregeContent, FregeFormula } from './frege-types';
import { inferQuantifierSort } from './frege-types';

// Recursive-descent parser for the Frege Begriffsschrift DSL.
//
// Grammar (lowest precedence first):
//   formula  := '|-' content                    judgment
//             | content                          mere content
//   content  := condExpr ('==' content)?         right-assoc identity-of-content
//   condExpr := unary ('->' condExpr)?           right-assoc conditional
//   unary    := '~' unary
//             | 'all'    ident '.' content       universal quantifier (wide scope)
//             | 'exists' ident '.' content       existential (rendered as ¬∀¬)
//             | primary
//   primary  := atom | '(' content ')'
//   atom     := ident ( '(' ident (',' ident)* ')' )?
//   ident    := [A-Za-z_][A-Za-z0-9_]*
//
// Precedence: `==` (identity-of-content) sits at the lowest level,
// looser than `->`. So `A -> B == C` parses as `(A -> B) == C` and a
// quantifier body extends through both `->` and `==`.
//
// Scope convention: `all x.` / `exists x.` bind the entire content to
// their right (including any following `->` and `==`), matching Frege's
// diagrams where the concavity governs the full content stroke that
// follows it. Use parentheses to force narrow scope.
//
// Sort convention: the *first letter* of the bound variable determines
// quantifier sort — uppercase = predicate variable (Frege's
// "second-level" concept), lowercase = individual. This mirrors Frege's
// typographic distinction between Gothic individual letters and Greek
// predicate letters.
//
// `all` and `exists` are keywords; `allowed` is not the keyword
// followed by a free variable name `owed`. Keyword recognition
// requires a non-identifier character after the keyword.

export type ParseError = { message: string; position: number };
export type ParseResult =
  | { ok: true;  formula: FregeFormula }
  | { ok: false; error: ParseError };

export function parseFrege(input: string): ParseResult {
  const p = new Parser(input);
  try {
    p.skipWs();
    if (p.atEnd()) {
      return { ok: false, error: { message: 'empty input', position: 0 } };
    }
    const isJudgment = p.tryLit('|-');
    p.skipWs();
    const body = p.parseContent();
    p.skipWs();
    if (!p.atEnd()) {
      return { ok: false, error: { message: `unexpected '${p.peek()}'`, position: p.pos } };
    }
    const formula: FregeFormula = isJudgment
      ? { kind: 'judgment', body }
      : { kind: 'content',  body };
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

  // Literal match. Skips whitespace first, advances on hit, leaves the
  // cursor untouched on miss.
  tryLit(lit: string): boolean {
    this.skipWs();
    if (this.src.startsWith(lit, this.pos)) {
      this.pos += lit.length;
      return true;
    }
    return false;
  }

  // Try to match a keyword followed by a non-identifier character. This
  // is what distinguishes the `all` keyword from a free identifier
  // starting with `all`.
  tryKeyword(kw: string): boolean {
    this.skipWs();
    if (!this.src.startsWith(kw, this.pos)) return false;
    const after = this.src[this.pos + kw.length];
    if (after !== undefined && IDENT_TAIL.test(after)) return false;
    this.pos += kw.length;
    return true;
  }

  parseContent(): FregeContent {
    const left = this.parseCond();
    if (this.tryLit('==')) {
      const right = this.parseContent();              // right-assoc
      return { kind: 'iden', left, right };
    }
    return left;
  }

  parseCond(): FregeContent {
    const left = this.parseUnary();
    // Distinguish `->` from `==` cleanly: peek before consuming.
    this.skipWs();
    if (this.src.startsWith('->', this.pos)) {
      this.pos += 2;
      const right = this.parseCond();                 // right-assoc
      return { kind: 'cond', antecedent: left, consequent: right };
    }
    return left;
  }

  parseUnary(): FregeContent {
    this.skipWs();
    if (this.tryLit('~')) {
      return { kind: 'not', body: this.parseUnary() };
    }
    if (this.tryKeyword('all')) {
      return this.parseQuantBody('forall');
    }
    if (this.tryKeyword('exists')) {
      return this.parseQuantBody('exists');
    }
    return this.parsePrimary();
  }

  // Shared `<var> '.' <content>` tail used by both `all` and `exists`.
  parseQuantBody(kind: 'forall' | 'exists'): FregeContent {
    this.skipWs();
    const v = this.parseIdent(`expected variable name after \`${kind === 'forall' ? 'all' : 'exists'}\``);
    this.skipWs();
    if (!this.tryLit('.')) {
      throw new ParserError("expected '.' after quantified variable", this.pos);
    }
    const sort = inferQuantifierSort(v);
    // Wide-scope: bind a full content (including any following ->/==).
    return { kind, variable: v, sort, body: this.parseContent() };
  }

  parsePrimary(): FregeContent {
    this.skipWs();
    const ch = this.peek();
    if (ch === '(') {
      const open = this.pos;
      this.pos++;
      const inner = this.parseContent();
      this.skipWs();
      if (this.peek() !== ')') {
        throw new ParserError(`unclosed group opened at position ${open}`, this.pos);
      }
      this.pos++;
      return inner;
    }
    return this.parseAtom();
  }

  parseAtom(): FregeContent {
    const name = this.parseIdent('expected an atom');
    this.skipWs();
    const args: string[] = [];
    if (this.peek() === '(') {
      this.pos++;
      this.skipWs();
      if (this.peek() === ')') {
        // No-arg parens: F() is allowed but discouraged. Treat as zero-arg.
        this.pos++;
      } else {
        args.push(this.parseIdent('expected argument name'));
        this.skipWs();
        while (this.peek() === ',') {
          this.pos++;
          this.skipWs();
          args.push(this.parseIdent('expected argument name'));
          this.skipWs();
        }
        if (this.peek() !== ')') {
          throw new ParserError("expected ',' or ')' in argument list", this.pos);
        }
        this.pos++;
      }
    }
    return { kind: 'atom', name, args };
  }

  parseIdent(errMsg: string): string {
    this.skipWs();
    const ch = this.peek();
    if (!ch || !IDENT_HEAD.test(ch)) {
      throw new ParserError(errMsg, this.pos);
    }
    const start = this.pos;
    while (!this.atEnd() && IDENT_TAIL.test(this.peek())) this.pos++;
    return this.src.slice(start, this.pos);
  }
}
