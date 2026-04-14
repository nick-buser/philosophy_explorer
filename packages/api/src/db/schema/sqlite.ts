// SQLite schema — isomorphic translation of the Postgres schema.
//
// Column type mappings:
//   pgEnum(...)                → text.$type<EnumLiteral>()   (TypeScript-enforced, not DB-enforced)
//   uuid().defaultRandom()     → text.$defaultFn(randomUUID) (stored as string)
//   timestamp({ withTimezone }) → text.$defaultFn(isoNow)    (stored as ISO8601 string)
//   integer                    → integer                     (identical)
//
// The row shapes produced by $inferSelect are structurally identical to the
// Postgres schema's inferred types, which is why the db/index.ts factory
// can cast the SQLite adapter to the Postgres types.

import { randomUUID } from 'crypto';
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type {
  WorkType, DateCertainty, SchoolRole, InfluenceType, NoteType, NoteSource,
} from './shared.js';

const isoNow = () => new Date().toISOString();

// ── Schools ───────────────────────────────────────────────────────────────────

export const schools = sqliteTable('schools', {
  id:              text('id').primaryKey().$defaultFn(randomUUID),
  slug:            text('slug').notNull().unique(),
  name:            text('name').notNull(),
  alsoKnownAs:     text('also_known_as'),
  periodStartYear: integer('period_start_year'),
  periodEndYear:   integer('period_end_year'),
  periodCertainty: text('period_certainty').$type<DateCertainty>().notNull().default('unknown'),
  description:     text('description'),
  createdAt:       text('created_at').notNull().$defaultFn(isoNow),
  updatedAt:       text('updated_at').notNull().$defaultFn(isoNow).$onUpdateFn(isoNow),
});

// ── Philosophers ──────────────────────────────────────────────────────────────

export const philosophers = sqliteTable('philosophers', {
  id:            text('id').primaryKey().$defaultFn(randomUUID),
  slug:          text('slug').notNull().unique(),
  name:          text('name').notNull(),
  alsoKnownAs:   text('also_known_as'),
  bornYear:      integer('born_year'),
  bornYearEnd:   integer('born_year_end'),
  bornCertainty: text('born_certainty').$type<DateCertainty>().notNull().default('unknown'),
  diedYear:      integer('died_year'),
  diedYearEnd:   integer('died_year_end'),
  diedCertainty: text('died_certainty').$type<DateCertainty>().notNull().default('unknown'),
  nationality:   text('nationality'),
  bioShort:      text('bio_short'),
  createdAt:     text('created_at').notNull().$defaultFn(isoNow),
  updatedAt:     text('updated_at').notNull().$defaultFn(isoNow).$onUpdateFn(isoNow),
});

// ── Philosopher ↔ School (M2M) ────────────────────────────────────────────────

export const philosopherSchools = sqliteTable(
  'philosopher_schools',
  {
    id:            text('id').primaryKey().$defaultFn(randomUUID),
    philosopherId: text('philosopher_id').notNull().references(() => philosophers.id, { onDelete: 'cascade' }),
    schoolId:      text('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
    role:          text('role').$type<SchoolRole>().notNull().default('member'),
    createdAt:     text('created_at').notNull().$defaultFn(isoNow),
  },
  (t) => [
    uniqueIndex('ps_philosopher_school_role_idx').on(t.philosopherId, t.schoolId, t.role),
  ],
);

// ── Philosopher influences (self-referential M2M) ─────────────────────────────

export const philosopherInfluences = sqliteTable(
  'philosopher_influences',
  {
    id:            text('id').primaryKey().$defaultFn(randomUUID),
    influencerId:  text('influencer_id').notNull().references(() => philosophers.id, { onDelete: 'cascade' }),
    influencedId:  text('influenced_id').notNull().references(() => philosophers.id, { onDelete: 'cascade' }),
    influenceType: text('influence_type').$type<InfluenceType>().notNull().default('direct'),
    description:   text('description'),
    createdAt:     text('created_at').notNull().$defaultFn(isoNow),
  },
  (t) => [
    uniqueIndex('pi_pair_type_idx').on(t.influencerId, t.influencedId, t.influenceType),
  ],
);

// ── Works ─────────────────────────────────────────────────────────────────────

export const works = sqliteTable('works', {
  id:               text('id').primaryKey().$defaultFn(randomUUID),
  slug:             text('slug').notNull().unique(),
  title:            text('title').notNull(),
  originalTitle:    text('original_title'),
  philosopherId:    text('philosopher_id').notNull().references(() => philosophers.id, { onDelete: 'restrict' }),
  workType:         text('work_type').$type<WorkType>().notNull().default('other'),
  composedYear:     integer('composed_year'),
  composedYearEnd:  integer('composed_year_end'),
  composedCertainty: text('composed_certainty').$type<DateCertainty>().notNull().default('unknown'),
  originalLanguage: text('original_language'),
  descriptionShort: text('description_short'),
  createdAt:        text('created_at').notNull().$defaultFn(isoNow),
  updatedAt:        text('updated_at').notNull().$defaultFn(isoNow).$onUpdateFn(isoNow),
});

// ── Notes ─────────────────────────────────────────────────────────────────────

export const notes = sqliteTable('notes', {
  id:            text('id').primaryKey().$defaultFn(randomUUID),
  content:       text('content').notNull(),
  noteType:      text('note_type').$type<NoteType>().notNull().default('other'),
  sourceType:    text('source_type').$type<NoteSource>().notNull().default('manual'),
  sourceName:    text('source_name'),
  sourceUrl:     text('source_url'),
  philosopherId: text('philosopher_id').references(() => philosophers.id, { onDelete: 'cascade' }),
  workId:        text('work_id').references(() => works.id, { onDelete: 'cascade' }),
  schoolId:      text('school_id').references(() => schools.id, { onDelete: 'cascade' }),
  createdAt:     text('created_at').notNull().$defaultFn(isoNow),
  updatedAt:     text('updated_at').notNull().$defaultFn(isoNow).$onUpdateFn(isoNow),
});

// ── Users ─────────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id:        text('id').primaryKey().$defaultFn(randomUUID),
  name:      text('name').notNull(),
  email:     text('email').notNull().unique(),
  createdAt: text('created_at').notNull().$defaultFn(isoNow),
});
