import type { CategoricalProposition, Syllogism } from './aristotelian-types';

// Geometry for Aristotelian Venn diagrams.
//
// Two layout shapes share a single module:
//
//   2-circle (single proposition): circles labelled S and P with overlap.
//   3-circle (syllogism):          circles S, M, P arranged so M sits
//                                  at the bottom and S, P at the top.
//
// Diagram conventions:
//   - Universal premises shade the regions they make empty
//     (A: shade X∖Y, E: shade X∩Y).
//   - Particular premises place a × in a non-shaded region inside
//     X∩Y (I) or X∖Y (O). Phase-1 picks ONE region per × — the
//     centre (S∩M∩P) when compatible and unshaded — rather than the
//     textbook's boundary-straddling glyph.
//
// The layout pass returns position-only data; SVG drawing is in
// `AristotelianRenderer.tsx`.

export const LAYOUT = {
  R: 72,                  // circle radius
  D: 72,                  // center-to-center distance (≈ R = heavy overlap)
  PAD: 36,                // canvas padding around the circles
  LABEL_OFFSET: 14,       // distance from circle edge to label
  CROSS_FONT_PX: 18,
  LABEL_FONT_PX: 14,
} as const;

// ─────────────────────────────────────────────────────────────────────
// Shared types

export type CircleRole = 'S' | 'M' | 'P';

export type RenderedCircle = {
  role: CircleRole;
  cx: number;
  cy: number;
  r: number;
  labelX: number;
  labelY: number;
};

// A region is described by which circles (by role) it sits inside.
// E.g. ['S']        = S only
//      ['S', 'M']   = S∩M but outside P
//      ['S','M','P']= centre triple-intersection
export type ShadedRegion = { inside: CircleRole[] };

export type CrossMark = { cx: number; cy: number };

export type Layout = {
  width: number;
  height: number;
  circles: RenderedCircle[];
  shaded: ShadedRegion[];
  crosses: CrossMark[];
};

// ─────────────────────────────────────────────────────────────────────
// Region keys (3-circle case)

// Letters are stored alphabetised so two regions with the same circle
// membership compare identically as strings.
type RegionKey = 'S' | 'M' | 'P' | 'MS' | 'PS' | 'MP' | 'MPS';

const ALL_REGION_KEYS: RegionKey[] = ['S', 'M', 'P', 'MS', 'PS', 'MP', 'MPS'];

function keyOf(roles: CircleRole[]): RegionKey {
  return [...roles].sort().join('') as RegionKey;
}

function rolesOf(key: RegionKey): CircleRole[] {
  return key.split('') as CircleRole[];
}

function regionContains(key: RegionKey, role: CircleRole): boolean {
  return key.includes(role);
}

// ─────────────────────────────────────────────────────────────────────
// 2-circle layout (single proposition)

export function layoutProposition(prop: CategoricalProposition): Layout {
  const { R, D, PAD, LABEL_OFFSET } = LAYOUT;
  const cy = PAD + R;
  const sCx = PAD + R;
  const pCx = sCx + D;
  const width  = pCx + R + PAD;
  const height = cy + R + PAD;

  const circles: RenderedCircle[] = [
    { role: 'S', cx: sCx, cy, r: R, labelX: sCx - R - LABEL_OFFSET, labelY: cy },
    { role: 'P', cx: pCx, cy, r: R, labelX: pCx + R + LABEL_OFFSET, labelY: cy },
  ];

  const shaded: ShadedRegion[] = [];
  const crosses: CrossMark[] = [];

  const sLune   = { cx: sCx - R * 0.55,   cy };
  const overlap = { cx: (sCx + pCx) / 2,  cy };

  switch (prop.form) {
    case 'A': shaded.push({ inside: ['S'] });             break; // S∖P empty
    case 'E': shaded.push({ inside: ['S', 'P'] });        break; // S∩P empty
    case 'I': crosses.push({ cx: overlap.cx, cy: overlap.cy }); break;
    case 'O': crosses.push({ cx: sLune.cx,   cy: sLune.cy });   break;
  }

  return { width, height, circles, shaded, crosses };
}

// ─────────────────────────────────────────────────────────────────────
// 3-circle layout (syllogism)

export function layoutSyllogism(s: Syllogism): Layout {
  const { R, D, PAD, LABEL_OFFSET } = LAYOUT;

  // S top-left, P top-right, M bottom — equilateral triangle of side D
  // centred on (cx, cy). SVG y is downward.
  const tHalf = D / 2;
  const tUp   = D * Math.sqrt(3) / 6;
  const tDown = D * Math.sqrt(3) / 3;

  const minX = -tHalf - R;
  const maxX =  tHalf + R;
  const minY = -tUp   - R;
  const maxY =  tDown + R;
  const width  = (maxX - minX) + 2 * PAD;
  const height = (maxY - minY) + 2 * PAD;

  const cx = -minX + PAD;
  const cy = -minY + PAD;

  const sCenter = { x: cx - tHalf, y: cy - tUp };
  const pCenter = { x: cx + tHalf, y: cy - tUp };
  const mCenter = { x: cx,         y: cy + tDown };

  const circles: RenderedCircle[] = [
    { role: 'S', cx: sCenter.x, cy: sCenter.y, r: R,
      labelX: sCenter.x - R - LABEL_OFFSET, labelY: sCenter.y },
    { role: 'P', cx: pCenter.x, cy: pCenter.y, r: R,
      labelX: pCenter.x + R + LABEL_OFFSET, labelY: pCenter.y },
    { role: 'M', cx: mCenter.x, cy: mCenter.y, r: R,
      labelX: mCenter.x,                    labelY: mCenter.y + R + LABEL_OFFSET },
  ];

  // Resolve term names to roles via the syllogism's S/M/P. The
  // conclusion's subject is S, predicate is P, and the parser exposes
  // the middle as `s.middle`.
  const sName = s.conclusion.subject;
  const pName = s.conclusion.predicate;
  const mName = s.middle;

  const roleOf = (term: string): CircleRole | null =>
    term === sName ? 'S' : term === mName ? 'M' : term === pName ? 'P' : null;

  const shadedSet = new Set<RegionKey>();
  applyUniversalPremise(s.major, roleOf, shadedSet);
  applyUniversalPremise(s.minor, roleOf, shadedSet);

  const crossKeys: RegionKey[] = [];
  applyParticularPremise(s.major, roleOf, shadedSet, crossKeys);
  applyParticularPremise(s.minor, roleOf, shadedSet, crossKeys);

  const shaded: ShadedRegion[] = [...shadedSet].map(key => ({
    inside: rolesOf(key),
  }));
  const crosses: CrossMark[] = crossKeys.map(key =>
    regionAnchor(key, sCenter, pCenter, mCenter));

  return { width, height, circles, shaded, crosses };
}

// ─────────────────────────────────────────────────────────────────────
// Premise application

function applyUniversalPremise(
  prem: CategoricalProposition,
  roleOf: (t: string) => CircleRole | null,
  shaded: Set<RegionKey>,
) {
  const X = roleOf(prem.subject);
  const Y = roleOf(prem.predicate);
  if (!X || !Y) return; // shouldn't happen — parser guarantees term coverage

  if (prem.form === 'A') {
    // All X is Y → regions inside X but outside Y are empty
    for (const key of ALL_REGION_KEYS) {
      if (regionContains(key, X) && !regionContains(key, Y)) shaded.add(key);
    }
  } else if (prem.form === 'E') {
    // No X is Y → regions inside both X and Y are empty
    for (const key of ALL_REGION_KEYS) {
      if (regionContains(key, X) && regionContains(key, Y)) shaded.add(key);
    }
  }
}

function applyParticularPremise(
  prem: CategoricalProposition,
  roleOf: (t: string) => CircleRole | null,
  shaded: Set<RegionKey>,
  crossOut: RegionKey[],
) {
  if (prem.form !== 'I' && prem.form !== 'O') return;
  const X = roleOf(prem.subject);
  const Y = roleOf(prem.predicate);
  if (!X || !Y) return;

  // I: × in some region inside X∩Y. O: × in some region inside X∖Y.
  // Candidate regions: enumerate, then prefer the centre region (most
  // informative for the syllogism check) when unshaded.
  const candidates = ALL_REGION_KEYS.filter(key => {
    const inX = regionContains(key, X);
    const inY = regionContains(key, Y);
    return prem.form === 'I' ? (inX && inY) : (inX && !inY);
  });
  const preferCentre = candidates.find(c => c === 'MPS') ?? null;
  const pick = (preferCentre && !shaded.has(preferCentre))
    ? preferCentre
    : candidates.find(c => !shaded.has(c)) ?? candidates[0];
  if (pick) crossOut.push(pick);
}

// ─────────────────────────────────────────────────────────────────────
// Region anchor positions for ×

function regionAnchor(
  key: RegionKey,
  S: { x: number; y: number },
  P: { x: number; y: number },
  M: { x: number; y: number },
): CrossMark {
  const G = { x: (S.x + P.x + M.x) / 3, y: (S.y + P.y + M.y) / 3 };

  const radial = (centre: { x: number; y: number }, frac: number) => ({
    cx: centre.x + frac * (centre.x - G.x),
    cy: centre.y + frac * (centre.y - G.y),
  });
  const between = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    away: { x: number; y: number },
    distance: number,
  ): CrossMark => {
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const dx = mid.x - away.x;
    const dy = mid.y - away.y;
    const len = Math.hypot(dx, dy) || 1;
    return { cx: mid.x + distance * dx / len, cy: mid.y + distance * dy / len };
  };

  switch (key) {
    case 'S':   return radial(S, 0.7);
    case 'P':   return radial(P, 0.7);
    case 'M':   return radial(M, 0.55);
    case 'PS':  return between(S, P, M, 16);
    case 'MS':  return between(S, M, P, 12);
    case 'MP':  return between(M, P, S, 12);
    case 'MPS': return { cx: G.x, cy: G.y };
  }
}

// Re-exports for tests
export const _internals = {
  ALL_REGION_KEYS,
  keyOf,
  rolesOf,
  regionContains,
  applyUniversalPremise,
  applyParticularPremise,
};
