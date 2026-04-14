import { CurriculumSchema, type Curriculum } from '../../lib/curriculum-schema.js';
import ancientGreekRaw from './ancient-greek-foundations.json';

function load(raw: unknown): Curriculum {
  return CurriculumSchema.parse(raw);
}

export const curricula: Curriculum[] = [
  load(ancientGreekRaw),
];

export function getCurriculumBySlug(slug: string): Curriculum | undefined {
  return curricula.find(c => c.slug === slug);
}
