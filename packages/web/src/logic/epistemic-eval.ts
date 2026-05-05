// Multi-agent epistemic satisfaction.
//
// Conventions match the modal engine:
//   K_a φ holds at w iff for every v with R_a(w, v): v ⊨ φ
//   M_a φ holds at w iff for some v with R_a(w, v):  v ⊨ φ  (≡ ¬K_a ¬φ)
// All other connectives evaluate pointwise. The agent index is kept
// outside the AST shape so that adding common-knowledge / distributed-
// knowledge later only needs new cases here.

import type {
  AgentId,
  EpistemicFormula,
  EpistemicModel,
  WorldId,
} from './epistemic-types';

export function satisfiesE(
  formula: EpistemicFormula,
  model: EpistemicModel,
  world: WorldId,
): boolean {
  const ctx = buildEvalContext(model);
  return evalAt(formula, ctx, world);
}

export function satisfactionMapE(
  formula: EpistemicFormula,
  model: EpistemicModel,
): Record<WorldId, boolean> {
  const ctx = buildEvalContext(model);
  const out: Record<WorldId, boolean> = {};
  for (const w of model.worlds) out[w.id] = evalAt(formula, ctx, w.id);
  return out;
}

export function validInModelE(
  formula: EpistemicFormula,
  model: EpistemicModel,
): { valid: boolean; failingWorld?: WorldId } {
  const ctx = buildEvalContext(model);
  for (const w of model.worlds) {
    if (!evalAt(formula, ctx, w.id)) {
      return { valid: false, failingWorld: w.id };
    }
  }
  return { valid: true };
}

// ---------- internals ----------

type EvalContext = {
  worldIds: Set<WorldId>;
  atomsAt: Map<WorldId, Set<string>>;
  // successors[a]?[w] = { v : R_a(w, v) }
  successors: Map<AgentId, Map<WorldId, WorldId[]>>;
};

function buildEvalContext(model: EpistemicModel): EvalContext {
  const worldIds = new Set(model.worlds.map(w => w.id));
  const atomsAt = new Map<WorldId, Set<string>>();
  for (const w of model.worlds) atomsAt.set(w.id, new Set(w.atoms));

  const successors = new Map<AgentId, Map<WorldId, WorldId[]>>();
  for (const a of model.agents) {
    const m = new Map<WorldId, WorldId[]>();
    for (const id of worldIds) m.set(id, []);
    successors.set(a, m);
  }
  for (const e of model.edges) {
    if (!worldIds.has(e.from) || !worldIds.has(e.to)) continue;
    const am = successors.get(e.agent);
    if (!am) continue;
    am.get(e.from)!.push(e.to);
  }
  return { worldIds, atomsAt, successors };
}

function evalAt(
  f: EpistemicFormula,
  ctx: EvalContext,
  w: WorldId,
): boolean {
  switch (f.kind) {
    case 'atom':
      return ctx.atomsAt.get(w)?.has(f.name) ?? false;
    case 'not':
      return !evalAt(f.body, ctx, w);
    case 'and':
      return evalAt(f.left, ctx, w) && evalAt(f.right, ctx, w);
    case 'or':
      return evalAt(f.left, ctx, w) || evalAt(f.right, ctx, w);
    case 'implies':
      return !evalAt(f.left, ctx, w) || evalAt(f.right, ctx, w);
    case 'iff':
      return evalAt(f.left, ctx, w) === evalAt(f.right, ctx, w);
    case 'know': {
      const succ = ctx.successors.get(f.agent)?.get(w) ?? [];
      for (const v of succ) {
        if (!evalAt(f.body, ctx, v)) return false;
      }
      return true;
    }
    case 'consider': {
      const succ = ctx.successors.get(f.agent)?.get(w) ?? [];
      for (const v of succ) {
        if (evalAt(f.body, ctx, v)) return true;
      }
      return false;
    }
  }
}
