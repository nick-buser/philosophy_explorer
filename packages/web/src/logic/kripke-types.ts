// Kripke / modal-logic types.
//
// Phase 1: propositional modal logic with a single accessibility
// relation. Multi-agent indexed modalities ([a]p, K_a p) are phase 2
// and will extend the AST with an optional agent index on box/dia.

// ---------- Formula AST ----------

export type ModalFormula =
  | { kind: 'atom';    name: string }
  | { kind: 'not';     body: ModalFormula }
  | { kind: 'box';     body: ModalFormula }   // □
  | { kind: 'dia';     body: ModalFormula }   // ◇
  | { kind: 'and';     left: ModalFormula; right: ModalFormula }
  | { kind: 'or';      left: ModalFormula; right: ModalFormula }
  | { kind: 'implies'; left: ModalFormula; right: ModalFormula }
  | { kind: 'iff';     left: ModalFormula; right: ModalFormula };

// ---------- Kripke model ----------

export type WorldId = string;

export type World = {
  id: WorldId;
  label?: string;
  // Atoms true at this world. Anything not listed is false
  // (closed-world for the visualization).
  atoms: string[];
};

export type AccessibilityEdge = {
  from: WorldId;
  to: WorldId;
};

export type KripkeModel = {
  worlds: World[];
  edges: AccessibilityEdge[];
  // The "actual world" — where ⊨ is evaluated for the truth badge.
  designated?: WorldId;
};

// ---------- Frame classes ----------

export type FrameClassSlug = 'K' | 'T' | 'S4' | 'S5';

export type FrameConstraint =
  | 'reflexive'
  | 'symmetric'
  | 'transitive'
  | 'serial'
  | 'euclidean';

export type FrameClass = {
  slug: FrameClassSlug;
  name: string;
  constraints: FrameConstraint[];
  // The axiom schema characteristic of this frame class.
  characteristicAxiom: {
    natural: string;  // "If necessarily P then P"
    dsl: string;      // "[]p -> p"
    unicode: string;  // "□p → p"
  };
  description: string;
};
