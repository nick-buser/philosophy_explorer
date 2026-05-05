import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { LogicExample, LogicSystem } from '../../data/logic-systems';
import { parseEpistemic } from '../epistemic-parser';
import { renderKatexE } from '../epistemic-render';
import { LogicCmEditor } from '../LogicCmEditor';
import { EpistemicModelView, colorForAgent } from '../EpistemicModelView';
import { KatexFormula } from '../KatexFormula';
import { EPISTEMIC_COMMANDS, findEpistemicCommand } from '../epistemic-commands';
import {
  satisfactionMapE,
  satisfiesE,
  validInModelE,
} from '../epistemic-eval';
import {
  epistemicAxiomVerdicts,
  type EpistemicAxiomVerdict,
} from '../epistemic-axioms';
import type { EpistemicFormula, EpistemicModel } from '../epistemic-types';
import { SectionHeading } from './shared';

export default function EpistemicLab({ system }: { system: LogicSystem }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initial.dsl);
  const [exampleSlug, setExampleSlug] = useState<string>(initial.slug);

  const activeExample = useMemo(
    () => system.examples.find(ex => ex.slug === exampleSlug) ?? initial,
    [exampleSlug, system.examples, initial],
  );
  const liveModel: EpistemicModel | undefined = activeExample.epistemicModel;

  function pickExample(slug: string) {
    const ex = system.examples.find(e => e.slug === slug);
    if (!ex) return;
    setExampleSlug(slug);
    setSrc(ex.dsl);
  }

  function runCommand(slug: string) {
    if (slug.startsWith('example.')) {
      pickExample(slug.slice('example.'.length));
      return;
    }
    const cmd = findEpistemicCommand(slug);
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
          <EpistemicLabBody
            src={src}
            onSrcChange={setSrc}
            examples={system.examples}
            onPickCommand={runCommand}
            activeExample={activeExample}
            liveModel={liveModel}
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

function EpistemicLabBody({
  src, onSrcChange, examples, onPickCommand, activeExample, liveModel,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onPickCommand: (slug: string) => void;
  activeExample: LogicExample;
  liveModel: EpistemicModel | undefined;
}) {
  const parsed = useMemo(() => parseEpistemic(src), [src]);

  return (
    <div className="space-y-4">
      <EpistemicToolbar
        onCommand={onPickCommand}
        examples={examples}
        activeExampleSlug={activeExample.slug}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <span className="text-gray-600">multi-agent epistemic</span>
          </div>
          <LogicCmEditor commands={EPISTEMIC_COMMANDS} value={src} onChange={onSrcChange} className="min-h-[180px]" />
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
          <div className="p-6 flex-1 flex items-center justify-center min-h-[180px]">
            {parsed.ok ? (
              <KatexFormula tex={renderKatexE(parsed.formula)} className="text-gray-100" />
            ) : (
              <div className="text-sm text-amber-300/80 font-mono">
                {parsed.error.message} (col {parsed.error.position + 1})
              </div>
            )}
          </div>
        </div>
      </div>

      {liveModel && (
        <>
          <AgentLegend model={liveModel} />
          <EpistemicModelPanel
            model={liveModel}
            formula={parsed.ok ? parsed.formula : undefined}
            activeExample={activeExample}
          />
          <EpistemicAxiomsPanel model={liveModel} />
        </>
      )}

      <p className="text-xs text-gray-500 leading-relaxed">
        Each declared agent gets a colored relation. Knowledge axioms are checked
        per-agent (T factivity, 4 positive introspection, 5 negative introspection,
        D consistency) — the verdict table reports a green ✓ when the axiom holds
        on every world for every substitution and a red ✗ with a witness when it
        doesn’t. The K axiom is universal across agents and frames; the others
        track structural properties of R_a.
      </p>
    </div>
  );
}

function AgentLegend({ model }: { model: EpistemicModel }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs text-gray-500">agents:</span>
      {model.agents.map(a => (
        <span
          key={a}
          className="text-xs px-2 py-0.5 rounded border border-gray-800 bg-gray-900 font-mono flex items-center gap-1.5"
        >
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: colorForAgent(a, model.agents) }}
          />
          <span className="text-gray-200">{a}</span>
        </span>
      ))}
    </div>
  );
}

function EpistemicModelPanel({
  model, formula, activeExample,
}: {
  model: EpistemicModel;
  formula: EpistemicFormula | undefined;
  activeExample: LogicExample;
}) {
  const satMap = useMemo(
    () => (formula ? satisfactionMapE(formula, model) : undefined),
    [formula, model],
  );
  const designated = model.designated ?? model.worlds[0]?.id;
  const designatedTruth = useMemo(() => {
    if (!formula || !designated) return undefined;
    return satisfiesE(formula, model, designated);
  }, [formula, model, designated]);
  const validity = useMemo(
    () => (formula ? validInModelE(formula, model) : undefined),
    [formula, model],
  );

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span>Epistemic model</span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-400">{activeExample.natural}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {designated && designatedTruth !== undefined && (
            <span
              className={
                'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ' +
                (designatedTruth
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30')
              }
            >
              {designatedTruth ? '⊨' : '⊭'} {designated}
            </span>
          )}
          {validity && (
            <span
              className={
                'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ' +
                (validity.valid
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30')
              }
            >
              {validity.valid ? 'model-valid' : `invalid (fails at ${validity.failingWorld})`}
            </span>
          )}
        </div>
      </div>
      <EpistemicModelView model={model} satisfaction={satMap} className="bg-gray-950/50" />
      {activeExample.note && (
        <div className="px-4 py-3 border-t border-gray-800 text-sm text-gray-400 leading-relaxed">
          {activeExample.note}
        </div>
      )}
    </div>
  );
}

function EpistemicAxiomsPanel({ model }: { model: EpistemicModel }) {
  const verdicts = useMemo(() => epistemicAxiomVerdicts(model), [model]);
  // Group by axiom for the table layout.
  const byAxiom = new Map<string, EpistemicAxiomVerdict[]>();
  for (const v of verdicts) {
    const key = v.axiom.short;
    if (!byAxiom.has(key)) byAxiom.set(key, []);
    byAxiom.get(key)!.push(v);
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4 space-y-3">
      <h3 className="text-gray-100 font-medium">Knowledge axioms per agent</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[...byAxiom.entries()].map(([short, group]) => {
          const def = group[0]!.axiom;
          return (
            <div key={short} className="rounded border border-gray-800 bg-gray-900/50 p-3 space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-gray-100 text-sm">{def.short}</span>
                <span className="text-[10px] text-gray-500">{def.correspondsTo === 'none' ? '' : `↔ ${def.correspondsTo}`}</span>
              </div>
              <div className="text-[10px] text-gray-500">{def.name}</div>
              <code className="text-[10px] block text-blue-300 font-mono break-all">{def.schema}</code>
              <div className="text-[10px] text-gray-500 leading-relaxed">{def.gloss}</div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {group.map(v => (
                  <span
                    key={v.agent}
                    className={
                      'text-[10px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-1 ' +
                      (v.valid
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30')
                    }
                    title={
                      v.valid
                        ? `${v.axiom.short} valid for ${v.agent}`
                        : `fails at ${v.failure?.world} under ${
                            v.failure
                              ? Object.entries(v.failure.substitution).map(([k, val]) => `${k}↦${val}`).join(', ')
                              : ''
                          }`
                    }
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-sm"
                      style={{ backgroundColor: colorForAgent(v.agent, model.agents) }}
                    />
                    {v.agent}: {v.valid ? '✓' : '✗'}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EpistemicToolbar({
  onCommand, examples, activeExampleSlug,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
  activeExampleSlug: string;
}) {
  const structural = EPISTEMIC_COMMANDS.filter(c => !c.slug.startsWith('example.'));
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
        className="text-xs px-2.5 py-1.5 rounded border border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors max-w-[320px]"
        value={activeExampleSlug}
        onChange={e => {
          const slug = e.target.value;
          if (slug) onCommand(`example.${slug}`);
        }}
      >
        {examples.map(ex => (
          <option key={ex.slug} value={ex.slug}>{ex.natural}</option>
        ))}
      </select>
    </div>
  );
}
