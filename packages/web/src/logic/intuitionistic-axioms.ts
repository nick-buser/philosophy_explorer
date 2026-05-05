// Intuitionistic-axiom verdicts for an intuitionistic Kripke model.
//
// Mirrors `kripke-axioms.ts` but evaluates with the intuitionistic
// forcing engine. The interesting cell is the *classical* tautologies
// that are intuitionistically *invalid* — we surface them with their
// names and short labels so the verdict table doubles as a tour of
// the classical / intuitionistic divide.
//
// Each axiom is checked at every world in the model under every
// substitution of its schema variables into atoms occurring in the
// model. The two-variable-Peirce family makes the substitution space
// quadratic in atom count; that's fine — examples ship at ≤4 atoms.
//
// "Valid in this model" = forced at every world for every substitution
// we tried. The pedagogical point is that LEM, DNE, Peirce, etc. fail
// in a witness model that's just a 2-world chain — exactly what the
// classical axiom panel can never produce because classical logic
// validates them everywhere.

import { forces } from './intuitionistic-eval';
import { parseModal } from './kripke-parser';
import type {
  KripkeModel,
  ModalFormula,
  WorldId,
} from './kripke-types';

export type IntuitionisticAxiomKind = 'valid' | 'classical-only';

export type IntuitionisticAxiomDef = {
  // Conventional name.
  name: string;
  // Short label.
  short: string;
  // Schema in DSL with metavariables p, q, …
  schema: string;
  vars: string[];
  // 'valid'         — should be valid in every intuitionistic model
  //                   (so a fail in a particular model implies the
  //                   model is broken / not a pre-order).
  // 'classical-only' — classical tautology, intuitionistically
  //                   invalid: failing in some model is the expected
  //                   pedagogical outcome.
  kind: IntuitionisticAxiomKind;
  // Plain-English gloss.
  gloss: string;
};

export const INTUITIONISTIC_AXIOMS: IntuitionisticAxiomDef[] = [
  {
    name: 'modus ponens (→ elim)',
    short: 'MP',
    schema: '(p & (p -> q)) -> q',
    vars: ['p', 'q'],
    kind: 'valid',
    gloss: 'p and p → q together force q. Sound in every Kripke pre-order.',
  },
  {
    name: 'identity',
    short: 'I',
    schema: 'p -> p',
    vars: ['p'],
    kind: 'valid',
    gloss: 'φ → φ. Trivially intuitionistically valid.',
  },
  {
    name: '∧-introduction',
    short: '∧I',
    schema: '(p & q) -> p',
    vars: ['p', 'q'],
    kind: 'valid',
    gloss: 'Conjunction projection. Intuitionistically valid.',
  },
  {
    name: 'excluded middle (LEM)',
    short: 'LEM',
    schema: 'p | !p',
    vars: ['p'],
    kind: 'classical-only',
    gloss:
      'Classical tautology. Intuitionistically invalid: a witness world that hasn’t yet decided p forces neither p nor ¬p.',
  },
  {
    name: 'double-negation elimination',
    short: 'DNE',
    schema: '!!p -> p',
    vars: ['p'],
    kind: 'classical-only',
    gloss:
      'Classical. Intuitionistically the converse (p → ¬¬p) holds; this direction collapses constructive content.',
  },
  {
    name: 'Peirce’s law',
    short: 'Peirce',
    schema: '((p -> q) -> p) -> p',
    vars: ['p', 'q'],
    kind: 'classical-only',
    gloss:
      'Pure-implicational principle equivalent to LEM over →. Famously intuitionistically invalid.',
  },
  {
    name: 'weak excluded middle',
    short: 'wLEM',
    schema: '!p | !!p',
    vars: ['p'],
    kind: 'classical-only',
    gloss:
      'Classical. Failing in a 3-world fork model where p is undecided in two incomparable ways.',
  },
  {
    name: 'De Morgan (the non-intuitionistic half)',
    short: 'DM',
    schema: '!(p & q) -> (!p | !q)',
    vars: ['p', 'q'],
    kind: 'classical-only',
    gloss:
      'Classical. Intuitionistically the converse holds; this direction does not.',
  },
];

export type IntuitionisticAxiomVerdict = {
  axiom: IntuitionisticAxiomDef;
  valid: boolean;
  failure?: {
    substitution: Record<string, string>;
    world: WorldId;
  };
};

export function intuitionisticAxiomVerdicts(
  model: KripkeModel,
): IntuitionisticAxiomVerdict[] {
  return INTUITIONISTIC_AXIOMS.map(a => verdictFor(a, model));
}

export function verdictFor(
  axiom: IntuitionisticAxiomDef,
  model: KripkeModel,
): IntuitionisticAxiomVerdict {
  const atoms = atomCandidates(model, axiom.vars.length);
  const subs = enumerateSubs(axiom.vars, atoms);
  for (const sub of subs) {
    const f = instantiate(axiom.schema, sub);
    for (const w of model.worlds) {
      if (!forces(f, model, w.id)) {
        return { axiom, valid: false, failure: { substitution: sub, world: w.id } };
      }
    }
  }
  return { axiom, valid: true };
}

// ---------- helpers ----------

// Substitution targets. Includes the model's actual atoms *and* a few
// fresh names not present at any world — needed to stage classical-only
// counterexamples like Peirce's law, where one schema variable must
// stand for an atom that is forced nowhere.
function atomCandidates(model: KripkeModel, varCount: number): string[] {
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

function instantiate(schema: string, sub: Record<string, string>): ModalFormula {
  const r = parseModal(schema);
  if (!r.ok) {
    throw new Error(`AXIOM schema unparseable: ${schema} (${r.error.message})`);
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
