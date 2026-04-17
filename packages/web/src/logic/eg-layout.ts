import type { EgNode } from './eg-ast';

// Layout pass: walk the AST and produce a rectangle tree. Atoms are
// laid out by text width; cuts enclose their children with padding and
// a rounded-rectangle boundary; the sheet is a horizontal flow.
//
// Coordinates are in SVG user units (approx. pixels at scale 1).

export type LaidOut =
  | { kind: 'atom';  name: string;         x: number; y: number; w: number; h: number }
  | { kind: 'cut';   children: LaidOut[];  x: number; y: number; w: number; h: number }
  | { kind: 'sheet'; children: LaidOut[];  x: number; y: number; w: number; h: number };

// Tunables. Kept as module constants so rendering stays predictable.
const ATOM_FONT_PX     = 18;
const ATOM_CHAR_PX     = 10;   // approx monospace advance at 18px
const ATOM_PAD_X       = 10;
const ATOM_PAD_Y       = 8;
const CUT_PAD          = 14;   // inner padding between a cut border and its children
const CHILD_GAP        = 14;   // horizontal gap between siblings (juxtaposition)
const SHEET_PAD        = 8;    // whitespace around the outermost content

export const LAYOUT_CONSTS = {
  ATOM_FONT_PX, ATOM_CHAR_PX, ATOM_PAD_X, ATOM_PAD_Y,
  CUT_PAD, CHILD_GAP, SHEET_PAD,
};

export function layout(node: EgNode): LaidOut {
  const sized = size(node);
  return position(sized, SHEET_PAD, SHEET_PAD);
}

// ── Pass 1: compute sizes bottom-up. ────────────────────────────────
type Sized =
  | { kind: 'atom';  name: string;     w: number; h: number }
  | { kind: 'cut';   children: Sized[]; w: number; h: number }
  | { kind: 'sheet'; children: Sized[]; w: number; h: number };

function size(node: EgNode): Sized {
  if (node.kind === 'atom') {
    const w = Math.max(ATOM_CHAR_PX * node.name.length + ATOM_PAD_X * 2, 30);
    const h = ATOM_FONT_PX + ATOM_PAD_Y * 2;
    return { kind: 'atom', name: node.name, w, h };
  }
  const childSizes = node.children.map(size);
  // Empty cut / empty sheet: still renders a visible shape.
  if (childSizes.length === 0) {
    const w = CUT_PAD * 2 + 12;
    const h = CUT_PAD * 2 + 12;
    return { kind: node.kind, children: [], w, h };
  }
  const innerW = childSizes.reduce((s, c) => s + c.w, 0) + CHILD_GAP * (childSizes.length - 1);
  const innerH = Math.max(...childSizes.map(c => c.h));
  const pad = node.kind === 'sheet' ? 0 : CUT_PAD;
  return {
    kind: node.kind,
    children: childSizes,
    w: innerW + pad * 2,
    h: innerH + pad * 2,
  };
}

// ── Pass 2: assign coordinates top-down. ─────────────────────────────
function position(s: Sized, x: number, y: number): LaidOut {
  if (s.kind === 'atom') {
    return { kind: 'atom', name: s.name, x, y, w: s.w, h: s.h };
  }
  const pad = s.kind === 'sheet' ? 0 : CUT_PAD;
  const childY = y + pad;
  const innerH = s.h - pad * 2;
  let cursorX = x + pad;
  const children: LaidOut[] = [];
  for (const child of s.children) {
    const cy = childY + (innerH - child.h) / 2;
    children.push(position(child, cursorX, cy));
    cursorX += child.w + CHILD_GAP;
  }
  return { kind: s.kind, children, x, y, w: s.w, h: s.h };
}

export function boundingSize(l: LaidOut): { width: number; height: number } {
  return {
    width:  l.w + SHEET_PAD * 2,
    height: l.h + SHEET_PAD * 2,
  };
}