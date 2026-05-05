// Parser for the Resolution / Horn / Datalog DSL.
//
// One source string maps to one of three program shapes, picked
// from surface syntax:
//
//   - `clauses` — clauses separated by `|` / `\/` / `∨`; literals
//     may be negated with `~` / `¬` / `not `. An optional goal line
//     `|- C` / `⊢ C` / `?- C` means "negate C and resolve to ⊥".
//
//   - `horn` — Prolog-style `head :- body1, body2.` rules and
//     atom facts (`fact(a).`), with at least one `?- query.` line.
//     SLD resolution backward-chains the query against the program.
//
//   - `datalog` — same surface as `horn` but no `?-` query and no
//     compound function symbols anywhere; semi-naïve forward
//     chaining computes the minimal model.
//
// Lines starting with `%` or `#` are comments.
// Variables: identifiers that begin with an uppercase letter or `_`.
// Constants: identifiers that begin with a lowercase letter, plus
// numeric literals.

import type {
  Atom, Clause, Goal, Literal, Mode, Program, Rule, Term,
} from './resolution-types';
import { atomHasFunctor } from './resolution-types';

export type ParseError = { message: string; line: number };
export type ParseResult =
  | { ok: true; program: Program; mode: Mode }
  | { ok: false; error: ParseError };

const NEGATION_PREFIXES = ['¬', '~'];
const OR_GLYPHS = ['∨', '\\/', '|'];
const IMPLICATION = ':-';
const TURNSTILES = ['⊢', '|-', '?-'];

function stripComments(line: string): string {
  // % or # start a line comment (not inside a quoted string — we
  // don't have strings, so this is unambiguous).
  const hashIdx = line.indexOf('#');
  const pctIdx = line.indexOf('%');
  let cut = line.length;
  if (hashIdx !== -1 && hashIdx < cut) cut = hashIdx;
  if (pctIdx !== -1 && pctIdx < cut) cut = pctIdx;
  return line.slice(0, cut);
}

function isVarStart(ch: string): boolean {
  return /[A-Z_]/.test(ch);
}

function isIdentStart(ch: string): boolean {
  return /[A-Za-z_0-9]/.test(ch);
}

function isIdentChar(ch: string): boolean {
  return /[A-Za-z_0-9]/.test(ch);
}

class Cursor {
  src: string;
  i: number = 0;
  line: number;

  constructor(src: string, line: number) {
    this.src = src;
    this.line = line;
  }

  eof(): boolean { return this.i >= this.src.length; }

  peek(n: number = 0): string {
    return this.src[this.i + n] ?? '';
  }

  rest(): string { return this.src.slice(this.i); }

  skipWs(): void {
    while (this.i < this.src.length && /\s/.test(this.src[this.i]!)) this.i++;
  }

  consume(s: string): boolean {
    if (this.src.startsWith(s, this.i)) { this.i += s.length; return true; }
    return false;
  }

  consumeWord(s: string): boolean {
    // Like consume but requires a non-identifier character after.
    if (!this.src.startsWith(s, this.i)) return false;
    const after = this.src[this.i + s.length] ?? '';
    if (after !== '' && isIdentChar(after)) return false;
    this.i += s.length;
    return true;
  }

  ident(): string | null {
    if (this.eof() || !isIdentStart(this.peek())) return null;
    let j = this.i;
    while (j < this.src.length && isIdentChar(this.src[j]!)) j++;
    const out = this.src.slice(this.i, j);
    this.i = j;
    return out;
  }
}

function parseTerm(c: Cursor): Term {
  c.skipWs();
  const id = c.ident();
  if (id === null) throw new Error(`expected term at "${c.rest().slice(0, 16)}"`);
  c.skipWs();
  if (c.consume('(')) {
    const args: Term[] = [];
    c.skipWs();
    if (!c.consume(')')) {
      args.push(parseTerm(c));
      c.skipWs();
      while (c.consume(',')) {
        args.push(parseTerm(c));
        c.skipWs();
      }
      if (!c.consume(')')) throw new Error(`expected ')' in compound term`);
    }
    return { kind: 'compound', functor: id, args };
  }
  if (isVarStart(id[0]!)) return { kind: 'var', name: id };
  return { kind: 'const', name: id };
}

function parseAtom(c: Cursor): Atom {
  c.skipWs();
  const id = c.ident();
  if (id === null) throw new Error(`expected atom at "${c.rest().slice(0, 16)}"`);
  if (isVarStart(id[0]!)) {
    throw new Error(`atom must begin with a constant predicate, got variable "${id}"`);
  }
  c.skipWs();
  if (!c.consume('(')) return { predicate: id, args: [] };
  const args: Term[] = [];
  c.skipWs();
  if (!c.consume(')')) {
    args.push(parseTerm(c));
    c.skipWs();
    while (c.consume(',')) {
      args.push(parseTerm(c));
      c.skipWs();
    }
    if (!c.consume(')')) throw new Error(`expected ')' after atom args`);
  }
  return { predicate: id, args };
}

function tryParseNegation(c: Cursor): boolean {
  c.skipWs();
  for (const g of NEGATION_PREFIXES) {
    if (c.consume(g)) return true;
  }
  if (c.consumeWord('not')) return true;
  return false;
}

function tryParseOr(c: Cursor): boolean {
  c.skipWs();
  for (const g of OR_GLYPHS) {
    if (c.consume(g)) return true;
  }
  return false;
}

function parseLiteral(c: Cursor): Literal {
  const negated = tryParseNegation(c);
  const atom = parseAtom(c);
  return { polarity: negated ? 'neg' : 'pos', atom };
}

function parseClauseBody(c: Cursor): Literal[] {
  const lits: Literal[] = [];
  lits.push(parseLiteral(c));
  while (tryParseOr(c)) {
    lits.push(parseLiteral(c));
  }
  // Optional trailing `.`
  c.skipWs();
  c.consume('.');
  return lits;
}

function parseAtomList(c: Cursor): Atom[] {
  // Comma-separated atoms.
  const out: Atom[] = [];
  out.push(parseAtom(c));
  c.skipWs();
  while (c.consume(',')) {
    out.push(parseAtom(c));
    c.skipWs();
  }
  c.consume('.');
  return out;
}

// First-pass family classification, by surface tokens. A line that
// cannot disambiguate on its own becomes 'unit'; the program-level
// decision then folds units into whichever family the rest of the
// file commits to (and into 'horn' if neither family appears).
type LineFamily = 'goal-clause' | 'goal-horn' | 'horn-rule' | 'clause' | 'unit';

function classifyLine(stripped: string): LineFamily {
  if (stripped.startsWith('?-')) return 'goal-horn';
  for (const t of TURNSTILES) {
    if (t !== '?-' && stripped.startsWith(t)) return 'goal-clause';
  }
  if (stripped.includes(IMPLICATION)) return 'horn-rule';
  for (const g of OR_GLYPHS) if (stripped.includes(g)) return 'clause';
  for (const g of NEGATION_PREFIXES) if (stripped.startsWith(g)) return 'clause';
  if (/^\s*not\b/.test(stripped)) return 'clause';
  return 'unit';
}

type LineSlice = { lineNo: number; text: string };

function gatherLines(src: string): LineSlice[] {
  // Each non-blank line is one statement. The single exception:
  // a buffered statement that ends with a continuation marker
  // (`,` or `:-` — mid-clause-body or just after the implication
  // arrow) consumes the following line. This lets the user wrap
  // a long Prolog rule onto multiple lines while keeping clause-
  // mode lines (which never end with such markers) standalone.
  const out: LineSlice[] = [];
  let i = 0;
  let lineNo = 1;
  let buf = '';
  let bufLine = 1;
  while (i < src.length) {
    let nl = src.indexOf('\n', i);
    if (nl === -1) nl = src.length;
    const raw = src.slice(i, nl);
    const stripped = stripComments(raw).trim();
    if (stripped) {
      if (!buf) bufLine = lineNo;
      buf = buf ? buf + ' ' + stripped : stripped;
      const continues = buf.endsWith(',') || buf.endsWith(':-');
      if (!continues) {
        out.push({ lineNo: bufLine, text: buf });
        buf = '';
      }
    }
    i = nl + 1;
    lineNo++;
  }
  if (buf) out.push({ lineNo: bufLine, text: buf });
  return out;
}

export function parseProgram(src: string): ParseResult {
  let lines: LineSlice[];
  try {
    lines = gatherLines(src);
  } catch (e) {
    return { ok: false, error: { message: (e as Error).message, line: 0 } };
  }

  type Tagged = { ln: LineSlice; family: LineFamily };
  const tagged: Tagged[] = lines.map(ln => ({ ln, family: classifyLine(ln.text) }));

  const hasClauseFamily = tagged.some(t => t.family === 'clause' || t.family === 'goal-clause');
  const hasHornFamily   = tagged.some(t => t.family === 'horn-rule' || t.family === 'goal-horn');

  if (hasClauseFamily && hasHornFamily) {
    return {
      ok: false,
      error: {
        message: 'cannot mix clause syntax (|, ∨, ¬, ⊢) with Horn syntax (:-, ?-) in one program',
        line: 0,
      },
    };
  }

  // Clauses-mode dispatch.
  if (hasClauseFamily) {
    const clauses: Clause[] = [];
    const goalClauses: Clause[] = [];
    for (const { ln, family } of tagged) {
      try {
        if (family === 'goal-clause') {
          let body = ln.text;
          for (const t of TURNSTILES) {
            if (body.startsWith(t)) { body = body.slice(t.length); break; }
          }
          const c = new Cursor(body, ln.lineNo);
          c.skipWs();
          if (c.eof()) {
            goalClauses.push({ literals: [] });
          } else {
            goalClauses.push({ literals: parseClauseBody(c) });
          }
        } else {
          // clause or unit (a bare atom — single positive literal)
          const c = new Cursor(ln.text, ln.lineNo);
          const lits = parseClauseBody(c);
          clauses.push({ literals: lits });
        }
      } catch (e) {
        return { ok: false, error: { message: (e as Error).message, line: ln.lineNo } };
      }
    }
    return {
      ok: true,
      mode: 'clauses',
      program: { mode: 'clauses', clauses, goals: goalClauses },
    };
  }

  // Horn / Datalog dispatch.
  const rules: Rule[] = [];
  const queryAtoms: Atom[][] = [];
  for (const { ln, family } of tagged) {
    try {
      if (family === 'goal-horn') {
        const body = ln.text.slice('?-'.length);
        const c = new Cursor(body, ln.lineNo);
        c.skipWs();
        queryAtoms.push(c.eof() ? [] : parseAtomList(c));
      } else if (family === 'horn-rule') {
        const colonIdx = ln.text.indexOf(IMPLICATION);
        const headSrc = ln.text.slice(0, colonIdx);
        const bodySrc = ln.text.slice(colonIdx + IMPLICATION.length);
        const hc = new Cursor(headSrc, ln.lineNo);
        const head = parseAtom(hc);
        const bc = new Cursor(bodySrc, ln.lineNo);
        bc.skipWs();
        const body = bc.eof() ? [] : parseAtomList(bc);
        rules.push({ head, body });
      } else {
        // unit — bare atom fact
        const c = new Cursor(ln.text, ln.lineNo);
        const head = parseAtom(c);
        c.skipWs();
        c.consume('.');
        rules.push({ head, body: [] });
      }
    } catch (e) {
      return { ok: false, error: { message: (e as Error).message, line: ln.lineNo } };
    }
  }

  if (queryAtoms.length > 0) {
    const atoms = queryAtoms[0] ?? [];
    const query: Goal = { atoms };
    return { ok: true, mode: 'horn', program: { mode: 'horn', rules, query } };
  }

  for (const r of rules) {
    if (atomHasFunctor(r.head) || r.body.some(atomHasFunctor)) {
      return {
        ok: false,
        error: {
          message: 'datalog programs may not contain compound function symbols; add a `?- query.` line to switch to Horn / SLD mode',
          line: 0,
        },
      };
    }
  }
  return { ok: true, mode: 'datalog', program: { mode: 'datalog', rules, query: null } };
}

