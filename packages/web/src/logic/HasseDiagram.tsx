import type { HasseData } from './boolean-lattice';

// Boolean-lattice Hasse diagram. Vertices are valuations; edges connect
// pairs differing in one bit (the covering relation of the powerset
// order). The formula's truth set is highlighted — at a glance the
// shape of "where the formula holds" becomes a region of the n-cube.

const NODE_R = 14;

export function HasseDiagram({ data }: { data: HasseData }) {
  const { width, height, nodes, edges, truthCount, totalCount, variables } = data;

  return (
    <div className="flex flex-col gap-3 items-start">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="text-gray-200"
        aria-label="Hasse diagram of the Boolean lattice"
      >
        {/* Edges (background) */}
        {edges.map((e, i) => {
          const a = nodes[e.from]!;
          const b = nodes[e.to]!;
          const stroke = e.both ? 'rgba(96, 165, 250, 0.55)' : 'rgba(75, 85, 99, 0.45)';
          const width = e.both ? 1.6 : 1;
          return (
            <line
              key={`edge-${i}`}
              x1={a.x} y1={a.y}
              x2={b.x} y2={b.y}
              stroke={stroke}
              strokeWidth={width}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const fill = node.value ? 'rgba(96, 165, 250, 0.32)' : 'rgba(15, 23, 42, 0.6)';
          const stroke = node.value ? '#60a5fa' : 'rgba(75, 85, 99, 0.7)';
          const textClass = node.value
            ? 'fill-gray-50 text-[10px] font-mono font-semibold'
            : 'fill-gray-500 text-[10px] font-mono';
          return (
            <g key={node.index}>
              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_R}
                fill={fill}
                stroke={stroke}
                strokeWidth={node.value ? 1.6 : 1}
              />
              <text x={node.x} y={node.y + 3} textAnchor="middle" className={textClass}>
                {node.label || '·'}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="text-xs text-gray-400">
        {variables.length === 0 ? (
          <>Constant function — single point.</>
        ) : (
          <>
            <span className="text-gray-200 font-mono">{truthCount}</span>
            <span> / {totalCount} vertices in the truth set; labels read </span>
            <span className="font-mono">{variables.join('')}</span>
            <span> high-bit-to-low.</span>
          </>
        )}
      </p>
    </div>
  );
}