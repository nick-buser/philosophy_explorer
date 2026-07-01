import { createRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { rootRoute } from './__root';
import { LOGIC_SYSTEMS } from '../data/logic-systems';
import { apiBaseUrl } from '../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
// Mirrors the API response shape from GET /api/philosophers/:slug.
// Replace with the generated type from api-types.ts after running gen:spec + gen:types.

type Work = {
  id: string;
  slug: string;
  title: string;
  originalTitle: string | null;
  workType: string;
  composedYear: number | null;
  composedYearEnd: number | null;
  composedCertainty: string;
  originalLanguage: string | null;
  descriptionShort: string | null;
};

type SchoolMembership = {
  id: string;
  slug: string;
  name: string;
  role: string;
};

type RelatedPhilosopher = {
  id: string;
  slug: string;
  name: string;
  influenceType: string;
  description: string | null;
};

type Note = {
  id: string;
  content: string;
  noteType: string;
  sourceType: string;
  sourceName: string | null;
  sourceUrl: string | null;
};

type PhilosopherDetail = {
  id: string;
  slug: string;
  name: string;
  alsoKnownAs: string | null;
  bornYear: number | null;
  bornCertainty: string;
  diedYear: number | null;
  diedCertainty: string;
  nationality: string | null;
  bioShort: string | null;
  works: Work[];
  schools: SchoolMembership[];
  influences: RelatedPhilosopher[];
  influencedBy: RelatedPhilosopher[];
  notes: Note[];
};

// ── Route ─────────────────────────────────────────────────────────────────────

export const philosopherDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/philosophers/$slug',
  component: PhilosopherDetailPage,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const API_BASE = apiBaseUrl;

function formatYear(year: number | null, certainty: string): string {
  if (year === null) return 'unknown';
  const abs = Math.abs(year);
  const era = year < 0 ? ' BCE' : ' CE';
  const prefix = certainty === 'circa' ? 'c. ' : certainty === 'flourished' ? 'fl. ' : '';
  return `${prefix}${abs}${era}`;
}

function formatLifespan(p: PhilosopherDetail): string {
  if (p.bornYear === null && p.diedYear === null) return '';
  const born = formatYear(p.bornYear, p.bornCertainty);
  const died = p.diedYear !== null ? formatYear(p.diedYear, p.diedCertainty) : 'present';
  return `${born} – ${died}`;
}

const INFLUENCE_LABEL: Record<string, string> = {
  direct:   'Direct',
  indirect: 'Indirect',
  critical: 'Critical',
  revival:  'Revival',
};

const INFLUENCE_COLOR: Record<string, string> = {
  direct:   'bg-blue-900/40 text-blue-300 border border-blue-700/40',
  indirect: 'bg-gray-800 text-gray-400 border border-gray-700',
  critical: 'bg-amber-900/30 text-amber-300 border border-amber-700/40',
  revival:  'bg-violet-900/30 text-violet-300 border border-violet-700/40',
};

const NOTE_LABEL: Record<string, string> = {
  context:        'Context',
  bibliography:   'Secondary Literature',
  interpretation: 'Interpretation',
  summary:        'Summary',
  quote:          'Quote',
  other:          'Note',
};

// ── Components ────────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-4">
      {children}
    </h2>
  );
}

function WorkCard({ work, index }: { work: Work; index: number }) {
  const year = work.composedYear !== null
    ? formatYear(work.composedYear, work.composedCertainty)
    : null;

  return (
    <div className="flex gap-4 py-4 border-b border-gray-800 last:border-0">
      <span className="text-2xl font-light text-gray-700 w-6 shrink-0 pt-0.5 select-none">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-gray-100 font-medium">{work.title}</span>
          {work.originalTitle && work.originalTitle !== work.title && (
            <span className="text-gray-500 text-sm italic">{work.originalTitle}</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          {year && <span>{year}</span>}
          {work.workType !== 'other' && (
            <span className="capitalize">{work.workType}</span>
          )}
          {work.originalLanguage && <span>{work.originalLanguage}</span>}
        </div>
        {work.descriptionShort && (
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">{work.descriptionShort}</p>
        )}
      </div>
    </div>
  );
}

function PhilosopherLink({ p }: { p: RelatedPhilosopher }) {
  return (
    <div className="py-3 border-b border-gray-800 last:border-0">
      <div className="flex items-start gap-3">
        <Link
          to="/philosophers/$slug"
          params={{ slug: p.slug }}
          className="text-gray-100 hover:text-white font-medium transition-colors"
        >
          {p.name}
        </Link>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${INFLUENCE_COLOR[p.influenceType] ?? INFLUENCE_COLOR.indirect}`}>
          {INFLUENCE_LABEL[p.influenceType] ?? p.influenceType}
        </span>
      </div>
      {p.description && (
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">{p.description}</p>
      )}
    </div>
  );
}

function NoteBlock({ note }: { note: Note }) {
  const label = NOTE_LABEL[note.noteType] ?? 'Note';
  // Render content: treat double-newline as paragraphs, preserve single newlines as <br>
  const paragraphs = note.content.split(/\n{2,}/);

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-500">
          {label}
        </span>
        {note.sourceName && (
          <span className="text-xs text-gray-600">— {note.sourceName}</span>
        )}
      </div>
      <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
        {paragraphs.map((para, i) => (
          <p key={i}>
            {para.split('\n').map((line, j, arr) => (
              <span key={j}>
                {line}
                {j < arr.length - 1 && <br />}
              </span>
            ))}
          </p>
        ))}
      </div>
    </div>
  );
}

function LogicLabCta({ philosopherSlug }: { philosopherSlug: string }) {
  const system = LOGIC_SYSTEMS.find(
    s => s.thinkerSlug === philosopherSlug && s.status === 'available',
  );
  if (!system) return null;
  return (
    <Link
      to="/logic/$system"
      params={{ system: system.slug }}
      className="block rounded-lg border border-blue-900/40 bg-blue-950/20 p-4 hover:border-blue-700/60 hover:bg-blue-950/40 transition-colors"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-widest uppercase text-blue-300/70">
            Logic Lab
          </div>
          <div className="mt-1 text-gray-100 font-medium">{system.name}</div>
          <p className="mt-1 text-sm text-gray-400 leading-relaxed">{system.shortDescription}</p>
        </div>
        <span className="shrink-0 text-blue-300 text-sm">Open →</span>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function PhilosopherDetailPage() {
  const { slug } = philosopherDetailRoute.useParams();

  const { data, isLoading, isError, error } = useQuery<PhilosopherDetail>({
    queryKey: ['philosopher', slug],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/philosophers/${slug}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Philosopher not found');
        throw new Error(`API error ${res.status}`);
      }
      return res.json() as Promise<PhilosopherDetail>;
    },
  });

  if (isLoading) {
    return (
      <main className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-48" />
            <div className="h-4 bg-gray-800 rounded w-32" />
            <div className="h-24 bg-gray-800 rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Home
          </Link>
          <p className="mt-8 text-gray-400">
            {error instanceof Error ? error.message : 'Failed to load philosopher.'}
          </p>
        </div>
      </main>
    );
  }

  const contextNotes    = data.notes.filter(n => n.noteType === 'context');
  const bibliNotes      = data.notes.filter(n => n.noteType === 'bibliography');
  const interpretNotes  = data.notes.filter(n => n.noteType === 'interpretation');
  const otherNotes      = data.notes.filter(
    n => !['context', 'bibliography', 'interpretation'].includes(n.noteType),
  );

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-6 space-y-12">

        {/* Back nav */}
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
          ← Home
        </Link>

        {/* Hero */}
        <header>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-100">{data.name}</h1>
            {data.alsoKnownAs && (
              <span className="text-gray-500 text-sm">({data.alsoKnownAs})</span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
            <span>{formatLifespan(data)}</span>
            {data.nationality && (
              <>
                <span className="text-gray-700">·</span>
                <span>{data.nationality}</span>
              </>
            )}
            {data.schools.map(s => (
              <span key={s.id} className="text-gray-700">·</span>
            ))}
            {data.schools.map(s => (
              <span key={s.id} className="text-gray-400">{s.name}</span>
            ))}
          </div>
          {data.bioShort && (
            <p className="mt-4 text-gray-300 leading-relaxed">{data.bioShort}</p>
          )}
        </header>

        <LogicLabCta philosopherSlug={data.slug} />

        {/* Reading order / context notes */}
        {contextNotes.length > 0 && (
          <section>
            <SectionHeading>Reading Order</SectionHeading>
            <div className="space-y-4">
              {contextNotes.map(n => <NoteBlock key={n.id} note={n} />)}
            </div>
          </section>
        )}

        {/* Works */}
        {data.works.length > 0 && (
          <section>
            <SectionHeading>Works</SectionHeading>
            <div>
              {data.works.map((w, i) => <WorkCard key={w.id} work={w} index={i} />)}
            </div>
          </section>
        )}

        {/* Influenced by / influences — side by side on wider screens */}
        {(data.influencedBy.length > 0 || data.influences.length > 0) && (
          <section>
            <SectionHeading>Influences</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {data.influencedBy.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-3 font-medium">
                    Influenced by
                  </p>
                  {data.influencedBy.map(p => (
                    <PhilosopherLink key={`${p.id}-${p.influenceType}`} p={p} />
                  ))}
                </div>
              )}
              {data.influences.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-3 font-medium">
                    Influenced
                  </p>
                  {data.influences.map(p => (
                    <PhilosopherLink key={`${p.id}-${p.influenceType}`} p={p} />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Related thinkers interpretation */}
        {interpretNotes.length > 0 && (
          <section>
            <SectionHeading>Related Thinkers</SectionHeading>
            <div className="space-y-4">
              {interpretNotes.map(n => <NoteBlock key={n.id} note={n} />)}
            </div>
          </section>
        )}

        {/* Secondary literature */}
        {bibliNotes.length > 0 && (
          <section>
            <SectionHeading>Secondary Literature</SectionHeading>
            <div className="space-y-4">
              {bibliNotes.map(n => <NoteBlock key={n.id} note={n} />)}
            </div>
          </section>
        )}

        {/* Catch-all other notes */}
        {otherNotes.length > 0 && (
          <section>
            <SectionHeading>Notes</SectionHeading>
            <div className="space-y-4">
              {otherNotes.map(n => <NoteBlock key={n.id} note={n} />)}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
