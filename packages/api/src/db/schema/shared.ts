// Shared TypeScript literal types for all enum columns.
// The Postgres schema uses pgEnum (DB-enforced); the SQLite schema uses
// text.$type<EnumLiteral>() (TypeScript-enforced only).
// Both resolve to the same runtime values and the same TypeScript types for rows.

export type WorkType =
  | 'treatise' | 'dialogue' | 'essay' | 'letter' | 'fragment'
  | 'commentary' | 'poem' | 'speech' | 'collection' | 'other';

export type DateCertainty = 'exact' | 'circa' | 'range' | 'flourished' | 'unknown';

export type SchoolRole = 'founder' | 'member' | 'student' | 'critic' | 'associated';

export type InfluenceType = 'direct' | 'indirect' | 'critical' | 'revival';

export type NoteType = 'summary' | 'interpretation' | 'quote' | 'context' | 'bibliography' | 'other';

export type NoteSource = 'manual' | 'api' | 'seed';
