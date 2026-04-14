import { createRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { rootRoute } from './__root';

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkDetail = {
  id: string; slug: string; title: string; originalTitle: string | null;
  workType: string; composedYear: number | null; composedYearEnd: number | null;
  composedCertainty: string; originalLanguage: string | null;
  descriptionShort: string | null;
  philosopherId: string; philosopherName: string; philosopherSlug: string;
  notes: Array<{
    id: string; content: string; noteType: string;
    sourceType: string; sourceName: string | null; sourceUrl: string | null;
  }>;
};

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const workDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/works/$slug',
  component: WorkDetailPage,
});

function formatYear(year: number | null, certainty: string, end?: number | null): string {
  if (year === null) return 'unknown';
  const abs = Math.abs(year);
  const era = year < 0 ? ' BCE' : ' CE';
  const pre = certainty === 'circa' ? 'c. ' : '';
  if (certainty === 'range' && end) return `${pre}${abs}${era}–${Math.abs(end)}${end < 0 ? ' BCE' : ' CE'}`;
  return `${pre}${abs}${era}`;
}

const NOTE_LABEL: Record<string, string> = {
  context: 'Context', bibliography: 'Secondary Literature',
  interpretation: 'Interpretation', summary: 'Summary', quote: 'Quote', other: 'Note',
};

function WorkDetailPage() {
  const { slug } = workDetailRoute.useParams();

  const { data, isLoading, isError, error } = useQuery<WorkDetail>({
    queryKey: ['work', slug],
    queryFn: async () => {
      const res = await fetch(`${API}/api/works/${slug}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Work not found');
        throw new Error(`API error ${res.status}`);
      }
      return res.json() as Promise<WorkDetail>;
    },
  });

  if (isLoading) {
    return (
      <main className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-6 animate-pulse space-y-4">
          <div className="h-4 bg-gray-800 rounded w-16" />
          <div className="h-8 bg-gray-800 rounded w-2/3" />
          <div className="h-4 bg-gray-800 rounded w-1/3" />
          <div className="h-24 bg-gray-800 rounded mt-6" />
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">← Browse</Link>
          <p className="mt-8 text-gray-400">{error instanceof Error ? error.message : 'Failed to load work.'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-6 space-y-10">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">← Browse</Link>

        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold text-gray-100">{data.title}</h1>
          {data.originalTitle && data.originalTitle !== data.title && (
            <p className="mt-1 text-gray-500 italic">{data.originalTitle}</p>
          )}
          <div className="flex items-center gap-3 mt-3 text-sm text-gray-500 flex-wrap">
            <Link
              to="/philosophers/$slug"
              params={{ slug: data.philosopherSlug }}
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              {data.philosopherName}
            </Link>
            <span className="text-gray-700">·</span>
            <span className="capitalize">{data.workType}</span>
            {data.composedYear !== null && (
              <>
                <span className="text-gray-700">·</span>
                <span>{formatYear(data.composedYear, data.composedCertainty, data.composedYearEnd)}</span>
              </>
            )}
            {data.originalLanguage && (
              <>
                <span className="text-gray-700">·</span>
                <span>{data.originalLanguage}</span>
              </>
            )}
          </div>
          {data.descriptionShort && (
            <p className="mt-5 text-gray-300 leading-relaxed">{data.descriptionShort}</p>
          )}
        </header>

        {/* Notes */}
        {data.notes.length > 0 && (
          <section className="space-y-4">
            {data.notes.map(n => {
              const label = NOTE_LABEL[n.noteType] ?? 'Note';
              const paragraphs = n.content.split(/\n{2,}/);
              return (
                <div key={n.id} className="rounded-lg border border-gray-800 bg-gray-900/50 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-semibold tracking-widest uppercase text-gray-500">{label}</span>
                    {n.sourceName && <span className="text-xs text-gray-600">— {n.sourceName}</span>}
                  </div>
                  <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
                    {paragraphs.map((para, i) => <p key={i}>{para}</p>)}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
