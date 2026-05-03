import { useMemo } from 'react';
import {
  EDGE_COLOR,
  SQUARE_LAYOUT,
  buildSquareLayout,
  cornerFor,
  deriveTruths,
  type CornerRole,
  type Edge,
  type SquareLayout,
  type Truth,
} from './aristotelian-square';
import type { ImportSetting } from './aristotelian-validity';

// SVG Square of Opposition.
//
// Renders the four corners (A/E/I/O), six relationship edges, and (when
// `focused` is set) the derived truth values of the unfocused corners
// under the chosen import setting. Edges that drop out under boolean
// reading are dimmed to convey the loss of the relationship without
// rearranging the diagram.

const LABEL_COLOR    = '#f3f4f6';
const MUTED_COLOR    = '#6b7280';
const CORNER_BG      = '#0b1220';
const CORNER_STROKE  = '#374151';
const FOCUSED_STROKE = '#fbbf24';

type Props = {
  focused: CornerRole | null;
  importSetting: ImportSetting;
  className?: string;
};

export function AristotelianSquare({ focused, importSetting, className }: Props) {
  const layout = useMemo(() => buildSquareLayout(importSetting), [importSetting]);
  const truths = useMemo(
    () => focused ? deriveTruths(focused, importSetting) : null,
    [focused, importSetting],
  );

  return (
    <svg
      className={className}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      {layout.edges.map(edge => (
        <EdgeLine key={`${edge.kind}-${edge.from}-${edge.to}`} edge={edge} layout={layout} />
      ))}
      {layout.corners.map(c => (
        <CornerNode
          key={c.role}
          role={c.role}
          cx={c.cx}
          cy={c.cy}
          truth={truths?.[c.role] ?? null}
          isFocused={focused === c.role}
        />
      ))}
    </svg>
  );
}

function EdgeLine({ edge, layout }: { edge: Edge; layout: SquareLayout }) {
  const a = cornerFor(edge.from, layout);
  const b = cornerFor(edge.to, layout);

  const colour = EDGE_COLOR[edge.kind];
  const opacity = edge.active ? 0.85 : 0.18;
  const dash = edge.active ? undefined : '4 3';

  // Pull the line endpoints in by the corner radius so they don't enter
  // the corner badges.
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const len = Math.hypot(dx, dy) || 1;
  const r = SQUARE_LAYOUT.CORNER_R + 4;
  const x1 = a.cx + (dx / len) * r;
  const y1 = a.cy + (dy / len) * r;
  const x2 = b.cx - (dx / len) * r;
  const y2 = b.cy - (dy / len) * r;

  // Edge label position depends on edge orientation:
  //  - top edge (A-E): above midpoint
  //  - bottom edge (I-O): below midpoint
  //  - left/right sides: rotated text alongside
  //  - diagonals: small rotated label near midpoint
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const isHorizontal = Math.abs(dy) < 1;
  const isVertical = Math.abs(dx) < 1;
  const isDiagonal = !isHorizontal && !isVertical;

  let labelX = midX;
  let labelY = midY;
  let labelAnchor: 'middle' | 'start' | 'end' = 'middle';
  let rotate: number | null = null;
  if (isHorizontal) {
    // Top edge above, bottom edge below.
    labelY = midY + (a.cy < layout.height / 2 ? -10 : 18);
  } else if (isVertical) {
    // Sides — rotate label 90deg.
    rotate = -90;
    labelX = midX + (a.cx < layout.width / 2 ? -12 : 12);
    labelAnchor = 'middle';
  } else {
    // Diagonal — keep horizontal but offset slightly toward the centre.
    labelY = midY - 6;
  }

  return (
    <g>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={colour}
        strokeOpacity={opacity}
        strokeWidth={SQUARE_LAYOUT.EDGE_STROKE}
        strokeDasharray={dash}
      />
      {!isDiagonal && (
        <text
          x={labelX}
          y={labelY}
          textAnchor={labelAnchor}
          dominantBaseline="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontStyle="italic"
          fontSize={SQUARE_LAYOUT.EDGE_LABEL_FONT_PX}
          fill={edge.active ? colour : MUTED_COLOR}
          opacity={edge.active ? 0.9 : 0.45}
          transform={rotate != null ? `rotate(${rotate} ${labelX} ${labelY})` : undefined}
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}

function CornerNode({
  role, cx, cy, truth, isFocused,
}: {
  role: CornerRole;
  cx: number;
  cy: number;
  truth: Truth | null;
  isFocused: boolean;
}) {
  const truthColor =
      truth === 'true'  ? '#34d399'
    : truth === 'false' ? '#f87171'
    : truth === 'unknown' ? '#9ca3af'
    : null;

  const truthGlyph =
      truth === 'true'  ? 'T'
    : truth === 'false' ? 'F'
    : truth === 'unknown' ? '?'
    : null;

  return (
    <g>
      <circle
        cx={cx} cy={cy}
        r={SQUARE_LAYOUT.CORNER_R}
        fill={CORNER_BG}
        stroke={isFocused ? FOCUSED_STROKE : CORNER_STROKE}
        strokeWidth={isFocused ? 2.4 : 1.4}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontWeight="bold"
        fontSize={SQUARE_LAYOUT.LABEL_FONT_PX}
        fill={LABEL_COLOR}
      >
        {role}
      </text>
      {truthGlyph != null && (
        <text
          x={cx + SQUARE_LAYOUT.CORNER_R - 4}
          y={cy - SQUARE_LAYOUT.CORNER_R + 8}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="bold"
          fontSize={11}
          fill={truthColor!}
        >
          {truthGlyph}
        </text>
      )}
    </g>
  );
}
