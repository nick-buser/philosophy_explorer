import type { FregeContent, FregeFormula } from './frege-types';

// Layout pass for the Frege Begriffsschrift renderer.
//
// The Begriffsschrift is right-anchored: terminal atoms sit at the
// rightmost edge of each row, and a network of horizontal/vertical
// strokes extends leftward from them. We compute geometry in two
// phases — bottom-up sizing followed by top-down placement that emits
// absolute drawing primitives. The renderer (FregeRenderer.tsx) is a
// dumb consumer of those primitives.
//
// Coordinates are in SVG user units (≈ pixels at scale 1).

// ---------- Tunables ----------

const ATOM_FONT_PX            = 18;
const ATOM_CHAR_PX            = 10;     // approximate italic-Times advance at 18px
const ATOM_LEFT_GAP           = 3;      // small gap between content stroke and atom text
const STROKE_LEN_MIN          = 14;     // minimum leftward extent past the atom
const ROW_PAD_ABOVE           = 6;
const ROW_PAD_BELOW           = 6;

const NEG_PAD_LEFT            = 18;
const NEG_TICK_OFFSET         = 9;      // x offset from the new (compound) stub
const NEG_TICK_LEN            = 9;

const FORALL_PAD_LEFT         = 32;
const FORALL_CAVITY_OFFSET    = 4;      // x offset from the new (compound) stub
const FORALL_CAVITY_W         = 22;
const FORALL_CAVITY_DEPTH     = 14;
const FORALL_CAVITY_SLOPE     = 4;      // diagonal portion of the U on each side
const FORALL_LETTER_PX        = 13;

const COND_HUB_GAP            = 22;     // leftward extension past the T-junction
const COND_VGAP               = 24;     // vertical gap between consequent and antecedent rows

const JUDGMENT_BAR_LEN        = 28;
const JUDGMENT_BAR_PAD        = 0;      // bar shares its right-edge with the body's stub

const SHEET_PAD               = 14;

export const LAYOUT_CONSTS = {
  ATOM_FONT_PX, ATOM_CHAR_PX, STROKE_LEN_MIN,
  ROW_PAD_ABOVE, ROW_PAD_BELOW,
  NEG_PAD_LEFT, NEG_TICK_OFFSET, NEG_TICK_LEN,
  FORALL_PAD_LEFT, FORALL_CAVITY_OFFSET, FORALL_CAVITY_W,
  FORALL_CAVITY_DEPTH, FORALL_CAVITY_SLOPE, FORALL_LETTER_PX,
  COND_HUB_GAP, COND_VGAP,
  JUDGMENT_BAR_LEN, JUDGMENT_BAR_PAD,
  SHEET_PAD,
};

// ---------- Atom text helpers ----------

export function atomText(name: string, args: string[]): string {
  if (args.length === 0) return name;
  return `${name}(${args.join(', ')})`;
}

function approxTextWidth(text: string): number {
  return Math.max(text.length * ATOM_CHAR_PX, ATOM_CHAR_PX);
}

// ---------- Sized tree (intrinsic dimensions, no absolute coords) ----------

type Sized = {
  w: number;          // horizontal extent (rightward of the stub)
  above: number;      // vertical extent above the stub
  below: number;      // vertical extent below the stub
  node: SizedNode;
};

type SizedNode =
  | { kind: 'atom';    name: string; args: string[]; textW: number }
  | { kind: 'not';     body: Sized }
  | { kind: 'forall';  variable: string; body: Sized }
  | { kind: 'cond';    antecedent: Sized; consequent: Sized };

function sizeContent(c: FregeContent): Sized {
  switch (c.kind) {
    case 'atom': {
      const textW = approxTextWidth(atomText(c.name, c.args));
      return {
        w:     STROKE_LEN_MIN + ATOM_LEFT_GAP + textW,
        above: ATOM_FONT_PX / 2 + ROW_PAD_ABOVE,
        below: ATOM_FONT_PX / 2 + ROW_PAD_BELOW,
        node:  { kind: 'atom', name: c.name, args: c.args, textW },
      };
    }
    case 'not': {
      const b = sizeContent(c.body);
      return {
        w:     NEG_PAD_LEFT + b.w,
        above: b.above,
        below: Math.max(b.below, NEG_TICK_LEN + 4),
        node:  { kind: 'not', body: b },
      };
    }
    case 'forall': {
      const b = sizeContent(c.body);
      return {
        w:     FORALL_PAD_LEFT + b.w,
        above: b.above,
        below: Math.max(b.below, FORALL_CAVITY_DEPTH + 4),
        node:  { kind: 'forall', variable: c.variable, body: b },
      };
    }
    case 'cond': {
      const ant = sizeContent(c.antecedent);
      const con = sizeContent(c.consequent);
      return {
        w:     COND_HUB_GAP + Math.max(ant.w, con.w),
        above: con.above,
        below: con.below + COND_VGAP + ant.above + ant.below,
        node:  { kind: 'cond', antecedent: ant, consequent: con },
      };
    }
  }
}

// ---------- Drawing primitives (absolute coordinates) ----------

export type Primitive =
  | { kind: 'hstroke';     x1: number; x2: number; y: number }
  | { kind: 'vstroke';     x: number; y1: number; y2: number }
  | { kind: 'negTick';     x: number; y: number; len: number }
  | { kind: 'cavity';      x: number; y: number; w: number; depth: number; slope: number; letter: string }
  | { kind: 'judgmentBar'; x: number; y1: number; y2: number }
  | { kind: 'atomText';    x: number; y: number; text: string };

export type LaidOut = {
  width:  number;
  height: number;
  primitives: Primitive[];
};

function placeContent(s: Sized, stubX: number, stubY: number, out: Primitive[]): void {
  const n = s.node;
  switch (n.kind) {
    case 'atom': {
      const atomLeftX = stubX + s.w - n.textW;
      out.push({ kind: 'hstroke', x1: stubX, x2: atomLeftX - ATOM_LEFT_GAP, y: stubY });
      out.push({ kind: 'atomText', x: atomLeftX, y: stubY, text: atomText(n.name, n.args) });
      return;
    }
    case 'not': {
      const newStub = stubX + NEG_PAD_LEFT;
      out.push({ kind: 'hstroke', x1: stubX, x2: newStub, y: stubY });
      out.push({ kind: 'negTick', x: stubX + NEG_TICK_OFFSET, y: stubY, len: NEG_TICK_LEN });
      placeContent(n.body, newStub, stubY, out);
      return;
    }
    case 'forall': {
      const newStub = stubX + FORALL_PAD_LEFT;
      const cavityX = stubX + FORALL_CAVITY_OFFSET;
      out.push({ kind: 'hstroke', x1: stubX, x2: cavityX, y: stubY });
      out.push({
        kind:   'cavity',
        x:      cavityX,
        y:      stubY,
        w:      FORALL_CAVITY_W,
        depth:  FORALL_CAVITY_DEPTH,
        slope:  FORALL_CAVITY_SLOPE,
        letter: n.variable,
      });
      out.push({ kind: 'hstroke', x1: cavityX + FORALL_CAVITY_W, x2: newStub, y: stubY });
      placeContent(n.body, newStub, stubY, out);
      return;
    }
    case 'cond': {
      const hubX = stubX + COND_HUB_GAP;
      const con = n.consequent;
      const ant = n.antecedent;
      // Compound's leftward stroke at the consequent's row height.
      out.push({ kind: 'hstroke', x1: stubX, x2: hubX, y: stubY });
      // Consequent (top): its stub coincides with the hub.
      placeContent(con, hubX, stubY, out);
      // Antecedent (bottom): below the hub by con.below + COND_VGAP + ant.above.
      const antStubY = stubY + con.below + COND_VGAP + ant.above;
      out.push({ kind: 'vstroke', x: hubX, y1: stubY, y2: antStubY });
      placeContent(ant, hubX, antStubY, out);
      return;
    }
  }
}

// ---------- Top-level layout entrypoint ----------

export function layoutFormula(formula: FregeFormula): LaidOut {
  const body = sizeContent(formula.body);
  const hasJudgment = formula.kind === 'judgment';

  // The judgment bar's right edge sits exactly at the body's stub x.
  // No extra horizontal space is reserved; the bar overlays the stub
  // point and extends UP and DOWN from it.
  const stubX = SHEET_PAD;
  const judgmentHalf = hasJudgment ? JUDGMENT_BAR_LEN / 2 : 0;
  const stubY = SHEET_PAD + Math.max(body.above, judgmentHalf);

  const primitives: Primitive[] = [];
  if (hasJudgment) {
    primitives.push({
      kind: 'judgmentBar',
      x:    stubX + JUDGMENT_BAR_PAD,
      y1:   stubY - JUDGMENT_BAR_LEN / 2,
      y2:   stubY + JUDGMENT_BAR_LEN / 2,
    });
  }
  placeContent(body, stubX, stubY, primitives);

  const width  = stubX + body.w + SHEET_PAD;
  const height = stubY + Math.max(body.below, judgmentHalf) + SHEET_PAD;

  return { width, height, primitives };
}
