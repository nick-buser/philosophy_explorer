import type { FrameClass, FrameClassSlug } from './kripke-types';

// Frame classes for phase 1: K, T, S4, S5.
//
// Each is a pure data record. Adding a new frame class (B, D, K4,
// KD45, …) is a data edit — no code branches reference these by
// name.
//
// Conventions for `constraints`:
//   reflexive  ::  ∀w. R(w, w)
//   symmetric  ::  ∀w u. R(w, u) → R(u, w)
//   transitive ::  ∀w u v. R(w, u) ∧ R(u, v) → R(w, v)
//   serial     ::  ∀w. ∃u. R(w, u)
//   euclidean  ::  ∀w u v. R(w, u) ∧ R(w, v) → R(u, v)
//
// S5's frames are equivalence relations (reflexive + symmetric +
// transitive); equivalently, reflexive + Euclidean. We list the
// equivalence-relation form because it's the most pedagogically
// transparent.

export const FRAMES: Record<FrameClassSlug, FrameClass> = {
  K: {
    slug: 'K',
    name: 'K — Minimal modal logic',
    constraints: [],
    characteristicAxiom: {
      natural: 'If necessarily (P implies Q), then necessarily-P implies necessarily-Q.',
      dsl: '[](p -> q) -> ([]p -> []q)',
      unicode: '□(p → q) → □p → □q',
    },
    description:
      'No constraints on the accessibility relation. Closed under the K axiom (distribution of □ over →) and the necessitation rule (if ⊢ φ then ⊢ □φ). Every other classical modal logic on this list extends K.',
  },
  T: {
    slug: 'T',
    name: 'T — Reflexive frames',
    constraints: ['reflexive'],
    characteristicAxiom: {
      natural: 'What is necessary is the case.',
      dsl: '[]p -> p',
      unicode: '□p → p',
    },
    description:
      'Every world accesses itself. Validates □p → p — the first step toward an alethic reading of necessity in which what is necessary really is so. Makes the actual world part of every possibility-set it can see.',
  },
  S4: {
    slug: 'S4',
    name: 'S4 — Reflexive and transitive frames',
    constraints: ['reflexive', 'transitive'],
    characteristicAxiom: {
      natural: 'What is necessary is necessarily necessary.',
      dsl: '[]p -> [][]p',
      unicode: '□p → □□p',
    },
    description:
      'T plus the 4 axiom (□p → □□p): nested necessities collapse upward. Natural for provability readings (anything provable is provably provable) and for treating necessity as truth-in-all-extensions of the current commitment.',
  },
  S5: {
    slug: 'S5',
    name: 'S5 — Equivalence-relation frames',
    constraints: ['reflexive', 'symmetric', 'transitive'],
    characteristicAxiom: {
      natural: 'What is possible is necessarily possible.',
      dsl: '<>p -> []<>p',
      unicode: '◇p → □◇p',
    },
    description:
      'Frames whose accessibility relation is an equivalence (equivalently: reflexive + Euclidean). Validates the 5 axiom (◇p → □◇p): possibility is itself necessary. The standard logic for metaphysical necessity in the Lewis–Kripke tradition; treats worlds in any equivalence class as wholly interchangeable.',
  },
};

// Display order on the picker.
export const FRAME_ORDER: FrameClassSlug[] = ['K', 'T', 'S4', 'S5'];

export const ALL_FRAMES: FrameClass[] = FRAME_ORDER.map(s => FRAMES[s]);

export function findFrame(slug: FrameClassSlug): FrameClass {
  return FRAMES[slug];
}
