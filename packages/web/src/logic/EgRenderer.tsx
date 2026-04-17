import { useMemo } from 'react';
import type { LaidOut } from './eg-layout';
import { LAYOUT_CONSTS, boundingSize, layout } from './eg-layout';
import type { EgNode } from './eg-ast';

// Depth-based tint so nested cuts read at a glance. Odd-depth cuts are
// "negative" (slightly warm), even-depth "positive" (slightly cool),
// reinforcing Peirce's polarity convention in Shin (2002).
const CUT_FILL = [
  'rgba(59,130,246,0.05)',   // depth 1 — inside one cut
  'rgba(251,146,60,0.05)',   // depth 2
  'rgba(59,130,246,0.08)',
  'rgba(251,146,60,0.08)',
];
const CUT_STROKE = '#6b7280';

type Props = {
  tree: EgNode;
  className?: string;
};

export function EgRenderer({ tree, className }: Props) {
  const laid = useMemo(() => layout(tree), [tree]);
  const { width, height } = boundingSize(laid);

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: '100%', height: 'auto' }}
    >
      <NodeShape node={laid} depth={0} />
    </svg>
  );
}

function NodeShape({ node, depth }: { node: LaidOut; depth: number }) {
  if (node.kind === 'atom') {
    const cx = node.x + node.w / 2;
    const cy = node.y + node.h / 2;
    return (
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontSize={LAYOUT_CONSTS.ATOM_FONT_PX}
        fill="#e5e7eb"
      >
        {node.name}
      </text>
    );
  }

  if (node.kind === 'sheet') {
    return (
      <g>
        {node.children.map((c, i) => (
          <NodeShape key={i} node={c} depth={depth} />
        ))}
      </g>
    );
  }

  // cut
  const fill = CUT_FILL[(depth) % CUT_FILL.length];
  return (
    <g>
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx={Math.min(node.h, node.w) / 2}
        ry={Math.min(node.h, node.w) / 2}
        fill={fill}
        stroke={CUT_STROKE}
        strokeWidth={1.5}
      />
      {node.children.map((c, i) => (
        <NodeShape key={i} node={c} depth={depth + 1} />
      ))}
    </g>
  );
}