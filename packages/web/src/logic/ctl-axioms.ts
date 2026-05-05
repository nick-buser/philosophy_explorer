// CTL axiom panel — canonical equivalences and validities.
//
// Each schema is universally valid in CTL on serial Kripke structures.
// A red ✗ here would mean the engine is mis-computing a fixed point —
// the panel doubles as a regression check.

import { satisfactionSetC } from './ctl-eval';
import { parseCtl } from './ctl-parser';
import type { CtlFormula, KripkeModel } from './ctl-types';
import type { WorldId } from './kripke-types';

export type CtlAxiomDef = {
  name: string;
  short: string;
  schema: string;
  vars: string[];
  gloss: string;
};

export const CTL_AXIOMS: CtlAxiomDef[] = [
  {
    name: 'AG ↔ ¬EF¬',
    short: 'AG=¬EF¬',
    schema: 'AG p <-> !EF !p',
    vars: ['p'],
    gloss: 'On every path always equals not (on some path eventually not). The CTL analogue of □ ≡ ¬◇¬.',
  },
  {
    name: 'EF unfold',
    short: 'EF=',
    schema: 'EF p <-> (p | EX EF p)',
    vars: ['p'],
    gloss: 'Existence of a future witness equals "now or one step closer". The least-fixed-point unfolding.',
  },
  {
    name: 'AG unfold',
    short: 'AG=',
    schema: 'AG p <-> (p & AX AG p)',
    vars: ['p'],
    gloss: 'On every path always equals "now and on every next-step always". Greatest-fixed-point unfolding.',
  },
  {
    name: 'AX-distributes over ∧',
    short: 'AX∧',
    schema: 'AX(p & q) <-> (AX p & AX q)',
    vars: ['p', 'q'],
    gloss: 'Universal-next distributes over conjunction.',
  },
  {
    name: 'EX distributes over ∨',
    short: 'EX∨',
    schema: 'EX(p | q) <-> (EX p | EX q)',
    vars: ['p', 'q'],
    gloss: 'Existential-next distributes over disjunction.',
  },
  {
    name: 'AF / AG duality',
    short: 'AF=¬EG¬',
    schema: 'AF p <-> !EG !p',
    vars: ['p'],
    gloss: 'On every path eventually equals not (on some path always not).',
  },
  {
    name: 'AU implies AF',
    short: 'AU→AF',
    schema: 'A[p U q] -> AF q',
    vars: ['p', 'q'],
    gloss: 'A[φ U ψ] entails AF ψ — the closure conjunct of universal Until.',
  },
  {
    name: 'EU implies EF',
    short: 'EU→EF',
    schema: 'E[p U q] -> EF q',
    vars: ['p', 'q'],
    gloss: 'E[φ U ψ] entails EF ψ — the closure conjunct of existential Until.',
  },
];

export type CtlAxiomVerdict = {
  axiom: CtlAxiomDef;
  valid: boolean;
  failure?: {
    substitution: Record<string, string>;
    state: WorldId;
  };
};

export function ctlAxiomVerdicts(model: KripkeModel): CtlAxiomVerdict[] {
  return CTL_AXIOMS.map(a => verdictFor(a, model));
}

export function verdictFor(axiom: CtlAxiomDef, model: KripkeModel): CtlAxiomVerdict {
  const atoms = atomCandidates(model, axiom.vars.length);
  const subs = enumerateSubs(axiom.vars, atoms);
  for (const sub of subs) {
    const f = instantiate(axiom.schema, sub);
    const sat = satisfactionSetC(f, model);
    for (const w of model.worlds) {
      if (!sat.has(w.id)) {
        return { axiom, valid: false, failure: { substitution: sub, state: w.id } };
      }
    }
  }
  return { axiom, valid: true };
}

// ---------- helpers ----------

function atomCandidates(model: KripkeModel, varCount: number): string[] {
  const present = new Set<string>();
  for (const w of model.worlds) for (const a of w.atoms) present.add(a);
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

function instantiate(schema: string, sub: Record<string, string>): CtlFormula {
  const r = parseCtl(schema);
  if (!r.ok) {
    throw new Error(`AXIOM schema unparseable: ${schema} (${r.error.message})`);
  }
  return rename(r.formula, sub);
}

function rename(f: CtlFormula, sub: Record<string, string>): CtlFormula {
  switch (f.kind) {
    case 'atom':
      return { kind: 'atom', name: sub[f.name] ?? f.name };
    case 'not':
      return { kind: 'not', body: rename(f.body, sub) };
    case 'and':
    case 'or':
    case 'implies':
    case 'iff':
      return { ...f, left: rename(f.left, sub), right: rename(f.right, sub) };
    case 'AX':
    case 'EX':
    case 'AF':
    case 'EF':
    case 'AG':
    case 'EG':
      return { kind: f.kind, body: rename(f.body, sub) };
    case 'AU':
    case 'EU':
      return { kind: f.kind, left: rename(f.left, sub), right: rename(f.right, sub) };
  }
}
