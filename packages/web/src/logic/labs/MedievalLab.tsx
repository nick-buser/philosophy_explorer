import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { LogicExample, LogicSystem } from '../../data/logic-systems';
import { parseMedieval } from '../medieval-parser';
import { MedievalRenderer } from '../MedievalRenderer';
import { MedievalEditor } from '../MedievalEditor';
import { MEDIEVAL_COMMANDS, findMedievalCommand } from '../medieval-commands';
import {
  checkModalSyllogism,
  checkSorites,
  type ModalValidityResult,
  type SoritesValidityResult,
} from '../medieval-validity';
import type { ModalReading, ModalSyllogism } from '../medieval-types';
import type { ImportSetting } from '../aristotelian-validity';
import { SectionHeading, ImportToggle } from './shared';

export default function MedievalLab({ system }: { system: LogicSystem }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initial.dsl);
  const [reading, setReading] = useState<ModalReading>('de-re');
  const [importSetting, setImportSetting] = useState<ImportSetting>('traditional');

  function runCommand(slug: string) {
    if (slug.startsWith('example.')) {
      const ex = system.examples.find(e => e.slug === slug.slice('example.'.length));
      if (ex) setSrc(ex.dsl);
      return;
    }
    const cmd = findMedievalCommand(slug);
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
          <MedievalLabBody
            src={src}
            onSrcChange={setSrc}
            examples={system.examples}
            onCommand={runCommand}
            reading={reading}
            onReadingChange={setReading}
            importSetting={importSetting}
            onImportChange={setImportSetting}
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

function MedievalLabBody({
  src, onSrcChange, examples, onCommand,
  reading, onReadingChange, importSetting, onImportChange,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onCommand: (slug: string) => void;
  reading: ModalReading;
  onReadingChange: (r: ModalReading) => void;
  importSetting: ImportSetting;
  onImportChange: (s: ImportSetting) => void;
}) {
  const parsed = useMemo(() => parseMedieval(src), [src]);

  // The page-level reading toggle only takes effect when the parsed
  // syllogism didn't fix a reading itself (i.e. assertoric premises +
  // a modal conclusion, or a compact-form fallback). When the parser
  // already resolved a reading from explicit prefixes/infixes, we
  // honour it and the toggle just shows the current effective state.
  const effectiveReading: ModalReading = parsed.ok && parsed.formula.kind === 'modal-syllogism'
    && parsed.formula.syllogism.reading !== 'assertoric'
      ? parsed.formula.syllogism.reading
      : reading;

  const validity =
    parsed.ok && parsed.formula.kind === 'modal-syllogism'
      ? checkModalSyllogism(
          { ...parsed.formula.syllogism, reading: effectiveReading },
          importSetting,
        )
      : null;
  const sorites =
    parsed.ok && parsed.formula.kind === 'sorites'
      ? checkSorites(parsed.formula.chain, importSetting)
      : null;

  return (
    <div className="space-y-4">
      <MedievalToolbar
        onCommand={onCommand}
        examples={examples}
        reading={reading}
        onReadingChange={onReadingChange}
        importSetting={importSetting}
        onImportChange={onImportChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <span className="text-gray-600">modal term logic</span>
          </div>
          <MedievalEditor value={src} onChange={onSrcChange} className="min-h-[260px]" />
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
            <span>Rendering</span>
            <div className="flex items-center gap-2">
              {validity && parsed.ok && parsed.formula.kind === 'modal-syllogism' && (
                <ModalValidityBadge
                  syllogism={{ ...parsed.formula.syllogism, reading: effectiveReading }}
                  result={validity}
                />
              )}
              {sorites && (
                <SoritesValidityBadge result={sorites} />
              )}
              {parsed.ok ? (
                <span className="text-emerald-400">parsed</span>
              ) : (
                <span className="text-amber-400">parse error</span>
              )}
            </div>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center min-h-[260px] overflow-auto">
            {parsed.ok ? (
              <MedievalRenderer
                formula={parsed.formula}
                className="max-h-[360px]"
                failedStepIndex={sorites && !sorites.valid ? sorites.failedStepIndex : null}
                stepNames={sorites && sorites.valid ? sorites.stepNames : []}
              />
            ) : (
              <div className="text-sm text-amber-300/80 font-mono">
                {parsed.error.message}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Long form: <code className="text-gray-300">Necessarily, all S is P</code> (de dicto) /
        <code className="ml-1 text-gray-300">All S is necessarily P</code> (de re).
        Modal syllogisms are three lines (the conclusion may be prefixed
        <code className="ml-1 text-gray-300">Therefore</code>). Sorites are 4+ lines, each line sharing a term with the next.
        Compact form: <code className="ml-1 text-gray-300">LXL-1/de-re/S,M,P</code>.
        Toggle <span className="text-gray-300">de re / de dicto</span> to switch the modal scope reading —
        Aristotle vs Buridan disagree on whether mixed L/X moods (e.g. Barbara LXL-1) are valid, and the toggle flips the result.
        The <span className="text-gray-300">Traditional / Boolean</span> toggle composes with reading and follows
        the FEAT-009 rule: Boolean import marks the 9 weakened underlying assertoric moods invalid.
      </p>
    </div>
  );
}

function MedievalToolbar({
  onCommand, examples, reading, onReadingChange, importSetting, onImportChange,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
  reading: ModalReading;
  onReadingChange: (r: ModalReading) => void;
  importSetting: ImportSetting;
  onImportChange: (s: ImportSetting) => void;
}) {
  const structural = MEDIEVAL_COMMANDS.filter(c => !c.slug.startsWith('example.'));
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
      <div className="mx-2 h-4 w-px bg-gray-800" />
      <ReadingToggle value={reading} onChange={onReadingChange} />
      <ImportToggle value={importSetting} onChange={onImportChange} />
    </div>
  );
}

function ReadingToggle({
  value, onChange,
}: {
  value: ModalReading;
  onChange: (r: ModalReading) => void;
}) {
  const options: { id: ModalReading; label: string; title: string }[] = [
    {
      id: 'de-re',
      label: 'de re',
      title: 'In sensu diviso — the modal operator binds the predicate inside the proposition (Aristotle).',
    },
    {
      id: 'de-dicto',
      label: 'de dicto',
      title: 'In sensu composito — the modal operator binds the proposition as a whole (Buridan / Theophrastus).',
    },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Modal reading"
      className="inline-flex rounded border border-gray-800 bg-gray-900 overflow-hidden"
    >
      {options.map(opt => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            title={opt.title}
            className={
              'text-xs px-2.5 py-1.5 transition-colors ' +
              (active
                ? 'bg-violet-500/15 text-violet-200'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200')
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ModalValidityBadge({
  syllogism, result,
}: {
  syllogism: ModalSyllogism;
  result: ModalValidityResult;
}) {
  const figLabel = `Fig ${syllogism.figure}`;
  const moodLabel = `${syllogism.modalMood}/${syllogism.assertoricMood}`;
  const readingLabel = syllogism.reading === 'de-re'
    ? 'de re'
    : syllogism.reading === 'de-dicto'
      ? 'de dicto'
      : 'assertoric';

  if (!result.valid) {
    const reasonText =
        result.reason === 'pattern-not-supported'   ? 'mode pattern unsupported in phase 1'
      : result.reason === 'conclusion-mode-mismatch' ? `conclusion mode mismatch — ${result.note ?? ''}`
      : result.reason === 'weakened-under-boolean'   ? 'weakened under Boolean import'
      :                                                'underlying assertoric mood is invalid';
    return (
      <span
        className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-rose-500/15 text-rose-300 border-rose-500/30"
        title={reasonText}
      >
        invalid · {moodLabel} · {figLabel} · {readingLabel}
      </span>
    );
  }
  return (
    <span
      className={
        'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ' +
        (result.assertoric.weakened
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30')
      }
      title={result.modalName ?? `${result.assertoric.name} (modal)`}
    >
      {(result.modalName ?? result.assertoric.name)} · {moodLabel} · {figLabel} · {readingLabel}
      {result.assertoric.weakened ? ' · weakened' : ''}
    </span>
  );
}

function SoritesValidityBadge({ result }: { result: SoritesValidityResult }) {
  if (!result.valid) {
    return (
      <span
        className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-rose-500/15 text-rose-300 border-rose-500/30"
        title={result.reason}
      >
        invalid · sorites step {result.failedStepIndex + 1}
      </span>
    );
  }
  return (
    <span
      className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      title={`${result.shape} sorites of length ${result.length}`}
    >
      sorites · {result.shape} · {result.length} steps
    </span>
  );
}
