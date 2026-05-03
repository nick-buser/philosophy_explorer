import type { PropForm } from './aristotelian-types';
import type { ImportSetting } from './aristotelian-validity';

// Geometry and relationship table for the classical Square of Opposition.
//
//   ┌─── contrary (depends on import) ───┐
//   A ─────────────────────────────────── E
//   │ ╲                                ╱ │
//   │   ╲                            ╱   │
// sub-  contradictory ╳ contradictory  sub-
// alt   (always)        (always)       alt
//   │   ╱                            ╲   │
//   │ ╱                                ╲ │
//   I ─────────────────────────────────── O
//   └── subcontrary (depends on import) ─┘
//
// Subalternation A→I and E→O depend on existential import.
//
// See docs/formal-logic/aristotelian-syllogistic.md §Square of Opposition.

// ─────────────────────────────────────────────────────────────────────
// Geometry

export const SQUARE_LAYOUT = {
  WIDTH: 360,
  HEIGHT: 280,
  PAD: 56,
  CORNER_R: 28,
  LABEL_FONT_PX: 22,
  EDGE_LABEL_FONT_PX: 11,
  EDGE_STROKE: 1.4,
} as const;

export type CornerRole = PropForm; // 'A' | 'E' | 'I' | 'O'

export type Corner = {
  role: CornerRole;
  cx: number;
  cy: number;
  schemaText: string; // "All S is P", "No S is P", …
};

export type EdgeKind = 'contrary' | 'subcontrary' | 'subalternation' | 'contradictory';

export type Edge = {
  kind: EdgeKind;
  from: CornerRole;
  to: CornerRole;
  // True when this edge's relation holds under the active import setting.
  // Contradictory diagonals are always active; the other three depend on
  // existential import.
  active: boolean;
  label: string;
};

export type SquareLayout = {
  width: number;
  height: number;
  corners: Corner[];
  edges: Edge[];
};

// Build the layout. `importSetting` only affects which edges are drawn
// as "active" — geometry is constant.
export function buildSquareLayout(importSetting: ImportSetting): SquareLayout {
  const { WIDTH, HEIGHT, PAD } = SQUARE_LAYOUT;
  const left = PAD;
  const right = WIDTH - PAD;
  const top = PAD;
  const bottom = HEIGHT - PAD;

  const corners: Corner[] = [
    { role: 'A', cx: left,  cy: top,    schemaText: 'All S is P' },
    { role: 'E', cx: right, cy: top,    schemaText: 'No S is P' },
    { role: 'I', cx: left,  cy: bottom, schemaText: 'Some S is P' },
    { role: 'O', cx: right, cy: bottom, schemaText: 'Some S is not P' },
  ];

  const importDependent = importSetting === 'traditional';

  const edges: Edge[] = [
    { kind: 'contrary',       from: 'A', to: 'E', active: importDependent, label: 'contraries' },
    { kind: 'subcontrary',    from: 'I', to: 'O', active: importDependent, label: 'subcontraries' },
    { kind: 'subalternation', from: 'A', to: 'I', active: importDependent, label: 'subalt.' },
    { kind: 'subalternation', from: 'E', to: 'O', active: importDependent, label: 'subalt.' },
    { kind: 'contradictory',  from: 'A', to: 'O', active: true,            label: 'contradictories' },
    { kind: 'contradictory',  from: 'E', to: 'I', active: true,            label: 'contradictories' },
  ];

  return { width: WIDTH, height: HEIGHT, corners, edges };
}

export function cornerFor(role: CornerRole, layout: SquareLayout): Corner {
  return layout.corners.find(c => c.role === role)!;
}

// ─────────────────────────────────────────────────────────────────────
// Derived truth values
//
// Given that one corner is asserted true, derive the truth values of the
// other three under the chosen import setting.

export type Truth = 'true' | 'false' | 'unknown';

export type DerivedTruths = Record<CornerRole, Truth>;

export function deriveTruths(focused: CornerRole, importSetting: ImportSetting): DerivedTruths {
  const out: DerivedTruths = { A: 'unknown', E: 'unknown', I: 'unknown', O: 'unknown' };
  out[focused] = 'true';

  // Contradictories always hold.
  out[contradictoryOf(focused)] = 'false';

  if (importSetting === 'boolean') return out;

  // Traditional reading — apply contrary, subcontrary, subalternation.
  switch (focused) {
    case 'A':
      // A true ⇒ E false (contrary), I true (subalternation), O false (already)
      out.E = 'false';
      out.I = 'true';
      break;
    case 'E':
      // E true ⇒ A false (contrary), O true (subalternation), I false (already)
      out.A = 'false';
      out.O = 'true';
      break;
    case 'I':
      // I true ⇒ E false (already from contradictory), A unknown,
      // O unknown (subcontrary doesn't determine which one is true)
      break;
    case 'O':
      // O true ⇒ A false (already), E unknown, I unknown
      break;
  }

  return out;
}

function contradictoryOf(role: CornerRole): CornerRole {
  switch (role) {
    case 'A': return 'O';
    case 'O': return 'A';
    case 'E': return 'I';
    case 'I': return 'E';
  }
}

// Color hints used by the renderer. Kept here so the choice of palette
// is alongside the relationship semantics it describes.
export const EDGE_COLOR: Record<EdgeKind, string> = {
  contradictory:  '#f87171', // rose-400
  contrary:       '#fbbf24', // amber-400
  subcontrary:    '#60a5fa', // blue-400
  subalternation: '#34d399', // emerald-400
};
