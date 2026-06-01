import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { renderUnicode } from '../logic/fol-render';
import type { FolFormula } from '../logic/fol-types';
import type { AristotelianFormula, CategoricalProposition } from '../logic/aristotelian-types';
import { FolVisualization } from '../logic/FolVisualization';
import { AristotelianRenderer } from '../logic/AristotelianRenderer';
import { FitchProofView } from '../logic/FitchProof';
import { BooleanVisualization } from '../logic/BooleanVisualization';
import { FiveStepView } from '../logic/FiveStepView';
import { fiveSteps } from '../logic/indian-render';
import { formalizationToDsl } from '../lib/argument-dsl';
import {
  clauseFormula,
  isDialogueAct,
  formalismLabel,
  FORMALISM_LAB_SLUG,
  WIRED_FORMALISMS,
  type ArgumentDetail,
  type ArgumentAttribution,
  type Formalization,
  type ArgumentClause,
  type Provenance,
} from '../lib/argument-types';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const WIRED = new Set<string>(WIRED_FORMALISMS);

const ROLE_LABEL: Record<string, string> = {
  premise: 'Premise',
  conclusion: 'Conclusion',
  lemma: 'Lemma',
  claim: 'Claim',
  composite: 'Dialogue',
};

const PROVENANCE_LABEL: Record<Provenance, string> = {
  auto: 'auto-generated',
  sanity_checked: 'sanity-checked',
  hand_written: 'hand-written',
};

// Auto = muted; sanity-checked = neutral; hand-written = strongest.
const PROVENANCE_TONE: Record<Provenance, string> = {
  auto: 'border-gray-800 text-gray-500',
  sanity_checked: 'border-gray-700 text-gray-400',
  hand_written: 'border-gray-600 text-gray-300',
};

// ── Formula rendering ─────────────────────────────────────────────────────

function renderProposition(p: CategoricalProposition): string {
  const t: Record<string, string> = {
    A: `All ${p.subject} are ${p.predicate}`,
    E: `No ${p.subject} are ${p.predicate}`,
    I: `Some ${p.subject} are ${p.predicate}`,
    O: `Some ${p.subject} are not ${p.predicate}`,
  };
  return t[p.form] ?? `${p.form}: ${p.subject} / ${p.predicate}`;
}

function renderFormula(f: FolFormula | AristotelianFormula | null): string | null {
  if (f === null) return null;
  if ('kind' in f && (f.kind === 'proposition' || f.kind === 'syllogism')) {
    const af = f as AristotelianFormula;
    return af.kind === 'proposition'
      ? renderProposition(af.proposition)
      : renderProposition(af.syllogism.conclusion);
  }
  return renderUnicode(f as FolFormula);
}

// ── Clause table (fol / nd / aristotelian) ────────────────────────────────

function ClauseRow({
  clause,
  formalization,
}: {
  clause: ArgumentClause;
  formalization: Formalization;
}) {
  const formula = clauseFormula(formalization, clause);
  const formal = renderFormula(formula);
  // Auto-render fallback: when there's no human verbalization yet, show the
  // rendered formula in the verbal column and mark it as auto-generated.
  const verbal = clause.verbalText ?? formal ?? '—';
  const isAuto = clause.verbalText === null;

  return (
    <div className="grid grid-cols-[7rem_1fr_1fr] gap-3 py-2 border-t border-gray-800 first:border-t-0">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 pt-0.5">
        {ROLE_LABEL[clause.role] ?? clause.role}
      </div>
      <div className="text-sm text-gray-300 leading-relaxed">
        {verbal}
        {isAuto && (
          <span className="ml-2 text-[10px] uppercase tracking-wider text-gray-600">auto</span>
        )}
      </div>
      <div className="text-sm font-mono text-gray-200">{formal ?? '—'}</div>
    </div>
  );
}

// ── Attribution ───────────────────────────────────────────────────────────

function AttributionLine({ a }: { a: ArgumentAttribution }) {
  const prov = a.provenance as Provenance;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
        <span className="uppercase tracking-wider text-[10px] text-gray-600">attributed to</span>
        <Link
          to="/philosophers/$slug"
          params={{ slug: a.philosopherSlug }}
          className="text-gray-300 hover:text-white transition-colors"
        >
          {a.philosopherName}
        </Link>
        {a.workTitle && a.workSlug && (
          <>
            <span className="text-gray-700">·</span>
            <Link
              to="/works/$slug"
              params={{ slug: a.workSlug }}
              className="text-gray-400 hover:text-gray-200 transition-colors italic"
            >
              {a.workTitle}
            </Link>
          </>
        )}
        <span
          className={`ml-auto text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${PROVENANCE_TONE[prov] ?? PROVENANCE_TONE.auto}`}
          title={a.note ?? undefined}
        >
          {PROVENANCE_LABEL[prov] ?? prov}
        </span>
      </div>
      {a.sourceText && (
        <blockquote className="text-xs text-gray-500 italic border-l-2 border-gray-800 pl-3 whitespace-pre-line">
          {a.sourceText}
        </blockquote>
      )}
    </div>
  );
}

// ── Dialogical moves ──────────────────────────────────────────────────────

function DialogicalView({ formalization }: { formalization: Extract<Formalization, { formalism: 'dialogical' }> }) {
  const { moves, summary } = formalization.ast.dialogue;
  return (
    <div className="space-y-2">
      {moves.map(m => {
        const known = isDialogueAct(m.act);
        return (
        <div key={m.move_no} className="grid grid-cols-[2rem_6rem_1fr] gap-3 py-1.5 border-t border-gray-800 first:border-t-0 text-sm">
          <div className="text-gray-600 tabular-nums">{m.move_no}</div>
          <div className="text-gray-400">
            <span className="text-gray-300">{m.speaker}</span>
            <span
              className={`block text-[10px] uppercase tracking-wider ${known ? 'text-gray-600' : 'text-amber-500'}`}
              title={known ? undefined : 'Unknown dialogue act — not in DIALOGUE_ACTS'}
              data-testid={known ? undefined : 'unknown-act'}
            >{m.act}</span>
          </div>
          <div className="text-gray-300 leading-relaxed">{m.content}</div>
        </div>
        );
      })}
      {summary && <p className="text-sm text-gray-400 italic pt-2 border-t border-gray-800">{summary}</p>}
    </div>
  );
}

// ── Generic fallback (not-yet-wired formalisms) ───────────────────────────

// For the 11 formalisms without a bespoke clause/move view yet, show the AST
// verbatim (it's exactly what the matching Logic Lab parses) plus a deep link
// into that system. Bespoke per-formalism rendering is a fast-follow.
function GenericFormalizationView({
  formalization,
}: {
  formalization: Extract<Formalization, { ast: Record<string, unknown> }>;
}) {
  const labSlug = FORMALISM_LAB_SLUG[formalization.formalism];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-wider text-gray-600">
          {formalismLabel(formalization.formalism)} · AST
        </span>
        {labSlug && (
          <Link
            to="/logic/$system"
            params={{ system: labSlug }}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Open in Logic Lab →
          </Link>
        )}
      </div>
      <pre className="text-xs text-gray-300 font-mono bg-gray-950/60 border border-gray-800 rounded p-3 overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(formalization.ast, null, 2)}
      </pre>
    </div>
  );
}

// ── Visualization + DSL (fol / nd / aristotelian) ──────────────────────────

function VizLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[10px] uppercase tracking-wider text-gray-600">{children}</span>;
}

// The rendered visualization for a formalization, reusing the Logic Lab
// renderers fed the argument's stored AST: FOL → semantic tableau / truth table
// (+ validity verdict), nd → Fitch proof, aristotelian → Venn diagram.
function FormalizationVisual({ formalization }: { formalization: Formalization }) {
  switch (formalization.formalism) {
    case 'fol':
      return (
        <div className="space-y-2">
          <VizLabel>Visualization</VizLabel>
          <FolVisualization formula={formalization.ast.formula} />
        </div>
      );
    case 'nd':
      return formalization.ast.proof ? (
        <div className="space-y-2">
          <VizLabel>Visualization · Fitch proof</VizLabel>
          <FitchProofView proof={formalization.ast.proof} />
        </div>
      ) : null;
    case 'aristotelian':
      return (
        <div className="space-y-2">
          <VizLabel>Visualization · Venn diagram</VizLabel>
          <div className="flex justify-center rounded-lg border border-gray-800 bg-gray-950/40 p-4">
            <AristotelianRenderer formula={formalization.ast.formula} className="max-h-[320px]" />
          </div>
        </div>
      );
    case 'boolean':
      return (
        <div className="space-y-2">
          <VizLabel>Visualization · Karnaugh map</VizLabel>
          <BooleanVisualization formula={formalization.ast.formula} />
        </div>
      );
    case 'indian':
      return (
        <div className="space-y-2">
          <VizLabel>Visualization · five-membered inference</VizLabel>
          <FiveStepView steps={fiveSteps(formalization.ast.inference)} />
        </div>
      );
    default:
      return null;
  }
}

// Formalisms whose only rendering is the FormalizationVisual above — no clause
// table, and no raw-AST generic fallback.
const VISUAL_ONLY_FORMALISMS = new Set<string>(['boolean', 'indian']);

// The argument's formula as Logic Lab DSL — copyable, and a deep link that
// opens the matching lab pre-loaded with it (?dsl=). Null for formalisms
// without a wired serializer (those keep the generic AST view).
function FormalizationDsl({ formalization }: { formalization: Formalization }) {
  const dsl = formalizationToDsl(formalization);
  if (dsl === null) return null;
  const labSlug = FORMALISM_LAB_SLUG[formalization.formalism];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <VizLabel>DSL · {formalismLabel(formalization.formalism)}</VizLabel>
        {labSlug && (
          <Link
            to="/logic/$system"
            params={{ system: labSlug }}
            search={{ dsl }}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Open in Logic Lab →
          </Link>
        )}
      </div>
      <pre className="text-xs text-gray-200 font-mono bg-gray-950/60 border border-gray-800 rounded p-3 overflow-x-auto whitespace-pre-wrap">
        {dsl}
      </pre>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────

export function ArgumentCard({ argumentId }: { argumentId: string }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [showContext, setShowContext] = useState(false);

  const { data, isLoading, isError } = useQuery<ArgumentDetail>({
    queryKey: ['argument', argumentId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/arguments/${argumentId}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json() as Promise<ArgumentDetail>;
    },
  });

  if (isLoading) {
    return <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-5 h-32 animate-pulse" />;
  }
  if (isError || !data) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-5 text-sm text-gray-500">
        Failed to load argument.
      </div>
    );
  }

  const active = data.formalizations[activeIdx] ?? data.formalizations[0];

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-5 space-y-4">
      {/* Intent */}
      <p className="text-sm text-gray-300 leading-relaxed">{data.intent}</p>

      {/* Attributions */}
      {data.attributions.length > 0 && (
        <div className="space-y-1">
          {data.attributions.map(a => (
            <AttributionLine key={a.id} a={a} />
          ))}
        </div>
      )}

      {/* Formalization switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        {data.formalizations.map((f, i) => (
          <button
            key={f.id}
            onClick={() => setActiveIdx(i)}
            className={`text-xs px-2.5 py-1 rounded border transition-colors ${
              i === activeIdx
                ? 'border-gray-600 bg-gray-800 text-gray-100'
                : 'border-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            {formalismLabel(f.formalism)}
            {f.isPrimary && data.formalizations.length > 1 && (
              <span className="ml-1.5 text-[10px] text-gray-600">primary</span>
            )}
          </button>
        ))}
      </div>

      {/* Standard form */}
      {active.formalism === 'dialogical' ? (
        <DialogicalView formalization={active} />
      ) : WIRED.has(active.formalism) ? (
        <div>
          <div className="grid grid-cols-[7rem_1fr_1fr] gap-3 pb-1 text-[10px] uppercase tracking-wider text-gray-600">
            <div />
            <div>Verbal</div>
            <div>Symbolic</div>
          </div>
          {data.clauses.map(c => (
            <ClauseRow key={c.id} clause={c} formalization={active} />
          ))}
        </div>
      ) : VISUAL_ONLY_FORMALISMS.has(active.formalism) ? null : (
        <GenericFormalizationView
          formalization={active as Extract<Formalization, { ast: Record<string, unknown> }>}
        />
      )}

      {/* Rendered visualization + copyable DSL (with lab prefill) */}
      <FormalizationVisual formalization={active} />
      <FormalizationDsl formalization={active} />

      {/* Context (collapsible) */}
      <button
        onClick={() => setShowContext(v => !v)}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        {showContext ? '− Hide context' : '+ Source, notes & assessments'}
      </button>

      {showContext && (
        <div className="space-y-4 text-sm border-t border-gray-800 pt-4">
          {data.source.excerpt && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">
                Source
                {data.source.file && (
                  <span className="ml-2 text-gray-700 normal-case tracking-normal">
                    {data.source.file}
                    {data.source.startLine !== null &&
                      `:${data.source.startLine}–${data.source.endLine}`}
                  </span>
                )}
              </div>
              <p className="text-gray-400 italic whitespace-pre-line">{data.source.excerpt}</p>
            </div>
          )}

          {data.assessments.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">
                Alternative formalisms considered
              </div>
              <ul className="space-y-1.5">
                {data.assessments.map(a => (
                  <li key={a.formalism} className="text-gray-400">
                    <span className="text-gray-300">{formalismLabel(a.formalism)}</span>
                    <span className="text-gray-600"> · fit {a.fitScore.toFixed(2)}</span>
                    <span className="block text-gray-500">{a.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.reviewerNotes.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Reviewer notes</div>
              <ul className="space-y-1 list-disc list-inside text-gray-400">
                {data.reviewerNotes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          {data.extractorNote && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Extractor note</div>
              <p className="text-gray-400">{data.extractorNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
