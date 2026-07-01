import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ALL_FORMALISMS,
  formalismLabel,
  type ArgumentDetail,
  type Formalism,
  type Provenance,
  type WriteArgumentInput,
} from '../lib/argument-types';
import { apiBaseUrl } from '../lib/api';

const API = apiBaseUrl;

const CLAUSE_ROLES = ['premise', 'conclusion', 'claim', 'lemma', 'composite'];
const PROVENANCES: Provenance[] = ['hand_written', 'sanity_checked', 'auto'];

// ── Form state (AST kept as editable text; parsed on submit) ────────────────

type FormFormalization = {
  formalism: Formalism;
  isPrimary: boolean;
  fitScore: string;
  reason: string;
  distortionRisk: string;
  astText: string;
};
type FormClause = { role: string; verbalText: string; sourceExcerpt: string };
type FormAssessment = { formalism: string; fitScore: string; reason: string; distortionRisk: string };
type FormAttribution = {
  philosopherSlug: string;
  workSlug: string;
  formalismRef: string;
  provenance: Provenance;
  sourceText: string;
  note: string;
};
type FormState = {
  intent: string;
  workSlug: string;
  sourceFile: string;
  sourceStartLine: string;
  sourceEndLine: string;
  sourceExcerpt: string;
  extractorNote: string;
  clauses: FormClause[];
  formalizations: FormFormalization[];
  assessments: FormAssessment[];
  reviewerNotes: string[];
  attributions: FormAttribution[];
};

const emptyForm = (): FormState => ({
  intent: '',
  workSlug: '',
  sourceFile: '',
  sourceStartLine: '',
  sourceEndLine: '',
  sourceExcerpt: '',
  extractorNote: '',
  clauses: [{ role: 'claim', verbalText: '', sourceExcerpt: '' }],
  formalizations: [
    { formalism: 'fol', isPrimary: true, fitScore: '', reason: '', distortionRisk: '', astText: '{\n  "formula": {}\n}' },
  ],
  assessments: [],
  reviewerNotes: [],
  attributions: [],
});

function detailToForm(d: ArgumentDetail): FormState {
  const formalismOfId = (fid: string | null) =>
    d.formalizations.find(f => f.id === fid)?.formalism ?? '';
  return {
    intent: d.intent,
    workSlug: d.workSlug ?? '',
    sourceFile: d.source.file ?? '',
    sourceStartLine: d.source.startLine?.toString() ?? '',
    sourceEndLine: d.source.endLine?.toString() ?? '',
    sourceExcerpt: d.source.excerpt ?? '',
    extractorNote: d.extractorNote ?? '',
    clauses: d.clauses.map(c => ({
      role: c.role,
      verbalText: c.verbalText ?? '',
      sourceExcerpt: c.sourceExcerpt ?? '',
    })),
    formalizations: d.formalizations.map(f => ({
      formalism: f.formalism as Formalism,
      isPrimary: f.isPrimary,
      fitScore: f.fitScore?.toString() ?? '',
      reason: f.reason ?? '',
      distortionRisk: f.distortionRisk ?? '',
      astText: JSON.stringify(f.ast, null, 2),
    })),
    assessments: d.assessments.map(a => ({
      formalism: a.formalism,
      fitScore: a.fitScore.toString(),
      reason: a.reason,
      distortionRisk: a.distortionRisk ?? '',
    })),
    reviewerNotes: [...d.reviewerNotes],
    attributions: d.attributions.map(a => ({
      philosopherSlug: a.philosopherSlug,
      workSlug: a.workSlug ?? '',
      formalismRef: formalismOfId(a.formalizationId),
      provenance: a.provenance,
      sourceText: a.sourceText ?? '',
      note: a.note ?? '',
    })),
  };
}

const nullIfBlank = (s: string) => (s.trim() === '' ? null : s);
const numOrNull = (s: string) => (s.trim() === '' ? null : Number(s));

// Build the request body. Throws with a readable message on bad AST JSON.
function formToInput(f: FormState): WriteArgumentInput {
  const formalizations = f.formalizations.map((fz, i) => {
    let ast: unknown;
    try {
      ast = JSON.parse(fz.astText);
    } catch (e) {
      throw new Error(`Formalization ${i + 1} (${formalismLabel(fz.formalism)}): AST is not valid JSON`);
    }
    return {
      formalism: fz.formalism,
      isPrimary: fz.isPrimary,
      fitScore: numOrNull(fz.fitScore),
      reason: nullIfBlank(fz.reason),
      distortionRisk: nullIfBlank(fz.distortionRisk),
      ast,
    };
  });
  return {
    workSlug: nullIfBlank(f.workSlug),
    sourceFile: nullIfBlank(f.sourceFile),
    sourceStartLine: numOrNull(f.sourceStartLine),
    sourceEndLine: numOrNull(f.sourceEndLine),
    sourceExcerpt: nullIfBlank(f.sourceExcerpt),
    intent: f.intent,
    extractorNote: nullIfBlank(f.extractorNote),
    clauses: f.clauses.map((c, i) => ({
      role: c.role,
      position: i,
      verbalText: nullIfBlank(c.verbalText),
      sourceExcerpt: nullIfBlank(c.sourceExcerpt),
    })),
    formalizations,
    assessments: f.assessments.map(a => ({
      formalism: a.formalism,
      fitScore: Number(a.fitScore) || 0,
      reason: a.reason,
      distortionRisk: nullIfBlank(a.distortionRisk),
    })),
    reviewerNotes: f.reviewerNotes.filter(n => n.trim() !== ''),
    attributions: f.attributions.map(a => ({
      philosopherSlug: a.philosopherSlug,
      workSlug: nullIfBlank(a.workSlug),
      formalismRef: nullIfBlank(a.formalismRef),
      provenance: a.provenance,
      sourceText: nullIfBlank(a.sourceText),
      note: nullIfBlank(a.note),
    })),
  };
}

// ── Small UI atoms ──────────────────────────────────────────────────────────

const inputCls =
  'w-full bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-gray-600 focus:outline-none';
const labelCls = 'block text-[10px] uppercase tracking-wider text-gray-500 mb-1';
const sectionCls = 'rounded-lg border border-gray-800 bg-gray-900/40 p-4 space-y-3';

function SectionHeader({ title, onAdd }: { title: string; onAdd?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      {onAdd && (
        <button type="button" onClick={onAdd} className="text-xs text-gray-400 hover:text-white">+ add</button>
      )}
    </div>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-xs text-gray-600 hover:text-red-400 shrink-0">remove</button>
  );
}

// ── Editor ──────────────────────────────────────────────────────────────────

type Props = {
  mode: 'create' | 'edit';
  id?: string;
  onSaved: (id: string) => void;
  onCancel: () => void;
};

export function ArgumentEditor({ mode, id, onSaved, onCancel }: Props) {
  const queryClient = useQueryClient();

  const philosophers = useQuery<{ slug: string; name: string }[]>({
    queryKey: ['philosophers'],
    queryFn: async () => (await fetch(`${API}/api/philosophers`)).json(),
  });
  const works = useQuery<{ slug: string; title: string }[]>({
    queryKey: ['works'],
    queryFn: async () => (await fetch(`${API}/api/works`)).json(),
  });

  // In edit mode, seed the form from the existing detail (reuses cache).
  const detail = useQuery<ArgumentDetail>({
    queryKey: ['argument', id],
    queryFn: async () => (await fetch(`${API}/api/arguments/${id}`)).json(),
    enabled: mode === 'edit' && !!id,
  });

  const [form, setForm] = useState<FormState | null>(mode === 'create' ? emptyForm() : null);
  // Once the detail loads, seed the form (only once).
  const seeded = form !== null;
  if (mode === 'edit' && detail.data && !seeded) {
    setForm(detailToForm(detail.data));
  }

  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (body: WriteArgumentInput) => {
      const url = mode === 'create' ? `${API}/api/arguments` : `${API}/api/arguments/${id}`;
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(e?.error ?? `Request failed (${res.status})`);
      }
      return res.json() as Promise<ArgumentDetail>;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['arguments'] });
      queryClient.invalidateQueries({ queryKey: ['argument', data.id] });
      onSaved(data.id);
    },
    onError: (e: Error) => setError(e.message),
  });

  const update = (patch: Partial<FormState>) => setForm(f => (f ? { ...f, ...patch } : f));

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form) return;
    if (form.intent.trim() === '') return setError('Intent is required.');
    if (form.formalizations.length === 0) return setError('At least one formalization is required.');
    if (form.formalizations.filter(fz => fz.isPrimary).length !== 1)
      return setError('Exactly one formalization must be marked primary.');
    if (form.attributions.some(a => a.philosopherSlug === ''))
      return setError('Each attribution needs a philosopher.');
    let body: WriteArgumentInput;
    try {
      body = formToInput(form);
    } catch (err) {
      return setError((err as Error).message);
    }
    save.mutate(body);
  }

  const philOptions = useMemo(() => philosophers.data ?? [], [philosophers.data]);
  const workOptions = useMemo(() => works.data ?? [], [works.data]);

  if (mode === 'edit' && !form) {
    return <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6 h-40 animate-pulse" />;
  }
  if (!form) return null;

  const setPrimary = (idx: number) =>
    update({ formalizations: form.formalizations.map((fz, i) => ({ ...fz, isPrimary: i === idx })) });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-100">
        {mode === 'create' ? 'New argument' : 'Edit argument'}
      </h2>

      {/* Core */}
      <div className={sectionCls}>
        <div>
          <label className={labelCls}>Intent *</label>
          <textarea
            className={inputCls}
            rows={2}
            value={form.intent}
            onChange={e => update({ intent: e.target.value })}
            placeholder="What this argument captures…"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Work</label>
            <select className={inputCls} value={form.workSlug} onChange={e => update({ workSlug: e.target.value })}>
              <option value="">— none —</option>
              {workOptions.map(w => <option key={w.slug} value={w.slug}>{w.title}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Source file</label>
            <input className={inputCls} value={form.sourceFile} onChange={e => update({ sourceFile: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Start line</label>
            <input className={inputCls} inputMode="numeric" value={form.sourceStartLine} onChange={e => update({ sourceStartLine: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>End line</label>
            <input className={inputCls} inputMode="numeric" value={form.sourceEndLine} onChange={e => update({ sourceEndLine: e.target.value })} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Source excerpt</label>
          <textarea className={inputCls} rows={2} value={form.sourceExcerpt} onChange={e => update({ sourceExcerpt: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Extractor note</label>
          <textarea className={inputCls} rows={2} value={form.extractorNote} onChange={e => update({ extractorNote: e.target.value })} />
        </div>
      </div>

      {/* Formalizations */}
      <div className={sectionCls}>
        <SectionHeader
          title="Formalizations"
          onAdd={() => update({ formalizations: [...form.formalizations, { formalism: 'fol', isPrimary: false, fitScore: '', reason: '', distortionRisk: '', astText: '{}' }] })}
        />
        {form.formalizations.map((fz, i) => (
          <div key={i} className="rounded border border-gray-800 p-3 space-y-2">
            <div className="flex items-center gap-3">
              <select
                className={inputCls + ' max-w-[14rem]'}
                value={fz.formalism}
                onChange={e => update({ formalizations: form.formalizations.map((x, j) => j === i ? { ...x, formalism: e.target.value as Formalism } : x) })}
              >
                {ALL_FORMALISMS.map(f => <option key={f} value={f}>{formalismLabel(f)}</option>)}
              </select>
              <label className="flex items-center gap-1.5 text-xs text-gray-400">
                <input type="radio" name="primary" checked={fz.isPrimary} onChange={() => setPrimary(i)} />
                primary
              </label>
              {form.formalizations.length > 1 && (
                <RemoveBtn onClick={() => update({ formalizations: form.formalizations.filter((_, j) => j !== i) })} />
              )}
            </div>
            <div>
              <label className={labelCls}>AST (JSON)</label>
              <textarea
                className={inputCls + ' font-mono'}
                rows={6}
                value={fz.astText}
                onChange={e => update({ formalizations: form.formalizations.map((x, j) => j === i ? { ...x, astText: e.target.value } : x) })}
              />
            </div>
            <input
              className={inputCls}
              placeholder="reason (optional)"
              value={fz.reason}
              onChange={e => update({ formalizations: form.formalizations.map((x, j) => j === i ? { ...x, reason: e.target.value } : x) })}
            />
          </div>
        ))}
      </div>

      {/* Clauses */}
      <div className={sectionCls}>
        <SectionHeader title="Clauses (standard form)" onAdd={() => update({ clauses: [...form.clauses, { role: 'premise', verbalText: '', sourceExcerpt: '' }] })} />
        {form.clauses.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-6 tabular-nums">{i}</span>
            <select className={inputCls + ' max-w-[8rem]'} value={c.role} onChange={e => update({ clauses: form.clauses.map((x, j) => j === i ? { ...x, role: e.target.value } : x) })}>
              {CLAUSE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <input className={inputCls} placeholder="verbal text (optional — auto-rendered if blank)" value={c.verbalText} onChange={e => update({ clauses: form.clauses.map((x, j) => j === i ? { ...x, verbalText: e.target.value } : x) })} />
            {form.clauses.length > 1 && <RemoveBtn onClick={() => update({ clauses: form.clauses.filter((_, j) => j !== i) })} />}
          </div>
        ))}
      </div>

      {/* Attributions */}
      <div className={sectionCls}>
        <SectionHeader title="Attributions" onAdd={() => update({ attributions: [...form.attributions, { philosopherSlug: '', workSlug: form.workSlug, formalismRef: '', provenance: 'hand_written', sourceText: '', note: '' }] })} />
        {form.attributions.length === 0 && <p className="text-xs text-gray-600">No attributions.</p>}
        {form.attributions.map((a, i) => (
          <div key={i} className="rounded border border-gray-800 p-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <select className={inputCls + ' max-w-[14rem]'} value={a.philosopherSlug} onChange={e => update({ attributions: form.attributions.map((x, j) => j === i ? { ...x, philosopherSlug: e.target.value } : x) })}>
                <option value="">— philosopher —</option>
                {philOptions.map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}
              </select>
              <select className={inputCls + ' max-w-[10rem]'} value={a.provenance} onChange={e => update({ attributions: form.attributions.map((x, j) => j === i ? { ...x, provenance: e.target.value as Provenance } : x) })}>
                {PROVENANCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select className={inputCls + ' max-w-[12rem]'} value={a.formalismRef} onChange={e => update({ attributions: form.attributions.map((x, j) => j === i ? { ...x, formalismRef: e.target.value } : x) })}>
                <option value="">— no formalization link —</option>
                {form.formalizations.map((fz, k) => <option key={k} value={fz.formalism}>{formalismLabel(fz.formalism)}</option>)}
              </select>
              <RemoveBtn onClick={() => update({ attributions: form.attributions.filter((_, j) => j !== i) })} />
            </div>
            <input className={inputCls} placeholder="source text (optional)" value={a.sourceText} onChange={e => update({ attributions: form.attributions.map((x, j) => j === i ? { ...x, sourceText: e.target.value } : x) })} />
          </div>
        ))}
      </div>

      {/* Assessments */}
      <div className={sectionCls}>
        <SectionHeader title="Alternative-formalism assessments" onAdd={() => update({ assessments: [...form.assessments, { formalism: 'nd', fitScore: '0.0', reason: '', distortionRisk: '' }] })} />
        {form.assessments.length === 0 && <p className="text-xs text-gray-600">None.</p>}
        {form.assessments.map((a, i) => (
          <div key={i} className="flex items-center gap-2">
            <select className={inputCls + ' max-w-[12rem]'} value={a.formalism} onChange={e => update({ assessments: form.assessments.map((x, j) => j === i ? { ...x, formalism: e.target.value } : x) })}>
              {ALL_FORMALISMS.map(f => <option key={f} value={f}>{formalismLabel(f)}</option>)}
            </select>
            <input className={inputCls + ' max-w-[6rem]'} placeholder="fit" inputMode="decimal" value={a.fitScore} onChange={e => update({ assessments: form.assessments.map((x, j) => j === i ? { ...x, fitScore: e.target.value } : x) })} />
            <input className={inputCls} placeholder="reason" value={a.reason} onChange={e => update({ assessments: form.assessments.map((x, j) => j === i ? { ...x, reason: e.target.value } : x) })} />
            <RemoveBtn onClick={() => update({ assessments: form.assessments.filter((_, j) => j !== i) })} />
          </div>
        ))}
      </div>

      {/* Reviewer notes */}
      <div className={sectionCls}>
        <SectionHeader title="Reviewer notes" onAdd={() => update({ reviewerNotes: [...form.reviewerNotes, ''] })} />
        {form.reviewerNotes.length === 0 && <p className="text-xs text-gray-600">None.</p>}
        {form.reviewerNotes.map((n, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={inputCls} value={n} onChange={e => update({ reviewerNotes: form.reviewerNotes.map((x, j) => j === i ? e.target.value : x) })} />
            <RemoveBtn onClick={() => update({ reviewerNotes: form.reviewerNotes.filter((_, j) => j !== i) })} />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400 border border-red-900/50 bg-red-950/30 rounded px-3 py-2">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={save.isPending}
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-900 text-sm font-medium hover:bg-white disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : mode === 'create' ? 'Create argument' : 'Save changes'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm hover:border-gray-500">
          Cancel
        </button>
      </div>
    </form>
  );
}
