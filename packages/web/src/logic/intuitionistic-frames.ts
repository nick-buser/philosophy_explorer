// Frame-shape diagnostics for an intuitionistic Kripke model.
//
// An intuitionistic Kripke frame is a pre-order (W, ≤) — reflexive
// and transitive — with a monotone valuation:
//
//   atom-persistence:  if w ≤ v then V(w) ⊆ V(v)
//
// (This persistence is automatically inherited by every formula in
// the intuitionistic fragment; the monotonicity check at the atom
// level is what guarantees it.)
//
// We surface three verdicts:
//   • is the relation reflexive?
//   • is it transitive?
//   • is the atom valuation monotone?
//
// When a verdict fails, we return a witness that the UI can phrase.
// `closeFrame` produces the smallest pre-order extension of the input
// (reflexive + transitive closure of R), and `closeValuation` lifts
// atoms forward along R so the resulting model is monotone.

import type { KripkeModel, WorldId } from './kripke-types';
import {
  closeUnder,
  isReflexive,
  isTransitive,
} from './kripke-frame-check';

export type MonotonicityCheck =
  | { holds: true }
  | { holds: false; witness: { from: WorldId; to: WorldId; atom: string } };

export type IntuitionisticDiagnostics = {
  reflexive:    { holds: boolean };
  transitive:   { holds: boolean };
  monotone:     MonotonicityCheck;
  // Convenience: the model is a valid intuitionistic frame iff all
  // three hold.
  isValidFrame: boolean;
};

export function intuitionisticDiagnostics(model: KripkeModel): IntuitionisticDiagnostics {
  const refl = isReflexive(model);
  const trans = isTransitive(model);
  const mono = isMonotone(model);
  return {
    reflexive: { holds: refl.holds },
    transitive: { holds: trans.holds },
    monotone: mono,
    isValidFrame: refl.holds && trans.holds && mono.holds,
  };
}

// Atom persistence: for every edge w → v, V(w) ⊆ V(v).
export function isMonotone(model: KripkeModel): MonotonicityCheck {
  const atomsAt = new Map<WorldId, Set<string>>();
  for (const w of model.worlds) atomsAt.set(w.id, new Set(w.atoms));
  for (const e of model.edges) {
    const from = atomsAt.get(e.from);
    const to = atomsAt.get(e.to);
    if (!from || !to) continue;
    for (const a of from) {
      if (!to.has(a)) {
        return { holds: false, witness: { from: e.from, to: e.to, atom: a } };
      }
    }
  }
  return { holds: true };
}

// Reflexive + transitive closure of R. Edges-only; valuation untouched.
export function closeFrame(model: KripkeModel): KripkeModel {
  return closeUnder(model, ['reflexive', 'transitive']);
}

// Push every atom forward along R to make V monotone. Idempotent — once
// applied, isMonotone(out) = true.
//
// This does NOT take the reflexive/transitive closure of R; it just
// propagates atoms to upward-closed sets under whatever R already is.
// Pair with closeFrame if you want a full pre-order.
export function closeValuation(model: KripkeModel): KripkeModel {
  // Compute upward closure once.
  const succ = new Map<WorldId, Set<WorldId>>();
  for (const w of model.worlds) succ.set(w.id, new Set());
  for (const e of model.edges) succ.get(e.from)?.add(e.to);

  const upward = new Map<WorldId, Set<WorldId>>();
  for (const w of model.worlds) {
    const seen = new Set<WorldId>([w.id]);
    const queue: WorldId[] = [w.id];
    while (queue.length > 0) {
      const u = queue.shift()!;
      for (const v of succ.get(u) ?? []) {
        if (!seen.has(v)) { seen.add(v); queue.push(v); }
      }
    }
    upward.set(w.id, seen);
  }

  // For each world w, for each atom in V(w), force it at every world in
  // up(w).
  const newAtoms = new Map<WorldId, Set<string>>();
  for (const w of model.worlds) newAtoms.set(w.id, new Set(w.atoms));
  for (const w of model.worlds) {
    for (const atom of w.atoms) {
      for (const v of upward.get(w.id) ?? []) {
        newAtoms.get(v)?.add(atom);
      }
    }
  }
  return {
    ...model,
    worlds: model.worlds.map(w => ({
      ...w,
      atoms: [...(newAtoms.get(w.id) ?? new Set())].sort(),
    })),
  };
}
