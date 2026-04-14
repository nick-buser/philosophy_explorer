import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ── Enums ─────────────────────────────────────────────────────────────────────

// Finite vocabulary for work classification
export const workTypeEnum = pgEnum('work_type', [
  'treatise',
  'dialogue',
  'essay',
  'letter',
  'fragment',
  'commentary',
  'poem',
  'speech',
  'collection',
  'other',
]);

// How confident we are in a date or range.
// Year columns use negative integers for BCE (e.g. -399 = 399 BCE).
// When certainty is 'range', year = range start, year_end = range end.
export const dateCertaintyEnum = pgEnum('date_certainty', [
  'exact',       // we know the specific year
  'circa',       // approximately this year (year_end unused)
  'range',       // somewhere in this span (year + year_end both set)
  'flourished',  // only an active-period is known (fl.)
  'unknown',     // no date information available
]);

// How a philosopher relates to a school
export const schoolRoleEnum = pgEnum('school_role', [
  'founder',
  'member',
  'student',
  'critic',
  'associated',
]);

// How one philosopher influenced another
export const influenceTypeEnum = pgEnum('influence_type', [
  'direct',
  'indirect',
  'critical',   // influenced via critique / rejection
  'revival',    // later thinker revived/reinterpreted the earlier one
]);

// What kind of note this is
export const noteTypeEnum = pgEnum('note_type', [
  'summary',
  'interpretation',
  'quote',
  'context',
  'bibliography',
  'other',
]);

// Where a note came from
export const noteSourceEnum = pgEnum('note_source', [
  'manual',  // written by hand in-app
  'api',     // fetched from an external API (SEP, Wikipedia, etc.)
  'seed',    // loaded from src/data/seed-data.ts
]);

// ── Schools ───────────────────────────────────────────────────────────────────

export const schools = pgTable(
  'schools',
  {
    id:              uuid('id').primaryKey().defaultRandom(),
    slug:            text('slug').notNull().unique(),
    name:            text('name').notNull(),
    alsoKnownAs:     text('also_known_as'),
    periodStartYear: integer('period_start_year'),
    periodEndYear:   integer('period_end_year'),
    periodCertainty: dateCertaintyEnum('period_certainty').notNull().default('unknown'),
    description:     text('description'),
    createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
      .$onUpdateFn(() => new Date()),
  },
);

// ── Philosophers ──────────────────────────────────────────────────────────────

export const philosophers = pgTable(
  'philosophers',
  {
    id:            uuid('id').primaryKey().defaultRandom(),
    slug:          text('slug').notNull().unique(),
    name:          text('name').notNull(),
    alsoKnownAs:   text('also_known_as'),
    // Birth date. year negative = BCE.
    bornYear:      integer('born_year'),
    bornYearEnd:   integer('born_year_end'),   // set when certainty = 'range'
    bornCertainty: dateCertaintyEnum('born_certainty').notNull().default('unknown'),
    // Death date
    diedYear:      integer('died_year'),
    diedYearEnd:   integer('died_year_end'),
    diedCertainty: dateCertaintyEnum('died_certainty').notNull().default('unknown'),
    nationality:   text('nationality'),
    bioShort:      text('bio_short'),
    createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
      .$onUpdateFn(() => new Date()),
  },
);

// ── Philosopher ↔ School (M2M) ────────────────────────────────────────────────

export const philosopherSchools = pgTable(
  'philosopher_schools',
  {
    id:            uuid('id').primaryKey().defaultRandom(),
    philosopherId: uuid('philosopher_id')
      .notNull()
      .references(() => philosophers.id, { onDelete: 'cascade' }),
    schoolId:      uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    role:          schoolRoleEnum('role').notNull().default('member'),
    createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One role per (philosopher, school) pair — add a new row for a second role if needed
    uniqueIndex('ps_philosopher_school_role_idx').on(t.philosopherId, t.schoolId, t.role),
  ],
);

// ── Philosopher influences (self-referential M2M) ─────────────────────────────

export const philosopherInfluences = pgTable(
  'philosopher_influences',
  {
    id:            uuid('id').primaryKey().defaultRandom(),
    influencerId:  uuid('influencer_id')
      .notNull()
      .references(() => philosophers.id, { onDelete: 'cascade' }),
    influencedId:  uuid('influenced_id')
      .notNull()
      .references(() => philosophers.id, { onDelete: 'cascade' }),
    influenceType: influenceTypeEnum('influence_type').notNull().default('direct'),
    description:   text('description'),
    createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('pi_pair_type_idx').on(t.influencerId, t.influencedId, t.influenceType),
  ],
);

// ── Works ─────────────────────────────────────────────────────────────────────

export const works = pgTable(
  'works',
  {
    id:               uuid('id').primaryKey().defaultRandom(),
    slug:             text('slug').notNull().unique(),
    title:            text('title').notNull(),
    originalTitle:    text('original_title'),
    // restrict: don't allow deleting a philosopher who has works
    philosopherId:    uuid('philosopher_id')
      .notNull()
      .references(() => philosophers.id, { onDelete: 'restrict' }),
    workType:         workTypeEnum('work_type').notNull().default('other'),
    // Composition date. Negative = BCE.
    composedYear:     integer('composed_year'),
    composedYearEnd:  integer('composed_year_end'),
    composedCertainty: dateCertaintyEnum('composed_certainty').notNull().default('unknown'),
    originalLanguage: text('original_language'),
    descriptionShort: text('description_short'),
    createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
      .$onUpdateFn(() => new Date()),
  },
);

// ── Notes ─────────────────────────────────────────────────────────────────────
// Polymorphic — attach to a philosopher, work, or school.
// Exactly one of (philosopherId, workId, schoolId) should be non-null,
// but this is enforced at the application layer for flexibility.
// source_type tracks provenance: manual (in-app), api (external fetch), seed (seed-data.ts)

export const notes = pgTable(
  'notes',
  {
    id:            uuid('id').primaryKey().defaultRandom(),
    content:       text('content').notNull(),
    noteType:      noteTypeEnum('note_type').notNull().default('other'),
    sourceType:    noteSourceEnum('source_type').notNull().default('manual'),
    sourceName:    text('source_name'),  // e.g. "Stanford Encyclopedia of Philosophy"
    sourceUrl:     text('source_url'),
    philosopherId: uuid('philosopher_id')
      .references(() => philosophers.id, { onDelete: 'cascade' }),
    workId:        uuid('work_id')
      .references(() => works.id, { onDelete: 'cascade' }),
    schoolId:      uuid('school_id')
      .references(() => schools.id, { onDelete: 'cascade' }),
    createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
      .$onUpdateFn(() => new Date()),
  },
);

// ── Users (auth placeholder) ──────────────────────────────────────────────────

export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      text('name').notNull(),
  email:     text('email').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type School                 = typeof schools.$inferSelect;
export type NewSchool              = typeof schools.$inferInsert;
export type Philosopher            = typeof philosophers.$inferSelect;
export type NewPhilosopher         = typeof philosophers.$inferInsert;
export type PhilosopherSchool      = typeof philosopherSchools.$inferSelect;
export type NewPhilosopherSchool   = typeof philosopherSchools.$inferInsert;
export type PhilosopherInfluence   = typeof philosopherInfluences.$inferSelect;
export type NewPhilosopherInfluence = typeof philosopherInfluences.$inferInsert;
export type Work                   = typeof works.$inferSelect;
export type NewWork                = typeof works.$inferInsert;
export type Note                   = typeof notes.$inferSelect;
export type NewNote                = typeof notes.$inferInsert;
export type User                   = typeof users.$inferSelect;
export type NewUser                = typeof users.$inferInsert;
