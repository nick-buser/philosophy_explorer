// Intuitionistic Kripke forcing.
//
// Reuses the classical ModalFormula AST and KripkeModel shape (a
// directed graph of worlds + atom valuations) but interprets it with
// intuitionistic semantics:
//
//   w ⊩ p          iff  p ∈ V(w)                                   (atom)
//   w ⊩ φ ∧ ψ      iff  w ⊩ φ  and  w ⊩ ψ                          (conj)
//   w ⊩ φ ∨ ψ      iff  w ⊩ φ  or   w ⊩ ψ                          (disj)
//   w ⊩ φ → ψ      iff  for all v ≥ w: v ⊩ φ implies v ⊩ ψ         (impl)
//   w ⊩ ¬φ         iff  for all v ≥ w: v ⊮ φ                       (neg, ≡ φ → ⊥)
//   w ⊩ φ ↔ ψ      iff  w ⊩ (φ → ψ) ∧ (ψ → φ)
//
// where v ≥ w means v is in the reflexive-transitive closure of R
// from w. Intuitionistic frames are pre-orders, but to be tolerant of
// hand-authored examples that violate that we always close R.
//
// Box / diamond operators have no intuitionistic reading in this
// fragment and trip an explicit error rather than evaluating
// silently. The Lab keeps □ / ◇ out of its slash-command palette.

import type { KripkeModel, ModalFormula, WorldId } from './kripke-types';

export class IntuitionisticEvalError extends Error {}

export function forces(
  formula: ModalFormula,
  model: KripkeModel,
  world: WorldId,
): boolean {
  const ctx = buildEvalContext(model);
  return forceAt(formula, ctx, world);
}

export function forcesMap(
  formula: ModalFormula,
  model: KripkeModel,
): Record<WorldId, boolean> {
  const ctx = buildEvalContext(model);
  const out: Record<WorldId, boolean> = {};
  for (const w of model.worlds) {
    out[w.id] = forceAt(formula, ctx, w.id);
  }
  return out;
}

// Forced at every world.
export function validInModel(
  formula: ModalFormula,
  model: KripkeModel,
): { valid: boolean; failingWorld?: WorldId } {
  const ctx = buildEvalContext(model);
  for (const w of model.worlds) {
    if (!forceAt(formula, ctx, w.id)) {
      return { valid: false, failingWorld: w.id };
    }
  }
  return { valid: true };
}

// ---------- internals ----------

type EvalContext = {
  atomsAt: Map<WorldId, Set<string>>;
  // upClosure[w] = { v : w R* v } including w itself.
  upClosure: Map<WorldId, WorldId[]>;
};

function buildEvalContext(model: KripkeModel): EvalContext {
  const atomsAt = new Map<WorldId, Set<string>>();
  for (const w of model.worlds) atomsAt.set(w.id, new Set(w.atoms));

  // Direct successors first.
  const succ = new Map<WorldId, Set<WorldId>>();
  for (const w of model.worlds) succ.set(w.id, new Set());
  for (const e of model.edges) {
    if (succ.has(e.from)) succ.get(e.from)!.add(e.to);
  }

  const upClosure = new Map<WorldId, WorldId[]>();
  for (const w of model.worlds) {
    const seen = new Set<WorldId>([w.id]);
    const queue: WorldId[] = [w.id];
    while (queue.length > 0) {
      const u = queue.shift()!;
      for (const v of succ.get(u) ?? []) {
        if (!seen.has(v)) {
          seen.add(v);
          queue.push(v);
        }
      }
    }
    upClosure.set(w.id, [...seen]);
  }
  return { atomsAt, upClosure };
}

function forceAt(
  f: ModalFormula,
  ctx: EvalContext,
  w: WorldId,
): boolean {
  switch (f.kind) {
    case 'atom':
      return ctx.atomsAt.get(w)?.has(f.name) ?? false;
    case 'and':
      return forceAt(f.left, ctx, w) && forceAt(f.right, ctx, w);
    case 'or':
      return forceAt(f.left, ctx, w) || forceAt(f.right, ctx, w);
    case 'implies':
      for (const v of ctx.upClosure.get(w) ?? [w]) {
        if (forceAt(f.left, ctx, v) && !forceAt(f.right, ctx, v)) return false;
      }
      return true;
    case 'not':
      for (const v of ctx.upClosure.get(w) ?? [w]) {
        if (forceAt(f.body, ctx, v)) return false;
      }
      return true;
    case 'iff': {
      const lr: ModalFormula = { kind: 'implies', left: f.left, right: f.right };
      const rl: ModalFormula = { kind: 'implies', left: f.right, right: f.left };
      return forceAt(lr, ctx, w) && forceAt(rl, ctx, w);
    }
    case 'box':
    case 'dia':
      throw new IntuitionisticEvalError(
        'intuitionistic logic has no modal operators (□ / ◇)',
      );
  }
}
