import { renderKatex } from './fol-render';
import { KatexFormula } from './KatexFormula';
import { RULE_LABELS, type FitchLine, type FitchProof } from './nd-types';

export function FitchProofView({ proof }: { proof: FitchProof }) {
  const grouped = groupBySubproof(proof.lines);
  return (
    <div className="font-mono text-sm space-y-0.5">
      <Block items={grouped} maxLineNo={proof.lines.length} />
    </div>
  );
}

type BlockItem =
  | { kind: 'line'; line: FitchLine }
  | { kind: 'subproof'; lines: BlockItem[] };

function groupBySubproof(lines: FitchLine[]): BlockItem[] {
  type Frame = { depth: number; items: BlockItem[] };
  const stack: Frame[] = [{ depth: 0, items: [] }];
  for (const l of lines) {
    while (stack.length > 1 && stack[stack.length - 1]!.depth > l.depth) {
      const closed = stack.pop()!;
      stack[stack.length - 1]!.items.push({ kind: 'subproof', lines: closed.items });
    }
    while (stack[stack.length - 1]!.depth < l.depth) {
      const newFrame: Frame = { depth: stack[stack.length - 1]!.depth + 1, items: [] };
      stack.push(newFrame);
    }
    stack[stack.length - 1]!.items.push({ kind: 'line', line: l });
  }
  while (stack.length > 1) {
    const closed = stack.pop()!;
    stack[stack.length - 1]!.items.push({ kind: 'subproof', lines: closed.items });
  }
  return stack[0]!.items;
}

function Block({ items, maxLineNo }: { items: BlockItem[]; maxLineNo: number }) {
  return (
    <div>
      {items.map((it, i) => {
        if (it.kind === 'line') return <Line key={i} line={it.line} maxLineNo={maxLineNo} />;
        return (
          <div key={i} className="border-l-2 border-blue-500/40 pl-3 my-1 bg-blue-500/5 rounded-sm">
            <Block items={it.lines} maxLineNo={maxLineNo} />
          </div>
        );
      })}
    </div>
  );
}

function Line({ line, maxLineNo }: { line: FitchLine; maxLineNo: number }) {
  const gutterWidth = String(maxLineNo).length;
  const isAssumption = line.rule === 'assumption';
  const isPremise = line.rule === 'premise';
  const isReit = line.rule === 'reit';
  const ruleColor =
    isPremise    ? 'text-gray-500'
  : isAssumption ? 'text-amber-300'
  : isReit       ? 'text-gray-500'
  : line.rule === 'raa' ? 'text-rose-300'
  : 'text-blue-300';

  return (
    <div
      className={
        'flex items-baseline gap-3 py-0.5 ' +
        (isAssumption ? 'border-b border-blue-500/30 mb-1 pb-1' : '')
      }
    >
      <span
        className="text-gray-600 text-xs tabular-nums shrink-0 text-right"
        style={{ width: `${gutterWidth + 1}ch` }}
      >
        {line.lineNo}.
      </span>
      <div className="flex-1 min-w-0">
        <KatexFormula tex={renderKatex(line.formula)} className="text-gray-100 inline-block" />
      </div>
      <span className={`text-xs ${ruleColor} shrink-0`}>
        {RULE_LABELS[line.rule]}
        {line.cites.length > 0 && (
          <span className="text-gray-500 ml-1">
            {line.cites.map(formatCite).join(', ')}
          </span>
        )}
      </span>
    </div>
  );
}

function formatCite(c: number | [number, number]): string {
  if (typeof c === 'number') return String(c);
  return `${c[0]}–${c[1]}`;
}
