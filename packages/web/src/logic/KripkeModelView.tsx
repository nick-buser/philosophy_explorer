import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Handle,
  MarkerType,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { KripkeModel, WorldId } from './kripke-types';

// KripkeModelView — renders a single Kripke model with React Flow.
//
// Visual conventions:
//   • Reflexivity (self-loops) shown as a ↻ icon on the node, not as
//     an edge. Keeps the canvas readable on small models and
//     communicates "this world is reflexive" more directly.
//   • Symmetric pairs (R(a,b) ∧ R(b,a)) collapse to a single
//     double-headed arrow. One-way edges draw as a single arrow.
//   • The designated ("actual") world gets a blue ring + label.
//   • Atoms true at a world appear as chips below the world id.
//     An empty valuation is shown as ∅.

type WorldNodeData = {
  worldId: string;
  atoms: string[];
  designated: boolean;
  reflexive: boolean;
  // Optional per-world verdict for the active formula. When set, the
  // node renders ⊨ / ⊭ as a chip below the atom list.
  satisfies?: boolean;
};

type WorldNode = Node<WorldNodeData, 'world'>;

function WorldNodeComp({ data }: NodeProps<WorldNode>) {
  const ringCls = data.designated
    ? 'border-blue-400 ring-2 ring-blue-400/40'
    : 'border-gray-700';

  return (
    <div className={`rounded-lg border bg-gray-950 px-3 py-2 min-w-[96px] ${ringCls}`}>
      {/* Hidden handles — used only as edge anchor points. */}
      <Handle type="source" position={Position.Right} className="!opacity-0" />
      <Handle type="target" position={Position.Left}  className="!opacity-0" />

      <div className="flex items-center gap-1.5">
        <span className="font-mono text-sm text-gray-200">{data.worldId}</span>
        {data.designated && (
          <span className="text-[9px] uppercase tracking-wider text-blue-300">actual</span>
        )}
        {data.reflexive && (
          <span
            className="ml-auto text-blue-300 text-xs leading-none"
            title="reflexive (self-loop)"
            aria-label="reflexive"
          >
            ↻
          </span>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {data.atoms.length === 0 ? (
          <span className="text-[10px] text-gray-600 italic">∅</span>
        ) : (
          data.atoms.map(a => (
            <span
              key={a}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
            >
              {a}
            </span>
          ))
        )}
      </div>
      {data.satisfies !== undefined && (
        <div className="mt-1.5">
          <span
            className={
              'text-[10px] font-mono px-1.5 py-0.5 rounded border ' +
              (data.satisfies
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30')
            }
            title={data.satisfies
              ? 'formula forced at this world'
              : 'formula not forced at this world'}
          >
            {data.satisfies ? '⊨' : '⊭'} φ
          </span>
        </div>
      )}
    </div>
  );
}

const nodeTypes = { world: WorldNodeComp };

type Props = {
  model: KripkeModel;
  className?: string;
  // Per-world verdict for the active formula. When provided, each
  // node renders ⊨ / ⊭ alongside its atom chips.
  satisfaction?: Record<WorldId, boolean>;
};

export function KripkeModelView({ model, className, satisfaction }: Props) {
  const { nodes, edges } = useMemo(
    () => buildGraph(model, satisfaction),
    [model, satisfaction],
  );

  return (
    <div className={className} style={{ width: '100%', height: 320 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        panOnDrag={false}
        panOnScroll={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1f2937" gap={16} />
      </ReactFlow>
    </div>
  );
}

// Exported for unit testing — keeps the rendering decisions (which
// edges collapse, which worlds are reflexive, where the designated
// flag goes) testable without mounting React Flow in jsdom.
export function buildGraph(
  model: KripkeModel,
  satisfaction?: Record<WorldId, boolean>,
): { nodes: WorldNode[]; edges: Edge[] } {
  const SPACING = 200;
  const reflexiveSet = new Set(
    model.edges.filter(e => e.from === e.to).map(e => e.from),
  );

  const nodes: WorldNode[] = model.worlds.map((w, i) => ({
    id: w.id,
    type: 'world',
    position: { x: i * SPACING, y: 0 },
    data: {
      worldId: w.label ?? w.id,
      atoms: w.atoms,
      designated: w.id === model.designated,
      reflexive: reflexiveSet.has(w.id),
      satisfies: satisfaction?.[w.id],
    },
  }));

  // Collapse symmetric pairs so we don't draw overlapping arrows on
  // S5 / B / equivalence-class models.
  const properEdges = model.edges.filter(e => e.from !== e.to);
  const reverseLookup = new Set(
    properEdges.map(e => `${e.from}->${e.to}`),
  );

  const drawn = new Set<string>();
  const edges: Edge[] = [];
  for (const e of properEdges) {
    const key = `${e.from}->${e.to}`;
    const reverseKey = `${e.to}->${e.from}`;
    if (drawn.has(key) || drawn.has(reverseKey)) continue;
    drawn.add(key);

    const symmetric = reverseLookup.has(reverseKey);
    edges.push({
      id: key,
      source: e.from,
      target: e.to,
      markerEnd:   { type: MarkerType.ArrowClosed, color: '#9ca3af', width: 16, height: 16 },
      ...(symmetric ? {
        markerStart: { type: MarkerType.ArrowClosed, color: '#9ca3af', width: 16, height: 16 },
      } : {}),
      style: { stroke: '#9ca3af', strokeWidth: 1.5 },
    });
  }

  return { nodes, edges };
}
