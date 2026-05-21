import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { LogicExample, LogicSystem } from '../../data/logic-systems';
import { parseMohist } from '../mohist-parser';
import { evaluateMou } from '../mohist-engine';
import type { MouEvaluation, Verdict } from '../mohist-engine';
import { MohistEditor } from '../MohistEditor';
import { MohistDiagram } from '../MohistDiagram';
import { MOHIST_COMMANDS, findMohistCommand } from '../mohist-commands';
import { SectionHeading } from './shared';

export default function MohistLab({ system }: { system: LogicSystem }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initial.dsl);

  function runCommand(slug: string) {
    if (slug.startsWith('example.')) {
      const ex = system.examples.find(e => e.slug === slug.slice('example.'.length));
      if (ex) setSrc(ex.dsl);
      return;
    }
    const cmd = findMohistCommand(slug);
    if (cmd) setSrc(cmd.insert);
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
          <MohistLabBody src={src} onSrcChange={setSrc} examples={system.examples} onCommand={runCommand} />
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

function MohistLabBody({
  src, onSrcChange, examples, onCommand,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onCommand: (slug: string) => void;
}) {
  const parsed = useMemo(() => parseMohist(src), [src]);
  const evaluation = parsed.ok ? evaluateMou(parsed.argument) : null;

  return (
    <div className="space-y-4">
      <MohistToolbar onCommand={onCommand} examples={examples} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <span className="text-gray-600">móu — parallel inference</span>
          </div>
          <MohistEditor value={src} onChange={onSrcChange} className="min-h-[220px]" />
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
            <span>Evaluation</span>
            <div className="flex items-center gap-2">
              {evaluation && <VerdictBadge verdict={evaluation.verdict} />}
              {parsed.ok ? (
                <span className="text-emerald-400">parsed</span>
              ) : (
                <span className="text-amber-400">parse error</span>
              )}
            </div>
          </div>
          <div className="p-6 flex-1 min-h-[220px] overflow-auto">
            {!parsed.ok ? (
              <div className="text-sm text-amber-300/80 font-mono">{parsed.error.message}</div>
            ) : evaluation ? (
              <EvaluationView evaluation={evaluation} />
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
        <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
          <span>The parallel</span>
          <span className="text-gray-600">
            {evaluation
              ? `${evaluation.declaredCategory.chinese} · ${evaluation.declaredCategory.pinyin}`
              : 'enter a móu argument'}
          </span>
        </div>
        <div className="p-4 flex-1">
          <MohistDiagram evaluation={evaluation} />
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        A móu argument is a <code className="text-gray-300">base</code> pair{' '}
        <code className="text-gray-300">X | Y</code> (the accepted “X is Y”), an{' '}
        <code className="text-gray-300">operator</code> applied to both terms, a declared{' '}
        <code className="text-gray-300">outcome</code> — one of the four Xiao Qu categories —
        and an optional <code className="text-gray-300">flag</code> naming the failure mode.
        The engine form-checks the schema and cross-checks the outcome against the flag; it
        does not infer which category a parallel falls into — that is not mechanically
        decidable. See the History section.
      </p>
    </div>
  );
}

function MohistToolbar({
  onCommand, examples,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
}) {
  const structural = MOHIST_COMMANDS.filter(c => !c.slug.startsWith('example.'));
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
        className="text-xs px-2.5 py-1.5 rounded border border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors max-w-[280px]"
        onChange={e => {
          const slug = e.target.value;
          if (slug) onCommand(`example.${slug}`);
          e.target.value = '';
        }}
        defaultValue=""
      >
        <option value="" disabled>Insert example…</option>
        {examples.map(ex => (
          <option key={ex.slug} value={ex.slug}>{ex.natural}</option>
        ))}
      </select>
    </div>
  );
}

function EvaluationView({ evaluation }: { evaluation: MouEvaluation }) {
  const { basePair, argument, declaredCategory, consistent, inconsistency, wellFormed, formIssues, verdict } =
    evaluation;
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-gray-500">Base — granted (是)</div>
        <p className="mt-1 text-sm text-gray-100">
          {basePair.subject} <span className="text-gray-500">is</span> {basePair.predicate}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          operator <code className="text-blue-300 font-mono">{argument.operator}</code>
        </p>
      </div>

      {!wellFormed && (
        <div className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          <div className="text-xs text-amber-300 font-medium">Ill-formed móu schema</div>
          <ul className="mt-1 space-y-0.5">
            {formIssues.map(issue => (
              <li key={issue} className="text-xs text-amber-200/80">— {issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div
        className={
          'rounded border px-3 py-2 ' +
          (declaredCategory.transfers
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-rose-500/30 bg-rose-500/5')
        }
      >
        <div className="text-xs text-gray-500">Declared outcome</div>
        <p className="mt-0.5 text-sm">
          <span className={declaredCategory.transfers ? 'text-emerald-200 font-medium' : 'text-rose-200 font-medium'}>
            {declaredCategory.chinese}
          </span>
          <span className="text-gray-500"> — {declaredCategory.pinyin} — {declaredCategory.english}</span>
        </p>
        <p className="mt-1 text-xs text-gray-400">{declaredCategory.gloss}</p>
      </div>

      <div
        className={
          'rounded border px-3 py-2 ' +
          (consistent
            ? 'border-gray-800 bg-gray-900/40'
            : 'border-amber-500/30 bg-amber-500/5')
        }
      >
        <div className="text-xs text-gray-500">Cross-check — outcome vs. flag</div>
        {consistent ? (
          <p className="mt-0.5 text-xs text-gray-300">
            Consistent — the declared outcome agrees with{' '}
            {argument.flag ? (
              <>the flag <code className="text-blue-300 font-mono">{argument.flag}</code></>
            ) : (
              'the absence of a failure flag'
            )}
            .
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-amber-200/90">{inconsistency}</p>
        )}
      </div>

      {argument.gloss && (
        <div>
          <div className="text-xs text-gray-500">Gloss</div>
          <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">{argument.gloss}</p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Verdict: <VerdictText verdict={verdict} />
      </p>
    </div>
  );
}

const VERDICT_LABEL: Record<Verdict, string> = {
  transfers: 'the parallel carries (然)',
  fails: 'the parallel fails (不然)',
  inconsistent: 'inconsistent — outcome and flag disagree',
  'ill-formed': 'ill-formed — not a móu schema',
};

function VerdictText({ verdict }: { verdict: Verdict }) {
  const tone =
    verdict === 'transfers' ? 'text-emerald-300'
    : verdict === 'fails' ? 'text-rose-300'
    : 'text-amber-300';
  return <span className={tone}>{VERDICT_LABEL[verdict]}</span>;
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const cls =
    verdict === 'transfers' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    : verdict === 'fails' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
    : 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  const text =
    verdict === 'transfers' ? '然 transfers'
    : verdict === 'fails' ? '不然 fails'
    : verdict === 'inconsistent' ? 'inconsistent'
    : 'ill-formed';
  return (
    <span
      className={'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ' + cls}
      title={VERDICT_LABEL[verdict]}
    >
      {text}
    </span>
  );
}
