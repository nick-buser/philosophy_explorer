import type { DatalogResult, DatalogStratum } from './resolution-engine';
import { formatAtom, formatSubstitution } from './resolution-types';

// Datalog forward-chaining renderer: per-iteration "stratum" tables.
//
// Stratum 0 is the EDB — facts the user wrote literally. Each
// subsequent stratum is the set of new ground facts derivable in
// one application of the immediate-consequence operator T_P from
// the strict subset of facts known at the *start* of the round.
// (The engine takes a snapshot per round to keep this clean — see
// `datalogForward` in `resolution-engine.ts`.)
//
// We render two views, in this order:
//
//   1. Strata sequence — for each round, the new facts and which
//      rule fired, with the body-match highlighted.
//   2. Final model — facts grouped by predicate, alphabetised by
//      predicate name, sorted by argument tuple within.
//
// The stratum view is the pedagogical one (you can read the
// fixpoint computation top-to-bottom). The final-model view is
// the answer. Both are useful.

export function DatalogStrata({ result }: { result: DatalogResult }) {
  return (
    <div className="space-y-4">
      <div className="text-xs text-gray-400 leading-relaxed flex items-center gap-3 flex-wrap">
        <span>strata: <span className="text-gray-200 font-mono">{result.strata.length}</span></span>
        <span>· total facts: <span className="text-gray-200 font-mono">{result.totalFacts}</span></span>
      </div>

      <div className="space-y-3">
        {result.strata.map(s => <StratumView key={s.iteration} stratum={s} />)}
      </div>

      <FinalModel result={result} />

      <p className="text-xs text-gray-500 leading-relaxed">
        Forward-chaining (semi-naïve) computes the minimal Herbrand model: start with the
        EDB facts at iteration 0, then at each round apply every rule's body to the
        snapshot of facts known at the round's start, derive every ground head fact, and
        add new ones to the model. Repeat until a round derives nothing new — the fixpoint.
      </p>
    </div>
  );
}

function StratumView({ stratum }: { stratum: DatalogStratum }) {
  if (stratum.newFacts.length === 0) return null;
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-950/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-800 flex items-baseline justify-between gap-3">
        <div className="text-xs">
          <span className="font-semibold text-gray-300">stratum {stratum.iteration}</span>
          <span className="ml-2 text-gray-500">
            {stratum.iteration === 0 ? 'EDB facts (input)' : `iteration ${stratum.iteration} — derived`}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-gray-600 font-mono">
          + {stratum.newFacts.length}
        </span>
      </div>
      <ul className="divide-y divide-gray-800/60">
        {stratum.newFacts.map((d, i) => (
          <li key={i} className="px-3 py-2 text-sm">
            <code className="text-gray-100 font-mono">{formatAtom(d.fact)}</code>
            {d.source !== null && (
              <div className="mt-0.5 text-[10px] text-gray-500 font-mono leading-tight">
                via R{d.source.ruleIndex + 1} · body match {d.source.bodyMatches.map(formatAtom).join(', ')}
                {d.source.binding.size > 0 && (
                  <> · θ={formatSubstitution(d.source.binding)}</>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FinalModel({ result }: { result: DatalogResult }) {
  const preds = Array.from(result.factsByPredicate.keys()).sort();
  if (preds.length === 0) return null;
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-800">
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">final model</span>
      </div>
      <div className="p-3 grid gap-3 sm:grid-cols-2">
        {preds.map(p => {
          const facts = (result.factsByPredicate.get(p) ?? [])
            .map(formatAtom)
            .sort();
          return (
            <div key={p} className="rounded border border-gray-800/80 bg-gray-950/40 p-2">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-mono mb-1">{p}</div>
              <ul className="space-y-0.5">
                {facts.map(f => (
                  <li key={f} className="text-xs text-gray-200 font-mono break-all">{f}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
