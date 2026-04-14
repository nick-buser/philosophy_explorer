import { createRoute, Link } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { curricula } from '../data/curricula/index';
import type { Curriculum } from '../lib/curriculum-schema';

export const curriculaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/curricula',
  component: CurriculaPage,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEVEL_STYLE: Record<string, string> = {
  beginner:     'bg-emerald-900/40 text-emerald-300',
  intermediate: 'bg-blue-900/40 text-blue-300',
  advanced:     'bg-violet-900/40 text-violet-300',
};

function levelLabel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

// ── Card ──────────────────────────────────────────────────────────────────────

function CurriculumCard({ c }: { c: Curriculum }) {
  const levelClass = LEVEL_STYLE[c.level] ?? 'bg-gray-800 text-gray-400';
  const primaryCount = c.items.filter(i => i.type === 'primary').length;
  const secondaryCount = c.items.filter(i => i.type === 'secondary').length;

  return (
    <Link
      to="/curricula/$slug"
      params={{ slug: c.slug }}
      className="block rounded-xl border border-gray-800 bg-gray-900/60 p-6 hover:border-gray-600 hover:bg-gray-900 transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-100 group-hover:text-white leading-snug text-lg">
            {c.title}
          </p>
          <p className="mt-1 text-sm text-gray-400 italic">{c.tagline}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full capitalize shrink-0 mt-1 ${levelClass}`}>
          {levelLabel(c.level)}
        </span>
      </div>
      <p className="mt-3 text-sm text-gray-400 leading-relaxed line-clamp-3">
        {c.description}
      </p>
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
        <span>{c.estimatedDuration}</span>
        <span className="text-gray-700">·</span>
        <span>{primaryCount} primary texts</span>
        {secondaryCount > 0 && (
          <>
            <span className="text-gray-700">·</span>
            <span>{secondaryCount} secondary</span>
          </>
        )}
        <span className="text-gray-700">·</span>
        <span>{c.stages.length} stages</span>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function CurriculaPage() {
  return (
    <main className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6">

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-100">Planned Curricula</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-xl">
            Sequenced reading paths through major philosophical traditions — primary texts in
            recommended order, secondary literature to read alongside them, and the dependency
            structure that explains why the sequence is what it is.
          </p>
        </div>

        {curricula.length === 0 ? (
          <p className="text-gray-600 text-sm py-12 text-center">No curricula yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {curricula.map(c => <CurriculumCard key={c.id} c={c} />)}
          </div>
        )}

      </div>
    </main>
  );
}
