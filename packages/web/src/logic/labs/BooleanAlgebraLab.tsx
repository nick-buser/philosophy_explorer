import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { LogicSystem, LogicExample } from '../../data/logic-systems';
import { parseBool } from '../boolean-parser';
import { renderKatex as renderBoolKatex, renderUnicode as renderBoolUnicode } from '../boolean-render';
import { BooleanEditor } from '../BooleanEditor';
import { BOOLEAN_COMMANDS } from '../boolean-commands';
import { buildBoolTruthTable, type BoolTruthTable } from '../boolean-truth-table';
import { buildKMap, KMAP_MAX_VARS, type KMapData } from '../boolean-kmap';
import { buildHasse, HASSE_MAX_VARS, type HasseData } from '../boolean-lattice';
import { simplify, RULE_LABELS, type SimplifyResult } from '../boolean-simplify';
import { toDnf, toCnf, toAnf } from '../boolean-normal-forms';
import { collectVariables } from '../boolean-types';
import { KatexFormula } from '../KatexFormula';
import { KarnaughMap } from '../KarnaughMap';
import { HasseDiagram } from '../HasseDiagram';
import { SectionHeading } from './shared';

export default function BooleanAlgebraLab({ system, initialDsl }: { system: LogicSystem; initialDsl?: string }) {
  const initial = system.examples[0]!;
  const [src, setSrc] = useState<string>(initialDsl ?? initial.dsl);

  function runCommand(slug: string) {
    if (slug.startsWith('example.')) {
      const ex = system.examples.find(e => e.slug === slug.slice('example.'.length));
      if (ex) setSrc(ex.dsl);
      return;
    }
    const cmd = BOOLEAN_COMMANDS.find(c => c.slug === slug);
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
          <BooleanLabBody
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

function BooleanLabBody({
  src, onSrcChange, examples, onCommand,
}: {
  src: string;
  onSrcChange: (s: string) => void;
  examples: LogicExample[];
  onCommand: (slug: string) => void;
}) {
  const parsed = useMemo(() => parseBool(src), [src]);
  const truthTable = useMemo<BoolTruthTable | null>(
    () => parsed.ok ? buildBoolTruthTable(parsed.formula) : null,
    [parsed],
  );
  const variables = useMemo(
    () => parsed.ok ? collectVariables(parsed.formula) : [],
    [parsed],
  );
  const kmap = useMemo<KMapData | null>(
    () => parsed.ok && variables.length <= KMAP_MAX_VARS ? buildKMap(parsed.formula) : null,
    [parsed, variables.length],
  );
  const hasse = useMemo<HasseData | null>(
    () => parsed.ok && variables.length <= HASSE_MAX_VARS ? buildHasse(parsed.formula) : null,
    [parsed, variables.length],
  );
  const simplification = useMemo<SimplifyResult | null>(
    () => parsed.ok ? simplify(parsed.formula) : null,
    [parsed],
  );
  const dnf = useMemo(() => parsed.ok ? toDnf(parsed.formula) : null, [parsed]);
  const cnf = useMemo(() => parsed.ok ? toCnf(parsed.formula) : null, [parsed]);
  const anf = useMemo(() => parsed.ok ? toAnf(parsed.formula) : null, [parsed]);

  return (
    <div className="space-y-4">
      <BooleanToolbar onCommand={onCommand} examples={examples} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-800 bg-gray-950 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between">
            <span>DSL · type <code className="text-gray-400">/</code> for commands</span>
            <span className="text-gray-600">{variables.length} variable{variables.length === 1 ? '' : 's'}</span>
          </div>
          <BooleanEditor value={src} onChange={onSrcChange} className="min-h-[180px]" />
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 flex flex-col">
          <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
            <span>Rendering</span>
            <div className="flex items-center gap-2">
              {truthTable && <StatusBadge status={truthTable.status} />}
              {parsed.ok ? (
                <span className="text-emerald-400">parsed</span>
              ) : (
                <span className="text-amber-400">parse error</span>
              )}
            </div>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center min-h-[180px] overflow-auto">
            {parsed.ok ? (
              <KatexFormula tex={renderBoolKatex(parsed.formula)} className="text-gray-100" />
            ) : (
              <div className="text-sm text-amber-300/80 font-mono">
                {parsed.error.message} (col {parsed.error.position + 1})
              </div>
            )}
          </div>
        </div>
      </div>

      {kmap && variables.length >= 1 && (
        <Panel title="Karnaugh map" subtitle="Cells coloured by prime-implicant cover. Adjacent cells differ in one variable.">
          <KarnaughMap data={kmap} />
        </Panel>
      )}

      {hasse && (
        <Panel title="Hasse diagram" subtitle="The Boolean lattice; vertices satisfying the formula are highlighted. Edges connect valuations differing in one variable.">
          <HasseDiagram data={hasse} />
        </Panel>
      )}

      {truthTable && variables.length > 0 && (
        <Panel title="Truth table" subtitle="One row per valuation; the rightmost column is the formula's value.">
          <TruthTable table={truthTable} />
        </Panel>
      )}

      {simplification && simplification.steps.length > 0 && (
        <Panel title="Simplification" subtitle={`${simplification.steps.length} rewrite${simplification.steps.length === 1 ? '' : 's'} applied. The simplifier is rule-based, not a complete decision procedure — truth-table equivalence remains the ground truth.`}>
          <SimplificationTrace result={simplification} />
        </Panel>
      )}

      {parsed.ok && (dnf || cnf || anf) && (
        <Panel title="Normal forms" subtitle="DNF (sum of products) lists minterms; CNF (product of sums) lists maxterms; ANF (Reed–Muller) is the canonical XOR / AND polynomial.">
          <NormalForms dnf={dnf} cnf={cnf} anf={anf} />
        </Panel>
      )}

      <p className="text-xs text-gray-500 leading-relaxed">
        Shorthand: juxtaposition is conjunction (<code className="text-gray-300">x y</code> = <code className="text-gray-300">x · y</code>);
        <code className="ml-1 text-gray-300">+</code> is disjunction;
        <code className="ml-1 text-gray-300">~x</code>, <code className="text-gray-300">¬x</code>, and postfix <code className="text-gray-300">x'</code> are complement;
        <code className="ml-1 text-gray-300">^</code> is XOR;
        <code className="ml-1 text-gray-300">-&gt;</code> and <code className="ml-1 text-gray-300">&lt;-&gt;</code> are implication and biconditional.
        Variables are single letters; the K-map and Hasse views render up to 4 variables.
        Type <code className="text-gray-300">/</code> in the editor for templates and examples.
      </p>
    </div>
  );
}

function BooleanToolbar({
  onCommand, examples,
}: {
  onCommand: (slug: string) => void;
  examples: LogicExample[];
}) {
  const structural = BOOLEAN_COMMANDS.filter(c => !c.slug.startsWith('example.'));
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

function StatusBadge({ status }: { status: BoolTruthTable['status'] }) {
  if (status === 'tautology') {
    return (
      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
        tautology · constant 1
      </span>
    );
  }
  if (status === 'contradiction') {
    return (
      <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-rose-500/15 text-rose-300 border-rose-500/30">
        contradiction · constant 0
      </span>
    );
  }
  return (
    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-amber-500/15 text-amber-300 border-amber-500/30">
      contingent
    </span>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40">
      <div className="px-3 py-2 border-b border-gray-800">
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">{title}</span>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4 overflow-x-auto">{children}</div>
    </div>
  );
}

function TruthTable({ table }: { table: BoolTruthTable }) {
  return (
    <table className="text-xs font-mono border-collapse">
      <thead>
        <tr className="text-gray-300">
          {table.variables.map(v => (
            <th key={v} className="px-2 py-1 border-b border-gray-700 text-left">{v}</th>
          ))}
          {table.subformulas.slice(table.variables.length).map((sf, i) => (
            <th key={i} className="px-2 py-1 border-b border-gray-700 text-left">
              <KatexFormula tex={renderBoolKatex(sf)} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, i) => (
          <tr
            key={i}
            className={
              row.mainValue
                ? 'bg-emerald-500/5'
                : 'bg-rose-500/5'
            }
          >
            {table.variables.map(v => (
              <td key={v} className="px-2 py-1 border-b border-gray-800/60">
                {row.valuation[v] ? '1' : '0'}
              </td>
            ))}
            {row.values.slice(table.variables.length).map((val, j) => (
              <td key={j} className="px-2 py-1 border-b border-gray-800/60">
                {val ? '1' : '0'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SimplificationTrace({ result }: { result: SimplifyResult }) {
  return (
    <ol className="space-y-2 text-sm">
      <li className="flex items-baseline gap-3">
        <span className="text-gray-500 text-xs w-12 shrink-0">start</span>
        <code className="text-gray-200 font-mono">{renderBoolUnicode(result.initial)}</code>
      </li>
      {result.steps.map((step, i) => (
        <li key={i} className="flex items-baseline gap-3">
          <span className="text-gray-500 text-xs w-12 shrink-0">{i + 1}.</span>
          <code className="text-gray-200 font-mono">{renderBoolUnicode(step.after)}</code>
          <span className="text-xs text-blue-300/80 ml-auto">{RULE_LABELS[step.rule]}</span>
        </li>
      ))}
    </ol>
  );
}

function NormalForms({ dnf, cnf, anf }: {
  dnf: ReturnType<typeof toDnf> | null;
  cnf: ReturnType<typeof toCnf> | null;
  anf: ReturnType<typeof toAnf> | null;
}) {
  return (
    <dl className="space-y-3 text-sm">
      {dnf && (
        <div className="flex items-baseline gap-3 flex-wrap">
          <dt className="text-xs uppercase tracking-wider text-gray-500 w-12 shrink-0">DNF</dt>
          <dd className="text-gray-200"><KatexFormula tex={renderBoolKatex(dnf)} /></dd>
        </div>
      )}
      {cnf && (
        <div className="flex items-baseline gap-3 flex-wrap">
          <dt className="text-xs uppercase tracking-wider text-gray-500 w-12 shrink-0">CNF</dt>
          <dd className="text-gray-200"><KatexFormula tex={renderBoolKatex(cnf)} /></dd>
        </div>
      )}
      {anf && (
        <div className="flex items-baseline gap-3 flex-wrap">
          <dt className="text-xs uppercase tracking-wider text-gray-500 w-12 shrink-0">ANF</dt>
          <dd className="text-gray-200"><KatexFormula tex={renderBoolKatex(anf)} /></dd>
        </div>
      )}
    </dl>
  );
}