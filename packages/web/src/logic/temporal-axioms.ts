// LTL axiom panel.
//
// Mirrors kripke-axioms but evaluates with the LTL engine. The axioms
// here are a small selection of canonical LTL theorems and equivalences
// — every one is valid on every lasso, so the panel doubles as a sanity
// check for the engine.
//
// "Valid in this trace" = forced at every position for every
// substitution we tried.

import { satisfactionSetT } from './temporal-eval';
import { parseTemporal } from './temporal-parser';
import type { TemporalFormula, Trace } from './temporal-types';

export type LtlAxiomDef = {
  name: string;
  short: string;
  schema: string;
  vars: string[];
  gloss: string;
};

export const LTL_AXIOMS: LtlAxiomDef[] = [
  {
    name: 'K (G distributes over →)',
    short: 'K',
    schema: 'G(p -> q) -> (G p -> G q)',
    vars: ['p', 'q'],
    gloss: 'If φ → ψ holds globally, the global truth of φ entails the global truth of ψ.',
  },
  {
    name: 'F-elimination of ∨',
    short: 'F∨',
    schema: 'F(p | q) <-> (F p | F q)',
    vars: ['p', 'q'],
    gloss: 'Eventually-disjunction equals disjunction-of-eventuallys. Distinctly LTL: G doesn’t distribute over ∨.',
  },
  {
    name: 'G-introduction of ∧',
    short: 'G∧',
    schema: 'G(p & q) <-> (G p & G q)',
    vars: ['p', 'q'],
    gloss: 'Always-conjunction equals conjunction-of-alwayses. The dual of F∨.',
  },
  {
    name: 'X self-distribution over ∧',
    short: 'X∧',
    schema: 'X(p & q) <-> (X p & X q)',
    vars: ['p', 'q'],
    gloss: 'Next-step distributes over conjunction. Holds because X has a unique successor.',
  },
  {
    name: 'duality F ≡ ¬G¬',
    short: 'F¬G',
    schema: 'F p <-> !G !p',
    vars: ['p'],
    gloss: 'Eventually equals not-always-not — the canonical LTL duality.',
  },
  {
    name: 'until → eventually',
    short: 'U→F',
    schema: '(p U q) -> F q',
    vars: ['p', 'q'],
    gloss: 'Until-q forces eventually-q. The closing-conjunct of LTL’s until semantics.',
  },
  {
    name: 'F unfold',
    short: 'F=',
    schema: 'F p <-> (p | X F p)',
    vars: ['p'],
    gloss: 'Eventually equals "now or later". The fixed-point unfolding the engine literally computes.',
  },
  {
    name: 'G unfold',
    short: 'G=',
    schema: 'G p <-> (p & X G p)',
    vars: ['p'],
    gloss: 'Always equals "now and forever after". Greatest-fixed-point unfolding.',
  },
];

export type LtlAxiomVerdict = {
  axiom: LtlAxiomDef;
  valid: boolean;
  failure?: {
    substitution: Record<string, string>;
    state: string;
  };
};

export function ltlAxiomVerdicts(trace: Trace): LtlAxiomVerdict[] {
  return LTL_AXIOMS.map(a => verdictFor(a, trace));
}

export function verdictFor(axiom: LtlAxiomDef, trace: Trace): LtlAxiomVerdict {
  const atoms = atomCandidates(trace, axiom.vars.length);
  const subs = enumerateSubs(axiom.vars, atoms);
  for (const sub of subs) {
    const f = instantiate(axiom.schema, sub);
    const sat = satisfactionSetT(f, trace);
    for (let i = 0; i < trace.states.length; i++) {
      if (!sat.has(i)) {
        return {
          axiom,
          valid: false,
          failure: { substitution: sub, state: trace.states[i]!.id },
        };
      }
    }
  }
  return { axiom, valid: true };
}

// ---------- helpers ----------

function atomCandidates(trace: Trace, varCount: number): string[] {
  const present = new Set<string>();
  for (const s of trace.states) for (const a of s.atoms) present.add(a);
  const out = new Set<string>(present);
  for (let i = 0; i < Math.max(1, varCount); i++) out.add(freshName(out, i));
  return [...out];
}

function freshName(taken: Set<string>, idx: number): string {
  const bases = ['x', 'y', 'z', 'r', 's', 't'];
  const base = bases[idx] ?? `v${idx}`;
  if (!taken.has(base)) return base;
  let n = 1;
  while (taken.has(`${base}${n}`)) n++;
  return `${base}${n}`;
}

function enumerateSubs(
  vars: string[],
  atoms: string[],
): Record<string, string>[] {
  if (vars.length === 0) return [{}];
  const [head, ...tail] = vars as [string, ...string[]];
  const tailSubs = enumerateSubs(tail, atoms);
  const out: Record<string, string>[] = [];
  for (const a of atoms) {
    for (const ts of tailSubs) out.push({ [head]: a, ...ts });
  }
  return out;
}

function instantiate(schema: string, sub: Record<string, string>): TemporalFormula {
  const r = parseTemporal(schema);
  if (!r.ok) {
    throw new Error(`AXIOM schema unparseable: ${schema} (${r.error.message})`);
  }
  return rename(r.formula, sub);
}

function rename(f: TemporalFormula, sub: Record<string, string>): TemporalFormula {
  switch (f.kind) {
    case 'atom':
      return { kind: 'atom', name: sub[f.name] ?? f.name };
    case 'not':
      return { kind: 'not', body: rename(f.body, sub) };
    case 'next':
      return { kind: 'next', body: rename(f.body, sub) };
    case 'eventually':
      return { kind: 'eventually', body: rename(f.body, sub) };
    case 'always':
      return { kind: 'always', body: rename(f.body, sub) };
    case 'and':
      return { kind: 'and', left: rename(f.left, sub), right: rename(f.right, sub) };
    case 'or':
      return { kind: 'or', left: rename(f.left, sub), right: rename(f.right, sub) };
    case 'implies':
      return { kind: 'implies', left: rename(f.left, sub), right: rename(f.right, sub) };
    case 'iff':
      return { kind: 'iff', left: rename(f.left, sub), right: rename(f.right, sub) };
    case 'until':
      return { kind: 'until', left: rename(f.left, sub), right: rename(f.right, sub) };
  }
}
