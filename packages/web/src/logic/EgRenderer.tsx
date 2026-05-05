import { useMemo } from 'react';
import type { HookAnchor, LaidOut } from './eg-layout';
import { LAYOUT_CONSTS, boundingSize, collectHookAnchors, layout } from './eg-layout';
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

// Heavy lines of identity, drawn over the rest of the diagram. Peirce's
// own diagrams used a noticeably thicker stroke than the cut boundary;
// we match that here for legibility.
const LINE_STROKE = '#f8fafc';
const LINE_WIDTH  = 2.5;
const HOOK_RADIUS = 2.5;

type Props = {
  tree: EgNode;
  className?: string;
};

export function EgRenderer({ tree, className }: Props) {
  const laid = useMemo(() => layout(tree), [tree]);
  const lines = useMemo(() => collectHookAnchors(laid), [laid]);
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
      <LinesOfIdentity lines={lines} />
    </svg>
  );
}

function NodeShape({ node, depth }: { node: LaidOut; depth: number }) {
  if (node.kind === 'atom') {
    const cx = node.x + node.w / 2;
    const baseH = LAYOUT_CONSTS.ATOM_FONT_PX + LAYOUT_CONSTS.ATOM_PAD_Y * 2;
    const cy = node.y + baseH / 2;
    return (
      <g>
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
      </g>
    );
  }

  if (node.kind === 'eq') {
    const cx = node.x + node.w / 2;
    const cy = node.y + node.h / 2;
    return (
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize={LAYOUT_CONSTS.ATOM_FONT_PX}
        fill="#e5e7eb"
      >
        {'='}
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

// Lines of identity: a heavy connector running through every hook of a
// given line name, with small dots at each hook spot. Connections are
// drawn as straight segments through the anchors in document order —
// this is a sufficient visual approximation; a fully Peirce-faithful
// renderer would route lines along area boundaries.
function LinesOfIdentity({ lines }: { lines: Map<string, HookAnchor[]> }) {
  const segments: { name: string; anchors: HookAnchor[] }[] = [];
  for (const [name, anchors] of lines) {
    if (anchors.length > 0) segments.push({ name, anchors });
  }
  if (segments.length === 0) return null;
  return (
    <g>
      {segments.map(({ name, anchors }) => {
        const points = anchors.map(a => `${a.x},${a.y}`).join(' ');
        return (
          <g key={name}>
            {anchors.length > 1 && (
              <polyline
                points={points}
                fill="none"
                stroke={LINE_STROKE}
                strokeWidth={LINE_WIDTH}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
            )}
            {anchors.map((a, i) => (
              <circle
                key={i}
                cx={a.x}
                cy={a.y}
                r={HOOK_RADIUS}
                fill={LINE_STROKE}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}
