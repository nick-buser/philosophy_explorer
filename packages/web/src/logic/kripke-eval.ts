// Kripke satisfaction engine.
//
// Pure recursive evaluator: `satisfies(formula, model, world)` decides
// whether `model, world ⊨ formula`. Replaces the hand-authored
// `satisfied: boolean` field that shipped in FEAT-006 and was flagged
// in `kripke-modal-logic.md` §Open question 5 ("is the static field
// honest?") — answer, after this ticket: no, it's now computed.
//
// Conventions:
//   • Atoms not listed at a world are false (closed-world per the
//     KripkeModel design).
//   • R is the directed edges of the model. □ quantifies over
//     successors of the current world; ◇ over the same.
//   • All operators are defined classically; the intuitionistic
//     variant lives in its own engine (next ticket) because its →
//     and ¬ quantify over an upward-closure rather than evaluating
//     pointwise.

import type { KripkeModel, ModalFormula, WorldId } from './kripke-types';

export function satisfies(
  formula: ModalFormula,
  model: KripkeModel,
  world: WorldId,
): boolean {
  const ctx = buildEvalContext(model);
  return evalAt(formula, ctx, world);
}

// Evaluate at every world; returns a map { worldId → bool } so the UI
// can label each node without re-walking the AST per world.
export function satisfactionMap(
  formula: ModalFormula,
  model: KripkeModel,
): Record<WorldId, boolean> {
  const ctx = buildEvalContext(model);
  const out: Record<WorldId, boolean> = {};
  for (const w of model.worlds) {
    out[w.id] = evalAt(formula, ctx, w.id);
  }
  return out;
}

// "Validity in a model" = forced at every world. The contrast with
// "truth at the designated world" matters once the engine is honest:
// many shipped examples are designated-world-true but not model-valid,
// and the axiom panel in particular wants the universal sense.
export function validInModel(
  formula: ModalFormula,
  model: KripkeModel,
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
  // atom valuation as a per-world Set for O(1) membership.
  atomsAt: Map<WorldId, Set<string>>;
  // successors[w] = { v : R(w, v) } for □ / ◇.
  successors: Map<WorldId, WorldId[]>;
};

function buildEvalContext(model: KripkeModel): EvalContext {
  const worldIds = new Set(model.worlds.map(w => w.id));
  const atomsAt = new Map<WorldId, Set<string>>();
  for (const w of model.worlds) {
    atomsAt.set(w.id, new Set(w.atoms));
  }
  const successors = new Map<WorldId, WorldId[]>();
  for (const id of worldIds) successors.set(id, []);
  for (const e of model.edges) {
    // Edges to undeclared worlds are silently ignored; the
    // system-data test catches those at seed-load time.
    if (!worldIds.has(e.from) || !worldIds.has(e.to)) continue;
    successors.get(e.from)!.push(e.to);
  }
  return { worldIds, atomsAt, successors };
}

function evalAt(
  f: ModalFormula,
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
    case 'box':
      for (const v of ctx.successors.get(w) ?? []) {
        if (!evalAt(f.body, ctx, v)) return false;
      }
      return true;
    case 'dia':
      for (const v of ctx.successors.get(w) ?? []) {
        if (evalAt(f.body, ctx, v)) return true;
      }
      return false;
  }
}
