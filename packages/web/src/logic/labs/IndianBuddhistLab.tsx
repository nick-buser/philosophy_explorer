import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { LogicExample, LogicSystem } from '../../data/logic-systems';
import { parseInference } from '../indian-parser';
import { classify, type Verdict } from '../indian-engine';
import { fiveSteps } from '../indian-render';
import { IndianEditor } from '../IndianEditor';
import { INDIAN_COMMANDS } from '../indian-commands';
import { FiveStepView } from '../FiveStepView';
import { HetuCakra } from '../HetuCakra';
import { SectionHeading } from './shared';

export default function IndianBuddhistLab({ system }: { system: LogicSystem }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initial.dsl);

  function runCommand(slug: string) {
    if (slug.startsWith('example.')) {
      const ex = system.examples.find(e => e.slug === slug.slice('example.'.length));
      if (ex) setSrc(ex.dsl);
      return;
    }
    const cmd = INDIAN_COMMANDS.find(c => c.slug === slug);
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
          <IndianLabBody
            src={src}
            onSrcChange={setSrc}
            examples={system.examples}
            onCommand={runCommand}
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

function IndianLabBody({
  src, onSrcChange, examples, onCommand,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onCommand: (slug: string) => void;
}) {
  const parsed = useMemo(() => parseInference(src), [src]);
  const classification = useMemo(
    () => parsed.ok ? classify(parsed.inference) : null,
    [parsed],
  );
  const steps = useMemo(
    () => parsed.ok ? fiveSteps(parsed.inference) : null,
    [parsed],
  );

  return (
    <div className="space-y-4">
      <IndianToolbar onCommand={onCommand} examples={examples} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <span className="text-gray-600">anumāna</span>
          </div>
          <IndianEditor value={src} onChange={onSrcChange} className="min-h-[220px]" />
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
            <span>Verdict</span>
            <div className="flex items-center gap-2">
              {classification && <VerdictBadge verdict={classification.verdict} />}
              {parsed.ok ? (
                <span className="text-emerald-400">parsed</span>
              ) : (
                <span className="text-amber-400">parse error</span>
              )}
            </div>
          </div>
          <div className="p-4 flex-1 min-h-[220px]">
            {classification ? (
              <TrairupyaPanel
                trairupya={classification.trairupya}
              />
            ) : !parsed.ok ? (
              <div className="text-sm text-amber-300/80 font-mono">
                {parsed.error.message}
                {parsed.error.line > 0 ? ` (line ${parsed.error.line})` : ''}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {steps && (
        <Panel
          title="Five-membered inference (pañcāvayava)"
          subtitle="The Nyāya five-step textual presentation: pratijñā · hetu · udāharaṇa · upanaya · nigamana."
        >
          <FiveStepView steps={steps} />
        </Panel>
      )}

      {classification && (
        <Panel
          title="Hetu-cakra"
          subtitle="Dignāga's wheel of reason. Rows: hetu's presence in the sapakṣa (similar examples). Columns: hetu's presence in the vipakṣa (dissimilar examples). The current inference's cell is highlighted."
        >
          <HetuCakra activeCell={classification.verdict.cell.id} />
          <p className="mt-3 text-xs text-gray-400 leading-relaxed">
            <span className="font-medium text-gray-200">{classification.verdict.cell.sanskrit}.</span>{' '}
            {classification.verdict.cell.gloss}.
          </p>
        </Panel>
      )}

      <p className="text-xs text-gray-500 leading-relaxed">
        Syntax: each line is <code className="text-gray-300">key: value</code>.
        Required keys: <code className="text-gray-300">paksha</code> (subject), <code className="text-gray-300">sadhya</code> (what to prove), <code className="text-gray-300">hetu</code> (reason). Optional: <code className="text-gray-300">sapaksha</code> (similar examples — bear the sādhya), <code className="text-gray-300">vipaksha</code> (dissimilar examples — lack the sādhya).
        Comma-separate examples; mark an example with <code className="text-gray-300">+</code> if it bears the hetu and <code className="text-gray-300">-</code> if it lacks it. Sapakṣa default is <code className="text-gray-300">+</code>; vipakṣa default is <code className="text-gray-300">-</code>.
      </p>
    </div>
  );
}

function IndianToolbar({
  onCommand, examples,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
}) {
  const structural = INDIAN_COMMANDS.filter(c => !c.slug.startsWith('example.'));
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

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const tone =
    verdict.kind === 'valid'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : verdict.kind === 'contradictory'
      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
      : verdict.kind === 'unestablished'
      ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
      : 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  const label =
    verdict.kind === 'valid'         ? `valid · ${verdict.cell.sanskrit}`
    : verdict.kind === 'contradictory' ? `contradictory · ${verdict.cell.sanskrit}`
    : verdict.kind === 'unestablished' ? `asiddha · pakṣa-dharmatā fails`
    :                                    `inconclusive · ${verdict.cell.sanskrit}`;
  return (
    <span
      className={'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ' + tone}
      title={verdict.cell.gloss}
    >
      {label}
    </span>
  );
}

function TrairupyaPanel({
  trairupya,
}: {
  trairupya: import('../indian-engine').Trairupya;
}) {
  const rows: { label: string; sanskrit: string; check: { satisfied: boolean; reason: string } }[] = [
    { label: 'Reason in the subject',     sanskrit: 'pakṣa-dharmatā',  check: trairupya.pakshadharmata },
    { label: 'Reason in similar cases',   sanskrit: 'sapakṣe sattvam',  check: trairupya.sapakshasattva },
    { label: 'Reason absent in others',   sanskrit: 'vipakṣe asattvam', check: trairupya.vipakshasattva },
  ];
  return (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-wider text-gray-500">trairūpya</div>
      <ul className="space-y-2">
        {rows.map(r => (
          <li key={r.sanskrit} className="flex items-start gap-3">
            <span
              className={
                'mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full border text-[10px] ' +
                (r.check.satisfied
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-rose-500/40 bg-rose-500/15 text-rose-300')
              }
              aria-label={r.check.satisfied ? 'satisfied' : 'fails'}
            >
              {r.check.satisfied ? '✓' : '×'}
            </span>
            <div className="min-w-0">
              <div className="text-sm">
                <span className="text-gray-100 font-medium">{r.sanskrit}</span>
                <span className="text-gray-500"> · {r.label}</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{r.check.reason}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40">
      <div className="px-3 py-2 border-b border-gray-800">
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">{title}</span>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
