import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { LogicExample, LogicSystem } from '../../data/logic-systems';
import { parseAristotelian } from '../aristotelian-parser';
import { AristotelianRenderer } from '../AristotelianRenderer';
import { AristotelianEditor } from '../AristotelianEditor';
import { AristotelianSquare } from '../AristotelianSquare';
import { ARISTOTELIAN_COMMANDS, findAristotelianCommand } from '../aristotelian-commands';
import { checkSyllogism, type ImportSetting } from '../aristotelian-validity';
import {
  allImmediateInferences,
  formatProposition,
  type ImmediateInference,
} from '../aristotelian-immediate';
import { SectionHeading, ImportToggle } from './shared';

export default function AristotelianLab({ system }: { system: LogicSystem }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initial.dsl);
  const [importSetting, setImportSetting] = useState<ImportSetting>('traditional');

  function runCommand(slug: string) {
    if (slug.startsWith('example.')) {
      const ex = system.examples.find(e => e.slug === slug.slice('example.'.length));
      if (ex) setSrc(ex.dsl);
      return;
    }
    const cmd = findAristotelianCommand(slug);
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
          <AristotelianLabBody
            src={src}
            onSrcChange={setSrc}
            examples={system.examples}
            onCommand={runCommand}
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

function AristotelianLabBody({
  src, onSrcChange, examples, onCommand, importSetting, onImportChange,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onCommand: (slug: string) => void;
  importSetting: ImportSetting;
  onImportChange: (s: ImportSetting) => void;
}) {
  const parsed = useMemo(() => parseAristotelian(src), [src]);
  const focusedForm = parsed.ok && parsed.formula.kind === 'proposition'
    ? parsed.formula.proposition.form
    : null;

  return (
    <div className="space-y-4">
      <AristotelianToolbar
        onCommand={onCommand}
        examples={examples}
        importSetting={importSetting}
        onImportChange={onImportChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <span className="text-gray-600">term logic</span>
          </div>
          <AristotelianEditor value={src} onChange={onSrcChange} className="min-h-[220px]" />
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
            <span>Rendering</span>
            <div className="flex items-center gap-2">
              {parsed.ok && parsed.formula.kind === 'syllogism' && (
                <ValidityBadge
                  syllogism={parsed.formula.syllogism}
                  importSetting={importSetting}
                />
              )}
              {parsed.ok ? (
                <span className="text-emerald-400">parsed</span>
              ) : (
                <span className="text-amber-400">parse error</span>
              )}
            </div>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center min-h-[220px] overflow-auto">
            {parsed.ok ? (
              <AristotelianRenderer formula={parsed.formula} className="max-h-[360px]" />
            ) : (
              <div className="text-sm text-amber-300/80 font-mono">
                {parsed.error.message}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
            <span>Square of opposition</span>
            <span className="text-gray-600">
              {focusedForm
                ? `focused on ${focusedForm}`
                : 'enter a single proposition to focus a corner'}
            </span>
          </div>
          <div className="p-4 flex-1 flex items-center justify-center min-h-[260px]">
            <AristotelianSquare
              focused={focusedForm}
              importSetting={importSetting}
              className="max-h-[300px]"
            />
          </div>
        </div>

        <ImmediateInferencesPanel
          proposition={
            parsed.ok && parsed.formula.kind === 'proposition'
              ? parsed.formula.proposition
              : null
          }
          importSetting={importSetting}
        />
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Long form: <code className="text-gray-300">All S is P</code>,
        <code className="ml-1 text-gray-300">No S is P</code>,
        <code className="ml-1 text-gray-300">Some S is P</code>,
        <code className="ml-1 text-gray-300">Some S is not P</code>.
        Syllogisms are three lines (the conclusion may be prefixed
        <code className="ml-1 text-gray-300">Therefore</code>). Compact form:
        <code className="ml-1 text-gray-300">AAA-1/S,M,P</code>.
        Type <code className="text-gray-300">/</code> in the editor for templates and examples.
        Toggle <span className="text-gray-300">Traditional / Boolean</span> to switch existential-import readings —
        the 9 weakened moods become invalid under Boolean, and the square's contrary, subcontrary, and subalternation edges drop.
      </p>
    </div>
  );
}

function AristotelianToolbar({
  onCommand, examples, importSetting, onImportChange,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
  importSetting: ImportSetting;
  onImportChange: (s: ImportSetting) => void;
}) {
  const structural = ARISTOTELIAN_COMMANDS.filter(c => !c.slug.startsWith('example.'));
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
      <ImportToggle value={importSetting} onChange={onImportChange} />
    </div>
  );
}

function ValidityBadge({
  syllogism, importSetting,
}: {
  syllogism: import('../aristotelian-types').Syllogism;
  importSetting: ImportSetting;
}) {
  const result = checkSyllogism(syllogism, importSetting);
  const figLabel = `Fig ${syllogism.figure}`;
  const moodLabel = syllogism.mood;
  if (!result.valid) {
    if (result.reason === 'weakened-under-boolean' && result.entry) {
      return (
        <span
          className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-rose-500/15 text-rose-300 border-rose-500/30"
          title={`${result.entry.name} is valid only under traditional reading (existential import). Boolean reading marks it invalid.`}
        >
          invalid · {result.entry.name} · {moodLabel} · {figLabel} · weakened
        </span>
      );
    }
    return (
      <span
        className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-rose-500/15 text-rose-300 border-rose-500/30"
        title={`${moodLabel}-${syllogism.figure} is not in the valid-mood table`}
      >
        invalid · {moodLabel} · {figLabel}
      </span>
    );
  }
  return (
    <span
      className={
        'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ' +
        (result.entry.weakened
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30')
      }
      title={
        result.entry.weakened
          ? `${result.entry.name} — valid under traditional reading (existential import)`
          : `${result.entry.name} — valid`
      }
    >
      {result.entry.name} · {moodLabel} · {figLabel}
      {result.entry.weakened ? ' · weakened' : ''}
    </span>
  );
}

function ImmediateInferencesPanel({
  proposition, importSetting,
}: {
  proposition: import('../aristotelian-types').CategoricalProposition | null;
  importSetting: ImportSetting;
}) {
  const inferences = useMemo(
    () => proposition ? allImmediateInferences(proposition) : [],
    [proposition],
  );

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
      <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
        <span>Immediate inferences</span>
        <span className="text-gray-600">conversion · obversion · contraposition</span>
      </div>
      <div className="p-4 flex-1 min-h-[260px]">
        {!proposition ? (
          <p className="text-sm text-gray-500 italic">
            Enter a single categorical proposition (A/E/I/O) to see its conversion, obversion, and contraposition.
          </p>
        ) : (
          <ul className="space-y-3">
            {inferences.map((inf, i) => (
              <ImmediateInferenceRow key={i} inference={inf} importSetting={importSetting} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ImmediateInferenceRow({
  inference, importSetting,
}: {
  inference: ImmediateInference;
  importSetting: ImportSetting;
}) {
  const effectiveValidity =
    inference.validity === 'per-accidens' && importSetting === 'boolean'
      ? 'invalid'
      : inference.validity;

  const tag =
      effectiveValidity === 'simple'       ? { label: 'valid',          cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
    : effectiveValidity === 'per-accidens' ? { label: 'per accidens',   cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' }
    :                                        { label: 'invalid',        cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };

  return (
    <li className="space-y-1">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <span className="text-sm text-gray-200 font-medium">{inference.label}</span>
        <span
          className={'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ' + tag.cls}
          title={inference.reason}
        >
          {tag.label}
        </span>
      </div>
      <code className="block text-xs px-2 py-1 rounded bg-gray-950 border border-gray-800 text-blue-300 font-mono">
        {formatProposition(inference.result)}
      </code>
      <p className="text-xs text-gray-500 leading-relaxed">{inference.reason}</p>
    </li>
  );
}
