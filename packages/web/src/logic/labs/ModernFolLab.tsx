import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { LogicSystem, LogicExample } from '../../data/logic-systems';
import { parseFol } from '../fol-parser';
import { renderKatex as renderFolKatex } from '../fol-render';
import { FolEditor } from '../FolEditor';
import { FOL_COMMANDS, findFolCommand } from '../fol-commands';
import { checkValidity, type ValidityResult, type Countermodel } from '../fol-validity';
import { isPropositional } from '../fol-types';
import { buildTruthTable, type TruthTable } from '../fol-truth-table';
import {
  buildTableauTree,
  ruleLabel,
  ruleClass,
  type TableauTree,
  type TableauNode,
} from '../fol-tableau-tree';
import { KatexFormula } from '../KatexFormula';
import { SectionHeading } from './shared';

export default function ModernFolLab({ system }: { system: LogicSystem }) {
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

function TruthTablePanel({ table }: { table: TruthTable }) {
  // Lemmon-style truth table. Atom columns first (one per atom);
  // subformula columns next, with the input formula in the rightmost.
  // Rows that falsify the main formula are tinted rose; otherwise a
  // muted background. Headers are KaTeX-rendered.
  const subformulaColumns = table.subformulas.map(s => renderFolKatex(s));
  const mainColumnIndex = table.subformulas.length - 1;

  const statusBadge = (() => {
    if (table.status === 'tautology') {
      return <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">tautology</span>;
    }
    if (table.status === 'contradiction') {
      return <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-rose-500/15 text-rose-300 border-rose-500/30">contradiction</span>;
    }
    return <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-amber-500/15 text-amber-300 border-amber-500/30">contingent</span>;
  })();

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
        <span>Truth table · {table.atoms.length} atom{table.atoms.length === 1 ? '' : 's'} · {table.rows.length} row{table.rows.length === 1 ? '' : 's'}</span>
        {statusBadge}
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-950/60">
              {table.atoms.map(a => (
                <th key={`atom-${a}`} className="px-3 py-2 text-left font-mono text-blue-300 border-r border-gray-800/60 whitespace-nowrap">
                  {a}
                </th>
              ))}
              {subformulaColumns.map((tex, i) => {
                const isMain = i === mainColumnIndex;
                return (
                  <th
                    key={`sub-${i}`}
                    className={`px-3 py-2 text-left border-r border-gray-800/60 whitespace-nowrap ${isMain ? 'bg-blue-950/30' : ''}`}
                  >
                    <KatexFormula tex={tex} className={isMain ? 'text-blue-200' : 'text-gray-300'} />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rIdx) => {
              const falsifies = !row.mainValue;
              const rowCls = falsifies
                ? 'bg-rose-500/5 hover:bg-rose-500/10'
                : 'hover:bg-gray-800/40';
              return (
                <tr key={rIdx} className={`border-b border-gray-800/40 ${rowCls}`}>
                  {table.atoms.map(a => (
                    <td key={`v-${rIdx}-${a}`} className="px-3 py-1.5 font-mono border-r border-gray-800/40">
                      <span className={row.valuation[a] ? 'text-emerald-300' : 'text-rose-300'}>
                        {row.valuation[a] ? 'T' : 'F'}
                      </span>
                    </td>
                  ))}
                  {row.values.map((v, cIdx) => {
                    const isMain = cIdx === mainColumnIndex;
                    return (
                      <td
                        key={`c-${rIdx}-${cIdx}`}
                        className={`px-3 py-1.5 font-mono border-r border-gray-800/40 ${isMain ? 'bg-blue-950/20' : ''}`}
                      >
                        <span className={v ? 'text-emerald-300' : 'text-rose-300'}>
                          {v ? 'T' : 'F'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableauTreePanel({ tree }: { tree: TableauTree }) {
  const verdictBadge = (() => {
    if (tree.verdict === 'valid') {
      return <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">all branches closed</span>;
    }
    if (tree.verdict === 'invalid') {
      return <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-rose-500/15 text-rose-300 border-rose-500/30">open branch found</span>;
    }
    return <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono border bg-amber-500/15 text-amber-300 border-amber-500/30">budget exhausted</span>;
  })();

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 flex items-center justify-between gap-2 flex-wrap">
        <span>
          Tableau (truth tree) · {tree.steps} step{tree.steps === 1 ? '' : 's'} of {tree.budget}
        </span>
        {verdictBadge}
      </div>
      <div className="p-4 overflow-auto">
        <TableauNodeView node={tree.root} isFirst={true} />
      </div>
      <div className="px-3 py-2 border-t border-gray-800 text-xs text-gray-500">
        Reading the tree: each line is one rule application. <span className="text-emerald-400">α</span> rules add formulas linearly; <span className="text-amber-400">β</span> rules split the branch into two sides; <span className="text-violet-400">γ</span> instantiates a universal with a term; <span className="text-blue-400">δ</span> witnesses an existential with a fresh constant. A branch closes (⊗) when it contains a contradiction; open branches yield a countermodel.
      </div>
    </div>
  );
}

function TableauNodeView({ node, isFirst }: { node: TableauNode; isFirst: boolean }) {
  // Recursive vertical layout. Each node renders its label + introduced
  // formulas; children are indented under it. β-children get a "left"/
  // "right" tag so the split is unambiguous.
  const cls = ruleClass(node.rule);
  const label = ruleLabel(node.rule);

  const ruleColor =
    cls === 'root'  ? 'text-gray-400'
  : cls === 'alpha' ? 'text-emerald-400'
  : cls === 'beta'  ? 'text-amber-400'
  : cls === 'gamma' ? 'text-violet-400'
  :                   'text-blue-400';   // delta

  const sideTag = node.branchSide
    ? <span className={`text-[10px] uppercase tracking-wider px-1 rounded ${node.branchSide === 'left' ? 'bg-amber-500/15 text-amber-300' : 'bg-orange-500/15 text-orange-300'}`}>{node.branchSide}</span>
    : null;

  const gammaTag = node.gammaTerm
    ? <span className="text-xs text-gray-500">with <code className="text-violet-300">{node.gammaTerm}</code></span>
    : null;

  return (
    <div className={isFirst ? '' : 'mt-2'}>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-xs text-gray-600 font-mono w-7 text-right shrink-0">[{node.id}]</span>
        <span className={`text-xs font-mono ${ruleColor} shrink-0`}>
          {cls === 'root' ? 'root' : `${cls[0]} ${label}`}
        </span>
        {sideTag}
        {gammaTag}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {node.introduced.map((f, i) => (
            <KatexFormula
              key={i}
              tex={renderFolKatex(f)}
              className="text-gray-200"
            />
          ))}
        </div>
      </div>

      {node.status === 'closed' && node.closure && (
        <div className="ml-9 mt-1 text-xs text-rose-300 font-mono">
          ⊗ closed{' '}
          {node.closure.kind === 'bot' && <span className="text-gray-500">(⊥ on branch)</span>}
          {node.closure.kind === 'not-top' && <span className="text-gray-500">(¬⊤ on branch)</span>}
          {node.closure.kind === 'eq-self' && <span className="text-gray-500">(¬({node.closure.term} = {node.closure.term}))</span>}
          {node.closure.kind === 'pred-clash' && (
            <span className="text-gray-500">
              ({node.closure.positive} vs {node.closure.negative})
            </span>
          )}
        </div>
      )}

      {node.status === 'open' && node.countermodel && (
        <div className="ml-9 mt-1 text-xs text-amber-300 font-mono">
          ◯ open · domain {`{ ${node.countermodel.domain.join(', ') || '·'} }`}
          {node.countermodel.positiveFacts.length > 0 && (
            <span className="ml-2 text-emerald-300">+ {node.countermodel.positiveFacts.join(', ')}</span>
          )}
          {node.countermodel.negativeFacts.length > 0 && (
            <span className="ml-2 text-rose-300">¬ {node.countermodel.negativeFacts.join(', ')}</span>
          )}
          {node.countermodel.equalities.length > 0 && (
            <span className="ml-2 text-violet-300">= {node.countermodel.equalities.join(', ')}</span>
          )}
          {node.countermodel.inequalities.length > 0 && (
            <span className="ml-2 text-amber-300">≠ {node.countermodel.inequalities.join(', ')}</span>
          )}
        </div>
      )}

      {node.status === 'budget' && (
        <div className="ml-9 mt-1 text-xs text-amber-400 font-mono">
          ⌛ budget exhausted on this branch
        </div>
      )}

      {node.children.length > 0 && (
        <div className="ml-9 border-l border-gray-800 pl-3 mt-1">
          {node.children.map(c => (
            <TableauNodeView key={c.id} node={c} isFirst={false} />
          ))}
        </div>
      )}
    </div>
  );
}
