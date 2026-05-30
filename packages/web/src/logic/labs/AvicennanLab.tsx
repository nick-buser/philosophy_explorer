import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { LogicExample, LogicSystem } from '../../data/logic-systems';
import { parseAvicennan } from '../avicennan-parser';
import { checkSyllogism } from '../avicennan-validity';
import { formatSyllogism, glossProposition, MODALITY_INFO } from '../avicennan-render';
import { letterOf } from '../avicennan-types';
import type { Syllogism, SyllogismVerdict } from '../avicennan-types';
import { AvicennanEditor } from '../AvicennanEditor';
import { AvicennanMoodTable } from '../AvicennanMoodTable';
import { AVICENNAN_COMMANDS, findAvicennanCommand } from '../avicennan-commands';
import { AristotelianSquare } from '../AristotelianSquare';
import { SectionHeading } from './shared';

export default function AvicennanLab({ system }: { system: LogicSystem }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initial.dsl);

  function runCommand(slug: string) {
    if (slug.startsWith('example.')) {
      const ex = system.examples.find(e => e.slug === slug.slice('example.'.length));
      if (ex) setSrc(ex.dsl);
      return;
    }
    const cmd = findAvicennanCommand(slug);
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
          <AvicennanLabBody
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

function AvicennanLabBody({
  src, onSrcChange, examples, onCommand,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onCommand: (slug: string) => void;
}) {
  const parsed = useMemo(() => parseAvicennan(src), [src]);

  const syllogism = parsed.ok && parsed.formula.kind === 'syllogism'
    ? parsed.formula.syllogism
    : null;
  const proposition = parsed.ok && parsed.formula.kind === 'proposition'
    ? parsed.formula.proposition
    : null;
  const verdict = syllogism ? checkSyllogism(syllogism) : null;

  return (
    <div className="space-y-4">
      <AvicennanToolbar onCommand={onCommand} examples={examples} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <span className="text-gray-600">modal term logic</span>
          </div>
          <AvicennanEditor value={src} onChange={onSrcChange} className="min-h-[220px]" />
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
            <span>Rendering</span>
            <div className="flex items-center gap-2">
              {verdict && <VerdictBadge verdict={verdict} syllogism={syllogism!} />}
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
            ) : syllogism ? (
              <SyllogismView syllogism={syllogism} />
            ) : proposition ? (
              <p className="text-sm text-gray-300 leading-relaxed">{glossProposition(proposition)}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500">
            Mood table
          </div>
          <div className="p-4 flex-1 min-h-[260px]">
            <AvicennanMoodTable syllogism={syllogism} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
            <span>Modal square of opposition</span>
            <span className="text-gray-600">
              {proposition
                ? `${proposition.modality} · corner ${letterOf(proposition)}`
                : 'enter a single proposition to focus a corner'}
            </span>
          </div>
          <div className="p-4 flex-1 flex items-center justify-center min-h-[260px]">
            <AristotelianSquare
              focused={proposition ? letterOf(proposition) : null}
              importSetting="traditional"
              className="max-h-[300px]"
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        A proposition is <code className="text-gray-300">modality quantifier S is P</code> — e.g.
        <code className="ml-1 text-gray-300">necessary every animal is mortal</code>. The four
        modalities are <span className="text-gray-300">necessary</span>,
        <span className="ml-1 text-gray-300">perpetual</span>,
        <span className="ml-1 text-gray-300">absolute</span>, and
        <span className="ml-1 text-gray-300">possible</span>. Wrap three propositions (major,
        minor, conclusion) in a <code className="text-gray-300">syllogism … end</code> block.
        Type <code className="text-gray-300">/</code> in the editor for templates and examples.
        Phase 1 decides validity by mood-table lookup; the two-dimensional modality, the
        hypothetical syllogistic, and a semantic model checker are deferred to phase 2.
      </p>
    </div>
  );
}

function AvicennanToolbar({
  onCommand, examples,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
}) {
  const structural = AVICENNAN_COMMANDS.filter(c => !c.slug.startsWith('example.'));
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

function SyllogismView({ syllogism }: { syllogism: Syllogism }) {
  const lines = formatSyllogism(syllogism);
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500">
        Figure {syllogism.figure} · middle term <code className="text-gray-400">{syllogism.middle}</code>
      </div>
      {lines.map(l => (
        <div key={l.role} className="flex items-baseline gap-3">
          <span className="text-[10px] uppercase tracking-wider text-gray-600 w-20 shrink-0">
            {l.role}
          </span>
          <code className="text-sm text-blue-300 font-mono">{l.text}</code>
        </div>
      ))}
    </div>
  );
}

function VerdictBadge({
  verdict, syllogism,
}: {
  verdict: SyllogismVerdict;
  syllogism: Syllogism;
}) {
  if (verdict.kind === 'invalid') {
    return (
      <span
        className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-rose-500/15 text-rose-300 border-rose-500/30"
        title={verdict.reason}
      >
        invalid · Fig {syllogism.figure}
      </span>
    );
  }
  const info = MODALITY_INFO[verdict.inheritedModality];
  return (
    <span
      className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      title={`The conclusion inherits the ${verdict.inheritedModality} modality (${info.arabic})`}
    >
      valid · inherits {verdict.inheritedModality}
    </span>
  );
}
