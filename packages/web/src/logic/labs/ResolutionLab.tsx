import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { LogicExample, LogicSystem } from '../../data/logic-systems';
import { parseProgram } from '../resolution-parser';
import { classify } from '../resolution-engine';
import { ResolutionEditor } from '../ResolutionEditor';
import { RESOLUTION_COMMANDS } from '../resolution-commands';
import { ResolutionDag } from '../ResolutionDag';
import { SldTree } from '../SldTree';
import { DatalogStrata } from '../DatalogStrata';
import type { Program } from '../resolution-types';
import { formatRule } from '../resolution-types';
import { SectionHeading } from './shared';

export default function ResolutionLab({ system }: { system: LogicSystem }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initial.dsl);

  function runCommand(slug: string) {
    if (slug.startsWith('example.')) {
      const ex = system.examples.find(e => e.slug === slug.slice('example.'.length));
      if (ex) setSrc(ex.dsl);
      return;
    }
    const cmd = RESOLUTION_COMMANDS.find(c => c.slug === slug);
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
          <ResolutionLabBody
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

function ResolutionLabBody({
  src, onSrcChange, examples, onCommand,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onCommand: (slug: string) => void;
}) {
  const parsed = useMemo(() => parseProgram(src), [src]);
  const output  = useMemo(() => parsed.ok ? classify(parsed.program) : null, [parsed]);

  return (
    <div className="space-y-4">
      <ResolutionToolbar onCommand={onCommand} examples={examples} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <ModeBadge mode={parsed.ok ? parsed.mode : null} />
          </div>
          <ResolutionEditor value={src} onChange={onSrcChange} className="min-h-[260px]" />
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
            <span>Verdict</span>
            <div className="flex items-center gap-2">
              {output && <VerdictBadge output={output} />}
              {parsed.ok ? (
                <span className="text-emerald-400">parsed</span>
              ) : (
                <span className="text-amber-400">parse error</span>
              )}
            </div>
          </div>
          <div className="p-4 flex-1 min-h-[260px]">
            {!parsed.ok ? (
              <div className="text-sm text-amber-300/80 font-mono">
                {parsed.error.message}
                {parsed.error.line > 0 ? ` (line ${parsed.error.line})` : ''}
              </div>
            ) : output ? (
              <Summary output={output} program={parsed.program} />
            ) : null}
          </div>
        </div>
      </div>

      {output?.kind === 'clauses' && (
        <Panel
          title="Resolution DAG"
          subtitle="Binary resolution applied to the clause set, with depth = max(parent depth) + 1."
        >
          <ResolutionDag
            result={output.result}
            goalCount={parsed.ok && parsed.program.mode === 'clauses' ? parsed.program.goals.length : 0}
          />
        </Panel>
      )}

      {output?.kind === 'horn' && (
        <Panel
          title="SLD derivation tree"
          subtitle="Goal-directed backward chaining over the Horn program. Leftmost atom selected at each step; rules tried in source order with backtracking."
        >
          <SldTree result={output.result} />
        </Panel>
      )}

      {output?.kind === 'datalog' && (
        <Panel
          title="Datalog forward chaining (semi-naïve)"
          subtitle="Per-iteration strata: each round derives every new ground fact reachable from the snapshot at the start of the round, until a round derives nothing new."
        >
          <DatalogStrata result={output.result} />
        </Panel>
      )}

      <p className="text-xs text-gray-500 leading-relaxed">
        Three modes, one DSL — the parser picks the mode from the surface syntax. Use{' '}
        <code className="text-gray-300">|</code> /{' '}
        <code className="text-gray-300">∨</code> and{' '}
        <code className="text-gray-300">~</code> /{' '}
        <code className="text-gray-300">¬</code> for clauses (refutation by binary resolution; an
        optional <code className="text-gray-300">⊢</code>{' '}/<code className="text-gray-300">|-</code>{' '}line is the goal).
        Use <code className="text-gray-300">head :- body, body.</code> rules and
        atom facts <code className="text-gray-300">fact(a).</code> for Horn / Datalog programs;
        a <code className="text-gray-300">?- query.</code> line switches into SLD backward chaining
        and produces an answer substitution. Without a query the program is Datalog
        (function-symbol-free) and the engine computes the minimal model.
      </p>
    </div>
  );
}

function ResolutionToolbar({
  onCommand, examples,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
}) {
  const structural = RESOLUTION_COMMANDS.filter(c => !c.slug.startsWith('example.'));
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

function ModeBadge({ mode }: { mode: 'clauses' | 'horn' | 'datalog' | null }) {
  if (!mode) return <span className="text-gray-600">—</span>;
  const tone =
    mode === 'clauses' ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
    : mode === 'horn'  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    :                    'bg-violet-500/15 text-violet-300 border-violet-500/30';
  return (
    <span className={'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ' + tone}>
      {mode}
    </span>
  );
}

function VerdictBadge({ output }: { output: ReturnType<typeof classify> }) {
  if (output.kind === 'clauses') {
    const r = output.result;
    if (r.outcome === 'refuted') {
      return <Badge tone="emerald">refuted · ⊥ at C{r.emptyClauseId}</Badge>;
    }
    if (r.outcome === 'budget') return <Badge tone="amber">budget exhausted</Badge>;
    return <Badge tone="violet">saturated · no ⊥</Badge>;
  }
  if (output.kind === 'horn') {
    const r = output.result;
    if (r.outcome === 'success') return <Badge tone="emerald">answer found</Badge>;
    if (r.outcome === 'budget')  return <Badge tone="amber">budget exhausted</Badge>;
    return <Badge tone="rose">no answer</Badge>;
  }
  return <Badge tone="violet">model · {output.result.totalFacts} facts</Badge>;
}

function Badge({ tone, children }: { tone: 'emerald' | 'rose' | 'amber' | 'violet'; children: React.ReactNode }) {
  const cls =
    tone === 'emerald' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    : tone === 'rose'  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
    : tone === 'amber' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    :                    'bg-violet-500/15 text-violet-300 border-violet-500/30';
  return (
    <span className={'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ' + cls}>
      {children}
    </span>
  );
}

function Summary({
  output, program,
}: {
  output: ReturnType<typeof classify>;
  program: Program;
}) {
  if (output.kind === 'clauses') {
    const r = output.result;
    return (
      <div className="space-y-2 text-sm text-gray-300 leading-relaxed">
        <div>
          <span className="text-gray-100 font-medium">Outcome:</span>{' '}
          {r.outcome === 'refuted' ? (
            <span className="text-emerald-300">refuted</span>
          ) : r.outcome === 'saturated' ? (
            <span className="text-violet-300">saturated (clause set is satisfiable)</span>
          ) : (
            <span className="text-amber-300">budget exhausted</span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {r.dag.length} clauses in DAG · {r.outcome === 'refuted' ? `⊥ at C${r.emptyClauseId}` : 'no ⊥ derived'}
        </div>
        {r.outcome === 'refuted' && (
          <p className="text-xs text-gray-400">
            The empty clause was derived, so the input clause set together with the negation of
            every goal is unsatisfiable — the goal follows from the inputs.
          </p>
        )}
      </div>
    );
  }
  if (output.kind === 'horn') {
    const r = output.result;
    return (
      <div className="space-y-2 text-sm text-gray-300 leading-relaxed">
        <div>
          <span className="text-gray-100 font-medium">Outcome:</span>{' '}
          {r.outcome === 'success' ? (
            <span className="text-emerald-300">answer found</span>
          ) : r.outcome === 'failure' ? (
            <span className="text-rose-300">no answer</span>
          ) : (
            <span className="text-amber-300">budget exhausted</span>
          )}
        </div>
        <div className="text-xs text-gray-500">{r.steps} resolution attempts</div>
        {r.outcome === 'success' && (
          <p className="text-xs text-gray-400">
            SLD found a derivation reducing the query to the empty goal. The answer substitution
            below is the composition of every MGU along the success branch, restricted to
            variables in the query.
          </p>
        )}
      </div>
    );
  }
  // datalog
  const r = output.result;
  const ruleCount = program.mode === 'datalog' ? program.rules.length : 0;
  return (
    <div className="space-y-2 text-sm text-gray-300 leading-relaxed">
      <div>
        <span className="text-gray-100 font-medium">Model:</span>{' '}
        <span className="text-violet-300">{r.totalFacts} facts</span> across {r.factsByPredicate.size} predicates
      </div>
      <div className="text-xs text-gray-500">
        {ruleCount} rule{ruleCount === 1 ? '' : 's'} · {r.strata.length} strata
      </div>
      {program.mode === 'datalog' && program.rules.length > 0 && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-200">show rules</summary>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            {program.rules.map((rule, i) => (
              <li key={i} className="text-gray-300">R{i + 1}. {formatRule(rule)}</li>
            ))}
          </ul>
        </details>
      )}
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
