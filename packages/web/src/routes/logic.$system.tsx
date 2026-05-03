import { useMemo, useState } from 'react';
import { Link, createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { findLogicSystem, type LogicExample, type LogicSystem } from '../data/logic-systems';
import { parseEg } from '../logic/eg-parser';
import { EgRenderer } from '../logic/EgRenderer';
import { EgEditor } from '../logic/EgEditor';
import { EG_COMMANDS, findCommand } from '../logic/eg-commands';
import { parseModal } from '../logic/kripke-parser';
import { renderKatex } from '../logic/kripke-render';
import { KripkeFormulaEditor } from '../logic/KripkeFormulaEditor';
import { KripkeModelView } from '../logic/KripkeModelView';
import { KatexFormula } from '../logic/KatexFormula';
import { KRIPKE_COMMANDS, findKripkeCommand } from '../logic/kripke-commands';
import type { FrameClassSlug } from '../logic/kripke-types';
import { ALL_FRAMES, findFrame } from '../logic/kripke-frames';
import { parseFrege } from '../logic/frege-parser';
import { FregeRenderer } from '../logic/FregeRenderer';
import { FregeEditor } from '../logic/FregeEditor';
import { FREGE_COMMANDS, findFregeCommand } from '../logic/frege-commands';
import { parseAristotelian } from '../logic/aristotelian-parser';
import { AristotelianRenderer } from '../logic/AristotelianRenderer';
import { AristotelianEditor } from '../logic/AristotelianEditor';
import { AristotelianSquare } from '../logic/AristotelianSquare';
import { ARISTOTELIAN_COMMANDS, findAristotelianCommand } from '../logic/aristotelian-commands';
import { checkSyllogism, type ImportSetting } from '../logic/aristotelian-validity';
import {
  allImmediateInferences,
  formatProposition,
  type ImmediateInference,
} from '../logic/aristotelian-immediate';
import { parseMedieval } from '../logic/medieval-parser';
import { MedievalRenderer } from '../logic/MedievalRenderer';
import { MedievalEditor } from '../logic/MedievalEditor';
import { MEDIEVAL_COMMANDS, findMedievalCommand } from '../logic/medieval-commands';
import {
  checkModalSyllogism,
  checkSorites,
  type ModalValidityResult,
  type SoritesValidityResult,
} from '../logic/medieval-validity';
import type {
  ModalReading,
  ModalSyllogism,
} from '../logic/medieval-types';
import { parseFol } from '../logic/fol-parser';
import { renderKatex as renderFolKatex } from '../logic/fol-render';
import { FolEditor } from '../logic/FolEditor';
import { FOL_COMMANDS, findFolCommand } from '../logic/fol-commands';
import { checkValidity, type ValidityResult, type Countermodel } from '../logic/fol-validity';
import { isPropositional } from '../logic/fol-types';

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

  if (system.slug === 'kripke') {
    return <KripkeLab system={system} />;
  }

  if (system.slug === 'frege-bs') {
    return <FregeBsLab system={system} />;
  }

  if (system.slug === 'aristotelian') {
    return <AristotelianLab system={system} />;
  }

  if (system.slug === 'medieval') {
    return <MedievalLab system={system} />;
  }

  if (system.slug === 'modern-fol') {
    return <ModernFolLab system={system} />;
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

// ─────────────────────────────────────────────────────────────────────
// Kripke Lab — modal logic with frame-class picker + Kripke model view.

function KripkeLab({ system }: { system: LogicSystem }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initial.dsl);
  const [exampleSlug, setExampleSlug] = useState<string>(initial.slug);
  const [frameSlug, setFrameSlug] = useState<FrameClassSlug>(
    initial.frameClass ?? 'K',
  );

  const activeExample = useMemo(
    () => system.examples.find(ex => ex.slug === exampleSlug) ?? initial,
    [exampleSlug, system.examples, initial],
  );

  function pickExample(slug: string) {
    const ex = system.examples.find(e => e.slug === slug);
    if (!ex) return;
    setExampleSlug(slug);
    setSrc(ex.dsl);
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

function KripkeLabBody({
  src, onSrcChange, examples, onPickCommand,
  frameSlug, onFrameChange, activeExample,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onPickCommand: (slug: string) => void;
  frameSlug: FrameClassSlug;
  onFrameChange: (s: FrameClassSlug) => void;
  activeExample: LogicExample;
}) {
  const parsed = useMemo(() => parseModal(src), [src]);
  const editorMatchesExample = src.trim() === activeExample.dsl.trim();
  const frame = findFrame(frameSlug);

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

      {activeExample.model && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/30 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span>Kripke model</span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-400">{activeExample.natural}</span>
              {activeExample.frameClass && (
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  {activeExample.frameClass}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!editorMatchesExample && (
                <span
                  className="text-[10px] uppercase tracking-wider text-gray-600"
                  title="The formula in the editor differs from the example formula. The model below is still the example's model."
                >
                  edited
                </span>
              )}
              <TruthBadge example={activeExample} editorMatches={editorMatchesExample} />
            </div>
          </div>
          <KripkeModelView model={activeExample.model} className="bg-gray-950/50" />
          {activeExample.note && (
            <div className="px-4 py-3 border-t border-gray-800 text-sm text-gray-400 leading-relaxed">
              {activeExample.note}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500 leading-relaxed">
        Frame class <code className="text-gray-300">{frame.slug}</code> describes which
        constraints on the accessibility relation <code className="text-gray-300">R</code> are
        assumed. The picker is informational in phase 1 — examples carry their own
        intended frame class. Type <code className="text-gray-300">/</code> in the
        editor for operator and example completions.
      </p>
    </div>
  );
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

function TruthBadge({
  example, editorMatches,
}: {
  example: LogicExample;
  editorMatches: boolean;
}) {
  if (example.satisfied === undefined) return null;
  const designated = example.model?.designated ?? 'w0';
  const ok = example.satisfied;
  // When the user has edited the formula away from the example, the
  // hand-authored `satisfied` flag is no longer meaningful — phase 1
  // has no evaluator. Render a neutral state.
  if (!editorMatches) {
    return (
      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 font-mono"
            title="Truth value is hand-authored for the example formula; not recomputed for edits in phase 1.">
        ⊨ ?
      </span>
    );
  }
  return (
    <span
      className={
        'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ' +
        (ok
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          : 'bg-rose-500/15 text-rose-300 border-rose-500/30')
      }
      title={ok
        ? `formula satisfied at ${designated}`
        : `formula not satisfied at ${designated}`}
    >
      {ok ? '⊨' : '⊭'} {designated}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Frege Begriffsschrift Lab — third populated system. 2D notation
// rendered as custom SVG; linear ASCII DSL for input.

function FregeBsLab({ system }: { system: LogicSystem }) {
  const initial = system.examples[2] ?? system.examples[0]!;
  const [src, setSrc] = useState<string>(initial.dsl);

  function runCommand(slug: string) {
    if (slug.startsWith('example.')) {
      const ex = system.examples.find(e => e.slug === slug.slice('example.'.length));
      if (ex) setSrc(ex.dsl);
      return;
    }
    const cmd = findFregeCommand(slug);
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
          <FregeBsLabBody src={src} onSrcChange={setSrc} examples={system.examples} onCommand={runCommand} />
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

function FregeBsLabBody({
  src, onSrcChange, examples, onCommand,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onCommand: (slug: string) => void;
}) {
  const parsed = useMemo(() => parseFrege(src), [src]);

  return (
    <div className="space-y-4">
      <FregeToolbar onCommand={onCommand} examples={examples} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <span className="text-gray-600">Begriffsschrift 1879</span>
          </div>
          <FregeEditor value={src} onChange={onSrcChange} className="min-h-[220px]" />
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
          <div className="p-6 flex-1 flex items-center justify-center min-h-[220px] overflow-auto">
            {parsed.ok ? (
              <FregeRenderer formula={parsed.formula} className="max-h-[420px]" />
            ) : (
              <div className="text-sm text-amber-300/80 font-mono">
                {parsed.error.message} (col {parsed.error.position + 1})
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Shorthand: <code className="text-gray-300">|- A</code> asserts A;
        <code className="ml-1 text-gray-300">~A</code> negates;
        <code className="ml-1 text-gray-300">A -&gt; B</code> is the conditional
        (Frege puts the consequent on top of the T-junction);
        <code className="ml-1 text-gray-300">all x. F(x)</code> is universal generality.
        Type <code className="text-gray-300">/</code> in the editor for templates and
        examples.
      </p>
    </div>
  );
}

function FregeToolbar({
  onCommand, examples,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
}) {
  const structural = FREGE_COMMANDS.filter(c => !c.slug.startsWith('example.'));
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

// ─────────────────────────────────────────────────────────────────────
// Aristotelian Lab — fourth populated system. Term logic with Venn
// diagrams; the only system that ships a validity check.

function AristotelianLab({ system }: { system: LogicSystem }) {
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

function ImportToggle({
  value, onChange,
}: {
  value: ImportSetting;
  onChange: (s: ImportSetting) => void;
}) {
  const options: { id: ImportSetting; label: string; title: string }[] = [
    {
      id: 'traditional',
      label: 'Traditional',
      title: 'Universal A/E carry existential import — the 9 weakened moods are valid.',
    },
    {
      id: 'boolean',
      label: 'Boolean',
      title: 'No existential import — A/E are conditionals; the 9 weakened moods become invalid.',
    },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Existential import"
      className="inline-flex rounded border border-gray-800 bg-gray-900 overflow-hidden"
    >
      {options.map(opt => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            title={opt.title}
            className={
              'text-xs px-2.5 py-1.5 transition-colors ' +
              (active
                ? 'bg-blue-500/15 text-blue-200'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200')
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ValidityBadge({
  syllogism, importSetting,
}: {
  syllogism: import('../logic/aristotelian-types').Syllogism;
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
  proposition: import('../logic/aristotelian-types').CategoricalProposition | null;
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

// ─────────────────────────────────────────────────────────────────────
// Medieval Lab — modal syllogistic + sorites (FEAT-010)

function MedievalLab({ system }: { system: LogicSystem }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initial.dsl);
  const [reading, setReading] = useState<ModalReading>('de-re');
  const [importSetting, setImportSetting] = useState<ImportSetting>('traditional');

  function runCommand(slug: string) {
    if (slug.startsWith('example.')) {
      const ex = system.examples.find(e => e.slug === slug.slice('example.'.length));
      if (ex) setSrc(ex.dsl);
      return;
    }
    const cmd = findMedievalCommand(slug);
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
          <MedievalLabBody
            src={src}
            onSrcChange={setSrc}
            examples={system.examples}
            onCommand={runCommand}
            reading={reading}
            onReadingChange={setReading}
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

function MedievalLabBody({
  src, onSrcChange, examples, onCommand,
  reading, onReadingChange, importSetting, onImportChange,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onCommand: (slug: string) => void;
  reading: ModalReading;
  onReadingChange: (r: ModalReading) => void;
  importSetting: ImportSetting;
  onImportChange: (s: ImportSetting) => void;
}) {
  const parsed = useMemo(() => parseMedieval(src), [src]);

  // The page-level reading toggle only takes effect when the parsed
  // syllogism didn't fix a reading itself (i.e. assertoric premises +
  // a modal conclusion, or a compact-form fallback). When the parser
  // already resolved a reading from explicit prefixes/infixes, we
  // honour it and the toggle just shows the current effective state.
  const effectiveReading: ModalReading = parsed.ok && parsed.formula.kind === 'modal-syllogism'
    && parsed.formula.syllogism.reading !== 'assertoric'
      ? parsed.formula.syllogism.reading
      : reading;

  const validity =
    parsed.ok && parsed.formula.kind === 'modal-syllogism'
      ? checkModalSyllogism(
          { ...parsed.formula.syllogism, reading: effectiveReading },
          importSetting,
        )
      : null;
  const sorites =
    parsed.ok && parsed.formula.kind === 'sorites'
      ? checkSorites(parsed.formula.chain, importSetting)
      : null;

  return (
    <div className="space-y-4">
      <MedievalToolbar
        onCommand={onCommand}
        examples={examples}
        reading={reading}
        onReadingChange={onReadingChange}
        importSetting={importSetting}
        onImportChange={onImportChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <span className="text-gray-600">modal term logic</span>
          </div>
          <MedievalEditor value={src} onChange={onSrcChange} className="min-h-[260px]" />
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
            <span>Rendering</span>
            <div className="flex items-center gap-2">
              {validity && parsed.ok && parsed.formula.kind === 'modal-syllogism' && (
                <ModalValidityBadge
                  syllogism={{ ...parsed.formula.syllogism, reading: effectiveReading }}
                  result={validity}
                />
              )}
              {sorites && (
                <SoritesValidityBadge result={sorites} />
              )}
              {parsed.ok ? (
                <span className="text-emerald-400">parsed</span>
              ) : (
                <span className="text-amber-400">parse error</span>
              )}
            </div>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center min-h-[260px] overflow-auto">
            {parsed.ok ? (
              <MedievalRenderer
                formula={parsed.formula}
                className="max-h-[360px]"
                failedStepIndex={sorites && !sorites.valid ? sorites.failedStepIndex : null}
                stepNames={sorites && sorites.valid ? sorites.stepNames : []}
              />
            ) : (
              <div className="text-sm text-amber-300/80 font-mono">
                {parsed.error.message}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Long form: <code className="text-gray-300">Necessarily, all S is P</code> (de dicto) /
        <code className="ml-1 text-gray-300">All S is necessarily P</code> (de re).
        Modal syllogisms are three lines (the conclusion may be prefixed
        <code className="ml-1 text-gray-300">Therefore</code>). Sorites are 4+ lines, each line sharing a term with the next.
        Compact form: <code className="ml-1 text-gray-300">LXL-1/de-re/S,M,P</code>.
        Toggle <span className="text-gray-300">de re / de dicto</span> to switch the modal scope reading —
        Aristotle vs Buridan disagree on whether mixed L/X moods (e.g. Barbara LXL-1) are valid, and the toggle flips the result.
        The <span className="text-gray-300">Traditional / Boolean</span> toggle composes with reading and follows
        the FEAT-009 rule: Boolean import marks the 9 weakened underlying assertoric moods invalid.
      </p>
    </div>
  );
}

function MedievalToolbar({
  onCommand, examples, reading, onReadingChange, importSetting, onImportChange,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
  reading: ModalReading;
  onReadingChange: (r: ModalReading) => void;
  importSetting: ImportSetting;
  onImportChange: (s: ImportSetting) => void;
}) {
  const structural = MEDIEVAL_COMMANDS.filter(c => !c.slug.startsWith('example.'));
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
      <ReadingToggle value={reading} onChange={onReadingChange} />
      <ImportToggle value={importSetting} onChange={onImportChange} />
    </div>
  );
}

function ReadingToggle({
  value, onChange,
}: {
  value: ModalReading;
  onChange: (r: ModalReading) => void;
}) {
  const options: { id: ModalReading; label: string; title: string }[] = [
    {
      id: 'de-re',
      label: 'de re',
      title: 'In sensu diviso — the modal operator binds the predicate inside the proposition (Aristotle).',
    },
    {
      id: 'de-dicto',
      label: 'de dicto',
      title: 'In sensu composito — the modal operator binds the proposition as a whole (Buridan / Theophrastus).',
    },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Modal reading"
      className="inline-flex rounded border border-gray-800 bg-gray-900 overflow-hidden"
    >
      {options.map(opt => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.id)}
            title={opt.title}
            className={
              'text-xs px-2.5 py-1.5 transition-colors ' +
              (active
                ? 'bg-violet-500/15 text-violet-200'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200')
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ModalValidityBadge({
  syllogism, result,
}: {
  syllogism: ModalSyllogism;
  result: ModalValidityResult;
}) {
  const figLabel = `Fig ${syllogism.figure}`;
  const moodLabel = `${syllogism.modalMood}/${syllogism.assertoricMood}`;
  const readingLabel = syllogism.reading === 'de-re'
    ? 'de re'
    : syllogism.reading === 'de-dicto'
      ? 'de dicto'
      : 'assertoric';

  if (!result.valid) {
    const reasonText =
        result.reason === 'pattern-not-supported'   ? 'mode pattern unsupported in phase 1'
      : result.reason === 'conclusion-mode-mismatch' ? `conclusion mode mismatch — ${result.note ?? ''}`
      : result.reason === 'weakened-under-boolean'   ? 'weakened under Boolean import'
      :                                                'underlying assertoric mood is invalid';
    return (
      <span
        className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-rose-500/15 text-rose-300 border-rose-500/30"
        title={reasonText}
      >
        invalid · {moodLabel} · {figLabel} · {readingLabel}
      </span>
    );
  }
  return (
    <span
      className={
        'text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border ' +
        (result.assertoric.weakened
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30')
      }
      title={result.modalName ?? `${result.assertoric.name} (modal)`}
    >
      {(result.modalName ?? result.assertoric.name)} · {moodLabel} · {figLabel} · {readingLabel}
      {result.assertoric.weakened ? ' · weakened' : ''}
    </span>
  );
}

function SoritesValidityBadge({ result }: { result: SoritesValidityResult }) {
  if (!result.valid) {
    return (
      <span
        className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-rose-500/15 text-rose-300 border-rose-500/30"
        title={result.reason}
      >
        invalid · sorites step {result.failedStepIndex + 1}
      </span>
    );
  }
  return (
    <span
      className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      title={`${result.shape} sorites of length ${result.length}`}
    >
      sorites · {result.shape} · {result.length} steps
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Modern FOL Lab — Peano/Russell linear notation, KaTeX-rendered.
// Validity is two-tier: propositional fragment via truth table, FOL
// via bounded semantic tableau.

function ModernFolLab({ system }: { system: LogicSystem }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initial.dsl);

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

function FolValidityBadge({ result }: { result: ValidityResult }) {
  const methodLabel = result.kind === 'unknown'
    ? 'tableau'
    : result.method === 'truth-table' ? 'truth-table' : 'tableau';
  if (result.kind === 'valid') {
    return (
      <span
        className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
        title={`Valid by ${methodLabel}`}
      >
        valid · {methodLabel}
      </span>
    );
  }
  if (result.kind === 'invalid') {
    return (
      <span
        className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-rose-500/15 text-rose-300 border-rose-500/30"
        title="A countermodel was found — see panel below."
      >
        invalid · {methodLabel}
      </span>
    );
  }
  return (
    <span
      className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-amber-500/15 text-amber-300 border-amber-500/30"
      title={`Tableau exhausted its ${result.budget}-step budget without closing or saturating. Increase the budget or reduce nesting to retry.`}
    >
      unknown · budget exhausted
    </span>
  );
}

function CountermodelPanel({
  countermodel, method,
}: {
  countermodel: Countermodel;
  method: 'truth-table' | 'tableau';
}) {
  if (countermodel.kind === 'valuation') {
    return (
      <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 space-y-2">
        <h3 className="text-xs font-semibold tracking-widest uppercase text-rose-300">
          Countermodel ({method})
        </h3>
        {countermodel.atoms.length === 0 ? (
          <p className="text-sm text-gray-300">The formula evaluates to ⊥ even with no propositional atoms.</p>
        ) : (
          <ul className="text-sm text-gray-200 font-mono leading-relaxed">
            {countermodel.atoms.map((a, i) => (
              <li key={a}>
                <span className="text-blue-300">{a}</span>{' '}
                <span className="text-gray-500">=</span>{' '}
                <span className={countermodel.values[i] ? 'text-emerald-300' : 'text-rose-300'}>
                  {countermodel.values[i] ? 'T' : 'F'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 space-y-2">
      <h3 className="text-xs font-semibold tracking-widest uppercase text-rose-300">
        Countermodel ({method})
      </h3>
      <div className="text-sm text-gray-200 space-y-1">
        <div>
          <span className="text-gray-500">domain</span> = {'{ '}
          <span className="font-mono text-blue-300">
            {countermodel.domain.join(', ')}
          </span>
          {' }'}
        </div>
        {countermodel.positiveFacts.length > 0 && (
          <CountermodelFacts label="true atoms"   items={countermodel.positiveFacts} cls="text-emerald-300" />
        )}
        {countermodel.negativeFacts.length > 0 && (
          <CountermodelFacts label="false atoms"  items={countermodel.negativeFacts} cls="text-rose-300" />
        )}
        {countermodel.equalities.length > 0 && (
          <CountermodelFacts label="equalities"   items={countermodel.equalities}    cls="text-violet-300" />
        )}
        {countermodel.inequalities.length > 0 && (
          <CountermodelFacts label="inequalities" items={countermodel.inequalities}  cls="text-amber-300" />
        )}
      </div>
    </div>
  );
}

function CountermodelFacts({ label, items, cls }: { label: string; items: string[]; cls: string }) {
  return (
    <div>
      <span className="text-gray-500">{label}</span>:{' '}
      <span className={`font-mono ${cls}`}>{items.join(', ')}</span>
    </div>
  );
}
