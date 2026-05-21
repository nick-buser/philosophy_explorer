import { FOUR_CATEGORIES } from './mohist-types';
import type { MouEvaluation } from './mohist-engine';

// The Mohist móu aligned-pair view — the base pair and the operator-
// applied parallel pair on two aligned rows, in the step-by-step-
// textual family of the Indian five-step. Below it, the four-outcome
// Xiao Qu taxonomy strip with the current outcome ringed.
//
// The base row is marked 是 (shì — granted). The parallel row is
// marked 然 (rán — "so", the parallel carries) or 不然 (bù rán — it
// does not), per the declared outcome's `transfers`.

type Props = {
  evaluation: MouEvaluation | null;
  className?: string;
};

// One term, optionally prefixed by the operator chip.
function Term({ operator, text }: { operator?: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {operator && (
        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25 font-mono">
          {operator}
        </span>
      )}
      <span className="text-sm text-gray-100">{text}</span>
    </span>
  );
}

function Row({
  label, hint, subject, predicate, copula, copulaTone, operator,
}: {
  label: string;
  hint: string;
  subject: string;
  predicate: string;
  copula: string;
  copulaTone: 'granted' | 'holds' | 'fails' | 'muted';
  operator?: string;
}) {
  const copulaClass =
    copulaTone === 'granted' ? 'text-gray-400 border-gray-700'
    : copulaTone === 'holds' ? 'text-emerald-300 border-emerald-500/40'
    : copulaTone === 'fails' ? 'text-rose-300 border-rose-500/40'
    : 'text-gray-600 border-gray-800';
  return (
    <div className="grid grid-cols-[5.5rem_1fr_auto_1fr] items-center gap-x-3 gap-y-1">
      <div className="text-xs text-gray-500">
        <div className="text-gray-400">{label}</div>
        <div className="text-[10px] text-gray-600">{hint}</div>
      </div>
      <div className="rounded border border-gray-800 bg-gray-950 px-3 py-2 min-h-[2.5rem] flex items-center">
        <Term operator={operator} text={subject} />
      </div>
      <div className={'text-xs font-mono px-2 py-1 rounded border ' + copulaClass}>
        {copula}
      </div>
      <div className="rounded border border-gray-800 bg-gray-950 px-3 py-2 min-h-[2.5rem] flex items-center">
        <Term operator={operator} text={predicate} />
      </div>
    </div>
  );
}

export function MohistDiagram({ evaluation, className }: Props) {
  if (!evaluation) {
    return (
      <div className={className}>
        <p className="text-sm text-gray-600">
          Enter a base pair and an operator to build a móu parallel.
        </p>
      </div>
    );
  }

  const { basePair, parallelPair, argument, wellFormed, verdict } = evaluation;
  const transfers = verdict === 'transfers';
  const blocked = verdict === 'ill-formed' || verdict === 'inconsistent';

  return (
    <div className={'w-full space-y-5 ' + (className ?? '')}>
      <div className="space-y-3">
        <Row
          label="base"
          hint="是 · granted"
          subject={basePair.subject}
          predicate={basePair.predicate}
          copula="is"
          copulaTone="granted"
        />
        <Row
          label="parallel"
          hint={wellFormed ? 'móu’s move' : 'ill-formed'}
          subject={parallelPair.subject}
          predicate={parallelPair.predicate}
          operator={argument.operator}
          copula={blocked ? 'is ?' : transfers ? 'is 然' : 'is not 不然'}
          copulaTone={blocked ? 'muted' : transfers ? 'holds' : 'fails'}
        />
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        The base sentence is granted (<span className="font-mono text-gray-400">是</span>).
        Móu applies the operator{' '}
        <span className="font-mono text-blue-300">{argument.operator || '—'}</span>{' '}
        to each term and proposes the parallel. Whether the parallel carries{' '}
        (<span className="font-mono text-gray-400">然</span>) is the declared
        outcome — the Xiao Qu’s four categories below.
      </p>

      <div>
        <div className="text-xs text-gray-500 mb-1.5">The four Xiao Qu outcomes</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FOUR_CATEGORIES.map(cat => {
            const active = evaluation.declaredCategory.id === cat.id;
            return (
              <div
                key={cat.id}
                title={`${cat.pinyin} — ${cat.gloss}`}
                className={
                  'rounded border px-2.5 py-2 ' +
                  (active
                    ? cat.transfers
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-rose-500/40 bg-rose-500/5'
                    : 'border-gray-800 bg-gray-900/40')
                }
              >
                <div
                  className={
                    'text-sm ' + (active ? 'text-gray-100' : 'text-gray-400')
                  }
                >
                  {cat.chinese}
                </div>
                <div className="text-[10px] text-gray-500 italic">{cat.pinyin}</div>
                <div className="text-[10px] text-gray-600 mt-0.5">{cat.english}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
