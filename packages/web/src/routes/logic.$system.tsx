import { useMemo, useState } from 'react';
import { Link, createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { findLogicSystem, type LogicExample, type LogicSystem } from '../data/logic-systems';
import { parseEg } from '../logic/eg-parser';
import { EgRenderer } from '../logic/EgRenderer';
import { EgEditor } from '../logic/EgEditor';
import { EG_COMMANDS, findCommand } from '../logic/eg-commands';

export const logicSystemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/logic/$system',
  component: LogicSystemPage,
});

function LogicSystemPage() {
  const { system: slug } = logicSystemRoute.useParams();
  const system = findLogicSystem(slug);

  if (!system) {
    return (
      <main className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <Link to="/logic" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Logic Lab
          </Link>
          <p className="text-gray-400">Unknown logic system: <code>{slug}</code>.</p>
        </div>
      </main>
    );
  }

  if (system.status === 'stub') {
    return (
      <main className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <Link to="/logic" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Logic Lab
          </Link>
          <h1 className="text-3xl font-bold text-gray-100">{system.name}</h1>
          <p className="text-gray-400">{system.shortDescription}</p>
          <div className="rounded-lg border border-dashed border-gray-800 bg-gray-900/20 p-6 text-gray-400 text-sm">
            This system is a stub. Content lands in a later ticket.
          </div>
        </div>
      </main>
    );
  }

  return <PeirceEgLab system={system} />;
}

// ─────────────────────────────────────────────────────────────────────
// Peirce EG Lab — the first populated system.

function PeirceEgLab({ system }: { system: LogicSystem }) {
  const [src, setSrc] = useState<string>(system.examples[3]?.dsl ?? 'P');

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
          <EgLab src={src} onSrcChange={setSrc} examples={system.examples} />
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
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-300 hover:text-blue-200"
                    >
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

// ─────────────────────────────────────────────────────────────────────
// Editor + renderer + command bar.

function EgLab({
  src, onSrcChange, examples,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
}) {
  const parsed = useMemo(() => parseEg(src), [src]);

  function runCommand(slug: string) {
    const cmd = findCommand(slug);
    if (!cmd) return;
    // Toolbar commands replace the document (simpler, and lab-friendly
    // for structural/example commands). Slash-triggered completion in
    // the editor inserts at cursor instead (see EgEditor).
    onSrcChange(cmd.insert);
  }

  return (
    <div className="space-y-4">
      <Toolbar onCommand={runCommand} examples={examples} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <span className="text-gray-600">alpha</span>
          </div>
          <EgEditor value={src} onChange={onSrcChange} className="min-h-[260px]" />
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
          <div className="p-6 flex-1 flex items-center justify-center min-h-[260px]">
            {parsed.ok ? (
              <EgRenderer tree={parsed.tree} className="max-h-[320px]" />
            ) : (
              <div className="text-sm text-amber-300/80 font-mono">
                {parsed.error.message} (col {parsed.error.position + 1})
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Shorthand: <code className="text-gray-300">P Q</code> juxtaposes (conjunction);
        <code className="ml-1 text-gray-300">(P)</code> wraps in a cut (negation);
        <code className="ml-1 text-gray-300">(P (Q))</code> is the scroll (implication).
        Type <code className="text-gray-300">/</code> in the editor to insert
        structural templates or examples.
      </p>
    </div>
  );
}

function Toolbar({
  onCommand, examples,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
}) {
  const structural = EG_COMMANDS.filter(c => !c.slug.startsWith('example.'));
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
        className="text-xs px-2.5 py-1.5 rounded border border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-4">
      {children}
    </h2>
  );
}