import { renderKatex } from './fol-render';
import { KatexFormula } from './KatexFormula';
import { RULE_LABELS } from './nd-types';
import type { GentzenNode } from './nd-gentzen';

export function GentzenTreeView({ root }: { root: GentzenNode }) {
  return (
    <div className="font-mono text-sm overflow-x-auto">
      <NodeView node={root} isRoot={true} />
    </div>
  );
}

function NodeView({ node, isRoot }: { node: GentzenNode; isRoot: boolean }) {
  const isLeaf = node.children.length === 0;
  const isAssumption = node.rule === 'assumption';
  const isPremise = node.rule === 'premise';

  const formulaCls = node.discharged
    ? 'text-gray-500 line-through'
    : isAssumption ? 'text-amber-200'
    : isPremise   ? 'text-gray-300'
    : 'text-gray-100';

  return (
    <div className={isRoot ? '' : 'mt-1.5'}>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="inline-flex items-baseline gap-1">
          {node.discharged && <span className="text-gray-500 text-xs">[</span>}
          <KatexFormula tex={renderKatex(node.formula)} className={`inline-block ${formulaCls}`} />
          {node.discharged && (
            <>
              <span className="text-gray-500 text-xs">]</span>
              {node.dischargedBy && (
                <sup className="text-[10px] text-rose-300/80 ml-0.5">
                  {RULE_LABELS[node.dischargedBy.rule]}
                </sup>
              )}
            </>
          )}
        </span>
        {!isLeaf && (
          <span className="text-xs text-blue-300 shrink-0">{RULE_LABELS[node.rule]}</span>
        )}
        {isLeaf && isPremise   && <span className="text-[10px] text-gray-500">premise</span>}
        {isLeaf && isAssumption && !node.discharged && <span className="text-[10px] text-amber-300/80">open assumption</span>}
      </div>
      {node.children.length > 0 && (
        <div className="ml-5 border-l border-gray-800 pl-3 mt-1">
          {node.children.map((c, i) => (
            <NodeView key={i} node={c} isRoot={false} />
          ))}
        </div>
      )}
    </div>
  );
}
