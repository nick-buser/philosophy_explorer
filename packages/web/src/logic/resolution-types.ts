// Types for the Resolution / Horn / Datalog logic system.
//
// One DSL → three program shapes, picked up by the parser from
// surface syntax:
//
//   1. clauses   — a set of (FOL or propositional) clauses; the lab
//                  runs binary resolution to refute the set,
//                  optionally adding the negation of a goal.
//   2. horn      — a Horn program (definite clauses + Prolog-style
//                  query); the lab runs SLD resolution and shows the
//                  derivation tree plus answer substitutions.
//   3. datalog   — function-symbol-free Horn program with no
//                  goal-directed query; the lab runs semi-naïve
//                  forward chaining and shows the per-iteration
//                  derived facts (strata).
//
// The same Term / Atom / Literal types serve all three. Variables
// are syntactic — capitalised identifiers — like Prolog and Datalog.

export type Mode = 'clauses' | 'horn' | 'datalog';

export type Term =
  | { kind: 'var'; name: string }
  | { kind: 'const'; name: string }
  | { kind: 'compound'; functor: string; args: Term[] };

export type Atom = { predicate: string; args: Term[] };

export type Literal = { polarity: 'pos' | 'neg'; atom: Atom };

// A disjunctive clause; literals are an unordered set in the
// abstract, but we keep them in source order for stable rendering.
// The empty clause ([]) is the contradiction ⊥.
export type Clause = { literals: Literal[] };

// A definite (Horn) clause: one positive head, zero or more positive
// body atoms. Facts have an empty body. Used by SLD and Datalog.
export type Rule = { head: Atom; body: Atom[] };

// A query: conjunction of atoms (Prolog `?- a, b, c.`). The SLD
// search succeeds when every atom is reduced to the empty goal.
export type Goal = { atoms: Atom[] };

export type Program =
  | { mode: 'clauses'; clauses: Clause[]; goals: Clause[] }
  | { mode: 'horn';    rules: Rule[]; query: Goal }
  | { mode: 'datalog'; rules: Rule[]; query: Goal | null };

// Substitution: variable name → term.
export type Substitution = Map<string, Term>;

export const EMPTY_SUBST: Substitution = new Map();

// Pretty-print a term, atom, literal, or clause for the renderer
// and for debug strings. `formatTerm`-style helpers don't depend
// on KaTeX — Resolution uses ASCII / Unicode glyphs directly so the
// renderer can show derivations without a per-step TeX render pass.

export function formatTerm(t: Term): string {
  if (t.kind === 'var') return t.name;
  if (t.kind === 'const') return t.name;
  if (t.args.length === 0) return t.functor;
  return `${t.functor}(${t.args.map(formatTerm).join(', ')})`;
}

export function formatAtom(a: Atom): string {
  if (a.args.length === 0) return a.predicate;
  return `${a.predicate}(${a.args.map(formatTerm).join(', ')})`;
}

export function formatLiteral(l: Literal): string {
  return l.polarity === 'pos' ? formatAtom(l.atom) : `¬${formatAtom(l.atom)}`;
}

export function formatClause(c: Clause): string {
  if (c.literals.length === 0) return '⊥';
  return c.literals.map(formatLiteral).join(' ∨ ');
}

export function formatRule(r: Rule): string {
  if (r.body.length === 0) return `${formatAtom(r.head)}.`;
  return `${formatAtom(r.head)} :- ${r.body.map(formatAtom).join(', ')}.`;
}

export function formatGoal(g: Goal): string {
  if (g.atoms.length === 0) return '□';
  return g.atoms.map(formatAtom).join(', ');
}

export function formatSubstitution(s: Substitution): string {
  if (s.size === 0) return '{}';
  const parts: string[] = [];
  for (const [k, v] of s) parts.push(`${k} ↦ ${formatTerm(v)}`);
  return `{${parts.join(', ')}}`;
}

// Term equality up to structure (not up to substitution).
export function termEquals(a: Term, b: Term): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'var')   return a.name === (b as Extract<Term, { kind: 'var' }>).name;
  if (a.kind === 'const') return a.name === (b as Extract<Term, { kind: 'const' }>).name;
  const bb = b as Extract<Term, { kind: 'compound' }>;
  if (a.functor !== bb.functor || a.args.length !== bb.args.length) return false;
  return a.args.every((arg, i) => termEquals(arg, bb.args[i]!));
}

export function atomEquals(a: Atom, b: Atom): boolean {
  if (a.predicate !== b.predicate || a.args.length !== b.args.length) return false;
  return a.args.every((arg, i) => termEquals(arg, b.args[i]!));
}

export function literalEquals(a: Literal, b: Literal): boolean {
  return a.polarity === b.polarity && atomEquals(a.atom, b.atom);
}

// Free variables of a term / atom / literal / clause.
export function freeVars(t: Term, into: Set<string> = new Set()): Set<string> {
  if (t.kind === 'var') into.add(t.name);
  else if (t.kind === 'compound') for (const a of t.args) freeVars(a, into);
  return into;
}

export function atomVars(a: Atom): Set<string> {
  const s = new Set<string>();
  for (const t of a.args) freeVars(t, s);
  return s;
}

export function clauseVars(c: Clause): Set<string> {
  const s = new Set<string>();
  for (const l of c.literals) for (const t of l.atom.args) freeVars(t, s);
  return s;
}

export function ruleVars(r: Rule): Set<string> {
  const s = new Set<string>();
  for (const t of r.head.args) freeVars(t, s);
  for (const b of r.body) for (const t of b.args) freeVars(t, s);
  return s;
}

// Datalog requires variables only — no compound function symbols.
export function termIsGround(t: Term): boolean {
  if (t.kind === 'var') return false;
  if (t.kind === 'const') return true;
  return t.args.every(termIsGround);
}

export function atomIsGround(a: Atom): boolean {
  return a.args.every(termIsGround);
}

export function termHasFunctor(t: Term): boolean {
  if (t.kind === 'compound') return t.args.length > 0;
  return false;
}

export function atomHasFunctor(a: Atom): boolean {
  return a.args.some(t => termHasFunctor(t) || (t.kind === 'compound' && t.args.some(termHasFunctor)));
}
