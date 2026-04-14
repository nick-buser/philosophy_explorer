import { createRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { rootRoute } from './__root';

// ── Types ─────────────────────────────────────────────────────────────────────

type SchoolDetail = {
  id: string; slug: string; name: string; alsoKnownAs: string | null;
  periodStartYear: number | null; periodEndYear: number | null;
  periodCertainty: string; description: string | null;
  members: Array<{
    id: string; slug: string; name: string; nationality: string | null;
    bornYear: number | null; bornCertainty: string;
    diedYear: number | null; diedCertainty: string;
    role: string;
  }>;
};

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const schoolDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/schools/$slug',
  component: SchoolDetailPage,
});

function formatYear(year: number | null, certainty: string): string {
  if (year === null) return '';
  const abs = Math.abs(year);
  const era = year < 0 ? ' BCE' : ' CE';
  const pre = certainty === 'circa' ? 'c. ' : certainty === 'flourished' ? 'fl. ' : '';
  return `${pre}${abs}${era}`;
}

function period(s: SchoolDetail): string {
  if (!s.periodStartYear) return '';
  const start = formatYear(s.periodStartYear, s.periodCertainty);
  if (s.periodCertainty === 'range' && s.periodEndYear) {
    return `${start} – ${formatYear(s.periodEndYear, 'exact')}`;
  }
  return start;
}

function lifespan(m: SchoolDetail['members'][number]): string {
  if (!m.bornYear && !m.diedYear) return '';
  const b = formatYear(m.bornYear, m.bornCertainty);
  const d = m.diedYear ? formatYear(m.diedYear, m.diedCertainty) : 'present';
  return b ? `${b} – ${d}` : '';
}

const ROLE_ORDER = ['founder', 'member', 'associated', 'student', 'critic'];

function SchoolDetailPage() {
  const { slug } = schoolDetailRoute.useParams();

  const { data, isLoading, isError, error } = useQuery<SchoolDetail>({
    queryKey: ['school', slug],
    queryFn: async () => {
      const res = await fetch(`${API}/api/schools/${slug}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('School not found');
        throw new Error(`API error ${res.status}`);
      }
      return res.json() as Promise<SchoolDetail>;
    },
  });

  if (isLoading) {
    return (
      <main className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-6 animate-pulse space-y-4">
          <div className="h-4 bg-gray-800 rounded w-16" />
          <div className="h-8 bg-gray-800 rounded w-1/2" />
          <div className="h-4 bg-gray-800 rounded w-1/4" />
          <div className="h-20 bg-gray-800 rounded mt-6" />
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">← Browse</Link>
          <p className="mt-8 text-gray-400">{error instanceof Error ? error.message : 'Failed to load school.'}</p>
        </div>
      </main>
    );
  }

  const per = period(data);

  // Group members by role
  const byRole = ROLE_ORDER.reduce<Record<string, typeof data.members>>((acc, role) => {
    const group = data.members.filter(m => m.role === role);
    if (group.length) acc[role] = group;
    return acc;
  }, {});

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-6 space-y-10">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">← Browse</Link>

        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold text-gray-100">{data.name}</h1>
          {data.alsoKnownAs && <p className="text-gray-500 text-sm mt-1">({data.alsoKnownAs})</p>}
          {per && <p className="text-gray-500 text-sm mt-1">{per}</p>}
          {data.description && (
            <p className="mt-4 text-gray-300 leading-relaxed">{data.description}</p>
          )}
        </header>

        {/* Members grouped by role */}
        {Object.entries(byRole).map(([role, members]) => (
          <section key={role}>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-4 capitalize">
              {role === 'associated' ? 'Associated' : role + 's'}
            </h2>
            <div className="space-y-0">
              {members.map(m => {
                const span = lifespan(m);
                return (
                  <div key={m.id} className="flex items-baseline gap-4 py-3 border-b border-gray-800 last:border-0">
                    <Link
                      to="/philosophers/$slug"
                      params={{ slug: m.slug }}
                      className="text-gray-100 hover:text-white font-medium transition-colors"
                    >
                      {m.name}
                    </Link>
                    <span className="text-xs text-gray-600">
                      {[span, m.nationality].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
