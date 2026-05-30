import { useMemo, useState } from 'react';
import { createRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { rootRoute } from './__root';
import { formalismLabel, type ArgumentSummary } from '../lib/argument-types';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const argumentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/arguments',
  component: ArgumentsPage,
});

// ── Card ──────────────────────────────────────────────────────────────────────

function ArgumentSummaryCard({ a }: { a: ArgumentSummary }) {
  return (
    <Link
      to="/arguments/$"
      params={{ _splat: a.id }}
      className="block rounded-xl border border-gray-800 bg-gray-900/60 p-5 hover:border-gray-600 hover:bg-gray-900 transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="flex-1 min-w-0 text-sm text-gray-300 group-hover:text-gray-100 leading-relaxed line-clamp-3">
          {a.intent}
        </p>
        <span className="shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-gray-700 text-gray-400 mt-0.5">
          {formalismLabel(a.primaryFormalism)}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
        {a.workTitle && a.workSlug ? (
          <span className="italic text-gray-500">{a.workTitle}</span>
        ) : (
          <span className="text-gray-700 italic">unlinked source</span>
        )}
        <span className="text-gray-700">·</span>
        <span>{a.clauseCount} clause{a.clauseCount === 1 ? '' : 's'}</span>
      </div>
    </Link>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────────

function ArgumentsPage() {
  const { data, isLoading, isError } = useQuery<ArgumentSummary[]>({
    queryKey: ['arguments'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/arguments`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json() as Promise<ArgumentSummary[]>;
    },
  });

  const [formalism, setFormalism] = useState<string>('all');
  const [q, setQ] = useState('');

  const items = data ?? [];
  const formalisms = useMemo(
    () => Array.from(new Set(items.map(a => a.primaryFormalism))).sort(),
    [items],
  );
  const filtered = items.filter(a => {
    if (formalism !== 'all' && a.primaryFormalism !== formalism) return false;
    if (q && !a.intent.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Arguments</h1>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-xl">
              Formalized arguments extracted from the corpus — each rendered in standard
              form under one or more logical systems, with its source passage and attribution.
            </p>
          </div>
          <Link
            to="/arguments/new"
            className="shrink-0 text-sm px-3 py-1.5 rounded-lg border border-gray-700 text-gray-200 hover:border-gray-500 hover:text-white transition-colors"
          >
            + New argument
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search intent…"
            className="flex-1 min-w-[12rem] bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-gray-600 focus:outline-none"
          />
          <select
            value={formalism}
            onChange={e => setFormalism(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:border-gray-600 focus:outline-none"
          >
            <option value="all">All formalisms</option>
            {formalisms.map(f => (
              <option key={f} value={f}>{formalismLabel(f)}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/50 h-28 animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-gray-500 text-sm py-12 text-center">Failed to load arguments.</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-600 text-sm py-12 text-center">
            {items.length === 0 ? 'No arguments yet.' : 'No arguments match the filters.'}
          </p>
        ) : (
          <>
            <p className="text-xs text-gray-600 mb-3">{filtered.length} of {items.length}</p>
            <div className="grid grid-cols-1 gap-4">
              {filtered.map(a => <ArgumentSummaryCard key={a.id} a={a} />)}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
