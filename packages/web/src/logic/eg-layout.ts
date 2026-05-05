import type { EgNode } from './eg-ast';

// Layout pass: walk the AST and produce a rectangle tree.
//
// Alpha shapes:
//   atom (0-ary)  → italic glyph at text width
//   cut           → rounded-rectangle boundary enclosing children
//   sheet         → horizontal flow at the top level
//
// Beta shapes (added):
//   atom (n-ary)  → predicate glyph with `n` hook anchors at the
//                    bottom of the box, evenly spaced
//   eq             → small "·=·" widget: two hook anchors with `=` between
//
// Coordinates are SVG user units (≈ pixels at scale 1).

export type HookAnchor = { name: string; x: number; y: number };

export type LaidOut =
  | { kind: 'atom';  name: string;     hooks: HookAnchor[]; x: number; y: number; w: number; h: number }
  | { kind: 'cut';   children: LaidOut[];                   x: number; y: number; w: number; h: number }
  | { kind: 'sheet'; children: LaidOut[];                   x: number; y: number; w: number; h: number }
  | { kind: 'eq';    left: HookAnchor; right: HookAnchor;   x: number; y: number; w: number; h: number };

// Tunables. Kept as module constants so rendering stays predictable.
const ATOM_FONT_PX     = 18;
const ATOM_CHAR_PX     = 10;   // approx monospace advance at 18px
const ATOM_PAD_X       = 10;
const ATOM_PAD_Y       = 8;
const HOOK_SPACING     = 14;   // horizontal distance between hook spots
const HOOK_BOTTOM_PAD  = 6;    // vertical gap below the predicate baseline for hooks
const EQ_WIDTH         = 60;   // width of the "·=·" identity widget
const EQ_HEIGHT        = ATOM_FONT_PX + ATOM_PAD_Y * 2;
const CUT_PAD          = 14;   // inner padding between a cut border and its children
const CHILD_GAP        = 14;   // horizontal gap between siblings (juxtaposition)
const SHEET_PAD        = 8;    // whitespace around the outermost content

export const LAYOUT_CONSTS = {
  ATOM_FONT_PX, ATOM_CHAR_PX, ATOM_PAD_X, ATOM_PAD_Y,
  HOOK_SPACING, HOOK_BOTTOM_PAD,
  EQ_WIDTH, EQ_HEIGHT,
  CUT_PAD, CHILD_GAP, SHEET_PAD,
};

export function layout(node: EgNode): LaidOut {
  const sized = size(node);
  const positioned = position(sized, SHEET_PAD, SHEET_PAD);
  return positioned;
}

// ── Pass 1: compute sizes bottom-up. ────────────────────────────────
type Sized =
  | { kind: 'atom';  name: string;       hookCount: number;   hookNames: string[]; w: number; h: number }
  | { kind: 'cut';   children: Sized[];                                              w: number; h: number }
  | { kind: 'sheet'; children: Sized[];                                              w: number; h: number }
  | { kind: 'eq';    left: string; right: string;                                    w: number; h: number };

function size(node: EgNode): Sized {
  if (node.kind === 'atom') {
    const hooks = node.hooks;
    const textW = ATOM_CHAR_PX * node.name.length + ATOM_PAD_X * 2;
    // Hooks fan out below the glyph; need enough width that the hook
    // anchors don't fall outside the predicate's box.
    const hookW = hooks.length <= 1
      ? 0
      : HOOK_SPACING * (hooks.length - 1) + ATOM_PAD_X * 2;
    const w = Math.max(textW, hookW, 30);
    const baseH = ATOM_FONT_PX + ATOM_PAD_Y * 2;
    const h = hooks.length > 0 ? baseH + HOOK_BOTTOM_PAD : baseH;
    return { kind: 'atom', name: node.name, hookCount: hooks.length, hookNames: hooks, w, h };
  }
  if (node.kind === 'eq') {
    return { kind: 'eq', left: node.left, right: node.right, w: EQ_WIDTH, h: EQ_HEIGHT };
  }
  const childSizes = node.children.map(size);
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
    const baseH = ATOM_FONT_PX + ATOM_PAD_Y * 2;
    const hooks: HookAnchor[] = [];
    if (s.hookCount > 0) {
      const hookY = y + baseH + HOOK_BOTTOM_PAD;
      const span = HOOK_SPACING * (s.hookCount - 1);
      const startX = x + (s.w - span) / 2;
      for (let i = 0; i < s.hookCount; i++) {
        hooks.push({ name: s.hookNames[i], x: startX + i * HOOK_SPACING, y: hookY });
      }
    }
    return { kind: 'atom', name: s.name, hooks, x, y, w: s.w, h: s.h };
  }
  if (s.kind === 'eq') {
    const cy = y + EQ_HEIGHT / 2;
    return {
      kind: 'eq',
      left:  { name: s.left,  x: x + ATOM_PAD_X,             y: cy },
      right: { name: s.right, x: x + EQ_WIDTH - ATOM_PAD_X,  y: cy },
      x, y, w: s.w, h: s.h,
    };
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

// Walk the laid-out tree and collect every hook anchor, grouped by
// line name. The renderer uses these to draw a heavy line of identity
// connecting all hooks that share a name.
export function collectHookAnchors(l: LaidOut): Map<string, HookAnchor[]> {
  const out = new Map<string, HookAnchor[]>();
  walk(l, out);
  return out;
}

function walk(l: LaidOut, out: Map<string, HookAnchor[]>): void {
  if (l.kind === 'atom') {
    for (const h of l.hooks) push(out, h);
    return;
  }
  if (l.kind === 'eq') {
    push(out, l.left);
    push(out, l.right);
    return;
  }
  for (const c of l.children) walk(c, out);
}

function push(out: Map<string, HookAnchor[]>, h: HookAnchor): void {
  if (!out.has(h.name)) out.set(h.name, []);
  out.get(h.name)!.push(h);
}
