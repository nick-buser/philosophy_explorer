import type { AgentId, EpistemicFormula } from './epistemic-types';

// Recursive-descent parser for multi-agent epistemic formulas.
//
// Grammar (lowest precedence first):
//   iff     := impl     ( ('<->' | '↔') impl )*       left-assoc
//   impl    := disj     ( ('->'  | '→') impl  )?      right-assoc
//   disj    := conj     ( ('|'   | '∨') conj  )*      left-assoc
//   conj    := unary    ( ('&'   | '∧') unary )*      left-assoc
//   unary   := agentMod | ('!' | '~' | '¬') unary | primary
//   agentMod:= ('K_' | 'M_') agentName unary
//            | '[' agentName ']' unary
//            | '<<' agentName '>>' unary
//   primary := atom | '(' iff ')'
//   atom    := [A-Za-z_][A-Za-z0-9_]*
//
// ASCII spellings only for now; Unicode K-with-subscript would need a
// font normalisation pass.

export type ParseError = { message: string; position: number };
export type ParseResult =
  | { ok: true;  formula: EpistemicFormula }
  | { ok: false; error: ParseError };

export function parseEpistemic(input: string): ParseResult {
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

  tryLit(lit: string): boolean {
    this.skipWs();
    if (this.src.startsWith(lit, this.pos)) {
      this.pos += lit.length;
      return true;
    }
    return false;
  }

  parseIff(): EpistemicFormula {
    let left = this.parseImpl();
    while (this.tryLit('<->') || this.tryLit('↔')) {
      const right = this.parseImpl();
      left = { kind: 'iff', left, right };
    }
    return left;
  }

  parseImpl(): EpistemicFormula {
    const left = this.parseDisj();
    if (this.tryLit('->') || this.tryLit('→')) {
      const right = this.parseImpl();
      return { kind: 'implies', left, right };
    }
    return left;
  }

  parseDisj(): EpistemicFormula {
    let left = this.parseConj();
    while (this.tryLit('|') || this.tryLit('∨')) {
      const right = this.parseConj();
      left = { kind: 'or', left, right };
    }
    return left;
  }

  parseConj(): EpistemicFormula {
    let left = this.parseUnary();
    while (this.tryLit('&') || this.tryLit('∧')) {
      const right = this.parseUnary();
      left = { kind: 'and', left, right };
    }
    return left;
  }

  parseUnary(): EpistemicFormula {
    // Knowledge / consideration prefixes — try multi-char literals
    // longest-first so 'K_alice' isn't shadowed by 'K' meaning atom.
    if (this.tryLit('K_')) {
      const agent = this.consumeAgent();
      return { kind: 'know', agent, body: this.parseUnary() };
    }
    if (this.tryLit('M_')) {
      const agent = this.consumeAgent();
      return { kind: 'consider', agent, body: this.parseUnary() };
    }
    if (this.tryLit('[')) {
      const agent = this.consumeAgent();
      if (!this.tryLit(']')) {
        throw new ParserError(`expected ']' after agent name`, this.pos);
      }
      return { kind: 'know', agent, body: this.parseUnary() };
    }
    if (this.tryLit('<<')) {
      const agent = this.consumeAgent();
      if (!this.tryLit('>>')) {
        throw new ParserError(`expected '>>' after agent name`, this.pos);
      }
      return { kind: 'consider', agent, body: this.parseUnary() };
    }
    if (this.tryLit('!') || this.tryLit('~') || this.tryLit('¬')) {
      return { kind: 'not', body: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  parsePrimary(): EpistemicFormula {
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

  consumeAgent(): AgentId {
    this.skipWs();
    if (!/[A-Za-z_]/.test(this.peek())) {
      throw new ParserError(`expected agent name`, this.pos);
    }
    const start = this.pos;
    while (!this.atEnd() && /[A-Za-z0-9_]/.test(this.peek())) this.pos++;
    return this.src.slice(start, this.pos);
  }
}
