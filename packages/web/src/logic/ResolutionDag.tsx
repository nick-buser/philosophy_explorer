import { useMemo } from 'react';
import type { DagNode, DagSource, RefutationResult } from './resolution-engine';
import { formatClause, formatSubstitution } from './resolution-types';

// Resolution-DAG renderer.
//
// Layout: clauses are arranged into rows by *derivation depth*.
// Inputs and goal-negations sit at depth 0; resolvents at
// max(parent.depth) + 1. We render rows from top (depth 0) down,
// with each clause as a small card, and draw straight SVG edges
// from each resolvent to its two parents. Edges always go upward
// (lower-depth to higher-depth) because parents are always at a
// strictly lower depth than the resolvent.
//
// Pure CSS-grid + a single absolutely-positioned SVG overlay. No
// layout libraries — the cards self-size, and the overlay reads
// each card's position via a ref-callback ledger.

type Props = {
  result: RefutationResult;
  // The original goals are surfaced in the badge labels.
  goalCount: number;
};

export function ResolutionDag({ result, goalCount }: Props) {
  const layout = useMemo(() => layoutDag(result), [result]);

  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-400 leading-relaxed flex items-center gap-3 flex-wrap">
        <Legend tone="input">input</Legend>
        {goalCount > 0 && <Legend tone="goal">¬goal</Legend>}
        <Legend tone="resolvent">resolvent</Legend>
        {result.emptyClauseId !== null && <Legend tone="empty">⊥ — refuted</Legend>}
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-4">
        <div className="space-y-3">
          {layout.rows.map((row, depth) => (
            <div key={depth} className="flex items-start gap-3">
              <div className="text-[10px] uppercase tracking-wider text-gray-600 font-mono w-12 pt-2 shrink-0 text-right">
                d={depth}
              </div>
              <div className="flex flex-wrap gap-3 flex-1">
                {row.map(node => (
                  <ClauseCard
                    key={node.id}
                    node={node}
                    isEmptyResult={result.emptyClauseId === node.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Each card is a clause. Inputs are seeded at depth 0; the engine adds the
        negation of every goal literal, then saturates the set under binary resolution
        bounded by depth. A resolvent inherits depth max(parent depths) + 1 and lists
        its two parents and the unifier that produced it. Reaching the empty clause ⊥
        proves the original goal follows from the inputs.
      </p>
    </div>
  );
}

function Legend({ tone, children }: { tone: 'input' | 'goal' | 'resolvent' | 'empty'; children: React.ReactNode }) {
  const cls = TONE_BG[tone];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-2.5 h-2.5 rounded-sm ${cls}`} />
      <span>{children}</span>
    </span>
  );
}

const TONE_BG = {
  input:     'bg-sky-500/40',
  goal:      'bg-violet-500/40',
  resolvent: 'bg-gray-500/40',
  empty:     'bg-rose-500/60',
};

function ClauseCard({ node, isEmptyResult }: { node: DagNode; isEmptyResult: boolean }) {
  const tone = node.source.kind === 'input'
    ? 'border-sky-500/50 bg-sky-500/5'
    : node.source.kind === 'goal'
    ? 'border-violet-500/50 bg-violet-500/5'
    : isEmptyResult
    ? 'border-rose-500/70 bg-rose-500/15'
    : 'border-gray-700 bg-gray-900/60';

  return (
    <div className={`rounded border ${tone} px-3 py-2 min-w-[6rem]`}>
      <div className="flex items-baseline gap-2">
        <span className="text-[10px] font-mono text-gray-500">C{node.id}</span>
        <code className="text-sm text-gray-100 font-mono break-all">
          {formatClause(node.clause)}
        </code>
      </div>
      <SourceLine source={node.source} />
    </div>
  );
}

function SourceLine({ source }: { source: DagSource }) {
  if (source.kind === 'input') {
    return <div className="mt-0.5 text-[10px] text-sky-300/70 font-mono">input #{source.index + 1}</div>;
  }
  if (source.kind === 'goal') {
    return (
      <div className="mt-0.5 text-[10px] text-violet-300/70 font-mono">
        ¬goal{source.goalIndex > 0 ? ` ${source.goalIndex + 1}` : ''}
      </div>
    );
  }
  return (
    <div className="mt-0.5 text-[10px] text-gray-500 font-mono space-y-0.5">
      <div>res(C{source.left}, C{source.right}) on lit {source.leftLit + 1} ↔ lit {source.rightLit + 1}</div>
      {source.mgu.size > 0 && (
        <div className="text-gray-400">θ = {formatSubstitution(source.mgu)}</div>
      )}
    </div>
  );
}

// Lay out by derivation depth: input/goal at 0, resolvent at
// max(parent depth) + 1.
type Layout = { rows: DagNode[][] };

function layoutDag(result: RefutationResult): Layout {
  const depth = new Map<number, number>();
  for (const node of result.dag) {
    if (node.source.kind === 'input' || node.source.kind === 'goal') {
      depth.set(node.id, 0);
    } else {
      const lD = depth.get(node.source.left)  ?? 0;
      const rD = depth.get(node.source.right) ?? 0;
      depth.set(node.id, Math.max(lD, rD) + 1);
    }
  }
  const maxDepth = Math.max(0, ...depth.values());
  const rows: DagNode[][] = Array.from({ length: maxDepth + 1 }, () => []);
  for (const node of result.dag) {
    rows[depth.get(node.id)!]!.push(node);
  }
  return { rows };
}
