import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { LogicExample, LogicSystem } from '../../data/logic-systems';
import { parseModal } from '../kripke-parser';
import { renderKatex } from '../kripke-render';
import { IntuitionisticFormulaEditor } from '../IntuitionisticFormulaEditor';
import { KripkeModelView } from '../KripkeModelView';
import { KatexFormula } from '../KatexFormula';
import { INTUITIONISTIC_COMMANDS, findIntuitionisticCommand } from '../intuitionistic-commands';
import type { KripkeModel, ModalFormula } from '../kripke-types';
import {
  forces,
  forcesMap,
  validInModel,
  IntuitionisticEvalError,
} from '../intuitionistic-eval';
import {
  closeFrame,
  closeValuation,
  intuitionisticDiagnostics,
} from '../intuitionistic-frames';
import { intuitionisticAxiomVerdicts } from '../intuitionistic-axioms';
import { SectionHeading } from './shared';

export default function IntuitionisticLab({ system }: { system: LogicSystem }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initial.dsl);
  const [exampleSlug, setExampleSlug] = useState<string>(initial.slug);
  const [liveModel, setLiveModel] = useState<KripkeModel | undefined>(initial.model);

  const activeExample = useMemo(
    () => system.examples.find(ex => ex.slug === exampleSlug) ?? initial,
    [exampleSlug, system.examples, initial],
  );

  function pickExample(slug: string) {
    const ex = system.examples.find(e => e.slug === slug);
    if (!ex) return;
    setExampleSlug(slug);
    setSrc(ex.dsl);
    setLiveModel(ex.model);
  }

  function runCommand(slug: string) {
    if (slug.startsWith('example.')) {
      pickExample(slug.slice('example.'.length));
      return;
    }
    const cmd = findIntuitionisticCommand(slug);
    if (!cmd) return;
    setSrc(cmd.insert);
  }

  function fixFrame() {
    if (!liveModel) return;
    setLiveModel(closeValuation(closeFrame(liveModel)));
  }

  function resetModel() {
    setLiveModel(activeExample.model);
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
          <IntuitionisticLabBody
            src={src}
            onSrcChange={setSrc}
            examples={system.examples}
            onPickCommand={runCommand}
            activeExample={activeExample}
            liveModel={liveModel}
            onFixFrame={fixFrame}
            onResetModel={resetModel}
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

function IntuitionisticLabBody({
  src, onSrcChange, examples, onPickCommand,
  activeExample, liveModel, onFixFrame, onResetModel,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onPickCommand: (slug: string) => void;
  activeExample: LogicExample;
  liveModel: KripkeModel | undefined;
  onFixFrame: () => void;
  onResetModel: () => void;
}) {
  const parsed = useMemo(() => parseModal(src), [src]);
  const modelEdited =
    liveModel !== undefined &&
    activeExample.model !== undefined &&
    liveModel !== activeExample.model;
  const containsModalOps = parsed.ok && hasModal(parsed.formula);

  return (
    <div className="space-y-4">
      <IntuitionisticToolbar
        onCommand={onPickCommand}
        examples={examples}
        activeExampleSlug={activeExample.slug}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <span className="text-gray-600">propositional intuitionistic</span>
          </div>
          <IntuitionisticFormulaEditor value={src} onChange={onSrcChange} className="min-h-[180px]" />
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>Rendering</span>
            {parsed.ok ? (
              containsModalOps ? (
                <span className="text-amber-400">no modal ops in intuitionistic</span>
              ) : (
                <span className="text-emerald-400">parsed</span>
              )
            ) : (
              <span className="text-amber-400">parse error</span>
            )}
          </div>
          <div className="p-6 flex-1 flex items-center justify-center min-h-[180px]">
            {parsed.ok ? (
              <KatexFormula tex={renderKatex(parsed.formula)} className="text-gray-100" />
            ) : (
              <div className="text-sm text-amber-300/80 font-mono">
                {parsed.error.message} (col {parsed.error.position + 1})
              </div>
            )}
          </div>
        </div>
      </div>

      {liveModel && (
        <IntuitionisticModelPanel
          model={liveModel}
          formula={parsed.ok && !containsModalOps ? parsed.formula : undefined}
          activeExample={activeExample}
          modelEdited={modelEdited}
          onFixFrame={onFixFrame}
          onResetModel={onResetModel}
        />
      )}

      {liveModel && (
        <FrameShapePanel model={liveModel} />
      )}

      {liveModel && (
        <IntuitionisticAxiomsPanel model={liveModel} />
      )}

      <p className="text-xs text-gray-500 leading-relaxed">
        Forcing values, per-world chips, frame-shape verdicts and axiom verdicts are
        computed live by the intuitionistic engine. Intuitionistic Kripke frames are
        pre-orders with a monotone valuation; the "fix frame" button takes the
        reflexive-transitive closure of R and lifts atoms forward so the result is
        a valid intuitionistic model.
      </p>
    </div>
  );
}

function hasModal(f: ModalFormula): boolean {
  switch (f.kind) {
    case 'atom':    return false;
    case 'box':
    case 'dia':     return true;
    case 'not':     return hasModal(f.body);
    case 'and':
    case 'or':
    case 'implies':
    case 'iff':     return hasModal(f.left) || hasModal(f.right);
  }
}

function IntuitionisticModelPanel({
  model, formula, activeExample, modelEdited, onFixFrame, onResetModel,
}: {
  model: KripkeModel;
  formula: ModalFormula | undefined;
  activeExample: LogicExample;
  modelEdited: boolean;
  onFixFrame: () => void;
  onResetModel: () => void;
}) {
  const diag = useMemo(() => intuitionisticDiagnostics(model), [model]);
  const fMap = useMemo(() => {
    if (!formula) return undefined;
    try { return forcesMap(formula, model); }
    catch (e) {
      if (e instanceof IntuitionisticEvalError) return undefined;
      throw e;
    }
  }, [formula, model]);
  const designated = model.designated ?? model.worlds[0]?.id;
  const designatedTruth = useMemo(() => {
    if (!formula || !designated) return undefined;
    try { return forces(formula, model, designated); }
    catch (e) {
      if (e instanceof IntuitionisticEvalError) return undefined;
      throw e;
    }
  }, [formula, model, designated]);
  const validity = useMemo(() => {
    if (!formula) return undefined;
    try { return validInModel(formula, model); }
    catch (e) {
      if (e instanceof IntuitionisticEvalError) return undefined;
      throw e;
    }
  }, [formula, model]);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span>Intuitionistic model</span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-400">{activeExample.natural}</span>
          {modelEdited && (
            <span className="text-[10px] uppercase tracking-wider text-amber-300">edited</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!diag.isValidFrame && (
            <button
              type="button"
              onClick={onFixFrame}
              className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition-colors"
              title="Take reflexive-transitive closure of R and propagate atoms upward"
            >
              fix frame
            </button>
          )}
          {modelEdited && (
            <button
              type="button"
              onClick={onResetModel}
              className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              reset
            </button>
          )}
          {designated && designatedTruth !== undefined && (
            <span
              className={
                'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ' +
                (designatedTruth
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30')
              }
              title={designatedTruth
                ? `formula forced at ${designated}`
                : `formula not forced at ${designated}`}
            >
              {designatedTruth ? '⊩' : '⊮'} {designated}
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
              title={validity.valid
                ? 'formula forced at every world (model-valid)'
                : `formula fails at ${validity.failingWorld}`}
            >
              {validity.valid ? 'model-valid' : `invalid (fails at ${validity.failingWorld})`}
            </span>
          )}
        </div>
      </div>
      <KripkeModelView model={model} satisfaction={fMap} className="bg-gray-950/50" />
      {activeExample.note && (
        <div className="px-4 py-3 border-t border-gray-800 text-sm text-gray-400 leading-relaxed">
          {activeExample.note}
        </div>
      )}
    </div>
  );
}

function FrameShapePanel({ model }: { model: KripkeModel }) {
  const diag = useMemo(() => intuitionisticDiagnostics(model), [model]);
  const cells = [
    { key: 'reflexive',  holds: diag.reflexive.holds,  label: 'reflexive',  hint: 'every world accesses itself' },
    { key: 'transitive', holds: diag.transitive.holds, label: 'transitive', hint: 'R(a,b) ∧ R(b,c) ⇒ R(a,c)' },
    {
      key: 'monotone',
      holds: diag.monotone.holds,
      label: 'monotone',
      hint: diag.monotone.holds
        ? 'V is upward-closed under R'
        : `${diag.monotone.witness.from} has '${diag.monotone.witness.atom}' but ${diag.monotone.witness.to} doesn’t`,
    },
  ];
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4 space-y-3">
      <h3 className="text-gray-100 font-medium">Frame shape</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {cells.map(c => {
          const cls = c.holds
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : 'bg-rose-500/10 text-rose-300 border-rose-500/30';
          return (
            <div
              key={c.key}
              className={`text-xs px-2 py-1.5 rounded border font-mono flex items-baseline justify-between gap-1 ${cls}`}
              title={c.hint}
            >
              <span>{c.label}</span>
              <span>{c.holds ? '✓' : '✗'}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        Intuitionistic Kripke frames are <em>pre-orders</em> (reflexive + transitive)
        with a <em>monotone</em> valuation: once an atom holds at a world, it holds at
        every accessible world. Failing any of these three turns the diagrams into a
        well-formed visualization of an ill-formed frame.
      </p>
    </div>
  );
}

function IntuitionisticAxiomsPanel({ model }: { model: KripkeModel }) {
  const verdicts = useMemo(() => intuitionisticAxiomVerdicts(model), [model]);
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4 space-y-3">
      <h3 className="text-gray-100 font-medium">Axioms in this model</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {verdicts.map(v => {
          const expectClassicalFail = v.axiom.kind === 'classical-only';
          const pedagogicallyExpected = expectClassicalFail ? !v.valid : v.valid;
          const cls = pedagogicallyExpected
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-amber-500/30 bg-amber-500/5';
          return (
            <div key={v.axiom.short} className={`text-xs px-3 py-2 rounded border ${cls}`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-gray-100">{v.axiom.short}</span>
                <span className={v.valid ? 'text-emerald-300' : 'text-rose-300'}>
                  {v.valid ? 'valid' : 'fails'}
                </span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">{v.axiom.name}</div>
              <code className="text-[10px] block mt-1 text-blue-300 font-mono break-all">
                {v.axiom.schema}
              </code>
              <div className="text-[10px] text-gray-500 mt-1 leading-relaxed">{v.axiom.gloss}</div>
              {!v.valid && v.failure && (
                <div className="text-[10px] text-rose-300/80 mt-1">
                  fails at <code className="font-mono">{v.failure.world}</code> under{' '}
                  <code className="font-mono">
                    {Object.entries(v.failure.substitution).map(([k, val]) => `${k}↦${val}`).join(', ')}
                  </code>
                </div>
              )}
              {v.axiom.kind === 'classical-only' && v.valid && (
                <div className="text-[10px] text-amber-300/80 mt-1">
                  classical-only axiom is valid here — likely no countermodel fits the model’s atom set; pick the LEM example to see one fail.
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        Green border = the model’s verdict matches the pedagogical role
        (intuitionistically valid principles holding; classical-only principles
        failing). Amber = the verdict is unexpected (a classical-only axiom holds
        because the model lacks the right witness shape, or an intuitionistically
        valid axiom fails because the frame violates a frame-shape constraint).
      </p>
    </div>
  );
}

function IntuitionisticToolbar({
  onCommand, examples, activeExampleSlug,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
  activeExampleSlug: string;
}) {
  const structural = INTUITIONISTIC_COMMANDS.filter(c => !c.slug.startsWith('example.'));
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
