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
import type { AgentId, EpistemicModel, WorldId } from './epistemic-types';

// Multi-agent variant of KripkeModelView. Each declared agent gets a
// distinct color; edges carry an agent label. Visual conventions:
//   • Self-loops collapse to a per-agent ↻ chip stack on the node.
//   • Edges between distinct worlds are drawn one-per-agent. A pair
//     of agents going opposite ways on the same world pair shows as
//     two stacked arrows.
//   • The designated world keeps the blue ring + "actual" tag.
//   • Each node still shows its atom valuation as chips below the id.

const AGENT_PALETTE = [
  '#60a5fa', // blue-400
  '#f59e0b', // amber-500
  '#34d399', // emerald-400
  '#f472b6', // pink-400
  '#a78bfa', // violet-400
  '#fb7185', // rose-400
];

export function colorForAgent(agent: AgentId, agents: readonly AgentId[]): string {
  const i = agents.indexOf(agent);
  if (i < 0) return '#9ca3af';
  return AGENT_PALETTE[i % AGENT_PALETTE.length]!;
}

type WorldNodeData = {
  worldId: string;
  atoms: string[];
  designated: boolean;
  // Per-agent reflexivity flags — used to render an inline ↻ list.
  reflexiveFor: { agent: AgentId; color: string }[];
  satisfies?: boolean;
};

type WorldNode = Node<WorldNodeData, 'eworld'>;

function WorldNodeComp({ data }: NodeProps<WorldNode>) {
  const ringCls = data.designated
    ? 'border-blue-400 ring-2 ring-blue-400/40'
    : 'border-gray-700';

  return (
    <div className={`rounded-lg border bg-gray-950 px-3 py-2 min-w-[110px] ${ringCls}`}>
      <Handle type="source" position={Position.Right} className="!opacity-0" />
      <Handle type="target" position={Position.Left}  className="!opacity-0" />

      <div className="flex items-center gap-1.5">
        <span className="font-mono text-sm text-gray-200">{data.worldId}</span>
        {data.designated && (
          <span className="text-[9px] uppercase tracking-wider text-blue-300">actual</span>
        )}
        {data.reflexiveFor.length > 0 && (
          <span className="ml-auto flex items-center gap-1">
            {data.reflexiveFor.map(r => (
              <span
                key={r.agent}
                className="text-xs leading-none"
                style={{ color: r.color }}
                title={`reflexive for ${r.agent}`}
              >
                ↻
              </span>
            ))}
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
          >
            {data.satisfies ? '⊨' : '⊭'} φ
          </span>
        </div>
      )}
    </div>
  );
}

const nodeTypes = { eworld: WorldNodeComp };

type Props = {
  model: EpistemicModel;
  className?: string;
  satisfaction?: Record<WorldId, boolean>;
};

export function EpistemicModelView({ model, className, satisfaction }: Props) {
  const { nodes, edges } = useMemo(
    () => buildEpistemicGraph(model, satisfaction),
    [model, satisfaction],
  );

  return (
    <div className={className} style={{ width: '100%', height: 360 }}>
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

export function buildEpistemicGraph(
  model: EpistemicModel,
  satisfaction?: Record<WorldId, boolean>,
): { nodes: WorldNode[]; edges: Edge[] } {
  const SPACING = 220;

  const reflexiveAt = new Map<WorldId, { agent: AgentId; color: string }[]>();
  for (const w of model.worlds) reflexiveAt.set(w.id, []);
  for (const e of model.edges) {
    if (e.from !== e.to) continue;
    const list = reflexiveAt.get(e.from);
    if (list) list.push({ agent: e.agent, color: colorForAgent(e.agent, model.agents) });
  }

  const nodes: WorldNode[] = model.worlds.map((w, i) => ({
    id: w.id,
    type: 'eworld',
    position: { x: i * SPACING, y: 0 },
    data: {
      worldId: w.label ?? w.id,
      atoms: w.atoms,
      designated: w.id === model.designated,
      reflexiveFor: reflexiveAt.get(w.id) ?? [],
      satisfies: satisfaction?.[w.id],
    },
  }));

  // Proper (non-self) edges, one drawn line per (agent, from→to) pair.
  const edges: Edge[] = [];
  for (const e of model.edges) {
    if (e.from === e.to) continue;
    const color = colorForAgent(e.agent, model.agents);
    edges.push({
      id: `${e.agent}::${e.from}->${e.to}`,
      source: e.from,
      target: e.to,
      label: e.agent,
      labelStyle: { fill: color, fontSize: 10, fontFamily: 'monospace' },
      labelBgStyle: { fill: '#030712', fillOpacity: 0.9 },
      labelBgPadding: [4, 2],
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
      style: { stroke: color, strokeWidth: 1.5 },
    });
  }
  return { nodes, edges };
}
