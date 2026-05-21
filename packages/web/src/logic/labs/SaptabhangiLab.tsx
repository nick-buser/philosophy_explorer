import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { LogicExample, LogicSystem } from '../../data/logic-systems';
import { parseSaptabhangi } from '../saptabhangi-parser';
import { classifyBhanga } from '../saptabhangi-engine';
import { BASIC_MODE_INFO } from '../saptabhangi-types';
import type { Classification, } from '../saptabhangi-engine';
import type { Predication } from '../saptabhangi-types';
import { SaptabhangiEditor } from '../SaptabhangiEditor';
import { SaptabhangiTable } from '../SaptabhangiTable';
import { SaptabhangiLattice } from '../SaptabhangiLattice';
import { SAPTABHANGI_COMMANDS, findSaptabhangiCommand } from '../saptabhangi-commands';
import { SectionHeading } from './shared';

export default function SaptabhangiLab({ system }: { system: LogicSystem }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initial.dsl);

  function runCommand(slug: string) {
    if (slug.startsWith('example.')) {
      const ex = system.examples.find(e => e.slug === slug.slice('example.'.length));
      if (ex) setSrc(ex.dsl);
      return;
    }
    const cmd = findSaptabhangiCommand(slug);
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
          <SaptabhangiLabBody
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

function SaptabhangiLabBody({
  src, onSrcChange, examples, onCommand,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onCommand: (slug: string) => void;
}) {
  const parsed = useMemo(() => parseSaptabhangi(src), [src]);
  const predication = parsed.ok ? parsed.predication : null;
  const classification = predication ? classifyBhanga(predication) : null;

  return (
    <div className="space-y-4">
      <SaptabhangiToolbar onCommand={onCommand} examples={examples} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <span className="text-gray-600">standpoint predication</span>
          </div>
          <SaptabhangiEditor value={src} onChange={onSrcChange} className="min-h-[220px]" />
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
            <span>Classification</span>
            <div className="flex items-center gap-2">
              {classification && <BhangaBadge classification={classification} />}
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
            ) : predication && classification ? (
              <PredicationView predication={predication} classification={classification} />
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500">
            The seven bhaṅgas
          </div>
          <div className="p-4 flex-1 min-h-[260px]">
            <SaptabhangiTable active={classification?.bhanga.n ?? null} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
            <span>Inclusion lattice</span>
            <span className="text-gray-600">
              {classification
                ? `bhaṅga ${classification.bhanga.n}`
                : 'enter a predication to ring a node'}
            </span>
          </div>
          <div className="p-4 flex-1 flex items-center justify-center min-h-[260px]">
            <SaptabhangiLattice active={classification?.bhanga.n ?? null} />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        A predication is a <code className="text-gray-300">subject</code> and a{' '}
        <code className="text-gray-300">predicate</code> plus one{' '}
        <code className="text-gray-300">standpoint &lt;name&gt;: &lt;mode&gt;</code> line per
        respect (<em>naya</em>). The three modes are{' '}
        <span className="text-gray-300">asti</span> (is),{' '}
        <span className="text-gray-300">nasti</span> (is not), and{' '}
        <span className="text-gray-300">avaktavya</span> (inexpressible). The engine unions the
        asserted modes; that non-empty subset <em>is</em> the bhaṅga. Type{' '}
        <code className="text-gray-300">/</code> in the editor for templates and examples.
        Phase 1 classifies a single predication; compound evaluation over the seven values is
        deferred to phase 2.
      </p>
    </div>
  );
}

function SaptabhangiToolbar({
  onCommand, examples,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
}) {
  const structural = SAPTABHANGI_COMMANDS.filter(c => !c.slug.startsWith('example.'));
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

function PredicationView({
  predication, classification,
}: {
  predication: Predication;
  classification: Classification;
}) {
  const { bhanga } = classification;
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-gray-500">Predication</div>
        <p className="mt-1 text-sm text-gray-300">
          <span className="text-gray-100">{predication.subject}</span>
          <span className="text-gray-500"> — is — </span>
          <span className="text-gray-100">{predication.predicate}</span>
        </p>
      </div>

      <div>
        <div className="text-xs text-gray-500">Standpoints</div>
        <div className="mt-1 space-y-1">
          {predication.standpoints.map((s, i) => {
            const info = BASIC_MODE_INFO[s.mode];
            return (
              <div key={`${s.name}-${i}`} className="flex items-baseline gap-3">
                <code className="text-xs text-gray-400 font-mono w-32 shrink-0 truncate" title={s.name}>
                  {s.name}
                </code>
                <span className="text-sm text-blue-300 font-mono">{info.iast}</span>
                <span className="text-xs text-gray-500">{info.gloss}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2">
        <div className="text-xs text-gray-500">
          Bhaṅga {bhanga.n} of 7
        </div>
        <p className="mt-0.5 text-sm">
          <span className="text-amber-200 font-medium">{bhanga.sanskrit}</span>
          <span className="text-gray-500"> — {bhanga.gloss}</span>
        </p>
      </div>
    </div>
  );
}

function BhangaBadge({ classification }: { classification: Classification }) {
  const { bhanga } = classification;
  return (
    <span
      className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-amber-500/15 text-amber-300 border-amber-500/30"
      title={`${bhanga.sanskrit} — ${bhanga.gloss}`}
    >
      bhaṅga {bhanga.n} · {bhanga.sanskrit}
    </span>
  );
}
