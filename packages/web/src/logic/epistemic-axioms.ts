// Multi-agent epistemic-axiom verdicts.
//
// We instantiate each axiom schema for *every declared agent* in the
// model — knowledge axioms are normally schematic in the agent. The
// substitution space for atoms reuses the model's atom set plus a
// fresh atom (mirroring intuitionistic-axioms) so countermodels can
// stage "this atom is forced nowhere" cases.

import { satisfiesE } from './epistemic-eval';
import { parseEpistemic } from './epistemic-parser';
import type {
  AgentId,
  EpistemicFormula,
  EpistemicModel,
  WorldId,
} from './epistemic-types';

export type EpistemicAxiomDef = {
  name: string;
  short: string;
  // Schema in the parser DSL with metavariables p, q, … and an "agent"
  // placeholder spelled `_`. The instantiator replaces `_` with each
  // declared agent in turn.
  schema: string;
  vars: string[];
  // Constraint on R_a that this axiom corresponds to.
  correspondsTo: 'reflexive' | 'symmetric' | 'transitive' | 'serial' | 'euclidean' | 'none';
  gloss: string;
};

export const EPISTEMIC_AXIOMS: EpistemicAxiomDef[] = [
  {
    name: 'K — distribution',
    short: 'K',
    schema: 'K__(p -> q) -> (K__p -> K__q)',
    vars: ['p', 'q'],
    correspondsTo: 'none',
    gloss: 'Distribution of knowledge over implication. Holds in every multi-agent Kripke model.',
  },
  {
    name: 'T — factivity',
    short: 'T',
    schema: 'K__p -> p',
    vars: ['p'],
    correspondsTo: 'reflexive',
    gloss: 'Knowledge implies truth. Corresponds to reflexivity of R_a.',
  },
  {
    name: '4 — positive introspection',
    short: '4',
    schema: 'K__p -> K__K__p',
    vars: ['p'],
    correspondsTo: 'transitive',
    gloss: 'If a knows p, a knows that a knows p. Corresponds to transitivity.',
  },
  {
    name: '5 — negative introspection',
    short: '5',
    schema: '!K__p -> K__!K__p',
    vars: ['p'],
    correspondsTo: 'euclidean',
    gloss: 'If a doesn’t know p, a knows it doesn’t know p. Corresponds to the Euclidean property.',
  },
  {
    name: 'D — consistency',
    short: 'D',
    schema: 'K__p -> M__p',
    vars: ['p'],
    correspondsTo: 'serial',
    gloss: 'A doesn’t know contradictions. Corresponds to seriality. Used as the *belief* analogue of T.',
  },
];

export type EpistemicAxiomVerdict = {
  axiom: EpistemicAxiomDef;
  agent: AgentId;
  valid: boolean;
  failure?: {
    substitution: Record<string, string>;
    world: WorldId;
  };
};

export function epistemicAxiomVerdicts(
  model: EpistemicModel,
): EpistemicAxiomVerdict[] {
  const out: EpistemicAxiomVerdict[] = [];
  for (const a of model.agents) {
    for (const ax of EPISTEMIC_AXIOMS) {
      out.push(verdictFor(ax, a, model));
    }
  }
  return out;
}

export function verdictFor(
  axiom: EpistemicAxiomDef,
  agent: AgentId,
  model: EpistemicModel,
): EpistemicAxiomVerdict {
  const atoms = atomCandidates(model, axiom.vars.length);
  const subs = enumerateSubs(axiom.vars, atoms);
  for (const sub of subs) {
    const f = instantiate(axiom.schema, agent, sub);
    for (const w of model.worlds) {
      if (!satisfiesE(f, model, w.id)) {
        return { axiom, agent, valid: false, failure: { substitution: sub, world: w.id } };
      }
    }
  }
  return { axiom, agent, valid: true };
}

// ---------- helpers ----------

function atomCandidates(model: EpistemicModel, varCount: number): string[] {
  const present = new Set<string>();
  for (const w of model.worlds) for (const a of w.atoms) present.add(a);
  const out = new Set<string>(present);
  for (let i = 0; i < Math.max(1, varCount); i++) {
    out.add(freshName(out, i));
  }
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
    for (const ts of tailSubs) {
      out.push({ [head]: a, ...ts });
    }
  }
  return out;
}

function instantiate(
  schema: string,
  agent: AgentId,
  sub: Record<string, string>,
): EpistemicFormula {
  // Replace the agent placeholder `_` with the actual agent name
  // before parsing. The placeholder appears immediately after K_ / M_.
  // Substitute the agent placeholder, padding with a space so atoms
  // adjacent to the placeholder don't get glued onto the agent name
  // (e.g. `K__p` must become `K_alice p`, not `K_alicep`).
  const withAgent = schema
    .replace(/K__/g, `K_${agent} `)
    .replace(/M__/g, `M_${agent} `);
  const r = parseEpistemic(withAgent);
  if (!r.ok) {
    throw new Error(`AXIOM schema unparseable: ${withAgent} (${r.error.message})`);
  }
  return rename(r.formula, sub);
}

function rename(f: EpistemicFormula, sub: Record<string, string>): EpistemicFormula {
  switch (f.kind) {
    case 'atom':
      return { kind: 'atom', name: sub[f.name] ?? f.name };
    case 'not':
      return { kind: 'not', body: rename(f.body, sub) };
    case 'know':
      return { kind: 'know', agent: f.agent, body: rename(f.body, sub) };
    case 'consider':
      return { kind: 'consider', agent: f.agent, body: rename(f.body, sub) };
    case 'and':
      return { kind: 'and', left: rename(f.left, sub), right: rename(f.right, sub) };
    case 'or':
      return { kind: 'or', left: rename(f.left, sub), right: rename(f.right, sub) };
    case 'implies':
      return { kind: 'implies', left: rename(f.left, sub), right: rename(f.right, sub) };
    case 'iff':
      return { kind: 'iff', left: rename(f.left, sub), right: rename(f.right, sub) };
  }
}
