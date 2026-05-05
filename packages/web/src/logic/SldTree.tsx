import type { SldNode, SldResult } from './resolution-engine';
import { formatAtom, formatRule, formatSubstitution } from './resolution-types';

// SLD-derivation tree renderer.
//
// The SLD search produces a tree where each interior node is a goal
// (a list of atoms) and each child is the result of selecting the
// leftmost atom and resolving against one freshened program clause.
// We render the *path actually explored* — including dead-end
// branches that were tried before the successful one — so the
// student can see backtracking as a real branching, not as a hidden
// reset. The successful branch is rendered with a green spine; dead
// ends are dimmed.

export function SldTree({ result }: { result: SldResult }) {
  const successPath = pathToFirstSuccess(result.root);
  return (
    <div className="space-y-3">
      <div className="text-xs text-gray-400 leading-relaxed flex items-center gap-3 flex-wrap">
        <Legend tone="success">success path</Legend>
        <Legend tone="dead">dead end</Legend>
        <Legend tone="open">open</Legend>
        <span className="ml-auto text-gray-500 font-mono">
          steps: {result.steps}
          {' · '}
          outcome: {result.outcome}
        </span>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-4 overflow-x-auto">
        <NodeView node={result.root} successPath={successPath} depth={0} />
      </div>

      {result.outcome === 'success' && (
        <p className="text-xs text-emerald-300/80 leading-relaxed font-mono">
          ⊢ {result.answer && result.answer.size > 0 ? formatSubstitution(result.answer) : '{} (true)'}
        </p>
      )}
      {result.outcome === 'failure' && (
        <p className="text-xs text-rose-300/80 leading-relaxed">
          The search exhausted every selection / rule combination without reducing the goal to ⌷
          (the empty goal). Under the closed-world assumption built into SLD, the query has no answer.
        </p>
      )}
      {result.outcome === 'budget' && (
        <p className="text-xs text-amber-300/80 leading-relaxed">
          Budget exhausted after {result.steps} resolution attempts. Consider rewriting the program
          to avoid left-recursion or rerunning Datalog forward chaining instead.
        </p>
      )}

      <p className="text-xs text-gray-500 leading-relaxed">
        Each node shows the current goal — a conjunction of atoms — and one child per attempted
        rule resolution. The leftmost atom of the goal is selected; the engine tries each program
        clause whose head unifies with it, substituting the body for the selected atom. The empty
        goal ⌷ is success; everything else is either a dead end (back-tracked) or off-path.
      </p>
    </div>
  );
}

function Legend({ tone, children }: { tone: 'success' | 'dead' | 'open'; children: React.ReactNode }) {
  const cls =
    tone === 'success' ? 'bg-emerald-500/40' :
    tone === 'dead'    ? 'bg-gray-700' :
                         'bg-amber-500/40';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block w-2.5 h-2.5 rounded-sm ${cls}`} />
      <span>{children}</span>
    </span>
  );
}

type SuccessPath = Set<SldNode>;

function pathToFirstSuccess(root: SldNode): SuccessPath {
  const path: SuccessPath = new Set();
  function walk(node: SldNode): boolean {
    if (node.goal.length === 0) {
      path.add(node);
      return true;
    }
    for (const att of node.attempts) {
      if (att.status === 'success' && att.child && walk(att.child)) {
        path.add(node);
        return true;
      }
    }
    return false;
  }
  walk(root);
  return path;
}

function NodeView({
  node, successPath, depth,
}: {
  node: SldNode;
  successPath: SuccessPath;
  depth: number;
}) {
  const onPath = successPath.has(node);
  const isLeaf = node.goal.length === 0;
  const tone = isLeaf
    ? 'border-emerald-500/60 bg-emerald-500/10'
    : onPath
    ? 'border-emerald-500/40 bg-gray-900/60'
    : 'border-gray-700 bg-gray-900/40';

  return (
    <div className="space-y-2" style={{ marginLeft: depth === 0 ? 0 : 16 }}>
      <div className={`inline-block rounded border ${tone} px-3 py-1.5`}>
        <code className="text-sm text-gray-100 font-mono break-all">
          {isLeaf ? '⌷' : node.goal.map(formatAtom).join(', ')}
        </code>
      </div>

      {node.attempts.length > 0 && (
        <ul className="border-l border-gray-800 pl-4 space-y-2">
          {node.attempts.map((att, i) => {
            const childOnPath = att.child ? successPath.has(att.child) : false;
            const dim = !childOnPath && att.status !== 'success';
            return (
              <li key={i}>
                <div className={'text-[10px] font-mono leading-tight ' + (dim ? 'text-gray-600' : 'text-gray-400')}>
                  <span className="text-gray-500">via </span>
                  <span className="text-gray-300">{formatRule(att.rule)}</span>
                  {att.mgu.size > 0 && (
                    <>
                      {' '}<span className="text-gray-500">θ=</span>{formatSubstitution(att.mgu)}
                    </>
                  )}
                  {att.status === 'dead-end' && <span className="ml-2 text-rose-300/80">× dead end</span>}
                </div>
                {att.child && (
                  <div className={dim ? 'opacity-60' : ''}>
                    <NodeView node={att.child} successPath={successPath} depth={depth + 1} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
