import { createRoute, z } from '@hono/zod-openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { eq, asc, aliasedTable } from 'drizzle-orm';
import { db, schema } from '../db/index.js';

const { philosophers, philosopherInfluences, philosopherSchools, schools, works, notes } = schema;

const app = new OpenAPIHono();

// ── Shared sub-schemas ────────────────────────────────────────────────────────

const WorkSchema = z.object({
  id:               z.string(),
  slug:             z.string(),
  title:            z.string(),
  originalTitle:    z.string().nullable(),
  workType:         z.string(),
  composedYear:     z.number().nullable(),
  composedYearEnd:  z.number().nullable(),
  composedCertainty: z.string(),
  originalLanguage: z.string().nullable(),
  descriptionShort: z.string().nullable(),
});

const SchoolMembershipSchema = z.object({
  id:   z.string(),
  slug: z.string(),
  name: z.string(),
  role: z.string(),
});

const RelatedPhilosopherSchema = z.object({
  id:            z.string(),
  slug:          z.string(),
  name:          z.string(),
  influenceType: z.string(),
  description:   z.string().nullable(),
});

const NoteSchema = z.object({
  id:         z.string(),
  content:    z.string(),
  noteType:   z.string(),
  sourceType: z.string(),
  sourceName: z.string().nullable(),
  sourceUrl:  z.string().nullable(),
});

const PhilosopherSummarySchema = z.object({
  id:            z.string(),
  slug:          z.string(),
  name:          z.string(),
  alsoKnownAs:   z.string().nullable(),
  bornYear:      z.number().nullable(),
  bornCertainty: z.string(),
  diedYear:      z.number().nullable(),
  diedCertainty: z.string(),
  nationality:   z.string().nullable(),
  bioShort:      z.string().nullable(),
});

const PhilosopherDetailSchema = PhilosopherSummarySchema.extend({
  works:        z.array(WorkSchema),
  schools:      z.array(SchoolMembershipSchema),
  influences:   z.array(RelatedPhilosopherSchema),
  influencedBy: z.array(RelatedPhilosopherSchema),
  notes:        z.array(NoteSchema),
});

// ── GET /api/philosophers ─────────────────────────────────────────────────────

const listRoute = createRoute({
  method: 'get',
  path: '/api/philosophers',
  tags: ['Philosophers'],
  summary: 'List all philosophers',
  responses: {
    200: {
      description: 'All philosophers, ordered by birth year',
      content: {
        'application/json': {
          schema: z.array(PhilosopherSummarySchema),
        },
      },
    },
  },
});

app.openapi(listRoute, async (c) => {
  const rows = await db
    .select()
    .from(philosophers)
    .orderBy(asc(philosophers.bornYear));
  return c.json(rows, 200);
});

// ── GET /api/philosophers/:slug ───────────────────────────────────────────────

const detailRoute = createRoute({
  method: 'get',
  path: '/api/philosophers/{slug}',
  tags: ['Philosophers'],
  summary: 'Get a philosopher by slug with works, schools, influences, and notes',
  request: {
    params: z.object({ slug: z.string() }),
  },
  responses: {
    200: {
      description: 'Philosopher detail',
      content: {
        'application/json': {
          schema: PhilosopherDetailSchema,
        },
      },
    },
    404: {
      description: 'Philosopher not found',
      content: {
        'application/json': {
          schema: z.object({ error: z.string() }),
        },
      },
    },
  },
});

app.openapi(detailRoute, async (c) => {
  const { slug } = c.req.valid('param');

  const [philosopher] = await db
    .select()
    .from(philosophers)
    .where(eq(philosophers.slug, slug));

  if (!philosopher) {
    return c.json({ error: 'Philosopher not found' }, 404);
  }

  // Works — ordered by composition year
  const philosopherWorks = await db
    .select({
      id:               works.id,
      slug:             works.slug,
      title:            works.title,
      originalTitle:    works.originalTitle,
      workType:         works.workType,
      composedYear:     works.composedYear,
      composedYearEnd:  works.composedYearEnd,
      composedCertainty: works.composedCertainty,
      originalLanguage: works.originalLanguage,
      descriptionShort: works.descriptionShort,
    })
    .from(works)
    .where(eq(works.philosopherId, philosopher.id))
    .orderBy(asc(works.composedYear));

  // School memberships
  const schoolMemberships = await db
    .select({
      id:   schools.id,
      slug: schools.slug,
      name: schools.name,
      role: philosopherSchools.role,
    })
    .from(philosopherSchools)
    .innerJoin(schools, eq(philosopherSchools.schoolId, schools.id))
    .where(eq(philosopherSchools.philosopherId, philosopher.id));

  // Outgoing influences (this philosopher → others)
  const influencedAlias = aliasedTable(philosophers, 'influenced');
  const outgoing = await db
    .select({
      id:            influencedAlias.id,
      slug:          influencedAlias.slug,
      name:          influencedAlias.name,
      influenceType: philosopherInfluences.influenceType,
      description:   philosopherInfluences.description,
    })
    .from(philosopherInfluences)
    .innerJoin(influencedAlias, eq(philosopherInfluences.influencedId, influencedAlias.id))
    .where(eq(philosopherInfluences.influencerId, philosopher.id));

  // Incoming influences (others → this philosopher)
  const influencerAlias = aliasedTable(philosophers, 'influencer');
  const incoming = await db
    .select({
      id:            influencerAlias.id,
      slug:          influencerAlias.slug,
      name:          influencerAlias.name,
      influenceType: philosopherInfluences.influenceType,
      description:   philosopherInfluences.description,
    })
    .from(philosopherInfluences)
    .innerJoin(influencerAlias, eq(philosopherInfluences.influencerId, influencerAlias.id))
    .where(eq(philosopherInfluences.influencedId, philosopher.id));

  // Notes attached to this philosopher
  const philosopherNotes = await db
    .select({
      id:         notes.id,
      content:    notes.content,
      noteType:   notes.noteType,
      sourceType: notes.sourceType,
      sourceName: notes.sourceName,
      sourceUrl:  notes.sourceUrl,
    })
    .from(notes)
    .where(eq(notes.philosopherId, philosopher.id));

  return c.json(
    {
      ...philosopher,
      works:        philosopherWorks,
      schools:      schoolMemberships,
      influences:   outgoing,
      influencedBy: incoming,
      notes:        philosopherNotes,
    },
    200,
  );
});

export default app;
