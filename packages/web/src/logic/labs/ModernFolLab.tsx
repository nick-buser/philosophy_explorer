import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { LogicSystem, LogicExample } from '../../data/logic-systems';
import { parseFol } from '../fol-parser';
import { renderKatex as renderFolKatex } from '../fol-render';
import { FolEditor } from '../FolEditor';
import { FOL_COMMANDS, findFolCommand } from '../fol-commands';
import { checkValidity, type ValidityResult } from '../fol-validity';
import { isPropositional } from '../fol-types';
import { buildTruthTable, type TruthTable } from '../fol-truth-table';
import { buildTableauTree, type TableauTree } from '../fol-tableau-tree';
import { KatexFormula } from '../KatexFormula';
import {
  FolValidityBadge,
  CountermodelPanel,
  TruthTablePanel,
  TableauTreePanel,
} from '../FolVisualization';
import { SectionHeading } from './shared';

export default function ModernFolLab({ system, initialDsl }: { system: LogicSystem; initialDsl?: string }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initialDsl ?? initial.dsl);

  function runCommand(slug: string) {
    if (slug.startsWith('example.')) {
      const ex = system.examples.find(e => e.slug === slug.slice('example.'.length));
      if (ex) setSrc(ex.dsl);
      return;
    }
    const cmd = findFolCommand(slug);
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
          <ModernFolLabBody
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

function ModernFolLabBody({
  src, onSrcChange, examples, onCommand,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onCommand: (slug: string) => void;
}) {
  const parsed = useMemo(() => parseFol(src), [src]);
  const validity = useMemo<ValidityResult | null>(
    () => parsed.ok ? checkValidity(parsed.formula) : null,
    [parsed],
  );
  const fragment: 'propositional' | 'first-order' | null =
    parsed.ok ? (isPropositional(parsed.formula) ? 'propositional' : 'first-order') : null;
  // Truth-table for the propositional fragment; tableau tree for FOL.
  // Both are exposed below the editor as a "show your work" panel.
  const truthTable = useMemo<TruthTable | null>(
    () => parsed.ok && fragment === 'propositional' ? buildTruthTable(parsed.formula) : null,
    [parsed, fragment],
  );
  const tableauTree = useMemo<TableauTree | null>(
    () => parsed.ok && fragment === 'first-order' ? buildTableauTree(parsed.formula) : null,
    [parsed, fragment],
  );

  return (
    <div className="space-y-4">
      <FolToolbar onCommand={onCommand} examples={examples} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <span className="text-gray-600">{fragment ?? 'classical FOL'}</span>
          </div>
          <FolEditor value={src} onChange={onSrcChange} className="min-h-[220px]" />
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
            <span>Rendering</span>
            <div className="flex items-center gap-2">
              {validity && <FolValidityBadge result={validity} />}
              {parsed.ok ? (
                <span className="text-emerald-400">parsed</span>
              ) : (
                <span className="text-amber-400">parse error</span>
              )}
            </div>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center min-h-[220px] overflow-auto">
            {parsed.ok ? (
              <KatexFormula tex={renderFolKatex(parsed.formula)} className="text-gray-100" />
            ) : (
              <div className="text-sm text-amber-300/80 font-mono">
                {parsed.error.message} (col {parsed.error.position + 1})
              </div>
            )}
          </div>
        </div>
      </div>

      {validity && validity.kind === 'invalid' && (
        <CountermodelPanel countermodel={validity.countermodel} method={validity.method} />
      )}

      {truthTable && <TruthTablePanel table={truthTable} />}
      {tableauTree && <TableauTreePanel tree={tableauTree} />}

      <p className="text-xs text-gray-500 leading-relaxed">
        Shorthand: <code className="text-gray-300">forall x. P(x)</code> /
        <code className="ml-1 text-gray-300">exists x. P(x)</code>;
        <code className="ml-1 text-gray-300">~p</code>,
        <code className="ml-1 text-gray-300">p &amp; q</code>,
        <code className="ml-1 text-gray-300">p | q</code>,
        <code className="ml-1 text-gray-300">p -&gt; q</code>,
        <code className="ml-1 text-gray-300">p &lt;-&gt; q</code>;
        identity is <code className="text-gray-300">t = u</code> /
        <code className="ml-1 text-gray-300">t != u</code>.
        Quantifiers bind wide-scope to the right — <code className="text-gray-300">forall x. P(x) -&gt; Q(x)</code> is ∀x.(P(x)→Q(x)). Use parentheses to force narrow scope.
        Type <code className="text-gray-300">/</code> in the editor for templates and examples.
        Validity is checked exactly for the propositional fragment (truth table) and via bounded semantic tableau otherwise.
      </p>
    </div>
  );
}

function FolToolbar({
  onCommand, examples,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
}) {
  const structural = FOL_COMMANDS.filter(c => !c.slug.startsWith('example.'));
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

