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
import type { Trace } from './temporal-types';

// TraceView — render a lasso trace as a horizontal sequence with a
// curved loopback arrow. Each state is a node showing its id, its
// atom valuation, and (optionally) per-state truth chips.

type StateNodeData = {
  stateId: string;
  atoms: string[];
  isStart: boolean;
  satisfies?: boolean;
};

type StateNode = Node<StateNodeData, 'tstate'>;

function StateNodeComp({ data }: NodeProps<StateNode>) {
  const ringCls = data.isStart
    ? 'border-blue-400 ring-2 ring-blue-400/40'
    : 'border-gray-700';

  return (
    <div className={`rounded-lg border bg-gray-950 px-3 py-2 min-w-[88px] ${ringCls}`}>
      <Handle type="source" position={Position.Right} className="!opacity-0" />
      <Handle type="target" position={Position.Left}  className="!opacity-0" />

      <div className="flex items-center gap-1.5">
        <span className="font-mono text-sm text-gray-200">{data.stateId}</span>
        {data.isStart && (
          <span className="text-[9px] uppercase tracking-wider text-blue-300">start</span>
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

const nodeTypes = { tstate: StateNodeComp };

type Props = {
  trace: Trace;
  className?: string;
  satisfaction?: Record<string, boolean>;
};

export function TraceView({ trace, className, satisfaction }: Props) {
  const { nodes, edges } = useMemo(
    () => buildTraceGraph(trace, satisfaction),
    [trace, satisfaction],
  );

  return (
    <div className={className} style={{ width: '100%', height: 280 }}>
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

export function buildTraceGraph(
  trace: Trace,
  satisfaction?: Record<string, boolean>,
): { nodes: StateNode[]; edges: Edge[] } {
  const SPACING = 160;
  const start = trace.start ?? 0;
  const n = trace.states.length;
  const lastIdx = n - 1;
  const stutter = trace.loopBack === lastIdx;

  const nodes: StateNode[] = trace.states.map((s, i) => ({
    id: s.id,
    type: 'tstate',
    position: { x: i * SPACING, y: 0 },
    data: {
      stateId: s.label ?? s.id,
      atoms: s.atoms,
      isStart: i === start,
      satisfies: satisfaction?.[s.id],
    },
  }));

  const edges: Edge[] = [];
  for (let i = 0; i < n - 1; i++) {
    edges.push({
      id: `seq-${i}`,
      source: trace.states[i]!.id,
      target: trace.states[i + 1]!.id,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af', width: 14, height: 14 },
      style: { stroke: '#9ca3af', strokeWidth: 1.5 },
    });
  }
  // Loopback edge — drawn as a curved bezier with a softer color so it
  // reads as the "infinite repetition" rather than another step.
  // Special-case the stutter form (loopBack === lastIdx): we render a
  // self-loop on the last state to communicate "things stop changing".
  if (stutter) {
    const last = trace.states[lastIdx]!;
    edges.push({
      id: 'loop-stutter',
      source: last.id,
      target: last.id,
      type: 'default',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280', width: 12, height: 12 },
      style: { stroke: '#6b7280', strokeWidth: 1.5, strokeDasharray: '4 3' },
      label: 'stutter',
      labelStyle: { fill: '#6b7280', fontSize: 9, fontFamily: 'monospace' },
      labelBgStyle: { fill: '#030712', fillOpacity: 0.8 },
      labelBgPadding: [4, 2],
    });
  } else {
    const fromState = trace.states[lastIdx]!;
    const toState = trace.states[trace.loopBack]!;
    edges.push({
      id: 'loopback',
      source: fromState.id,
      target: toState.id,
      type: 'default',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#a78bfa', width: 14, height: 14 },
      style: { stroke: '#a78bfa', strokeWidth: 1.5, strokeDasharray: '6 4' },
      label: `loop → ${toState.label ?? toState.id}`,
      labelStyle: { fill: '#a78bfa', fontSize: 10, fontFamily: 'monospace' },
      labelBgStyle: { fill: '#030712', fillOpacity: 0.9 },
      labelBgPadding: [4, 2],
    });
  }
  return { nodes, edges };
}
