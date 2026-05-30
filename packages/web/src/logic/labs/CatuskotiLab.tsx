import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { LogicExample, LogicSystem } from '../../data/logic-systems';
import { parseCatuskoti } from '../catuskoti-parser';
import { evaluateCatuskoti } from '../catuskoti-engine';
import type { Evaluation } from '../catuskoti-engine';
import { READING_INFO } from '../catuskoti-types';
import type { Reading } from '../catuskoti-types';
import { CatuskotiEditor } from '../CatuskotiEditor';
import { CatuskotiDiagram } from '../CatuskotiDiagram';
import { CATUSKOTI_COMMANDS, findCatuskotiCommand } from '../catuskoti-commands';
import { SectionHeading } from './shared';

// Rewrite (or append) the `reading:` line of a catuṣkoṭi DSL source so
// the reading toggle and the editor text stay in sync.
function setReadingInDsl(src: string, reading: Reading): string {
  const lines = src.split('\n');
  const idx = lines.findIndex(l => /^\s*reading\s*:/i.test(l));
  const line = `reading:     ${reading}`;
  if (idx >= 0) {
    lines[idx] = line;
    return lines.join('\n');
  }
  return (src.endsWith('\n') ? src.slice(0, -1) : src) + '\n' + line;
}

export default function CatuskotiLab({ system }: { system: LogicSystem }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initial.dsl);

  function runCommand(slug: string) {
    if (slug.startsWith('example.')) {
      const ex = system.examples.find(e => e.slug === slug.slice('example.'.length));
      if (ex) setSrc(ex.dsl);
      return;
    }
    const cmd = findCatuskotiCommand(slug);
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
          <CatuskotiLabBody
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

function CatuskotiLabBody({
  src, onSrcChange, examples, onCommand,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onCommand: (slug: string) => void;
}) {
  const parsed = useMemo(() => parseCatuskoti(src), [src]);
  const evaluation = parsed.ok ? evaluateCatuskoti(parsed.proposition) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CatuskotiToolbar onCommand={onCommand} examples={examples} />
        <ReadingToggle
          value={parsed.ok ? parsed.proposition.reading : 'affirming'}
          disabled={!parsed.ok}
          onChange={reading => onSrcChange(setReadingInDsl(src, reading))}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <span className="text-gray-600">four-cornered predication</span>
          </div>
          <CatuskotiEditor value={src} onChange={onSrcChange} className="min-h-[220px]" />
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
            <span>Evaluation</span>
            <div className="flex items-center gap-2">
              {evaluation && <VerdictBadge evaluation={evaluation} />}
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
              <EvaluationView text={parsed.proposition.text} evaluation={evaluation} />
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
        <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
          <span>The four corners</span>
          <span className="text-gray-600">
            {evaluation
              ? evaluation.reading === 'prasanga'
                ? 'prasaṅga — all four refused'
                : `affirming — koṭi ${evaluation.koti.n}`
              : 'enter a proposition to place a corner'}
          </span>
        </div>
        <div className="p-4 flex-1 flex items-center justify-center">
          <CatuskotiDiagram evaluation={evaluation} />
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        A catuṣkoṭi is a <code className="text-gray-300">proposition</code>, the{' '}
        <code className="text-gray-300">koti</code> (corner) under consideration —{' '}
        <span className="text-gray-300">affirmation</span>,{' '}
        <span className="text-gray-300">negation</span>,{' '}
        <span className="text-gray-300">both</span>, or{' '}
        <span className="text-gray-300">neither</span> — and a{' '}
        <code className="text-gray-300">reading</code>. The affirming reading asserts
        the corner; the prasaṅga reading refuses it and, with it, all four. The engine
        fixes <code className="text-gray-300">v(A)</code> to the corner’s four-valued
        (FDE) value and evaluates each corner-formula under it. Phase 1 evaluates the
        four fixed corner-formulas; compound evaluation is deferred to phase 2.
      </p>
    </div>
  );
}

function CatuskotiToolbar({
  onCommand, examples,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
}) {
  const structural = CATUSKOTI_COMMANDS.filter(c => !c.slug.startsWith('example.'));
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

function ReadingToggle({
  value, disabled, onChange,
}: {
  value: Reading;
  disabled: boolean;
  onChange: (r: Reading) => void;
}) {
  const options: Reading[] = ['affirming', 'prasanga'];
  return (
    <div
      role="radiogroup"
      aria-label="Catuṣkoṭi reading"
      className="inline-flex rounded border border-gray-800 bg-gray-900 overflow-hidden"
    >
      {options.map(opt => {
        const active = value === opt;
        const info = READING_INFO[opt];
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt)}
            title={info.gloss}
            className={
              'text-xs px-2.5 py-1.5 transition-colors disabled:opacity-40 ' +
              (active
                ? 'bg-blue-500/15 text-blue-200'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200')
            }
          >
            {info.label}
          </button>
        );
      })}
    </div>
  );
}

function EvaluationView({ text, evaluation }: { text: string; evaluation: Evaluation }) {
  const { koti, reading, verdict, corners } = evaluation;
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-gray-500">Proposition A</div>
        <p className="mt-1 text-sm text-gray-100">{text}</p>
      </div>

      <div
        className={
          'rounded border px-3 py-2 ' +
          (verdict === 'affirmed'
            ? 'border-amber-500/30 bg-amber-500/5'
            : 'border-rose-500/30 bg-rose-500/5')
        }
      >
        <div className="text-xs text-gray-500">
          Koṭi {koti.n} of 4 · {READING_INFO[reading].label} reading
        </div>
        <p className="mt-0.5 text-sm">
          <span className={verdict === 'affirmed' ? 'text-amber-200 font-medium' : 'text-rose-200 font-medium'}>
            {koti.sanskrit}
          </span>
          <span className="text-gray-500"> — {koti.formula} — {koti.gloss}</span>
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {verdict === 'affirmed'
            ? 'The affirming reading asserts this corner of the proposition.'
            : 'The prasaṅga reading refuses this corner — and, with it, all four.'}
        </p>
      </div>

      <div>
        <div className="text-xs text-gray-500">
          Corner-formulas under v(A) = {fmtValue(evaluation.propositionValue)}
        </div>
        <div className="mt-1 space-y-1">
          {corners.map(c => (
            <div key={c.koti.n} className="flex items-baseline gap-3">
              <span className="text-xs text-gray-500 w-10 shrink-0">koṭi {c.koti.n}</span>
              <code className="text-sm text-gray-300 font-mono w-24 shrink-0">{c.koti.formula}</code>
              <span className="text-sm text-blue-300 font-mono">{fmtValue(c.value)}</span>
              <span className={c.designated ? 'text-xs text-emerald-400' : 'text-xs text-gray-600'}>
                {c.designated ? 'assertible' : 'not assertible'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function fmtValue(values: readonly string[]): string {
  if (values.length === 0) return '∅';
  return `{${values.join(', ')}}`;
}

function VerdictBadge({ evaluation }: { evaluation: Evaluation }) {
  const affirmed = evaluation.verdict === 'affirmed';
  return (
    <span
      className={
        'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ' +
        (affirmed
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          : 'bg-rose-500/15 text-rose-300 border-rose-500/30')
      }
      title={`${evaluation.koti.sanskrit} — ${evaluation.koti.gloss}`}
    >
      {affirmed ? `koṭi ${evaluation.koti.n} affirmed` : 'all four rejected'}
    </span>
  );
}
