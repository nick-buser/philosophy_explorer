// Frame-constraint diagnostics for a Kripke model.
//
// Given a model, decide which structural constraints its accessibility
// relation R actually satisfies (reflexive, symmetric, transitive,
// serial, euclidean) and surface witnesses when a constraint fails.
//
// Used by the Lab to:
//   • flag mismatches between a model's declared frameClass and the
//     constraints its R actually meets;
//   • drive the "fix model" auto-completion (close R under the
//     constraints of a chosen frame class).
//
// All functions are pure and operate on the existing KripkeModel
// shape — no new data types required.

import { FRAMES } from './kripke-frames';
import type {
  AccessibilityEdge,
  FrameClassSlug,
  FrameConstraint,
  KripkeModel,
  WorldId,
} from './kripke-types';

// ---------- per-constraint checks ----------

export type ConstraintCheck =
  | { holds: true }
  | { holds: false; witness: ConstraintWitness };

// What a violation looks like, per constraint. The shape is constraint-
// specific so the UI can describe the failure precisely.
export type ConstraintWitness =
  | { kind: 'reflexive';  world: WorldId }
  | { kind: 'symmetric';  from: WorldId; to: WorldId }
  | { kind: 'transitive'; via: [WorldId, WorldId, WorldId] } // R(a,b), R(b,c), but not R(a,c)
  | { kind: 'serial';     world: WorldId }
  | { kind: 'euclidean';  via: [WorldId, WorldId, WorldId] };

export function isReflexive(model: KripkeModel): ConstraintCheck {
  const succ = successorIndex(model);
  for (const w of model.worlds) {
    if (!succ.get(w.id)?.has(w.id)) {
      return { holds: false, witness: { kind: 'reflexive', world: w.id } };
    }
  }
  return { holds: true };
}

export function isSymmetric(model: KripkeModel): ConstraintCheck {
  const succ = successorIndex(model);
  for (const e of model.edges) {
    if (!succ.get(e.to)?.has(e.from)) {
      return {
        holds: false,
        witness: { kind: 'symmetric', from: e.from, to: e.to },
      };
    }
  }
  return { holds: true };
}

export function isTransitive(model: KripkeModel): ConstraintCheck {
  const succ = successorIndex(model);
  for (const a of model.worlds) {
    const bs = succ.get(a.id);
    if (!bs) continue;
    for (const b of bs) {
      const cs = succ.get(b);
      if (!cs) continue;
      for (const c of cs) {
        if (!succ.get(a.id)?.has(c)) {
          return {
            holds: false,
            witness: { kind: 'transitive', via: [a.id, b, c] },
          };
        }
      }
    }
  }
  return { holds: true };
}

export function isSerial(model: KripkeModel): ConstraintCheck {
  const succ = successorIndex(model);
  for (const w of model.worlds) {
    const out = succ.get(w.id);
    if (!out || out.size === 0) {
      return { holds: false, witness: { kind: 'serial', world: w.id } };
    }
  }
  return { holds: true };
}

export function isEuclidean(model: KripkeModel): ConstraintCheck {
  const succ = successorIndex(model);
  for (const a of model.worlds) {
    const outs = succ.get(a.id);
    if (!outs) continue;
    const arr = [...outs];
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length; j++) {
        const b = arr[i]!;
        const c = arr[j]!;
        if (b === c) continue;
        if (!succ.get(b)?.has(c)) {
          return {
            holds: false,
            witness: { kind: 'euclidean', via: [a.id, b, c] },
          };
        }
      }
    }
  }
  return { holds: true };
}

const CHECKERS: Record<FrameConstraint, (m: KripkeModel) => ConstraintCheck> = {
  reflexive:  isReflexive,
  symmetric:  isSymmetric,
  transitive: isTransitive,
  serial:     isSerial,
  euclidean:  isEuclidean,
};

// ---------- aggregate diagnostics ----------

export type FrameDiagnostics = {
  // For every constraint, the verdict on this model's R.
  perConstraint: Record<FrameConstraint, ConstraintCheck>;
  // Convenience: the set of constraints that hold.
  satisfied: FrameConstraint[];
};

export function frameDiagnostics(model: KripkeModel): FrameDiagnostics {
  const perConstraint = {} as Record<FrameConstraint, ConstraintCheck>;
  const satisfied: FrameConstraint[] = [];
  for (const c of Object.keys(CHECKERS) as FrameConstraint[]) {
    const v = CHECKERS[c](model);
    perConstraint[c] = v;
    if (v.holds) satisfied.push(c);
  }
  return { perConstraint, satisfied };
}

// Validate a model against the constraints declared by a frame class.
// Returns the list of violations (empty = model honours the class).
export function validateAgainst(
  model: KripkeModel,
  frameSlug: FrameClassSlug,
): { ok: boolean; violations: ConstraintCheck[] } {
  const frame = FRAMES[frameSlug];
  const violations: ConstraintCheck[] = [];
  for (const c of frame.constraints) {
    const v = CHECKERS[c](model);
    if (!v.holds) violations.push(v);
  }
  return { ok: violations.length === 0, violations };
}

// ---------- closure operations (the "fix model" actions) ----------

// Add the smallest set of edges required to make R satisfy the given
// constraints. Used by the Lab's "fix model" affordance — picks up an
// inconsistent model and snaps it to the nearest frame in the chosen
// class.
//
// The algorithm is: iterate (reflexive → symmetric → transitive
// → euclidean → serial) until the model is stable. Each pass is
// idempotent and only adds edges, never removes them, so the loop
// terminates in finite worlds.
export function closeUnder(
  model: KripkeModel,
  constraints: FrameConstraint[],
): KripkeModel {
  if (constraints.length === 0) return model;
  let edges = dedupeEdges(model.edges);
  let changed = true;
  // Bound generously; each iteration only ever adds edges in a finite
  // model, so this terminates regardless.
  let guard = 0;
  while (changed && guard++ < 100) {
    changed = false;
    if (constraints.includes('reflexive')) {
      const next = addReflexive(edges, model.worlds.map(w => w.id));
      if (next.length !== edges.length) { edges = next; changed = true; }
    }
    if (constraints.includes('symmetric')) {
      const next = addSymmetric(edges);
      if (next.length !== edges.length) { edges = next; changed = true; }
    }
    if (constraints.includes('transitive')) {
      const next = addTransitive(edges);
      if (next.length !== edges.length) { edges = next; changed = true; }
    }
    if (constraints.includes('euclidean')) {
      const next = addEuclidean(edges);
      if (next.length !== edges.length) { edges = next; changed = true; }
    }
    if (constraints.includes('serial')) {
      const next = addSerial(edges, model.worlds.map(w => w.id));
      if (next.length !== edges.length) { edges = next; changed = true; }
    }
  }
  return { ...model, edges };
}

export function closeUnderFrame(
  model: KripkeModel,
  frameSlug: FrameClassSlug,
): KripkeModel {
  return closeUnder(model, FRAMES[frameSlug].constraints);
}

// ---------- helpers ----------

function successorIndex(model: KripkeModel): Map<WorldId, Set<WorldId>> {
  const idx = new Map<WorldId, Set<WorldId>>();
  for (const w of model.worlds) idx.set(w.id, new Set());
  for (const e of model.edges) {
    if (!idx.has(e.from)) idx.set(e.from, new Set());
    idx.get(e.from)!.add(e.to);
  }
  return idx;
}

function dedupeEdges(edges: AccessibilityEdge[]): AccessibilityEdge[] {
  const seen = new Set<string>();
  const out: AccessibilityEdge[] = [];
  for (const e of edges) {
    const k = `${e.from}->${e.to}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}

function addReflexive(edges: AccessibilityEdge[], worlds: WorldId[]): AccessibilityEdge[] {
  const have = new Set(edges.map(e => `${e.from}->${e.to}`));
  const out = [...edges];
  for (const w of worlds) {
    if (!have.has(`${w}->${w}`)) out.push({ from: w, to: w });
  }
  return out;
}

function addSymmetric(edges: AccessibilityEdge[]): AccessibilityEdge[] {
  const have = new Set(edges.map(e => `${e.from}->${e.to}`));
  const out = [...edges];
  for (const e of edges) {
    const k = `${e.to}->${e.from}`;
    if (!have.has(k)) {
      have.add(k);
      out.push({ from: e.to, to: e.from });
    }
  }
  return out;
}

function addTransitive(edges: AccessibilityEdge[]): AccessibilityEdge[] {
  // Floyd-Warshall-esque single pass; the outer loop in closeUnder
  // re-runs until stable, so a single pass per call is sufficient.
  const have = new Set(edges.map(e => `${e.from}->${e.to}`));
  const succ = new Map<WorldId, Set<WorldId>>();
  for (const e of edges) {
    if (!succ.has(e.from)) succ.set(e.from, new Set());
    succ.get(e.from)!.add(e.to);
  }
  const out = [...edges];
  for (const [a, bs] of succ) {
    for (const b of bs) {
      const cs = succ.get(b);
      if (!cs) continue;
      for (const c of cs) {
        const k = `${a}->${c}`;
        if (!have.has(k)) {
          have.add(k);
          out.push({ from: a, to: c });
        }
      }
    }
  }
  return out;
}

function addEuclidean(edges: AccessibilityEdge[]): AccessibilityEdge[] {
  const have = new Set(edges.map(e => `${e.from}->${e.to}`));
  const succ = new Map<WorldId, Set<WorldId>>();
  for (const e of edges) {
    if (!succ.has(e.from)) succ.set(e.from, new Set());
    succ.get(e.from)!.add(e.to);
  }
  const out = [...edges];
  for (const [, outs] of succ) {
    const arr = [...outs];
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length; j++) {
        if (i === j) continue;
        const b = arr[i]!;
        const c = arr[j]!;
        const k = `${b}->${c}`;
        if (!have.has(k)) {
          have.add(k);
          out.push({ from: b, to: c });
        }
      }
    }
  }
  return out;
}

function addSerial(edges: AccessibilityEdge[], worlds: WorldId[]): AccessibilityEdge[] {
  const succ = new Map<WorldId, number>();
  for (const w of worlds) succ.set(w, 0);
  for (const e of edges) succ.set(e.from, (succ.get(e.from) ?? 0) + 1);
  const out = [...edges];
  for (const [w, count] of succ) {
    if (count === 0) {
      // Make w serial by adding a self-loop. Cheapest fix and
      // doesn't introduce a fresh world.
      out.push({ from: w, to: w });
    }
  }
  return out;
}
