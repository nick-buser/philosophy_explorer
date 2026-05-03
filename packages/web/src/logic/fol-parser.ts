import type { FolFormula, FolTerm } from './fol-types';

// Recursive-descent parser for the modern-FOL DSL.
//
// Grammar (lowest precedence first):
//   iff      := impl ( '<->' | '↔'                    impl  )*    left-assoc
//   impl     := disj ( '->'  | '→'                    impl  )?    right-assoc
//   disj     := conj ( '|'   | '∨' | '\\/'             conj  )*    left-assoc
//   conj     := unary( '&'   | '∧' | '/\\'             unary )*    left-assoc
//   unary    := ('~'|'!'|'¬'|'not') unary
//             | ('forall'|'∀') ident '.' iff              wide scope
//             | ('exists'|'∃') ident '.' iff              wide scope
//             | atom
//   atom     := 'true'  | '⊤' | '\\top'                          ⊤
//             | 'false' | '⊥' | '\\bot'                          ⊥
//             | '(' iff ')'
//             | callable ( ('=' | '!=' | '≠') term )?      eq / pred
//   callable := ident ( '(' termList ')' )?
//   term     := ident ( '(' termList ')' )?
//   termList := term (',' term)*
//   ident    := [A-Za-z_][A-Za-z0-9_]*
//
// Scope convention: quantifiers bind wide-scope to the right (matching
// Frege's diagrams and standard mathematical English: "for all x, P(x)
// implies Q(x)" reads as ∀x.(P(x)→Q(x)), not (∀x.P(x))→Q(x)). Use
// parens to force narrow scope: `(forall x. P(x)) -> Q(a)`.
//
// Variable vs. constant: a 0-arg term identifier is a `var` iff it is
// currently within the scope of a `forall`/`exists` binder for that
// name, otherwise a `const`. n-arg term identifiers are always `fn`,
// regardless of binding (FOL doesn't quantify over functions).
//
// Predicate vs. term: position-determined. In atom position the parser
// reads an identifier-with-optional-args, then looks ahead — if `=` or
// `!=` follows it was a term (re-tagged), otherwise it was a predicate.

export type ParseError = { message: string; position: number };
export type ParseResult =
  | { ok: true;  formula: FolFormula }
  | { ok: false; error: ParseError };

export function parseFol(input: string): ParseResult {
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

const IDENT_HEAD = /[A-Za-z_]/;
const IDENT_TAIL = /[A-Za-z0-9_]/;

const KEYWORDS = new Set(['forall', 'exists', 'not', 'true', 'false']);

class Parser {
  pos = 0;
  // Stack of variable names currently in scope (innermost last). A
  // term identifier on this stack parses as `var`; otherwise `const`.
  // Function applications are always `fn` regardless of stack.
  bound: string[] = [];

  constructor(private src: string) {}

  atEnd() { return this.pos >= this.src.length; }
  peek() { return this.src[this.pos] ?? ''; }

  skipWs() {
    while (!this.atEnd() && /\s/.test(this.peek())) this.pos++;
  }

  // Match a literal at the current position (after whitespace) and
  // advance past it on success.
  tryLit(lit: string): boolean {
    this.skipWs();
    if (this.src.startsWith(lit, this.pos)) {
      this.pos += lit.length;
      return true;
    }
    return false;
  }

  // Like tryLit but the match must NOT be followed by an identifier
  // continuation character. Distinguishes the keyword `forall` from a
  // free identifier `forallx`.
  tryKeyword(kw: string): boolean {
    this.skipWs();
    if (!this.src.startsWith(kw, this.pos)) return false;
    const after = this.src[this.pos + kw.length];
    if (after !== undefined && IDENT_TAIL.test(after)) return false;
    this.pos += kw.length;
    return true;
  }

  // Top-level: <->
  parseIff(): FolFormula {
    let left = this.parseImpl();
    while (this.tryLit('<->') || this.tryLit('↔')) {
      const right = this.parseImpl();
      left = { kind: 'iff', left, right };
    }
    return left;
  }

  parseImpl(): FolFormula {
    const left = this.parseDisj();
    if (this.tryLit('->') || this.tryLit('→')) {
      const right = this.parseImpl();           // right-assoc
      return { kind: 'implies', left, right };
    }
    return left;
  }

  parseDisj(): FolFormula {
    let left = this.parseConj();
    while (this.tryLit('\\/') || this.tryLit('∨') || this.tryLit('|')) {
      const right = this.parseConj();
      left = { kind: 'or', left, right };
    }
    return left;
  }

  parseConj(): FolFormula {
    let left = this.parseUnary();
    while (this.tryLit('/\\') || this.tryLit('∧') || this.tryLit('&')) {
      const right = this.parseUnary();
      left = { kind: 'and', left, right };
    }
    return left;
  }

  parseUnary(): FolFormula {
    this.skipWs();
    if (this.tryLit('¬') || this.tryLit('!') || this.tryLit('~') || this.tryKeyword('not')) {
      return { kind: 'not', body: this.parseUnary() };
    }
    if (this.tryKeyword('forall') || this.tryLit('∀')) {
      return this.parseQuantBody('forall');
    }
    if (this.tryKeyword('exists') || this.tryLit('∃')) {
      return this.parseQuantBody('exists');
    }
    return this.parseAtom();
  }

  parseQuantBody(kind: 'forall' | 'exists'): FolFormula {
    this.skipWs();
    const v = this.parseRawIdent('expected variable name after quantifier');
    if (KEYWORDS.has(v)) {
      throw new ParserError(`'${v}' is a reserved keyword and cannot be a variable name`, this.pos);
    }
    this.skipWs();
    if (!this.tryLit('.')) {
      throw new ParserError("expected '.' after quantified variable", this.pos);
    }
    this.bound.push(v);
    try {
      const body = this.parseIff();             // wide-scope
      return { kind, variable: v, body };
    } finally {
      this.bound.pop();
    }
  }

  parseAtom(): FolFormula {
    this.skipWs();
    // Boolean constants — keyword forms first so `truefoo` doesn't
    // tokenise as `true`+`foo`.
    if (this.tryKeyword('true') || this.tryLit('⊤') || this.tryLit('\\top')) {
      return { kind: 'top' };
    }
    if (this.tryKeyword('false') || this.tryLit('⊥') || this.tryLit('\\bot')) {
      return { kind: 'bot' };
    }
    if (this.peek() === '(') {
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

    // Read an identifier-with-optional-args. We don't yet know whether
    // it's a predicate (formula atom) or a term (left side of an
    // equality). Disambiguate after by looking at the next operator.
    const startPos = this.pos;
    const name = this.parseRawIdent('expected an atom');
    if (KEYWORDS.has(name)) {
      throw new ParserError(`unexpected keyword '${name}' in atom position`, startPos);
    }
    const args = this.tryParseArgList();

    this.skipWs();
    if (this.tryLit('!=') || this.tryLit('≠')) {
      const left  = this.identToTerm(name, args);
      const right = this.parseTerm();
      return { kind: 'not', body: { kind: 'eq', left, right } };
    }
    if (this.tryLit('=')) {
      const left  = this.identToTerm(name, args);
      const right = this.parseTerm();
      return { kind: 'eq', left, right };
    }
    return { kind: 'pred', name, args };
  }

  tryParseArgList(): FolTerm[] {
    if (this.peek() !== '(') return [];
    this.pos++;
    this.skipWs();
    const args: FolTerm[] = [];
    if (this.peek() === ')') {
      this.pos++;
      return args;
    }
    args.push(this.parseTerm());
    this.skipWs();
    while (this.peek() === ',') {
      this.pos++;
      this.skipWs();
      args.push(this.parseTerm());
      this.skipWs();
    }
    if (this.peek() !== ')') {
      throw new ParserError("expected ',' or ')' in argument list", this.pos);
    }
    this.pos++;
    return args;
  }

  parseTerm(): FolTerm {
    this.skipWs();
    const startPos = this.pos;
    const name = this.parseRawIdent('expected term');
    if (KEYWORDS.has(name)) {
      throw new ParserError(`unexpected keyword '${name}' in term position`, startPos);
    }
    const args = this.tryParseArgList();
    return this.identToTerm(name, args);
  }

  identToTerm(name: string, args: FolTerm[]): FolTerm {
    if (args.length > 0) {
      return { kind: 'fn', name, args };
    }
    if (this.bound.includes(name)) {
      return { kind: 'var', name };
    }
    return { kind: 'const', name };
  }

  parseRawIdent(errMsg: string): string {
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
