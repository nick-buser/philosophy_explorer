import { createRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { rootRoute } from './__root';

// ── Types ─────────────────────────────────────────────────────────────────────

type Philosopher = {
  id: string; slug: string; name: string; alsoKnownAs: string | null;
  bornYear: number | null; bornCertainty: string;
  diedYear: number | null; diedCertainty: string;
  nationality: string | null; bioShort: string | null;
};

type Work = {
  id: string; slug: string; title: string; originalTitle: string | null;
  workType: string; composedYear: number | null; composedCertainty: string;
  originalLanguage: string | null; descriptionShort: string | null;
  philosopherId: string; philosopherName: string; philosopherSlug: string;
};

type School = {
  id: string; slug: string; name: string;
  periodStartYear: number | null; periodEndYear: number | null;
  periodCertainty: string; description: string | null;
};

type Tab = 'philosophers' | 'works' | 'schools';

// ── Route ─────────────────────────────────────────────────────────────────────

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: BrowsePage,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
}

function formatYear(year: number | null, certainty: string, end?: number | null): string {
  if (year === null) return '';
  const abs = Math.abs(year);
  const era = year < 0 ? ' BCE' : '';
  const pre = certainty === 'circa' ? 'c. ' : certainty === 'flourished' ? 'fl. ' : '';
  if (certainty === 'range' && end) {
    const absEnd = Math.abs(end);
    const eraEnd = end < 0 ? ' BCE' : '';
    return `${pre}${abs}${era}–${absEnd}${eraEnd}`;
  }
  return `${pre}${abs}${era}`;
}

function lifespan(p: Philosopher): string {
  if (!p.bornYear && !p.diedYear) return '';
  const b = formatYear(p.bornYear, p.bornCertainty);
  const d = p.diedYear ? formatYear(p.diedYear, p.diedCertainty) : 'present';
  return b ? `${b} – ${d}` : '';
}

function period(s: School): string {
  if (!s.periodStartYear) return '';
  return formatYear(s.periodStartYear, s.periodCertainty, s.periodEndYear);
}

function workDate(w: Work): string {
  if (!w.composedYear) return '';
  return formatYear(w.composedYear, w.composedCertainty);
}

// ── Shared ────────────────────────────────────────────────────────────────────

const WORK_TYPE_COLOR: Record<string, string> = {
  treatise:   'bg-blue-900/40 text-blue-300',
  dialogue:   'bg-violet-900/40 text-violet-300',
  essay:      'bg-teal-900/40 text-teal-300',
  collection: 'bg-amber-900/40 text-amber-300',
  fragment:   'bg-gray-800 text-gray-400',
  poem:       'bg-pink-900/40 text-pink-300',
  letter:     'bg-orange-900/40 text-orange-300',
  other:      'bg-gray-800 text-gray-400',
};

function Badge({ label, className = '' }: { label: string; className?: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${className}`}>{label}</span>
  );
}

// ── Cards ─────────────────────────────────────────────────────────────────────

function PhilosopherCard({ p }: { p: Philosopher }) {
  const span = lifespan(p);
  return (
    <Link
      to="/philosophers/$slug"
      params={{ slug: p.slug }}
      className="block rounded-xl border border-gray-800 bg-gray-900/60 p-5 hover:border-gray-600 hover:bg-gray-900 transition-all group"
    >
      <p className="font-semibold text-gray-100 group-hover:text-white leading-snug">
        {p.name}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {[span, p.nationality].filter(Boolean).join(' · ')}
      </p>
      {p.bioShort && (
        <p className="mt-3 text-sm text-gray-400 leading-relaxed line-clamp-3">
          {p.bioShort}
        </p>
      )}
    </Link>
  );
}

function WorkCard({ w }: { w: Work }) {
  const date = workDate(w);
  const colorClass = WORK_TYPE_COLOR[w.workType] ?? WORK_TYPE_COLOR.other;
  return (
    <Link
      to="/works/$slug"
      params={{ slug: w.slug }}
      className="block rounded-xl border border-gray-800 bg-gray-900/60 p-5 hover:border-gray-600 hover:bg-gray-900 transition-all group"
    >
      <p className="font-semibold text-gray-100 group-hover:text-white leading-snug">
        {w.title}
      </p>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <Link
          to="/philosophers/$slug"
          params={{ slug: w.philosopherSlug }}
          onClick={e => e.stopPropagation()}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {w.philosopherName}
        </Link>
        {date && <span className="text-xs text-gray-600">{date}</span>}
        <Badge label={w.workType} className={colorClass} />
      </div>
      {w.descriptionShort && (
        <p className="mt-3 text-sm text-gray-400 leading-relaxed line-clamp-3">
          {w.descriptionShort}
        </p>
      )}
    </Link>
  );
}

function SchoolCard({ s }: { s: School }) {
  const per = period(s);
  return (
    <Link
      to="/schools/$slug"
      params={{ slug: s.slug }}
      className="block rounded-xl border border-gray-800 bg-gray-900/60 p-5 hover:border-gray-600 hover:bg-gray-900 transition-all group"
    >
      <p className="font-semibold text-gray-100 group-hover:text-white leading-snug">
        {s.name}
      </p>
      {per && <p className="text-xs text-gray-500 mt-1">{per}</p>}
      {s.description && (
        <p className="mt-3 text-sm text-gray-400 leading-relaxed line-clamp-3">
          {s.description}
        </p>
      )}
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function BrowsePage() {
  const [tab, setTab] = useState<Tab>('philosophers');
  const [query, setQuery] = useState('');

  const { data: philosophers = [], isLoading: loadingP } = useQuery<Philosopher[]>({
    queryKey: ['philosophers'],
    queryFn: () => fetchJson('/api/philosophers'),
  });

  const { data: works = [], isLoading: loadingW } = useQuery<Work[]>({
    queryKey: ['works'],
    queryFn: () => fetchJson('/api/works'),
  });

  const { data: schools = [], isLoading: loadingS } = useQuery<School[]>({
    queryKey: ['schools'],
    queryFn: () => fetchJson('/api/schools'),
  });

  const q = query.toLowerCase();

  const filteredPhilosophers = useMemo(
    () => !q ? philosophers : philosophers.filter(p =>
      (p.name ?? '').toLowerCase().includes(q) ||
      (p.nationality ?? '').toLowerCase().includes(q) ||
      (p.bioShort ?? '').toLowerCase().includes(q) ||
      (p.alsoKnownAs ?? '').toLowerCase().includes(q)
    ),
    [philosophers, q],
  );

  const filteredWorks = useMemo(
    () => !q ? works : works.filter(w =>
      (w.title ?? '').toLowerCase().includes(q) ||
      (w.originalTitle ?? '').toLowerCase().includes(q) ||
      (w.philosopherName ?? '').toLowerCase().includes(q) ||
      (w.descriptionShort ?? '').toLowerCase().includes(q) ||
      (w.workType ?? '').toLowerCase().includes(q)
    ),
    [works, q],
  );

  const filteredSchools = useMemo(
    () => !q ? schools : schools.filter(s =>
      (s.name ?? '').toLowerCase().includes(q) ||
      (s.description ?? '').toLowerCase().includes(q)
    ),
    [schools, q],
  );

  const isLoading = loadingP || loadingW || loadingS;

  const counts: Record<Tab, number> = {
    philosophers: filteredPhilosophers.length,
    works:        filteredWorks.length,
    schools:      filteredSchools.length,
  };

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-100">Philosophy Explorer</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {philosophers.length} philosophers · {works.length} works · {schools.length} schools
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Search ${tab}…`}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-gray-800">
          {(['philosophers', 'works', 'schools'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm capitalize rounded-t transition-colors ${
                tab === t
                  ? 'text-gray-100 border-b-2 border-gray-100 -mb-px'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t}
              <span className={`ml-2 text-xs ${tab === t ? 'text-gray-400' : 'text-gray-700'}`}>
                {counts[t]}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/60 p-5 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-800 rounded w-1/3 mb-4" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-800 rounded" />
                  <div className="h-3 bg-gray-800 rounded w-5/6" />
                  <div className="h-3 bg-gray-800 rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {tab === 'philosophers' && (
              filteredPhilosophers.length === 0
                ? <Empty query={query} label="philosophers" />
                : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPhilosophers.map(p => <PhilosopherCard key={p.id} p={p} />)}
                  </div>
            )}
            {tab === 'works' && (
              filteredWorks.length === 0
                ? <Empty query={query} label="works" />
                : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredWorks.map(w => <WorkCard key={w.id} w={w} />)}
                  </div>
            )}
            {tab === 'schools' && (
              filteredSchools.length === 0
                ? <Empty query={query} label="schools" />
                : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSchools.map(s => <SchoolCard key={s.id} s={s} />)}
                  </div>
            )}
          </>
        )}

      </div>
    </main>
  );
}

function Empty({ query, label }: { query: string; label: string }) {
  return (
    <p className="text-gray-600 text-sm py-12 text-center">
      {query ? `No ${label} matching "${query}"` : `No ${label} found.`}
    </p>
  );
}
