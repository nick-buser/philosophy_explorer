import { useMemo, useState, type ReactNode } from 'react';
import { KripkeModelView } from './KripkeModelView';
import { EpistemicModelView } from './EpistemicModelView';
import { TraceView } from './TraceView';
import { satisfactionMap } from './kripke-eval';
import { satisfactionMapE } from './epistemic-eval';
import { satisfactionMapT } from './temporal-eval';
import { satisfactionMapC } from './ctl-eval';
import { forcesMap } from './intuitionistic-eval';
import { ALL_FRAMES, findFrame } from './kripke-frames';
import { closeUnderFrame } from './kripke-frame-check';
import type { KripkeModel, FrameClassSlug } from './kripke-types';
import { findLogicSystem, type LogicSystem, type LogicExample } from '../data/logic-systems';

// Inline modal-logic visualization for the argument browser. Each modal
// argument already carries its own hand-authored model/trace, so that's the
// default render; a dropdown lets you switch to the lab system's example models
// (or, for kripke, close R under a frame class) to see how the formula behaves
// in other models / modal systems. Worlds/positions where the formula holds are
// highlighted by the underlying view's `satisfaction` overlay.

type Sat = Record<string, boolean>;
type ModelOption = { label: string; model: unknown };

type ModalKind = {
  // Candidate models pulled from the lab system's examples.
  examples: (sys: LogicSystem) => ModelOption[];
  satisfaction: (formula: unknown, model: unknown) => Sat;
  view: (model: unknown, sat: Sat) => ReactNode;
  // Only kripke exposes the K/T/S4/S5 frame-class closure.
  frames: boolean;
};

const exampleModels = (sys: LogicSystem): ModelOption[] =>
  sys.examples.filter(e => e.model).map(e => ({ label: e.natural, model: e.model }));

const KINDS: Record<string, ModalKind> = {
  kripke: {
    examples: exampleModels,
    satisfaction: (f, m) => satisfactionMap(f as never, m as KripkeModel),
    view: (m, sat) => <KripkeModelView model={m as KripkeModel} satisfaction={sat} className="bg-gray-950/50" />,
    frames: true,
  },
  intuitionistic: {
    examples: exampleModels,
    satisfaction: (f, m) => forcesMap(f as never, m as never),
    view: (m, sat) => <KripkeModelView model={m as KripkeModel} satisfaction={sat} className="bg-gray-950/50" />,
    frames: false,
  },
  ctl: {
    examples: exampleModels,
    satisfaction: (f, m) => satisfactionMapC(f as never, m as never),
    view: (m, sat) => <KripkeModelView model={m as KripkeModel} satisfaction={sat} className="bg-gray-950/50" />,
    frames: false,
  },
  epistemic: {
    examples: sys => sys.examples.filter(e => e.epistemicModel).map(e => ({ label: e.natural, model: e.epistemicModel })),
    satisfaction: (f, m) => satisfactionMapE(f as never, m as never),
    view: (m, sat) => <EpistemicModelView model={m as never} satisfaction={sat} className="bg-gray-950/50" />,
    frames: false,
  },
  temporal: {
    examples: sys => sys.examples.filter(e => e.trace).map(e => ({ label: e.natural, model: e.trace })),
    satisfaction: (f, m) => satisfactionMapT(f as never, m as never),
    view: (m, sat) => <TraceView trace={m as never} satisfaction={sat} className="bg-gray-950/50" />,
    frames: false,
  },
};

const selectCls =
  'bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:border-gray-600 focus:outline-none max-w-[18rem]';

export function ModalArgumentViz({
  formalism, formula, model, labSlug,
}: {
  formalism: string;
  formula: unknown;
  model: unknown;        // the argument's own model or trace (from the AST)
  labSlug: string | null;
}) {
  const kind = KINDS[formalism];
  const system = labSlug ? findLogicSystem(labSlug) : undefined;

  const options = useMemo<ModelOption[]>(
    () => [{ label: 'specified in this argument', model }, ...(system && kind ? kind.examples(system) : [])],
    [model, system, kind],
  );
  const [idx, setIdx] = useState(0);
  const [frameSlug, setFrameSlug] = useState<FrameClassSlug>('K');

  if (!kind) return null;

  const chosen = options[Math.min(idx, options.length - 1)]?.model ?? model;
  const effective = kind.frames ? closeUnderFrame(chosen as KripkeModel, frameSlug) : chosen;
  const sat = kind.satisfaction(formula, effective);
  const holds = Object.values(sat).filter(Boolean).length;
  const total = Object.keys(sat).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <select className={selectCls} value={idx} onChange={e => setIdx(Number(e.target.value))}>
          {options.map((o, i) => (
            <option key={i} value={i}>{o.label}</option>
          ))}
        </select>
        {kind.frames && (
          <select
            className={selectCls + ' font-mono'}
            value={frameSlug}
            onChange={e => setFrameSlug(e.target.value as FrameClassSlug)}
            title="Close R under this frame class to see how the formula behaves in that modal system"
          >
            {ALL_FRAMES.map(f => (
              <option key={f.slug} value={f.slug}>{f.slug} — {findFrame(f.slug).name}</option>
            ))}
          </select>
        )}
        <span className="text-[10px] uppercase tracking-wider text-gray-500 ml-auto">
          formula holds at {holds}/{total} {total === 1 ? 'state' : 'states'}
        </span>
      </div>
      {kind.view(effective, sat)}
      <p className="text-[11px] text-gray-600 leading-relaxed">
        Highlighted states are where the formula is satisfied. Switch the model to evaluate it against
        the lab's example models{kind.frames ? ', or pick a frame class to close R under that modal system' : ''}.
      </p>
    </div>
  );
}
