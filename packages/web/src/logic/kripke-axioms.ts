// Axiom-validity panel for a Kripke model.
//
// For a fixed list of canonical modal axioms (K, T, 4, 5, B, D),
// decide whether each is valid in the given model — i.e. forced at
// every world under every substitution of the schema's variables.
//
// We approximate "every substitution" by trying every assignment of
// the schema's atomic variables to the atoms actually present in the
// model. For schemas with one variable (most of these) and small
// models, that's a finite enumeration; the search space is small
// enough that we can afford to be exhaustive.
//
// When an axiom fails, we report a witness: the substitution + the
// world at which the instantiation isn't forced. This is what the UI
// surfaces in the "axioms in this model" table.

import { satisfies } from './kripke-eval';
import { parseModal } from './kripke-parser';
import type {
  KripkeModel,
  ModalFormula,
  WorldId,
} from './kripke-types';

export type AxiomDef = {
  // Conventional name, lowercase to match standard usage.
  name: string;
  // Short label for the panel ("K", "T", "4", "5", "B", "D").
  short: string;
  // The schema in the parser DSL with metavariables p, q, …
  schema: string;
  // Variables the schema quantifies over (in occurrence order).
  vars: string[];
  // Constraint on R that this axiom corresponds to (informational —
  // useful for the UI to show alongside the verdict).
  correspondsTo: 'reflexive' | 'symmetric' | 'transitive' | 'serial' | 'euclidean' | 'none';
};

// Canonical list, in pedagogical order.
export const AXIOMS: AxiomDef[] = [
  {
    name: 'K — distribution',
    short: 'K',
    schema: '[](p -> q) -> ([]p -> []q)',
    vars: ['p', 'q'],
    correspondsTo: 'none',
  },
  {
    name: 'T — necessity → actuality',
    short: 'T',
    schema: '[]p -> p',
    vars: ['p'],
    correspondsTo: 'reflexive',
  },
  {
    name: '4 — necessity nests',
    short: '4',
    schema: '[]p -> [][]p',
    vars: ['p'],
    correspondsTo: 'transitive',
  },
  {
    name: '5 — possibility is necessary',
    short: '5',
    schema: '<>p -> []<>p',
    vars: ['p'],
    correspondsTo: 'euclidean',
  },
  {
    name: 'B — symmetry',
    short: 'B',
    schema: 'p -> []<>p',
    vars: ['p'],
    correspondsTo: 'symmetric',
  },
  {
    name: 'D — necessity → possibility',
    short: 'D',
    schema: '[]p -> <>p',
    vars: ['p'],
    correspondsTo: 'serial',
  },
];

export type AxiomVerdict = {
  axiom: AxiomDef;
  // True when the schema is forced at every world for every
  // substitution we tried.
  valid: boolean;
  // When invalid, the substitution + the world that witnesses
  // the failure.
  failure?: {
    substitution: Record<string, string>;  // p → "q", "p", etc.
    world: WorldId;
  };
};

export function axiomVerdicts(model: KripkeModel): AxiomVerdict[] {
  return AXIOMS.map(a => verdictFor(a, model));
}

export function verdictFor(axiom: AxiomDef, model: KripkeModel): AxiomVerdict {
  const atoms = atomCandidates(model);
  const subs = enumerateSubs(axiom.vars, atoms);
  for (const sub of subs) {
    const f = instantiate(axiom.schema, sub);
    for (const w of model.worlds) {
      if (!satisfies(f, model, w.id)) {
        return { axiom, valid: false, failure: { substitution: sub, world: w.id } };
      }
    }
  }
  return { axiom, valid: true };
}

// ---------- helpers ----------

// Substitution targets. Always include the model's actual atoms so the
// failure witness uses a recognisable letter; also include a fresh
// "x" if the model has no atoms at all so we still cover the
// vacuous-valuation case.
function atomCandidates(model: KripkeModel): string[] {
  const atoms = new Set<string>();
  for (const w of model.worlds) for (const a of w.atoms) atoms.add(a);
  if (atoms.size === 0) atoms.add('x');
  return [...atoms];
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

function instantiate(schema: string, sub: Record<string, string>): ModalFormula {
  const r = parseModal(schema);
  if (!r.ok) {
    throw new Error(`AXIOMS schema unparseable: ${schema} (${r.error.message})`);
  }
  return rename(r.formula, sub);
}

function rename(f: ModalFormula, sub: Record<string, string>): ModalFormula {
  switch (f.kind) {
    case 'atom':
      return { kind: 'atom', name: sub[f.name] ?? f.name };
    case 'not':
      return { kind: 'not', body: rename(f.body, sub) };
    case 'box':
      return { kind: 'box', body: rename(f.body, sub) };
    case 'dia':
      return { kind: 'dia', body: rename(f.body, sub) };
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
