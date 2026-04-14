import { createRoute, z } from '@hono/zod-openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { eq, asc } from 'drizzle-orm';
import { db, schema } from '../db/index.js';

const { works, schools, philosophers, philosopherSchools, philosopherInfluences, notes } = schema;

const app = new OpenAPIHono();

// ── Shared sub-schemas ────────────────────────────────────────────────────────

const WorkListItemSchema = z.object({
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
  philosopherId:    z.string(),
  philosopherName:  z.string(),
  philosopherSlug:  z.string(),
});

const SchoolListItemSchema = z.object({
  id:              z.string(),
  slug:            z.string(),
  name:            z.string(),
  alsoKnownAs:     z.string().nullable(),
  periodStartYear: z.number().nullable(),
  periodEndYear:   z.number().nullable(),
  periodCertainty: z.string(),
  description:     z.string().nullable(),
});

const NoteSchema = z.object({
  id:         z.string(),
  content:    z.string(),
  noteType:   z.string(),
  sourceType: z.string(),
  sourceName: z.string().nullable(),
  sourceUrl:  z.string().nullable(),
});

const SchoolMemberSchema = z.object({
  id:            z.string(),
  slug:          z.string(),
  name:          z.string(),
  nationality:   z.string().nullable(),
  bornYear:      z.number().nullable(),
  bornCertainty: z.string(),
  diedYear:      z.number().nullable(),
  diedCertainty: z.string(),
  role:          z.string(),
});

// ── GET /api/works ─────────────────────────────────────────────────────────────

const worksListRoute = createRoute({
  method: 'get',
  path: '/api/works',
  tags: ['Works'],
  summary: 'List all works with their philosopher',
  responses: {
    200: {
      description: 'All works, ordered by philosopher name then composition year',
      content: { 'application/json': { schema: z.array(WorkListItemSchema) } },
    },
  },
});

app.openapi(worksListRoute, async (c) => {
  const rows = await db
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
      philosopherId:    works.philosopherId,
      philosopherName:  philosophers.name,
      philosopherSlug:  philosophers.slug,
    })
    .from(works)
    .innerJoin(philosophers, eq(works.philosopherId, philosophers.id))
    .orderBy(asc(philosophers.name), asc(works.composedYear));
  return c.json(rows, 200);
});

// ── GET /api/works/:slug ───────────────────────────────────────────────────────

const workDetailRoute = createRoute({
  method: 'get',
  path: '/api/works/{slug}',
  tags: ['Works'],
  summary: 'Get a work by slug with philosopher and notes',
  request: { params: z.object({ slug: z.string() }) },
  responses: {
    200: {
      description: 'Work detail',
      content: {
        'application/json': {
          schema: WorkListItemSchema.extend({ notes: z.array(NoteSchema) }),
        },
      },
    },
    404: {
      description: 'Work not found',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
    },
  },
});

app.openapi(workDetailRoute, async (c) => {
  const { slug } = c.req.valid('param');

  const [row] = await db
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
      philosopherId:    works.philosopherId,
      philosopherName:  philosophers.name,
      philosopherSlug:  philosophers.slug,
    })
    .from(works)
    .innerJoin(philosophers, eq(works.philosopherId, philosophers.id))
    .where(eq(works.slug, slug));

  if (!row) return c.json({ error: 'Work not found' }, 404);

  const workNotes = await db
    .select({
      id:         notes.id,
      content:    notes.content,
      noteType:   notes.noteType,
      sourceType: notes.sourceType,
      sourceName: notes.sourceName,
      sourceUrl:  notes.sourceUrl,
    })
    .from(notes)
    .where(eq(notes.workId, row.id));

  return c.json({ ...row, notes: workNotes }, 200);
});

// ── GET /api/schools ───────────────────────────────────────────────────────────

const schoolsListRoute = createRoute({
  method: 'get',
  path: '/api/schools',
  tags: ['Schools'],
  summary: 'List all schools, ordered by period start year',
  responses: {
    200: {
      description: 'All schools',
      content: { 'application/json': { schema: z.array(SchoolListItemSchema) } },
    },
  },
});

app.openapi(schoolsListRoute, async (c) => {
  const rows = await db
    .select({
      id:              schools.id,
      slug:            schools.slug,
      name:            schools.name,
      alsoKnownAs:     schools.alsoKnownAs,
      periodStartYear: schools.periodStartYear,
      periodEndYear:   schools.periodEndYear,
      periodCertainty: schools.periodCertainty,
      description:     schools.description,
    })
    .from(schools)
    .orderBy(asc(schools.periodStartYear));
  return c.json(rows, 200);
});

// ── GET /api/schools/:slug ─────────────────────────────────────────────────────

const schoolDetailRoute = createRoute({
  method: 'get',
  path: '/api/schools/{slug}',
  tags: ['Schools'],
  summary: 'Get a school by slug with member philosophers',
  request: { params: z.object({ slug: z.string() }) },
  responses: {
    200: {
      description: 'School detail',
      content: {
        'application/json': {
          schema: SchoolListItemSchema.extend({ members: z.array(SchoolMemberSchema) }),
        },
      },
    },
    404: {
      description: 'School not found',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
    },
  },
});

app.openapi(schoolDetailRoute, async (c) => {
  const { slug } = c.req.valid('param');

  const [school] = await db
    .select({
      id:              schools.id,
      slug:            schools.slug,
      name:            schools.name,
      alsoKnownAs:     schools.alsoKnownAs,
      periodStartYear: schools.periodStartYear,
      periodEndYear:   schools.periodEndYear,
      periodCertainty: schools.periodCertainty,
      description:     schools.description,
    })
    .from(schools)
    .where(eq(schools.slug, slug));

  if (!school) return c.json({ error: 'School not found' }, 404);

  const members = await db
    .select({
      id:            philosophers.id,
      slug:          philosophers.slug,
      name:          philosophers.name,
      nationality:   philosophers.nationality,
      bornYear:      philosophers.bornYear,
      bornCertainty: philosophers.bornCertainty,
      diedYear:      philosophers.diedYear,
      diedCertainty: philosophers.diedCertainty,
      role:          philosopherSchools.role,
    })
    .from(philosopherSchools)
    .innerJoin(philosophers, eq(philosopherSchools.philosopherId, philosophers.id))
    .where(eq(philosopherSchools.schoolId, school.id))
    .orderBy(asc(philosophers.bornYear));

  return c.json({ ...school, members }, 200);
});

export default app;
