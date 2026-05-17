import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { renderUnicode } from '../logic/fol-render';
import type { FolFormula } from '../logic/fol-types';
import type { AristotelianFormula, CategoricalProposition } from '../logic/aristotelian-types';
import {
  clauseFormula,
  type ArgumentDetail,
  type ArgumentAttribution,
  type Formalization,
  type ArgumentClause,
  type Provenance,
} from '../lib/argument-types';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const FORMALISM_LABEL: Record<string, string> = {
  fol: 'First-order logic',
  nd: 'Natural deduction',
  aristotelian: 'Aristotelian',
  dialogical: 'Dialogical',
};

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
      {moves.map(m => (
        <div key={m.move_no} className="grid grid-cols-[2rem_6rem_1fr] gap-3 py-1.5 border-t border-gray-800 first:border-t-0 text-sm">
          <div className="text-gray-600 tabular-nums">{m.move_no}</div>
          <div className="text-gray-400">
            <span className="text-gray-300">{m.speaker}</span>
            <span className="block text-[10px] uppercase tracking-wider text-gray-600">{m.act}</span>
          </div>
          <div className="text-gray-300 leading-relaxed">{m.content}</div>
        </div>
      ))}
      {summary && <p className="text-sm text-gray-400 italic pt-2 border-t border-gray-800">{summary}</p>}
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
            {FORMALISM_LABEL[f.formalism] ?? f.formalism}
            {f.isPrimary && data.formalizations.length > 1 && (
              <span className="ml-1.5 text-[10px] text-gray-600">primary</span>
            )}
          </button>
        ))}
      </div>

      {/* Standard form */}
      {active.formalism === 'dialogical' ? (
        <DialogicalView formalization={active} />
      ) : (
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
      )}

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
                    <span className="text-gray-300">{FORMALISM_LABEL[a.formalism] ?? a.formalism}</span>
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
