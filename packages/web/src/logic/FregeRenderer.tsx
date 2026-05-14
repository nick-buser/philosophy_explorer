import { useMemo } from 'react';
import type { FregeFormula } from './frege-types';
import { LAYOUT_CONSTS, layoutFormula, type Primitive } from './frege-layout';

// SVG renderer for the Frege Begriffsschrift.
//
// Reads a `FregeFormula` AST, runs the layout pass, and emits a flat
// list of SVG primitives. Strokes are drawn with a single stroke
// colour and consistent width — Frege's notation has no polarity
// shading the way Peirce's nested cuts do.
//
// Higher-order: cavities carry a `sort` field. Individual quantifiers
// keep the original pale-gold letter; predicate quantifiers shift to
// teal so a glance at the diagram reveals when a quantifier ranges
// over concepts rather than objects.

const STROKE_COLOR  = '#e5e7eb';
const STROKE_WIDTH  = 1.6;
const ATOM_FILL     = '#f3f4f6';
const QUANT_INDIV   = '#fde68a';   // pale gold for individual variables
const QUANT_PRED    = '#67e8f9';   // light cyan for predicate variables
const IDEN_FILL     = '#f3f4f6';

type Props = {
  formula: FregeFormula;
  className?: string;
};

export function FregeRenderer({ formula, className }: Props) {
  const laid = useMemo(() => layoutFormula(formula), [formula]);

  return (
    <svg
      className={className}
      viewBox={`0 0 ${laid.width} ${laid.height}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      {laid.primitives.map((p, i) => <PrimitiveShape key={i} p={p} />)}
    </svg>
  );
}

function PrimitiveShape({ p }: { p: Primitive }) {
  switch (p.kind) {
    case 'hstroke':
      // Avoid emitting zero-length segments; they appear when an empty
      // sub-node ends up flush against the hub.
      if (p.x2 <= p.x1) return null;
      return (
        <line
          x1={p.x1} y1={p.y} x2={p.x2} y2={p.y}
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="square"
        />
      );

    case 'vstroke':
      if (p.y2 <= p.y1) return null;
      return (
        <line
          x1={p.x} y1={p.y1} x2={p.x} y2={p.y2}
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="square"
        />
      );

    case 'negTick':
      // Small vertical tick attached to the underside of the content
      // stroke — Frege's negation mark.
      return (
        <line
          x1={p.x} y1={p.y} x2={p.x} y2={p.y + p.len}
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="square"
        />
      );

    case 'cavity': {
      // U-shaped concavity: stroke dips down and back up. The bound
      // variable letter sits inside the cup.
      const d =
        `M ${p.x},${p.y} ` +
        `L ${p.x + p.slope},${p.y + p.depth} ` +
        `L ${p.x + p.w - p.slope},${p.y + p.depth} ` +
        `L ${p.x + p.w},${p.y}`;
      const letterX = p.x + p.w / 2;
      const letterY = p.y + p.depth - 3;
      const fill    = p.sort === 'predicate' ? QUANT_PRED : QUANT_INDIV;
      return (
        <g>
          <path
            d={d}
            fill="none"
            stroke={STROKE_COLOR}
            strokeWidth={STROKE_WIDTH}
            strokeLinejoin="miter"
          />
          <text
            x={letterX}
            y={letterY}
            textAnchor="middle"
            dominantBaseline="alphabetic"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontStyle="italic"
            fontSize={LAYOUT_CONSTS.FORALL_LETTER_PX}
            fontWeight={p.sort === 'predicate' ? 700 : 400}
            fill={fill}
          >
            {p.letter}
          </text>
        </g>
      );
    }

    case 'idenSign':
      // Frege's identity-of-content (Part III §8): a triple-bar drawn
      // mid-row between the two contents.
      return (
        <text
          x={p.x}
          y={p.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize={p.size}
          fill={IDEN_FILL}
        >
          {'≡'}
        </text>
      );

    case 'judgmentBar':
      return (
        <line
          x1={p.x} y1={p.y1} x2={p.x} y2={p.y2}
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH + 0.4}
          strokeLinecap="square"
        />
      );

    case 'atomText':
      return (
        <text
          x={p.x}
          y={p.y}
          textAnchor="start"
          dominantBaseline="central"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontStyle="italic"
          fontSize={LAYOUT_CONSTS.ATOM_FONT_PX}
          fill={ATOM_FILL}
        >
          {p.text}
        </text>
      );
  }
}
