import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { LogicExample, LogicSystem } from '../../data/logic-systems';
import { parseModal } from '../kripke-parser';
import { renderKatex } from '../kripke-render';
import { KripkeFormulaEditor } from '../KripkeFormulaEditor';
import { KripkeModelView } from '../KripkeModelView';
import { KatexFormula } from '../KatexFormula';
import { KRIPKE_COMMANDS, findKripkeCommand } from '../kripke-commands';
import type {
  FrameClassSlug,
  KripkeModel,
  ModalFormula,
} from '../kripke-types';
import { ALL_FRAMES, findFrame } from '../kripke-frames';
import {
  satisfactionMap,
  satisfies,
  validInModel,
} from '../kripke-eval';
import {
  closeUnderFrame,
  frameDiagnostics,
  validateAgainst,
  type ConstraintWitness,
} from '../kripke-frame-check';
import { axiomVerdicts } from '../kripke-axioms';
import { SectionHeading } from './shared';

export default function KripkeLab({ system }: { system: LogicSystem }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initial.dsl);
  const [exampleSlug, setExampleSlug] = useState<string>(initial.slug);
  const [frameSlug, setFrameSlug] = useState<FrameClassSlug>(
    initial.frameClass ?? 'K',
  );
  // The "live" model: starts as the example's hand-authored model, can
  // be replaced by closing R under a chosen frame class via the
  // "fix model" button.
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
    if (ex.frameClass) setFrameSlug(ex.frameClass);
  }

  function runCommand(slug: string) {
    if (slug.startsWith('example.')) {
      pickExample(slug.slice('example.'.length));
      return;
    }
    const cmd = findKripkeCommand(slug);
    if (!cmd) return;
    setSrc(cmd.insert);
  }

  function fixModelToFrame() {
    if (!liveModel) return;
    setLiveModel(closeUnderFrame(liveModel, frameSlug));
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
          <KripkeLabBody
            src={src}
            onSrcChange={setSrc}
            examples={system.examples}
            onPickCommand={runCommand}
            frameSlug={frameSlug}
            onFrameChange={setFrameSlug}
            activeExample={activeExample}
            liveModel={liveModel}
            onFixModel={fixModelToFrame}
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

function KripkeLabBody({
  src, onSrcChange, examples, onPickCommand,
  frameSlug, onFrameChange, activeExample,
  liveModel, onFixModel, onResetModel,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onPickCommand: (slug: string) => void;
  frameSlug: FrameClassSlug;
  onFrameChange: (s: FrameClassSlug) => void;
  activeExample: LogicExample;
  liveModel: KripkeModel | undefined;
  onFixModel: () => void;
  onResetModel: () => void;
}) {
  const parsed = useMemo(() => parseModal(src), [src]);
  const frame = findFrame(frameSlug);
  const modelEdited =
    liveModel !== undefined &&
    activeExample.model !== undefined &&
    liveModel !== activeExample.model;

  return (
    <div className="space-y-4">
      <FrameClassPicker selected={frameSlug} onSelect={onFrameChange} />
      <FrameClassDetail frameSlug={frameSlug} />

      <KripkeToolbar
        onCommand={onPickCommand}
        examples={examples}
        activeExampleSlug={activeExample.slug}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <span className="text-gray-600">propositional modal</span>
          </div>
          <KripkeFormulaEditor value={src} onChange={onSrcChange} className="min-h-[180px]" />
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
        <KripkeModelPanel
          model={liveModel}
          formula={parsed.ok ? parsed.formula : undefined}
          activeExample={activeExample}
          frameSlug={frameSlug}
          modelEdited={modelEdited}
          onFixModel={onFixModel}
          onResetModel={onResetModel}
        />
      )}

      {liveModel && (
        <FrameDiagnosticsPanel model={liveModel} frameSlug={frameSlug} />
      )}

      {liveModel && (
        <AxiomVerdictsPanel model={liveModel} />
      )}

      <p className="text-xs text-gray-500 leading-relaxed">
        Truth values, per-world chips, frame diagnostics and axiom verdicts are computed
        live by the engine. Frame class <code className="text-gray-300">{frame.slug}</code>{' '}
        sets the constraints checked under "frame diagnostics"; if the example model violates
        them, the "close R under {frame.slug}" button adds the smallest set of edges to fix it.
      </p>
    </div>
  );
}

function KripkeModelPanel({
  model, formula, activeExample, frameSlug, modelEdited, onFixModel, onResetModel,
}: {
  model: KripkeModel;
  formula: ModalFormula | undefined;
  activeExample: LogicExample;
  frameSlug: FrameClassSlug;
  modelEdited: boolean;
  onFixModel: () => void;
  onResetModel: () => void;
}) {
  const satMap = useMemo(
    () => (formula ? satisfactionMap(formula, model) : undefined),
    [formula, model],
  );
  const designated = model.designated ?? model.worlds[0]?.id;
  const designatedTruth = useMemo(() => {
    if (!formula || !designated) return undefined;
    return satisfies(formula, model, designated);
  }, [formula, model, designated]);
  const validity = useMemo(
    () => (formula ? validInModel(formula, model) : undefined),
    [formula, model],
  );
  const validation = useMemo(() => validateAgainst(model, frameSlug), [model, frameSlug]);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span>Kripke model</span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-400">{activeExample.natural}</span>
          {activeExample.frameClass && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
              declared {activeExample.frameClass}
            </span>
          )}
          {modelEdited && (
            <span className="text-[10px] uppercase tracking-wider text-amber-300">
              edited
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!validation.ok && (
            <button
              type="button"
              onClick={onFixModel}
              className="text-[10px] uppercase tracking-wider px-2 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition-colors"
              title={`Add the smallest set of edges so R satisfies ${frameSlug}'s constraints`}
            >
              close R under {frameSlug}
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
              title={validity.valid
                ? 'formula forced at every world (model-valid)'
                : `formula fails at ${validity.failingWorld}`}
            >
              {validity.valid ? 'model-valid' : `invalid (fails at ${validity.failingWorld})`}
            </span>
          )}
        </div>
      </div>
      <KripkeModelView model={model} satisfaction={satMap} className="bg-gray-950/50" />
      {activeExample.note && (
        <div className="px-4 py-3 border-t border-gray-800 text-sm text-gray-400 leading-relaxed">
          {activeExample.note}
        </div>
      )}
    </div>
  );
}

function FrameDiagnosticsPanel({
  model, frameSlug,
}: {
  model: KripkeModel;
  frameSlug: FrameClassSlug;
}) {
  const diag = useMemo(() => frameDiagnostics(model), [model]);
  const frame = findFrame(frameSlug);
  const required = new Set(frame.constraints);
  const constraints = ['reflexive', 'symmetric', 'transitive', 'serial', 'euclidean'] as const;

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="text-gray-100 font-medium">Frame diagnostics</h3>
        <span className="text-xs text-gray-500">
          checked against <code className="text-gray-300">{frameSlug}</code>
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {constraints.map(c => {
          const verdict = diag.perConstraint[c];
          const requiredHere = required.has(c);
          const cls = verdict.holds
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : requiredHere
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              : 'bg-gray-800/40 text-gray-500 border-gray-800';
          return (
            <div
              key={c}
              className={`text-xs px-2 py-1.5 rounded border font-mono flex items-baseline justify-between gap-1 ${cls}`}
              title={
                verdict.holds
                  ? `R is ${c}`
                  : witnessLabel(verdict.witness)
              }
            >
              <span>{c}</span>
              <span>
                {verdict.holds ? '✓' : requiredHere ? '✗' : '·'}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        Bold rose ✗ = constraint required by {frameSlug} but R doesn't satisfy it. Grey ·
        = neither required nor present. ✓ = R satisfies the constraint regardless of frame class.
      </p>
    </div>
  );
}

function AxiomVerdictsPanel({ model }: { model: KripkeModel }) {
  const verdicts = useMemo(() => axiomVerdicts(model), [model]);
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4 space-y-3">
      <h3 className="text-gray-100 font-medium">Axioms in this model</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {verdicts.map(v => (
          <div
            key={v.axiom.short}
            className={
              'text-xs px-3 py-2 rounded border ' +
              (v.valid
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-rose-500/30 bg-rose-500/5')
            }
          >
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
            {!v.valid && v.failure && (
              <div className="text-[10px] text-rose-300/80 mt-1">
                fails at <code className="font-mono">{v.failure.world}</code> under{' '}
                <code className="font-mono">
                  {Object.entries(v.failure.substitution).map(([k, val]) => `${k}↦${val}`).join(', ')}
                </code>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        An axiom is "valid in this model" iff it's forced at every world for every
        substitution of its schema variables into atoms occurring in the model.
        Engine-derived; no hand-authored truth values.
      </p>
    </div>
  );
}

function witnessLabel(w: ConstraintWitness): string {
  switch (w.kind) {
    case 'reflexive':  return `no self-loop at ${w.world}`;
    case 'symmetric':  return `${w.from}→${w.to} has no reverse`;
    case 'transitive': {
      const [a, b, c] = w.via;
      return `${a}→${b}→${c}, but ${a}→${c} missing`;
    }
    case 'serial':     return `${w.world} is a dead end`;
    case 'euclidean': {
      const [a, b, c] = w.via;
      return `${a}→${b}, ${a}→${c}, but ${b}→${c} missing`;
    }
  }
}

function FrameClassPicker({
  selected, onSelect,
}: {
  selected: FrameClassSlug;
  onSelect: (s: FrameClassSlug) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500 mr-1">frame class:</span>
      {ALL_FRAMES.map(f => {
        const active = f.slug === selected;
        return (
          <button
            key={f.slug}
            type="button"
            onClick={() => onSelect(f.slug)}
            className={
              'text-xs px-2.5 py-1.5 rounded border transition-colors font-mono ' +
              (active
                ? 'border-blue-500/50 bg-blue-500/10 text-blue-200'
                : 'border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-gray-100')
            }
            title={f.name}
          >
            {f.slug}
          </button>
        );
      })}
    </div>
  );
}

function FrameClassDetail({ frameSlug }: { frameSlug: FrameClassSlug }) {
  const frame = findFrame(frameSlug);
  const parsed = useMemo(() => parseModal(frame.characteristicAxiom.dsl), [frame]);
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="text-gray-100 font-medium">{frame.name}</h3>
        <span className="text-xs text-gray-500">
          {frame.constraints.length === 0
            ? 'no constraints on R'
            : frame.constraints.join(' + ')}
        </span>
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">{frame.description}</p>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-gray-500">
          characteristic axiom
        </span>
        {parsed.ok && (
          <KatexFormula tex={renderKatex(parsed.formula)} className="text-gray-100" displayMode={false} />
        )}
        <code className="text-xs px-1.5 py-0.5 rounded bg-gray-950 border border-gray-800 text-blue-300 font-mono">
          {frame.characteristicAxiom.dsl}
        </code>
      </div>
    </div>
  );
}

function KripkeToolbar({
  onCommand, examples, activeExampleSlug,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
  activeExampleSlug: string;
}) {
  const structural = KRIPKE_COMMANDS.filter(c => !c.slug.startsWith('example.'));
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
