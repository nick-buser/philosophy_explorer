import 'dotenv/config';
import { db, schema } from './index.js';

const {
  users,
  schools,
  philosophers,
  philosopherSchools,
  philosopherInfluences,
  works,
  notes,
} = schema;
import { DEFAULT_USER_ID } from '../lib/default-user.js';
import {
  schoolsData,
  philosophersData,
  philosopherSchoolsData,
  philosopherInfluencesData,
  worksData,
  notesData,
} from '../data/seed-data.js';

async function seed() {
  console.log('Seeding database...');

  // ── Default user ───────────────────────────────────────────────────────────
  await db
    .insert(users)
    .values({ id: DEFAULT_USER_ID, name: 'Default User', email: 'user@example.com' })
    .onConflictDoNothing();
  console.log('  ✓ default user');

  // ── Schools ────────────────────────────────────────────────────────────────
  if (schoolsData.length > 0) {
    await db.insert(schools).values(schoolsData).onConflictDoNothing();
    console.log(`  ✓ schools (${schoolsData.length})`);
  }

  // ── Philosophers ───────────────────────────────────────────────────────────
  if (philosophersData.length > 0) {
    await db.insert(philosophers).values(philosophersData).onConflictDoNothing();
    console.log(`  ✓ philosophers (${philosophersData.length})`);
  }

  // Resolve slugs → IDs for all association inserts
  const allPhilosophers = await db.select({ id: philosophers.id, slug: philosophers.slug }).from(philosophers);
  const allSchools      = await db.select({ id: schools.id, slug: schools.slug }).from(schools);
  const allWorks        = await db.select({ id: works.id, slug: works.slug }).from(works);

  const philosopherBySlug = Object.fromEntries(allPhilosophers.map(p => [p.slug, p.id]));
  const schoolBySlug      = Object.fromEntries(allSchools.map(s => [s.slug, s.id]));

  // ── Philosopher ↔ School associations ─────────────────────────────────────
  const psInserts = philosopherSchoolsData
    .map(({ philosopherSlug, schoolSlug, role }) => {
      const philosopherId = philosopherBySlug[philosopherSlug];
      const schoolId      = schoolBySlug[schoolSlug];
      if (!philosopherId) { console.warn(`  ! unknown philosopher slug: ${philosopherSlug}`); return null; }
      if (!schoolId)      { console.warn(`  ! unknown school slug: ${schoolSlug}`); return null; }
      return { philosopherId, schoolId, role };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (psInserts.length > 0) {
    await db.insert(philosopherSchools).values(psInserts).onConflictDoNothing();
    console.log(`  ✓ philosopher-school associations (${psInserts.length})`);
  }

  // ── Influence relationships ────────────────────────────────────────────────
  const infInserts = philosopherInfluencesData
    .map(({ influencerSlug, influencedSlug, influenceType, description }) => {
      const influencerId = philosopherBySlug[influencerSlug];
      const influencedId = philosopherBySlug[influencedSlug];
      if (!influencerId) { console.warn(`  ! unknown influencer slug: ${influencerSlug}`); return null; }
      if (!influencedId) { console.warn(`  ! unknown influenced slug: ${influencedSlug}`); return null; }
      return { influencerId, influencedId, influenceType, description };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (infInserts.length > 0) {
    await db.insert(philosopherInfluences).values(infInserts).onConflictDoNothing();
    console.log(`  ✓ influence relationships (${infInserts.length})`);
  }

  // ── Works ──────────────────────────────────────────────────────────────────
  const workInserts = worksData
    .map(({ philosopherSlug, ...rest }) => {
      const philosopherId = philosopherBySlug[philosopherSlug];
      if (!philosopherId) { console.warn(`  ! unknown philosopher slug for work "${rest.slug}": ${philosopherSlug}`); return null; }
      return { ...rest, philosopherId };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (workInserts.length > 0) {
    await db.insert(works).values(workInserts).onConflictDoNothing();
    console.log(`  ✓ works (${workInserts.length})`);
  }

  // Refresh works map now that works are inserted
  const freshWorks  = await db.select({ id: works.id, slug: works.slug }).from(works);
  const workBySlug  = Object.fromEntries(freshWorks.map(w => [w.slug, w.id]));

  // ── Seed notes ─────────────────────────────────────────────────────────────
  const noteInserts = notesData
    .map(({ philosopherSlug, schoolSlug, workSlug, ...rest }) => {
      const philosopherId = philosopherSlug ? philosopherBySlug[philosopherSlug] : undefined;
      const schoolId      = schoolSlug      ? schoolBySlug[schoolSlug]           : undefined;
      const workId        = workSlug        ? workBySlug[workSlug]               : undefined;
      if (philosopherSlug && !philosopherId) { console.warn(`  ! unknown philosopher slug for note: ${philosopherSlug}`); return null; }
      if (schoolSlug      && !schoolId)      { console.warn(`  ! unknown school slug for note: ${schoolSlug}`);           return null; }
      if (workSlug        && !workId)        { console.warn(`  ! unknown work slug for note: ${workSlug}`);               return null; }
      return { ...rest, sourceType: 'seed' as const, philosopherId, schoolId, workId };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (noteInserts.length > 0) {
    await db.insert(notes).values(noteInserts).onConflictDoNothing();
    console.log(`  ✓ seed notes (${noteInserts.length})`);
  }

  console.log('Done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
