// LTL satisfaction over a lasso trace.
//
// We compute SAT(φ) as a bit-set over the n positions of the trace.
// Bottom-up over the formula structure; the temporal operators
// X / F / G / U have closed-form fixed-point computations on a
// finite lasso:
//
//   next(i)  = i + 1            if i < n - 1
//            = loopBack          otherwise
//
//   SAT(p)        = { i : p ∈ V(s_i) }
//   SAT(¬φ)       = positions \ SAT(φ)
//   SAT(φ ∧ ψ)    = SAT(φ) ∩ SAT(ψ)            (and similarly for ∨/→/↔)
//   SAT(X φ)      = { i : next(i) ∈ SAT(φ) }
//   SAT(F φ)      = least S ⊇ SAT(φ) closed under "next(i) ∈ S → i ∈ S"
//   SAT(G φ)      = greatest S ⊆ SAT(φ) closed under "i ∈ S → next(i) ∈ S"
//   SAT(φ U ψ)    = least S ⊇ SAT(ψ) such that
//                    i ∈ SAT(φ) ∧ next(i) ∈ S ⇒ i ∈ S
//
// All four fixed points stabilise in ≤ n iterations on a trace of n
// positions; n is small in every example we ship.

import type { Trace, TemporalFormula } from './temporal-types';

export function satisfiesT(
  formula: TemporalFormula,
  trace: Trace,
  position?: number,
): boolean {
  const sat = satisfactionSetT(formula, trace);
  const at = position ?? trace.start ?? 0;
  return sat.has(at);
}

// Per-position truth map (StateId -> boolean). For the start-position
// the map's value is the LTL satisfaction at that index; elsewhere it's
// the satisfaction *of the same formula* read at that position.
export function satisfactionMapT(
  formula: TemporalFormula,
  trace: Trace,
): Record<string, boolean> {
  const sat = satisfactionSetT(formula, trace);
  const out: Record<string, boolean> = {};
  for (let i = 0; i < trace.states.length; i++) {
    out[trace.states[i]!.id] = sat.has(i);
  }
  return out;
}

// True iff the formula holds at every position of the trace.
export function validInTrace(
  formula: TemporalFormula,
  trace: Trace,
): { valid: boolean; failingState?: string } {
  const sat = satisfactionSetT(formula, trace);
  for (let i = 0; i < trace.states.length; i++) {
    if (!sat.has(i)) {
      return { valid: false, failingState: trace.states[i]!.id };
    }
  }
  return { valid: true };
}

// ---------- internals ----------

export function satisfactionSetT(
  formula: TemporalFormula,
  trace: Trace,
): Set<number> {
  const n = trace.states.length;
  const next = (i: number) => (i < n - 1 ? i + 1 : trace.loopBack);
  const all = new Set<number>();
  for (let i = 0; i < n; i++) all.add(i);

  const recur = (f: TemporalFormula): Set<number> => {
    switch (f.kind) {
      case 'atom': {
        const s = new Set<number>();
        for (let i = 0; i < n; i++) {
          if (trace.states[i]!.atoms.includes(f.name)) s.add(i);
        }
        return s;
      }
      case 'not': {
        const inner = recur(f.body);
        const s = new Set<number>();
        for (let i = 0; i < n; i++) if (!inner.has(i)) s.add(i);
        return s;
      }
      case 'and': {
        const l = recur(f.left); const r = recur(f.right);
        const s = new Set<number>();
        for (const i of l) if (r.has(i)) s.add(i);
        return s;
      }
      case 'or': {
        const l = recur(f.left); const r = recur(f.right);
        const s = new Set<number>(l);
        for (const i of r) s.add(i);
        return s;
      }
      case 'implies': {
        const l = recur(f.left); const r = recur(f.right);
        const s = new Set<number>();
        for (let i = 0; i < n; i++) if (!l.has(i) || r.has(i)) s.add(i);
        return s;
      }
      case 'iff': {
        const l = recur(f.left); const r = recur(f.right);
        const s = new Set<number>();
        for (let i = 0; i < n; i++) if (l.has(i) === r.has(i)) s.add(i);
        return s;
      }
      case 'next': {
        const inner = recur(f.body);
        const s = new Set<number>();
        for (let i = 0; i < n; i++) if (inner.has(next(i))) s.add(i);
        return s;
      }
      case 'always': {
        // greatest fixed-point of: S ⊆ inner ∧ (i ∈ S → next(i) ∈ S)
        const inner = recur(f.body);
        let s = new Set<number>(all);
        let changed = true;
        while (changed) {
          changed = false;
          const removals: number[] = [];
          for (const i of s) {
            if (!inner.has(i) || !s.has(next(i))) removals.push(i);
          }
          for (const i of removals) { s.delete(i); changed = true; }
        }
        return s;
      }
      case 'eventually': {
        // least fixed-point of: S ⊇ inner ∧ (next(i) ∈ S → i ∈ S)
        const inner = recur(f.body);
        const s = new Set<number>(inner);
        let changed = true;
        while (changed) {
          changed = false;
          for (let i = 0; i < n; i++) {
            if (!s.has(i) && s.has(next(i))) { s.add(i); changed = true; }
          }
        }
        return s;
      }
      case 'until': {
        // least fixed-point of: S ⊇ right ∧ (i ∈ left ∧ next(i) ∈ S → i ∈ S)
        const left = recur(f.left); const right = recur(f.right);
        const s = new Set<number>(right);
        let changed = true;
        while (changed) {
          changed = false;
          for (let i = 0; i < n; i++) {
            if (s.has(i)) continue;
            if (left.has(i) && s.has(next(i))) { s.add(i); changed = true; }
          }
        }
        return s;
      }
    }
  };

  return recur(formula);
}
