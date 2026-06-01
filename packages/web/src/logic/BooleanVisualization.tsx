import { useMemo } from 'react';
import { renderKatex as renderBoolKatex } from './boolean-render';
import { buildBoolTruthTable } from './boolean-truth-table';
import { buildKMap } from './boolean-kmap';
import { KarnaughMap } from './KarnaughMap';
import { KatexFormula } from './KatexFormula';
import type { BoolFormula } from './boolean-types';

// Inline boolean-algebra visualization for the argument browser: the formula,
// a tautology / contradiction / contingent verdict (from the truth table), and
// a Karnaugh map when the formula is within the K-map variable budget.
const STATUS_STYLE: Record<string, string> = {
  tautology: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  contradiction: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  contingent: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

export function BooleanVisualization({ formula }: { formula: BoolFormula }) {
  const table = useMemo(() => buildBoolTruthTable(formula), [formula]);
  const kmap = useMemo(() => buildKMap(formula), [formula]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <KatexFormula tex={renderBoolKatex(formula)} className="text-gray-100" />
        <span
          className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ${STATUS_STYLE[table.status]}`}
        >
          {table.status}
        </span>
      </div>
      {kmap && (
        <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-4 flex justify-center overflow-x-auto">
          <KarnaughMap data={kmap} />
        </div>
      )}
    </div>
  );
}
