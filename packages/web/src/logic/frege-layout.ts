import type { FregeContent, FregeFormula, QuantifierSort } from './frege-types';

// Layout pass for the Frege Begriffsschrift renderer.
//
// The Begriffsschrift is right-anchored: terminal atoms sit at the
// rightmost edge of each row, and a network of horizontal/vertical
// strokes extends leftward from them. We compute geometry in two
// phases — bottom-up sizing followed by top-down placement that emits
// absolute drawing primitives. The renderer (FregeRenderer.tsx) is a
// dumb consumer of those primitives.
//
// Phase 2 additions (higher-order):
//   - `iden` lays out as a single row: left subcontent · ≡ · right
//     subcontent. The judgment bar still attaches at the leftmost stub;
//     each subcontent emits its own content stroke.
//   - `exists` lowers to ¬∀x.¬body in the sizer. This matches Frege's
//     own derivation in *Begriffsschrift* §11–12 — he never had an
//     explicit existential glyph, just the double-negation pattern
//     bracketing a concavity. The renderer ends up emitting the
//     derived shape via existing primitives.
//   - `forall` carries a `sort` ('individual' | 'predicate') that the
//     cavity primitive forwards to the renderer for color distinction.
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

const IDEN_SIGN_W             = 18;     // width reserved for the ≡ glyph
const IDEN_SIGN_PX            = 18;     // glyph font-size (matches atoms)
const IDEN_GAP_BEFORE         = 4;      // breathing room left of the glyph
const IDEN_GAP_AFTER          = 4;      // and right of it
const IDEN_HALF_HEIGHT        = ATOM_FONT_PX / 2 + ROW_PAD_ABOVE;

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
  IDEN_SIGN_W, IDEN_SIGN_PX, IDEN_GAP_BEFORE, IDEN_GAP_AFTER,
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
  | { kind: 'forall';  variable: string; sort: QuantifierSort; body: Sized }
  | { kind: 'cond';    antecedent: Sized; consequent: Sized }
  | { kind: 'iden';    left: Sized; right: Sized };

// Lower `exists` to ¬∀x.¬body for layout purposes — Frege drew it that
// way (Begriffsschrift §11–12). All higher-order existentials lower the
// same way; the predicate-sort is forwarded onto the inner `forall`.
function lower(c: FregeContent): FregeContent {
  if (c.kind !== 'exists') return c;
  return {
    kind: 'not',
    body: {
      kind: 'forall',
      variable: c.variable,
      sort: c.sort,
      body: { kind: 'not', body: c.body },
    },
  };
}

function sizeContent(c: FregeContent): Sized {
  const lowered = lower(c);
  switch (lowered.kind) {
    case 'atom': {
      const textW = approxTextWidth(atomText(lowered.name, lowered.args));
      return {
        w:     STROKE_LEN_MIN + ATOM_LEFT_GAP + textW,
        above: ATOM_FONT_PX / 2 + ROW_PAD_ABOVE,
        below: ATOM_FONT_PX / 2 + ROW_PAD_BELOW,
        node:  { kind: 'atom', name: lowered.name, args: lowered.args, textW },
      };
    }
    case 'not': {
      const b = sizeContent(lowered.body);
      return {
        w:     NEG_PAD_LEFT + b.w,
        above: b.above,
        below: Math.max(b.below, NEG_TICK_LEN + 4),
        node:  { kind: 'not', body: b },
      };
    }
    case 'forall': {
      const b = sizeContent(lowered.body);
      return {
        w:     FORALL_PAD_LEFT + b.w,
        above: b.above,
        below: Math.max(b.below, FORALL_CAVITY_DEPTH + 4),
        node:  { kind: 'forall', variable: lowered.variable, sort: lowered.sort, body: b },
      };
    }
    case 'cond': {
      const ant = sizeContent(lowered.antecedent);
      const con = sizeContent(lowered.consequent);
      return {
        w:     COND_HUB_GAP + Math.max(ant.w, con.w),
        above: con.above,
        below: con.below + COND_VGAP + ant.above + ant.below,
        node:  { kind: 'cond', antecedent: ant, consequent: con },
      };
    }
    case 'iden': {
      const lhs = sizeContent(lowered.left);
      const rhs = sizeContent(lowered.right);
      return {
        w:     lhs.w + IDEN_GAP_BEFORE + IDEN_SIGN_W + IDEN_GAP_AFTER + rhs.w,
        above: Math.max(lhs.above, rhs.above, IDEN_HALF_HEIGHT),
        below: Math.max(lhs.below, rhs.below, IDEN_HALF_HEIGHT),
        node:  { kind: 'iden', left: lhs, right: rhs },
      };
    }
    case 'exists':
      // Unreachable: lowered above. Kept exhaustive so TS/the linter
      // catch a missing case if the AST grows.
      throw new Error('unreachable: exists should have been lowered');
  }
}

// ---------- Drawing primitives (absolute coordinates) ----------

export type Primitive =
  | { kind: 'hstroke';     x1: number; x2: number; y: number }
  | { kind: 'vstroke';     x: number; y1: number; y2: number }
  | { kind: 'negTick';     x: number; y: number; len: number }
  | { kind: 'cavity';      x: number; y: number; w: number; depth: number; slope: number; letter: string; sort: QuantifierSort }
  | { kind: 'idenSign';    x: number; y: number; size: number }
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
        sort:   n.sort,
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
    case 'iden': {
      const { left, right } = n;
      // Left subcontent emits its own leading stroke from stubX.
      placeContent(left, stubX, stubY, out);
      // Sign sits centred in its IDEN_SIGN_W slot.
      const signLeft   = stubX + left.w + IDEN_GAP_BEFORE;
      const signCentre = signLeft + IDEN_SIGN_W / 2;
      out.push({ kind: 'idenSign', x: signCentre, y: stubY, size: IDEN_SIGN_PX });
      // Right subcontent's stub starts past the sign.
      const rightStubX = signLeft + IDEN_SIGN_W + IDEN_GAP_AFTER;
      placeContent(right, rightStubX, stubY, out);
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
