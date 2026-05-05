// CTL model checker — labelling algorithm.
//
// For each subformula, compute the set of states where it holds.
// Bottom-up over the AST. The fixed-point operators (EF, AF, EG, AG,
// EU, AU) iterate to convergence on a finite state space — straight
// out of the textbook (Clarke / Emerson / Sistla 1986).
//
// We require the model to be *serial* (every state has a successor).
// On a non-serial model, AG is over-permissive at dead ends (vacuous);
// that's fine semantically but we surface seriality as a diagnostic
// in the lab so users can spot the dead-end edge case.

import type { CtlFormula, KripkeModel } from './ctl-types';
import type { WorldId } from './kripke-types';

export function satisfiesC(
  formula: CtlFormula,
  model: KripkeModel,
  state: WorldId,
): boolean {
  return satisfactionSetC(formula, model).has(state);
}

export function satisfactionMapC(
  formula: CtlFormula,
  model: KripkeModel,
): Record<WorldId, boolean> {
  const sat = satisfactionSetC(formula, model);
  const out: Record<WorldId, boolean> = {};
  for (const w of model.worlds) out[w.id] = sat.has(w.id);
  return out;
}

export function validInModelC(
  formula: CtlFormula,
  model: KripkeModel,
): { valid: boolean; failingState?: WorldId } {
  const sat = satisfactionSetC(formula, model);
  for (const w of model.worlds) {
    if (!sat.has(w.id)) return { valid: false, failingState: w.id };
  }
  return { valid: true };
}

// ---------- internals ----------

export function satisfactionSetC(
  formula: CtlFormula,
  model: KripkeModel,
): Set<WorldId> {
  const succ = new Map<WorldId, Set<WorldId>>();
  const pred = new Map<WorldId, Set<WorldId>>();
  for (const w of model.worlds) {
    succ.set(w.id, new Set());
    pred.set(w.id, new Set());
  }
  for (const e of model.edges) {
    succ.get(e.from)?.add(e.to);
    pred.get(e.to)?.add(e.from);
  }

  const all = new Set<WorldId>(model.worlds.map(w => w.id));
  const atomsAt = new Map<WorldId, Set<string>>();
  for (const w of model.worlds) atomsAt.set(w.id, new Set(w.atoms));

  const recur = (f: CtlFormula): Set<WorldId> => {
    switch (f.kind) {
      case 'atom': {
        const s = new Set<WorldId>();
        for (const w of model.worlds) {
          if (atomsAt.get(w.id)?.has(f.name)) s.add(w.id);
        }
        return s;
      }
      case 'not': {
        const inner = recur(f.body);
        const s = new Set<WorldId>();
        for (const id of all) if (!inner.has(id)) s.add(id);
        return s;
      }
      case 'and': {
        const l = recur(f.left); const r = recur(f.right);
        const s = new Set<WorldId>();
        for (const id of l) if (r.has(id)) s.add(id);
        return s;
      }
      case 'or': {
        const l = recur(f.left); const r = recur(f.right);
        const s = new Set<WorldId>(l); for (const id of r) s.add(id); return s;
      }
      case 'implies': {
        const l = recur(f.left); const r = recur(f.right);
        const s = new Set<WorldId>();
        for (const id of all) if (!l.has(id) || r.has(id)) s.add(id);
        return s;
      }
      case 'iff': {
        const l = recur(f.left); const r = recur(f.right);
        const s = new Set<WorldId>();
        for (const id of all) if (l.has(id) === r.has(id)) s.add(id);
        return s;
      }
      case 'EX': {
        const inner = recur(f.body);
        const s = new Set<WorldId>();
        for (const id of all) {
          for (const v of succ.get(id) ?? []) {
            if (inner.has(v)) { s.add(id); break; }
          }
        }
        return s;
      }
      case 'AX': {
        const inner = recur(f.body);
        const s = new Set<WorldId>();
        for (const id of all) {
          const outs = succ.get(id) ?? new Set();
          let ok = true;
          for (const v of outs) {
            if (!inner.has(v)) { ok = false; break; }
          }
          if (ok) s.add(id);
        }
        return s;
      }
      case 'EF': {
        // least fixed point: SAT(f) ∪ EX X
        const inner = recur(f.body);
        const s = new Set<WorldId>(inner);
        const queue = [...inner];
        while (queue.length > 0) {
          const v = queue.shift()!;
          for (const u of pred.get(v) ?? []) {
            if (!s.has(u)) { s.add(u); queue.push(u); }
          }
        }
        return s;
      }
      case 'AF': {
        // least fixed point: SAT(f) ∪ AX X
        const inner = recur(f.body);
        let s = new Set<WorldId>(inner);
        let changed = true;
        while (changed) {
          changed = false;
          for (const id of all) {
            if (s.has(id)) continue;
            const outs = succ.get(id) ?? new Set();
            if (outs.size === 0) continue;       // dead end — AX X vacuously true would loop
            let ok = true;
            for (const v of outs) {
              if (!s.has(v)) { ok = false; break; }
            }
            if (ok) { s.add(id); changed = true; }
          }
        }
        return s;
      }
      case 'EG': {
        // greatest fixed point: SAT(f) ∩ EX X
        const inner = recur(f.body);
        let s = new Set<WorldId>(inner);
        let changed = true;
        while (changed) {
          changed = false;
          const removals: WorldId[] = [];
          for (const id of s) {
            const outs = succ.get(id) ?? new Set();
            let any = false;
            for (const v of outs) {
              if (s.has(v)) { any = true; break; }
            }
            if (!any) removals.push(id);
          }
          for (const id of removals) { s.delete(id); changed = true; }
        }
        return s;
      }
      case 'AG': {
        // greatest fixed point: SAT(f) ∩ AX X
        const inner = recur(f.body);
        let s = new Set<WorldId>(inner);
        let changed = true;
        while (changed) {
          changed = false;
          const removals: WorldId[] = [];
          for (const id of s) {
            const outs = succ.get(id) ?? new Set();
            let allIn = true;
            for (const v of outs) {
              if (!s.has(v)) { allIn = false; break; }
            }
            if (!allIn) removals.push(id);
          }
          for (const id of removals) { s.delete(id); changed = true; }
        }
        return s;
      }
      case 'EU': {
        // least fixed point: SAT(right) ∪ (SAT(left) ∩ EX X)
        const left = recur(f.left); const right = recur(f.right);
        const s = new Set<WorldId>(right);
        const queue = [...right];
        while (queue.length > 0) {
          const v = queue.shift()!;
          for (const u of pred.get(v) ?? []) {
            if (s.has(u)) continue;
            if (!left.has(u)) continue;
            s.add(u); queue.push(u);
          }
        }
        return s;
      }
      case 'AU': {
        // least fixed point: SAT(right) ∪ (SAT(left) ∩ AX X)
        const left = recur(f.left); const right = recur(f.right);
        let s = new Set<WorldId>(right);
        let changed = true;
        while (changed) {
          changed = false;
          for (const id of all) {
            if (s.has(id)) continue;
            if (!left.has(id)) continue;
            const outs = succ.get(id) ?? new Set();
            if (outs.size === 0) continue;
            let ok = true;
            for (const v of outs) {
              if (!s.has(v)) { ok = false; break; }
            }
            if (ok) { s.add(id); changed = true; }
          }
        }
        return s;
      }
    }
  };

  return recur(formula);
}
