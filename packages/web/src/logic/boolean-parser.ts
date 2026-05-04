import type { BoolFormula } from './boolean-types';

// Recursive-descent parser for the Boolean-algebra DSL.
//
// Mixes algebraic and propositional notations because in practice
// Boolean-algebra writing freely combines them: `~(x y) <-> ~x + ~y`
// reads as De Morgan whether you read the juxtaposition as "·" or the
// "+" as "∨". Single-letter variables only — that's what makes
// juxtaposition unambiguous (xy → x · y, never a two-letter atom).
//
// Grammar (lowest precedence first; left-assoc unless noted):
//   iff      := imp ( ('<->' | '↔')  imp )*
//   imp      := or  ( ('->'  | '→')  imp )?           right-assoc
//   or       := xor ( ('+'   | '|'   | '∨'  | '\\/') xor )*
//   xor      := and ( ('^'   | '⊕')                   and )*
//   and      := unary ( ('·' | '*' | '&' | '∧' | '/\\' )?  unary )*  — implicit · between adjacent atoms
//   unary    := ('~' | '!' | '¬' | "'" prefix? )* primary primeSuffix
//   primary  := '0' | '⊥' | '(' iff ')' | '1' | '⊤' | ident
//   primeSuffix := ("'" | '′')*                      postfix complement
//   ident    := single letter [A-Za-z]
//
// The implicit-conjunction step is what makes `xy`, `x y`, and `x·y`
// all parse the same. We try to consume an explicit AND operator
// first; failing that we look for another atom-start token and treat
// it as implicit conjunction.

export type ParseError = { message: string; position: number };
export type ParseResult =
  | { ok: true;  formula: BoolFormula }
  | { ok: false; error: ParseError };

export function parseBool(input: string): ParseResult {
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

  // ---- iff: ↔ left-assoc ----
  parseIff(): BoolFormula {
    let left = this.parseImp();
    while (true) {
      this.skipWs();
      if (this.match('<->') || this.match('↔')) {
        const right = this.parseImp();
        left = { kind: 'iff', left, right };
      } else break;
    }
    return left;
  }

  // ---- imp: → right-assoc ----
  parseImp(): BoolFormula {
    const left = this.parseOr();
    this.skipWs();
    if (this.match('->') || this.match('→')) {
      const right = this.parseImp();
      return { kind: 'imp', left, right };
    }
    return left;
  }

  // ---- or: + ∨ | left-assoc ----
  parseOr(): BoolFormula {
    let left = this.parseXor();
    while (true) {
      this.skipWs();
      if (this.matchOrOperator()) {
        const right = this.parseXor();
        left = { kind: 'or', left, right };
      } else break;
    }
    return left;
  }

  matchOrOperator(): boolean {
    // `+`, `\/`, `|`, `∨`. Must NOT match `||` as two ORs (treat as one).
    if (this.peek() === '|') {
      // `|` is OR; `||` is also OR (collapse).
      this.pos++;
      if (this.peek() === '|') this.pos++;
      return true;
    }
    if (this.peek() === '+') { this.pos++; return true; }
    if (this.peek() === '∨') { this.pos++; return true; }
    if (this.match('\\/')) return true;
    return false;
  }

  // ---- xor: ^ ⊕ left-assoc ----
  parseXor(): BoolFormula {
    let left = this.parseAnd();
    while (true) {
      this.skipWs();
      if (this.peek() === '^' || this.peek() === '⊕') {
        this.pos++;
        const right = this.parseAnd();
        left = { kind: 'xor', left, right };
      } else break;
    }
    return left;
  }

  // ---- and: explicit · * & ∧, plus implicit juxtaposition ----
  parseAnd(): BoolFormula {
    let left = this.parseUnary();
    while (true) {
      this.skipWs();
      if (this.matchAndOperator()) {
        const right = this.parseUnary();
        left = { kind: 'and', left, right };
        continue;
      }
      // Implicit conjunction: another atom-start follows without an
      // operator between us. Detected by a primary-startable character.
      if (this.atPrimaryStart()) {
        const right = this.parseUnary();
        left = { kind: 'and', left, right };
        continue;
      }
      break;
    }
    return left;
  }

  matchAndOperator(): boolean {
    const c = this.peek();
    if (c === '·' || c === '*' || c === '∧') { this.pos++; return true; }
    if (c === '&') {
      this.pos++;
      if (this.peek() === '&') this.pos++;
      return true;
    }
    if (this.match('/\\')) return true;
    return false;
  }

  atPrimaryStart(): boolean {
    const c = this.peek();
    if (c === undefined) return false;
    if (c === '(') return true;
    if (c === '~' || c === '!' || c === '¬') return true;
    if (c === '0' || c === '1' || c === '⊥' || c === '⊤') return true;
    return /[A-Za-z]/.test(c);
  }

  // ---- unary: prefix ~/!/¬ then primary then postfix prime(s) ----
  parseUnary(): BoolFormula {
    this.skipWs();
    const c = this.peek();
    if (c === '~' || c === '!' || c === '¬') {
      this.pos++;
      const body = this.parseUnary();
      return { kind: 'not', body };
    }
    let body = this.parsePrimary();
    // Postfix prime(s): each adds one negation.
    while (this.peek() === '\'' || this.peek() === '′') {
      this.pos++;
      body = { kind: 'not', body };
    }
    return body;
  }

  // ---- primary: constants, parens, single-letter atoms ----
  parsePrimary(): BoolFormula {
    this.skipWs();
    const c = this.peek();
    if (c === undefined) {
      throw new ParserError('expected expression', this.pos);
    }
    if (c === '0' || c === '⊥') { this.pos++; return { kind: 'zero' }; }
    if (c === '1' || c === '⊤') { this.pos++; return { kind: 'one'  }; }
    if (c === '(') {
      this.pos++;
      const inner = this.parseIff();
      this.skipWs();
      if (this.peek() !== ')') {
        throw new ParserError(`expected ')' near '${this.peek() ?? 'end'}'`, this.pos);
      }
      this.pos++;
      return inner;
    }
    if (/[A-Za-z]/.test(c)) {
      const name = c;
      this.pos++;
      // Reject multi-letter identifiers: Boolean algebra is single-letter
      // by convention so `xy` can be juxtaposition. Adjacent letters form
      // separate atoms via the implicit-conjunction step in parseAnd.
      return { kind: 'var', name };
    }
    throw new ParserError(`unexpected '${c}'`, this.pos);
  }

  // ---- helpers ----
  peek(): string | undefined { return this.src[this.pos]; }
  atEnd(): boolean { return this.pos >= this.src.length; }
  match(s: string): boolean {
    if (this.src.startsWith(s, this.pos)) { this.pos += s.length; return true; }
    return false;
  }
  skipWs(): void {
    while (this.pos < this.src.length && /\s/.test(this.src[this.pos]!)) this.pos++;
  }
}