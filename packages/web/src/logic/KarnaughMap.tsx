import type { KMapData } from './boolean-kmap';

// SVG-rendered Karnaugh map. Cells coloured by membership in the
// chosen prime-implicant cover; the cover legend appears under the
// grid. Up to 4 variables (capped in `boolean-kmap.ts`).

const CELL = 56;
const PADDING_X = 56;
const PADDING_Y = 44;
const COVER_PALETTE = [
  '#60a5fa', // sky-400
  '#f472b6', // pink-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#a78bfa', // violet-400
  '#f87171', // red-400
  '#22d3ee', // cyan-400
  '#facc15', // yellow-400
];

export function KarnaughMap({ data }: { data: KMapData }) {
  const rowCount = data.rows.labels.length;
  const colCount = data.cols.labels.length;
  const width  = PADDING_X + colCount * CELL + 16;
  const height = PADDING_Y + rowCount * CELL + 16;

  const rowAxisLabel = data.rows.variables.join('');
  const colAxisLabel = data.cols.variables.join('');

  return (
    <div className="flex flex-col gap-3 items-start">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="text-gray-200"
        aria-label="Karnaugh map"
      >
        {/* Axis labels */}
        {colAxisLabel && (
          <text x={PADDING_X + (colCount * CELL) / 2} y={18} textAnchor="middle"
                className="fill-gray-400 text-[12px] font-mono">
            {colAxisLabel}
          </text>
        )}
        {rowAxisLabel && (
          <text x={16} y={PADDING_Y + (rowCount * CELL) / 2} textAnchor="middle"
                transform={`rotate(-90 16 ${PADDING_Y + (rowCount * CELL) / 2})`}
                className="fill-gray-400 text-[12px] font-mono">
            {rowAxisLabel}
          </text>
        )}

        {/* Column header (Gray labels) */}
        {data.cols.labels.map((label, c) => (
          <text
            key={`col-${c}`}
            x={PADDING_X + c * CELL + CELL / 2}
            y={PADDING_Y - 8}
            textAnchor="middle"
            className="fill-gray-400 text-[11px] font-mono"
          >
            {label}
          </text>
        ))}

        {/* Row header (Gray labels) */}
        {data.rows.labels.map((label, r) => (
          <text
            key={`row-${r}`}
            x={PADDING_X - 10}
            y={PADDING_Y + r * CELL + CELL / 2 + 4}
            textAnchor="end"
            className="fill-gray-400 text-[11px] font-mono"
          >
            {label}
          </text>
        ))}

        {/* Cells */}
        {data.cells.map(cell => {
          const x = PADDING_X + cell.col * CELL;
          const y = PADDING_Y + cell.row * CELL;
          const piIdx = cell.coverPIs[0];
          const fill = cell.value
            ? piIdx !== undefined
              ? withAlpha(COVER_PALETTE[piIdx % COVER_PALETTE.length]!, 0.28)
              : 'rgba(229, 231, 235, 0.06)'
            : 'rgba(15, 23, 42, 0.5)';
          const stroke = piIdx !== undefined
            ? COVER_PALETTE[piIdx % COVER_PALETTE.length]!
            : 'rgba(75, 85, 99, 0.6)';
          const strokeWidth = piIdx !== undefined ? 1.4 : 1;

          return (
            <g key={`${cell.row}-${cell.col}`}>
              <rect
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                rx={4}
              />
              <text
                x={x + CELL / 2}
                y={y + CELL / 2 + 5}
                textAnchor="middle"
                className={cell.value ? 'fill-gray-100 text-[15px] font-semibold' : 'fill-gray-500 text-[13px]'}
              >
                {cell.value ? '1' : '0'}
              </text>
              <text
                x={x + CELL - 5}
                y={y + 12}
                textAnchor="end"
                className="fill-gray-600 text-[8.5px] font-mono"
                aria-label={`minterm ${cell.minterm}`}
              >
                {cell.minterm}
              </text>
            </g>
          );
        })}
      </svg>

      {data.cover.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
          {data.cover.map((pi, i) => (
            <li key={pi.pattern} className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: withAlpha(COVER_PALETTE[i % COVER_PALETTE.length]!, 0.5) }}
              />
              <code className="font-mono">{pi.label}</code>
              <span className="text-gray-500">({pi.minterms.length} cells)</span>
            </li>
          ))}
        </ul>
      )}

      {data.cover.length === 0 && (
        <p className="text-xs text-gray-500">
          {data.cells.every(c => !c.value)
            ? 'Contradiction — no minterms.'
            : 'No prime-implicant cover.'}
        </p>
      )}
    </div>
  );
}

function withAlpha(hex: string, alpha: number): string {
  // Accepts only #rrggbb form from our palette.
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}