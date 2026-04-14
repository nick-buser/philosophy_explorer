import { createRoute, Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  useEdgesState,
  useNodesState,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Dagre from '@dagrejs/dagre';
import { rootRoute } from './__root';
import { getCurriculumBySlug } from '../data/curricula/index';
import type { Curriculum, CurriculumItem, Dependency, CurriculumStage } from '../lib/curriculum-schema';

export const curriculumDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/curricula/$slug',
  component: CurriculumDetailPage,
});

// ── Styles ────────────────────────────────────────────────────────────────────

const LEVEL_STYLE: Record<string, string> = {
  beginner:     'bg-emerald-900/40 text-emerald-300',
  intermediate: 'bg-blue-900/40 text-blue-300',
  advanced:     'bg-violet-900/40 text-violet-300',
};

const ITEM_TYPE_STYLE: Record<string, { border: string; text: string; badge: string }> = {
  primary:   { border: '#1e40af', text: '#93c5fd', badge: 'bg-blue-900/40 text-blue-300' },
  secondary: { border: '#92400e', text: '#fcd34d', badge: 'bg-amber-900/40 text-amber-300' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatYear(year: number): string {
  const abs = Math.abs(year);
  return year < 0 ? `${abs} BCE` : `${year} CE`;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-4">
      {children}
    </h2>
  );
}

// ── Dependency Graph ──────────────────────────────────────────────────────────

const NODE_W = 196;
const NODE_H = 76;

type ItemNodeData = { item: CurriculumItem };
type ItemNode = Node<ItemNodeData, 'curriculumItem'>;

function CurriculumItemNode({ data }: NodeProps<ItemNode>) {
  const { item } = data;
  const style = ITEM_TYPE_STYLE[item.type] ?? ITEM_TYPE_STYLE.primary;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#374151', border: '1px solid #4b5563', width: 8, height: 8 }}
        isConnectable={false}
      />
      <div
        style={{
          width: NODE_W,
          height: NODE_H,
          borderColor: style.border,
          borderWidth: 1.5,
          borderStyle: item.workSlug ? 'solid' : 'dashed',
        }}
        className="rounded-lg bg-gray-900 px-3 py-2 flex flex-col justify-center gap-1"
      >
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full capitalize leading-none ${style.badge}`}>
            {item.type}
          </span>
          {!item.workSlug && (
            <span className="text-[9px] text-gray-600 italic leading-none">not in explorer</span>
          )}
        </div>
        <p
          className="text-[11px] font-semibold leading-tight truncate"
          style={{ color: style.text }}
        >
          {item.title}
        </p>
        <p className="text-[10px] text-gray-500 truncate leading-none">{item.author}</p>
        {item.composedYear !== undefined && (
          <p className="text-[9px] text-gray-700 leading-none">{formatYear(item.composedYear)}</p>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#374151', border: '1px solid #4b5563', width: 8, height: 8 }}
        isConnectable={false}
      />
    </>
  );
}

const nodeTypes = { curriculumItem: CurriculumItemNode };

function buildLayoutedElements(
  items: CurriculumItem[],
  dependencies: Dependency[],
): { nodes: ItemNode[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 90, marginx: 24, marginy: 24 });

  const itemIds = new Set(items.map(i => i.id));
  items.forEach(item => g.setNode(item.id, { width: NODE_W, height: NODE_H }));

  const validDeps = dependencies.filter(d => itemIds.has(d.from) && itemIds.has(d.to));
  validDeps.forEach(dep => g.setEdge(dep.from, dep.to));

  Dagre.layout(g);

  const nodes: ItemNode[] = items.map(item => {
    const { x, y } = g.node(item.id);
    return {
      id: item.id,
      type: 'curriculumItem' as const,
      position: { x: x - NODE_W / 2, y: y - NODE_H / 2 },
      data: { item },
      draggable: false,
      connectable: false,
      selectable: false,
    };
  });

  const edges: Edge[] = validDeps.map((dep, i) => ({
    id: `e-${i}`,
    source: dep.from,
    target: dep.to,
    style: { stroke: '#4b5563', strokeWidth: 1.25 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#4b5563', width: 14, height: 14 },
  }));

  return { nodes, edges };
}

function DependencyGraph({
  items,
  dependencies,
}: {
  items: CurriculumItem[];
  dependencies: Dependency[];
}) {
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildLayoutedElements(items, dependencies),
    // items/dependencies are static JSON — useMemo is just for hygiene
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [nodes] = useNodesState(initNodes);
  const [edges] = useEdgesState(initEdges);

  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden" style={{ height: 540 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.08 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnDoubleClick={false}
        style={{ background: '#030712' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#1f2937"
        />
        <Controls
          showInteractive={false}
          style={{
            background: '#111827',
            border: '1px solid #1f2937',
            borderRadius: 8,
            color: '#9ca3af',
          }}
        />
      </ReactFlow>
      <div className="flex items-center gap-6 px-4 py-2.5 border-t border-gray-800 bg-gray-950 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-400" />
          Primary text
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
          Secondary
        </span>
        <span className="flex items-center gap-1.5">
          <svg width={22} height={8}>
            <line x1={0} y1={4} x2={18} y2={4} stroke="#4b5563" strokeWidth={1.5} strokeDasharray="4 3" />
          </svg>
          Not yet in explorer
        </span>
      </div>
    </div>
  );
}

// ── Reading list ──────────────────────────────────────────────────────────────

function ItemRow({ item, index }: { item: CurriculumItem; index: number }) {
  const typeTextCls = item.type === 'primary' ? 'text-blue-300' : 'text-amber-300';
  const badgeCls    = item.type === 'primary'
    ? 'bg-blue-900/40 text-blue-300'
    : 'bg-amber-900/40 text-amber-300';

  const titleEl = item.workSlug ? (
    <Link
      to="/works/$slug"
      params={{ slug: item.workSlug }}
      className={`font-medium hover:underline underline-offset-2 transition-colors ${typeTextCls}`}
    >
      {item.title}
    </Link>
  ) : (
    <span className="font-medium text-gray-200">{item.title}</span>
  );

  const authorEl = item.authorSlug ? (
    <Link
      to="/philosophers/$slug"
      params={{ slug: item.authorSlug }}
      className="hover:text-gray-300 transition-colors"
    >
      {item.author}
    </Link>
  ) : (
    <span>{item.author}</span>
  );

  return (
    <div className="flex gap-4 py-4 border-b border-gray-800 last:border-0">
      <span className="text-2xl font-light text-gray-700 w-6 shrink-0 pt-0.5 select-none tabular-nums">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          {titleEl}
          <span className={`text-xs px-1.5 py-0.5 rounded-full capitalize ${badgeCls}`}>
            {item.type}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
          {authorEl}
          {item.composedYear !== undefined && (
            <span className="text-gray-600">{formatYear(item.composedYear)}</span>
          )}
          {!item.workSlug && (
            <span className="text-gray-700 italic">not yet in explorer</span>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-400 leading-relaxed">{item.description}</p>
        {item.note && (
          <p className="mt-1.5 text-xs text-gray-500 leading-relaxed italic border-l-2 border-gray-800 pl-3">
            {item.note}
          </p>
        )}
      </div>
    </div>
  );
}

function StageSection({
  stage,
  items,
  globalOffset,
}: {
  stage: CurriculumStage;
  items: CurriculumItem[];
  globalOffset: number;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-100">{stage.title}</h3>
        {stage.description && (
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">{stage.description}</p>
        )}
      </div>
      <div>
        {items.map((item, i) => (
          <ItemRow key={item.id} item={item} index={globalOffset + i} />
        ))}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function CurriculumDetailPage() {
  const { slug } = curriculumDetailRoute.useParams();
  const curriculum = getCurriculumBySlug(slug);

  if (!curriculum) {
    return (
      <main className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-6">
          <Link to="/curricula" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Curricula
          </Link>
          <p className="mt-8 text-gray-400">Curriculum not found.</p>
        </div>
      </main>
    );
  }

  const levelClass = LEVEL_STYLE[curriculum.level] ?? 'bg-gray-800 text-gray-400';
  const sortedStages = [...curriculum.stages].sort((a, b) => a.order - b.order);

  let runningIndex = 0;

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6 space-y-14">

        <Link to="/curricula" className="text-sm text-gray-500 hover:text-gray-300 transition-colors block">
          ← Curricula
        </Link>

        <header>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-100 leading-tight">{curriculum.title}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full capitalize shrink-0 ${levelClass}`}>
              {curriculum.level}
            </span>
          </div>
          <p className="mt-2 text-gray-400 italic text-lg">{curriculum.tagline}</p>
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 flex-wrap">
            <span>{curriculum.estimatedDuration}</span>
            <span className="text-gray-700">·</span>
            <span>{curriculum.items.filter(i => i.type === 'primary').length} primary texts</span>
            <span className="text-gray-700">·</span>
            <span>{curriculum.items.filter(i => i.type === 'secondary').length} secondary</span>
          </div>
          <p className="mt-4 text-gray-300 leading-relaxed">{curriculum.description}</p>
        </header>

        <section>
          <SectionHeading>Why This Sequence</SectionHeading>
          <p className="text-sm text-gray-400 leading-relaxed">{curriculum.justification}</p>
        </section>

        <section>
          <SectionHeading>Dependency Graph</SectionHeading>
          <p className="text-xs text-gray-600 mb-4">
            Arrows point from prerequisite to dependent. Read anything before the texts that depend on it.
          </p>
          <DependencyGraph items={curriculum.items} dependencies={curriculum.dependencies} />
        </section>

        <section>
          <SectionHeading>Reading List</SectionHeading>
          <div className="space-y-12">
            {sortedStages.map(stage => {
              const stageItems = curriculum.items.filter(i => i.stageId === stage.id);
              const offset = runningIndex;
              runningIndex += stageItems.length;
              return (
                <StageSection
                  key={stage.id}
                  stage={stage}
                  items={stageItems}
                  globalOffset={offset}
                />
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}
