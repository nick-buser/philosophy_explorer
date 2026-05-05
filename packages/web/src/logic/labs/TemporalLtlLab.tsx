import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { LogicExample, LogicSystem } from '../../data/logic-systems';
import { parseTemporal } from '../temporal-parser';
import { renderKatexT } from '../temporal-render';
import { LogicCmEditor } from '../LogicCmEditor';
import { TraceView } from '../TraceView';
import { KatexFormula } from '../KatexFormula';
import { TEMPORAL_COMMANDS, findTemporalCommand } from '../temporal-commands';
import {
  satisfactionMapT,
  satisfiesT,
  validInTrace,
} from '../temporal-eval';
import { ltlAxiomVerdicts } from '../temporal-axioms';
import type { TemporalFormula, Trace } from '../temporal-types';
import { SectionHeading } from './shared';

export default function TemporalLtlLab({ system }: { system: LogicSystem }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initial.dsl);
  const [exampleSlug, setExampleSlug] = useState<string>(initial.slug);

  const activeExample = useMemo(
    () => system.examples.find(ex => ex.slug === exampleSlug) ?? initial,
    [exampleSlug, system.examples, initial],
  );
  const liveTrace: Trace | undefined = activeExample.trace;

  function pickExample(slug: string) {
    const ex = system.examples.find(e => e.slug === slug);
    if (!ex) return;
    setExampleSlug(slug);
    setSrc(ex.dsl);
  }

  function runCommand(slug: string) {
    if (slug.startsWith('example.')) {
      pickExample(slug.slice('example.'.length));
      return;
    }
    const cmd = findTemporalCommand(slug);
    if (!cmd) return;
    setSrc(cmd.insert);
  }

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-6 space-y-12">
        <Link to="/logic" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
          ← Logic Lab
        </Link>

        <header>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-100">{system.name}</h1>
            <span className="text-sm text-gray-500">{system.era}</span>
          </div>
          <p className="mt-3 text-gray-400 leading-relaxed max-w-3xl">{system.shortDescription}</p>
        </header>

        <section>
          <SectionHeading>Lab</SectionHeading>
          <LtlLabBody
            src={src}
            onSrcChange={setSrc}
            examples={system.examples}
            onPickCommand={runCommand}
            activeExample={activeExample}
            liveTrace={liveTrace}
          />
        </section>

        <section>
          <SectionHeading>History</SectionHeading>
          <p className="text-gray-300 leading-relaxed">{system.history}</p>
        </section>

        <section>
          <SectionHeading>Primitives</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {system.primitives.map(p => (
              <div key={p.name} className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-gray-100 font-medium">{p.name}</h3>
                  <code className="text-xs px-1.5 py-0.5 rounded bg-gray-950 border border-gray-800 text-blue-300 font-mono">
                    {p.syntax}
                  </code>
                </div>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </section>

        {system.readingPointers.length > 0 && (
          <section>
            <SectionHeading>Further reading</SectionHeading>
            <ul className="space-y-2">
              {system.readingPointers.map(r => (
                <li key={r.href} className="text-sm">
                  {r.kind === 'case-study' ? (
                    <Link to={r.href} className="text-blue-300 hover:text-blue-200">{r.title}</Link>
                  ) : (
                    <a href={r.href} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
                      {r.title} ↗
                    </a>
                  )}
                  <span className="ml-2 text-xs text-gray-600">({r.kind})</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function LtlLabBody({
  src, onSrcChange, examples, onPickCommand, activeExample, liveTrace,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onPickCommand: (slug: string) => void;
  activeExample: LogicExample;
  liveTrace: Trace | undefined;
}) {
  const parsed = useMemo(() => parseTemporal(src), [src]);

  return (
    <div className="space-y-4">
      <LtlToolbar
        onCommand={onPickCommand}
        examples={examples}
        activeExampleSlug={activeExample.slug}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <span className="text-gray-600">linear temporal</span>
          </div>
          <LogicCmEditor commands={TEMPORAL_COMMANDS} value={src} onChange={onSrcChange} className="min-h-[180px]" />
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>Rendering</span>
            {parsed.ok ? (
              <span className="text-emerald-400">parsed</span>
            ) : (
              <span className="text-amber-400">parse error</span>
            )}
          </div>
          <div className="p-6 flex-1 flex items-center justify-center min-h-[180px]">
            {parsed.ok ? (
              <KatexFormula tex={renderKatexT(parsed.formula)} className="text-gray-100" />
            ) : (
              <div className="text-sm text-amber-300/80 font-mono">
                {parsed.error.message} (col {parsed.error.position + 1})
              </div>
            )}
          </div>
        </div>
      </div>

      {liveTrace && (
        <>
          <TracePanel
            trace={liveTrace}
            formula={parsed.ok ? parsed.formula : undefined}
            activeExample={activeExample}
          />
          <LtlAxiomsPanel trace={liveTrace} />
        </>
      )}

      <p className="text-xs text-gray-500 leading-relaxed">
        Truth values per state, the start-position truth badge, and axiom verdicts
        are all computed by the LTL engine on the lasso trace. The dashed purple
        loopback edge marks where the infinite future cycles to. The "stutter"
        edge (dashed grey self-loop) appears when the loop terminates at the last
        state — an OK approximation for "things stop changing", but it is *not*
        equivalent to a non-cyclic infinite future.
      </p>
    </div>
  );
}

function TracePanel({
  trace, formula, activeExample,
}: {
  trace: Trace;
  formula: TemporalFormula | undefined;
  activeExample: LogicExample;
}) {
  const satMap = useMemo(
    () => (formula ? satisfactionMapT(formula, trace) : undefined),
    [formula, trace],
  );
  const start = trace.start ?? 0;
  const startStateId = trace.states[start]?.id;
  const startTruth = useMemo(() => {
    if (!formula) return undefined;
    return satisfiesT(formula, trace);
  }, [formula, trace]);
  const validity = useMemo(
    () => (formula ? validInTrace(formula, trace) : undefined),
    [formula, trace],
  );

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span>Lasso trace</span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-400">{activeExample.natural}</span>
          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 font-mono">
            n = {trace.states.length} · loop → {trace.states[trace.loopBack]?.id}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {startStateId && startTruth !== undefined && (
            <span
              className={
                'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ' +
                (startTruth
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30')
              }
            >
              {startTruth ? '⊨' : '⊭'} {startStateId}
            </span>
          )}
          {validity && (
            <span
              className={
                'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ' +
                (validity.valid
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30')
              }
            >
              {validity.valid ? 'trace-valid' : `invalid (fails at ${validity.failingState})`}
            </span>
          )}
        </div>
      </div>
      <TraceView trace={trace} satisfaction={satMap} className="bg-gray-950/50" />
      {activeExample.note && (
        <div className="px-4 py-3 border-t border-gray-800 text-sm text-gray-400 leading-relaxed">
          {activeExample.note}
        </div>
      )}
    </div>
  );
}

function LtlAxiomsPanel({ trace }: { trace: Trace }) {
  const verdicts = useMemo(() => ltlAxiomVerdicts(trace), [trace]);
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4 space-y-3">
      <h3 className="text-gray-100 font-medium">LTL axioms in this trace</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {verdicts.map(v => (
          <div
            key={v.axiom.short}
            className={
              'text-xs px-3 py-2 rounded border ' +
              (v.valid
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-rose-500/30 bg-rose-500/5')
            }
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-gray-100">{v.axiom.short}</span>
              <span className={v.valid ? 'text-emerald-300' : 'text-rose-300'}>
                {v.valid ? 'valid' : 'fails'}
              </span>
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">{v.axiom.name}</div>
            <code className="text-[10px] block mt-1 text-blue-300 font-mono break-all">
              {v.axiom.schema}
            </code>
            <div className="text-[10px] text-gray-500 mt-1 leading-relaxed">{v.axiom.gloss}</div>
            {!v.valid && v.failure && (
              <div className="text-[10px] text-rose-300/80 mt-1">
                fails at <code className="font-mono">{v.failure.state}</code> under{' '}
                <code className="font-mono">
                  {Object.entries(v.failure.substitution).map(([k, val]) => `${k}↦${val}`).join(', ')}
                </code>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        Every entry is a canonical LTL theorem — valid on every infinite trace. A
        red ✗ here would mean the engine is miscomputing a fixed point; the panel
        doubles as a regression check.
      </p>
    </div>
  );
}

function LtlToolbar({
  onCommand, examples, activeExampleSlug,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
  activeExampleSlug: string;
}) {
  const structural = TEMPORAL_COMMANDS.filter(c => !c.slug.startsWith('example.'));
  return (
    <div className="flex flex-wrap items-center gap-2">
      {structural.map(c => (
        <button
          key={c.slug}
          type="button"
          onClick={() => onCommand(c.slug)}
          className="text-xs px-2.5 py-1.5 rounded border border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors font-mono"
          title={c.detail}
        >
          /{c.slug}
        </button>
      ))}
      <div className="mx-2 h-4 w-px bg-gray-800" />
      <select
        className="text-xs px-2.5 py-1.5 rounded border border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors max-w-[320px]"
        value={activeExampleSlug}
        onChange={e => {
          const slug = e.target.value;
          if (slug) onCommand(`example.${slug}`);
        }}
      >
        {examples.map(ex => (
          <option key={ex.slug} value={ex.slug}>{ex.natural}</option>
        ))}
      </select>
    </div>
  );
}
