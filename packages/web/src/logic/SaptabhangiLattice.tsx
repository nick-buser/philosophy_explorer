import { useMemo } from 'react';
import { SEVEN_BHANGAS, modeSetKey } from './saptabhangi-types';
import type { BasicMode, BhangaNumber } from './saptabhangi-types';

// Inclusion lattice of the seven bhaṅgas — the seven non-empty subsets
// of {asti, nāsti, avaktavya} ordered by ⊆. Three singletons at the
// base, three pairs in the middle, the triple at the apex; edges are
// the covering relation. Reuses the layered-Hasse idiom of
// `HasseDiagram.tsx` (the Boolean-algebra system) — the structure is a
// Hasse diagram by construction. The active bhaṅga's node is ringed.

const NODE_R = 17;
const WIDTH = 340;
const HEIGHT = 276;
const ROW_Y: Record<number, number> = { 1: 236, 2: 138, 3: 40 };
const COLS_3 = [56, 170, 284];

const MODE_GLYPH: Record<BasicMode, string> = {
  asti: '+',
  nasti: '−',
  avaktavya: '·',
};

type LatticeNode = {
  n: BhangaNumber;
  x: number;
  y: number;
  label: string;
  title: string;
};

type LatticeEdge = { from: BhangaNumber; to: BhangaNumber };

function build(): { nodes: LatticeNode[]; edges: LatticeEdge[] } {
  const bySize = new Map<number, typeof SEVEN_BHANGAS>();
  for (const b of SEVEN_BHANGAS) {
    const list = bySize.get(b.modes.length) ?? [];
    list.push(b);
    bySize.set(b.modes.length, list);
  }

  const nodes: LatticeNode[] = [];
  for (const [size, list] of bySize) {
    const xs = list.length === 1 ? [WIDTH / 2] : COLS_3;
    list.forEach((b, i) => {
      nodes.push({
        n: b.n,
        x: xs[i]!,
        y: ROW_Y[size]!,
        label: b.modes.map(m => MODE_GLYPH[m]).join(' '),
        title: `${b.n}. ${b.sanskrit} — ${b.gloss}`,
      });
    });
  }

  // Covering edges: a ⊆ b with exactly one extra mode.
  const edges: LatticeEdge[] = [];
  for (const a of SEVEN_BHANGAS) {
    for (const b of SEVEN_BHANGAS) {
      if (b.modes.length !== a.modes.length + 1) continue;
      if (a.modes.every(m => b.modes.includes(m))) {
        edges.push({ from: a.n, to: b.n });
      }
    }
  }

  return { nodes, edges };
}

type Props = {
  active: BhangaNumber | null;
  className?: string;
};

export function SaptabhangiLattice({ active, className }: Props) {
  const { nodes, edges } = useMemo(build, []);
  const nodeOf = (n: BhangaNumber) => nodes.find(nd => nd.n === n)!;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width={WIDTH}
        height={HEIGHT}
        className="text-gray-200 max-w-full"
        aria-label="Inclusion lattice of the seven bhaṅgas"
      >
        {edges.map((e, i) => {
          const a = nodeOf(e.from);
          const b = nodeOf(e.to);
          const touchesActive = active === e.from || active === e.to;
          return (
            <line
              key={`edge-${i}`}
              x1={a.x} y1={a.y}
              x2={b.x} y2={b.y}
              stroke={touchesActive ? 'rgba(251, 191, 36, 0.55)' : 'rgba(75, 85, 99, 0.45)'}
              strokeWidth={touchesActive ? 1.8 : 1}
            />
          );
        })}

        {nodes.map(node => {
          const isActive = active === node.n;
          return (
            <g key={node.n}>
              <title>{node.title}</title>
              {isActive && (
                <circle cx={node.x} cy={node.y} r={NODE_R + 4} fill="none" stroke="#fbbf24" strokeWidth={1.4} />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_R}
                fill={isActive ? 'rgba(251, 191, 36, 0.28)' : 'rgba(15, 23, 42, 0.6)'}
                stroke={isActive ? '#fbbf24' : 'rgba(75, 85, 99, 0.7)'}
                strokeWidth={isActive ? 1.8 : 1}
              />
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                className={
                  isActive
                    ? 'fill-amber-100 text-[11px] font-mono font-semibold'
                    : 'fill-gray-400 text-[11px] font-mono'
                }
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="text-xs text-gray-500 leading-relaxed">
        The seven subsets ordered by inclusion — singletons at the base, the
        sevenfold bhaṅga at the apex. Glyphs:{' '}
        <span className="font-mono text-gray-400">+</span> asti,{' '}
        <span className="font-mono text-gray-400">−</span> nāsti,{' '}
        <span className="font-mono text-gray-400">·</span> avaktavya.
      </p>
    </div>
  );
}
