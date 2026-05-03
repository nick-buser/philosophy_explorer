import type { Syllogism } from './aristotelian-types';
import {
  layoutProposition as layoutAssertoricProposition,
  layoutSyllogism as layoutAssertoricSyllogism,
  type Layout as AristotelianLayout,
  type CircleRole,
} from './aristotelian-layout';
import type {
  ModalProposition,
  ModalSyllogism,
  SoritesChain,
} from './medieval-types';

// Layout for medieval syllogistic visuals.
//
// Modal syllogism: reuse the Aristotelian 3-circle Venn for shading,
// then overlay `□`/`◇` glyphs near each modally-annotated premise.
// Each glyph is anchored along the centre line connecting the two
// circles touched by its premise (subject-circle and predicate-circle),
// offset outward so it doesn't sit on top of a shaded region or ×.
//
// Sorites: a horizontal chain of term-nodes connected by step-edges.
// One node per distinct term, one edge per syllogism step.

// ─────────────────────────────────────────────────────────────────────
// Modal syllogism layout

export type ModalGlyph = {
  cx: number;
  cy: number;
  symbol: string;          // '□' | '◇'
  premiseRole: 'major' | 'minor' | 'conclusion';
};

export type ModalSyllogismLayout = AristotelianLayout & {
  glyphs: ModalGlyph[];
};

const GLYPH_OUTSET = 24;     // pixels beyond the circle pair midpoint, away from the centre

export function layoutModalSyllogism(s: ModalSyllogism): ModalSyllogismLayout {
  const assertoric: Syllogism = {
    major: s.major.base,
    minor: s.minor.base,
    conclusion: s.conclusion.base,
    middle: s.middle,
    mood: s.assertoricMood,
    figure: s.figure,
  };
  const base = layoutAssertoricSyllogism(assertoric);

  const sCircle = base.circles.find(c => c.role === 'S')!;
  const pCircle = base.circles.find(c => c.role === 'P')!;
  const mCircle = base.circles.find(c => c.role === 'M')!;
  const centre = {
    x: (sCircle.cx + pCircle.cx + mCircle.cx) / 3,
    y: (sCircle.cy + pCircle.cy + mCircle.cy) / 3,
  };

  const glyphs: ModalGlyph[] = [];

  function addGlyph(
    prem: ModalProposition,
    role: 'major' | 'minor' | 'conclusion',
  ) {
    if (prem.mode === 'X') return;
    const subjectRole = roleOfTerm(s, prem.base.subject);
    const predicateRole = roleOfTerm(s, prem.base.predicate);
    if (!subjectRole || !predicateRole) return;
    const cs = base.circles.find(c => c.role === subjectRole)!;
    const cp = base.circles.find(c => c.role === predicateRole)!;
    const mid = { x: (cs.cx + cp.cx) / 2, y: (cs.cy + cp.cy) / 2 };
    // Push the glyph along the vector (mid - centre) so it sits
    // *outside* the triangle of circle centres rather than at the
    // already-busy intersection.
    const dx = mid.x - centre.x;
    const dy = mid.y - centre.y;
    const len = Math.hypot(dx, dy) || 1;
    const cx = mid.x + GLYPH_OUTSET * dx / len;
    const cy = mid.y + GLYPH_OUTSET * dy / len;
    glyphs.push({
      cx, cy,
      symbol: prem.mode === 'L' ? '□' : '◇',  // □ or ◇
      premiseRole: role,
    });
  }

  addGlyph(s.major, 'major');
  addGlyph(s.minor, 'minor');
  addGlyph(s.conclusion, 'conclusion');

  return { ...base, glyphs };
}

function roleOfTerm(s: ModalSyllogism, term: string): CircleRole | null {
  if (term === s.conclusion.base.subject) return 'S';
  if (term === s.conclusion.base.predicate) return 'P';
  if (term === s.middle) return 'M';
  return null;
}

// ─────────────────────────────────────────────────────────────────────
// Sorites layout — a horizontal chain of term-nodes with step labels.

export const SORITES_LAYOUT = {
  NODE_W: 110,
  NODE_H: 36,
  GAP: 60,             // horizontal space between nodes (where the edge lives)
  PAD: 24,
  STEP_LABEL_FONT: 11,
  TERM_LABEL_FONT: 13,
} as const;

export type SoritesNode = {
  x: number;
  y: number;
  w: number;
  h: number;
  term: string;
  index: number;       // 0-based position in the chain
};

export type SoritesEdge = {
  from: number;        // node index
  to: number;
  label: string;       // 'Barbara' / step name
  midX: number;
  midY: number;
  failed: boolean;     // true if this step failed validity
};

export type SoritesLayout = {
  width: number;
  height: number;
  nodes: SoritesNode[];
  edges: SoritesEdge[];
};

export function layoutSorites(
  chain: SoritesChain,
  stepNames: string[],
  failedStepIndex: number | null,
): SoritesLayout {
  const { NODE_W, NODE_H, GAP, PAD } = SORITES_LAYOUT;

  // Term sequence: for an Aristotelian chain the terms run
  // S(p0) → P(p0)=S(p1) → P(p1)=S(p2) → … → P(pN-1).
  // For a Goclenian chain (premises walked tail-to-head) we walk
  // the premises in reverse to get the same forward sequence.
  const ordered = chain.shape === 'aristotelian'
    ? chain.premises
    : [...chain.premises].reverse();

  const terms: string[] = [ordered[0]!.subject];
  for (const p of ordered) terms.push(p.predicate);

  const nodes: SoritesNode[] = terms.map((t, i) => ({
    x: PAD + i * (NODE_W + GAP),
    y: PAD,
    w: NODE_W,
    h: NODE_H,
    term: t,
    index: i,
  }));

  const edges: SoritesEdge[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const a = nodes[i]!;
    const b = nodes[i + 1]!;
    const midX = (a.x + a.w + b.x) / 2;
    const midY = a.y + a.h / 2;
    edges.push({
      from: i,
      to:   i + 1,
      label: stepNames[i] ?? 'Barbara',
      midX, midY,
      failed: failedStepIndex !== null && failedStepIndex === i,
    });
  }

  const width = PAD + terms.length * NODE_W + (terms.length - 1) * GAP + PAD;
  const height = PAD + NODE_H + PAD;

  return { width, height, nodes, edges };
}

// ─────────────────────────────────────────────────────────────────────
// Single modal proposition layout — reuses the assertoric 2-circle
// Venn from aristotelian-layout, but adds a glyph anchored to the
// modal premise's affected region.

export type ModalPropositionLayout = AristotelianLayout & {
  glyphs: ModalGlyph[];
};

export function layoutModalProposition(prop: ModalProposition): ModalPropositionLayout {
  const base = layoutAssertoricProposition(prop.base);
  const glyphs: ModalGlyph[] = [];
  if (prop.mode !== 'X') {
    const sCircle = base.circles.find(c => c.role === 'S')!;
    const pCircle = base.circles.find(c => c.role === 'P')!;
    const mid = { x: (sCircle.cx + pCircle.cx) / 2, y: sCircle.cy };
    glyphs.push({
      cx: mid.x,
      cy: mid.y - sCircle.r - 8,
      symbol: prop.mode === 'L' ? '□' : '◇',
      premiseRole: 'major',
    });
  }
  return { ...base, glyphs };
}

// ─────────────────────────────────────────────────────────────────────
// Test surface

export const _internals = { roleOfTerm };
