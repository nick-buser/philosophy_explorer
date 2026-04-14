import { z } from 'zod';

// ── Enums ─────────────────────────────────────────────────────────────────────

export const CurriculumLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type CurriculumLevel = z.infer<typeof CurriculumLevelSchema>;

export const ReadingTypeSchema = z.enum(['primary', 'secondary']);
export type ReadingType = z.infer<typeof ReadingTypeSchema>;

// ── Stage ─────────────────────────────────────────────────────────────────────
// A named phase within the curriculum (e.g. "Presocratic Origins").
// Items reference their stage by id.

export const CurriculumStageSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number().int().positive(),
  description: z.string().optional(),
});
export type CurriculumStage = z.infer<typeof CurriculumStageSchema>;

// ── Item ──────────────────────────────────────────────────────────────────────
// A single reading in the curriculum — primary text or secondary literature.
// workSlug and authorSlug are optional links into the DB-backed explorer pages.

export const CurriculumItemSchema = z.object({
  /** Unique within this curriculum. Used as graph node id. */
  id: z.string(),
  stageId: z.string(),
  type: ReadingTypeSchema,
  title: z.string(),
  /** Slug of the corresponding Work record in the DB, if it exists. */
  workSlug: z.string().optional(),
  /** Slug of the corresponding Philosopher record in the DB, if it exists. */
  authorSlug: z.string().optional(),
  /** Display name of the author(s). */
  author: z.string(),
  /** Approximate composition year (negative = BCE). */
  composedYear: z.number().optional(),
  /** Short description of what this text covers. */
  description: z.string(),
  /** Optional reading guidance specific to this item (ordering tips, what to focus on). */
  note: z.string().optional(),
});
export type CurriculumItem = z.infer<typeof CurriculumItemSchema>;

// ── Dependency ────────────────────────────────────────────────────────────────
// A directed prereq edge: `from` should be read before `to`.
// Both reference CurriculumItem ids within the same curriculum.

export const DependencySchema = z.object({
  from: z.string(),
  to: z.string(),
  /** Optional explanation of why this prereq relationship holds. */
  note: z.string().optional(),
});
export type Dependency = z.infer<typeof DependencySchema>;

// ── Curriculum ────────────────────────────────────────────────────────────────
// Top-level entity. Designed to map cleanly to a DB table when the time comes:
//   - id / slug become the primary/unique key
//   - stages / items / dependencies become child tables with curriculum_id FK
//   - scalar fields map 1:1 to columns

export const CurriculumSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  tagline: z.string(),
  description: z.string(),
  level: CurriculumLevelSchema,
  estimatedDuration: z.string(),
  stages: z.array(CurriculumStageSchema),
  items: z.array(CurriculumItemSchema),
  dependencies: z.array(DependencySchema),
  /** Long-form rationale for why this sequence and these texts were chosen. */
  justification: z.string(),
  createdAt: z.string().datetime(),
});
export type Curriculum = z.infer<typeof CurriculumSchema>;
