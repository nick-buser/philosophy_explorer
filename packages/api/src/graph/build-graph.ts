/**
 * Converts seed-data.ts and curriculum JSON files into the unified
 * graphology JSON format (graph-data.json).
 *
 * Run: npx tsx src/graph/build-graph.ts
 * Or via package script: npm run graph:build
 */

import { writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Graph from 'graphology';
import {
  schoolsData,
  philosophersData,
  worksData,
  philosopherSchoolsData,
  philosopherInfluencesData,
} from '../data/seed-data.js';
import { nodeKey, edgeKey } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function buildGraph() {
  const graph = new Graph({ type: 'directed', multi: true, allowSelfLoops: false });
  graph.setAttribute('name', 'philosophy-explorer-graph');
  graph.setAttribute('version', '1.0.0');
  graph.setAttribute('builtAt', new Date().toISOString());

  // ── Philosopher nodes ──────────────────────────────────────────────────

  for (const p of philosophersData) {
    const key = nodeKey('Philosopher', p.slug);
    graph.addNode(key, {
      label: 'Philosopher',
      slug: p.slug,
      name: p.name,
      alsoKnownAs: p.alsoKnownAs ?? null,
      bornYear: p.bornYear ?? null,
      bornCertainty: p.bornCertainty,
      diedYear: p.diedYear ?? null,
      diedCertainty: p.diedCertainty,
      nationality: p.nationality ?? null,
      bioShort: p.bioShort ?? null,
    });
  }

  // ── School nodes ───────────────────────────────────────────────────────

  for (const s of schoolsData) {
    const key = nodeKey('School', s.slug);
    graph.addNode(key, {
      label: 'School',
      slug: s.slug,
      name: s.name,
      alsoKnownAs: s.alsoKnownAs ?? null,
      periodStartYear: s.periodStartYear ?? null,
      periodEndYear: s.periodEndYear ?? null,
      periodCertainty: s.periodCertainty,
      description: s.description ?? null,
    });
  }

  // ── Work nodes ─────────────────────────────────────────────────────────

  for (const w of worksData) {
    const key = nodeKey('Work', w.slug);
    graph.addNode(key, {
      label: 'Work',
      slug: w.slug,
      title: w.title,
      originalTitle: w.originalTitle ?? null,
      workType: w.workType,
      composedYear: w.composedYear ?? null,
      composedCertainty: w.composedCertainty ?? 'unknown',
      originalLanguage: w.originalLanguage ?? null,
      descriptionShort: w.descriptionShort ?? null,
      authorSlug: w.philosopherSlug,
    });

    // AUTHORED edge: philosopher → work
    const authorKey = nodeKey('Philosopher', w.philosopherSlug);
    if (graph.hasNode(authorKey)) {
      graph.addEdge(authorKey, key, {
        type: 'AUTHORED',
      });
    }
  }

  // ── MEMBER_OF edges ────────────────────────────────────────────────────

  for (const ps of philosopherSchoolsData) {
    const pKey = nodeKey('Philosopher', ps.philosopherSlug);
    const sKey = nodeKey('School', ps.schoolSlug);
    if (!graph.hasNode(pKey) || !graph.hasNode(sKey)) continue;

    graph.addEdge(pKey, sKey, {
      type: 'MEMBER_OF',
      role: ps.role,
    });
  }

  // ── INFLUENCED edges ───────────────────────────────────────────────────

  for (const inf of philosopherInfluencesData) {
    const srcKey = nodeKey('Philosopher', inf.influencerSlug);
    const tgtKey = nodeKey('Philosopher', inf.influencedSlug);
    if (!graph.hasNode(srcKey) || !graph.hasNode(tgtKey)) continue;

    graph.addEdge(srcKey, tgtKey, {
      type: 'INFLUENCED',
      influenceType: inf.influenceType,
      description: inf.description ?? null,
    });
  }

  // ── Curriculum items & edges ───────────────────────────────────────────

  const curriculaDir = resolve(__dirname, '../../../web/src/data/curricula');
  let curriculumFiles: string[] = [];
  try {
    curriculumFiles = readdirSync(curriculaDir).filter((f) => f.endsWith('.json'));
  } catch {
    console.warn('No curriculum directory found at', curriculaDir);
  }

  for (const file of curriculumFiles) {
    const raw = JSON.parse(readFileSync(resolve(curriculaDir, file), 'utf-8'));
    const slug = raw.slug as string;

    for (const item of raw.items as Array<Record<string, unknown>>) {
      const itemKey = `curriculumitem:${slug}:${item.id as string}`;
      graph.addNode(itemKey, {
        label: 'CurriculumItem',
        curriculumSlug: slug,
        itemId: item.id,
        stageId: item.stageId,
        type: item.type,
        title: item.title,
        author: item.author,
        composedYear: item.composedYear ?? null,
        description: item.description ?? null,
        note: item.note ?? null,
      });

      // REFERENCES_WORK edge
      if (item.workSlug) {
        const workKey = nodeKey('Work', item.workSlug as string);
        if (graph.hasNode(workKey)) {
          graph.addEdge(itemKey, workKey, { type: 'REFERENCES_WORK' });
        }
      }

      // REFERENCES_PHILOSOPHER edge
      if (item.authorSlug) {
        const philKey = nodeKey('Philosopher', item.authorSlug as string);
        if (graph.hasNode(philKey)) {
          graph.addEdge(itemKey, philKey, { type: 'REFERENCES_PHILOSOPHER' });
        }
      }
    }

    // PREREQ_OF edges
    for (const dep of raw.dependencies as Array<{ from: string; to: string; note?: string }>) {
      const fromKey = `curriculumitem:${slug}:${dep.from}`;
      const toKey = `curriculumitem:${slug}:${dep.to}`;
      if (!graph.hasNode(fromKey) || !graph.hasNode(toKey)) continue;

      graph.addEdge(fromKey, toKey, {
        type: 'PREREQ_OF',
        note: dep.note ?? null,
      });
    }
  }

  return graph;
}

// ── CLI entry point ──────────────────────────────────────────────────────────

const graph = buildGraph();

const outPath = resolve(__dirname, '../data/graph-data.json');
const exported = graph.export();
writeFileSync(outPath, JSON.stringify(exported, null, 2));

const stats = {
  nodes: graph.order,
  edges: graph.size,
  byLabel: {} as Record<string, number>,
  byEdgeType: {} as Record<string, number>,
};

graph.forEachNode((_k: string, attrs: Record<string, unknown>) => {
  const l = attrs.label as string;
  stats.byLabel[l] = (stats.byLabel[l] ?? 0) + 1;
});

graph.forEachEdge((_ek: string, attrs: Record<string, unknown>) => {
  const t = attrs.type as string;
  stats.byEdgeType[t] = (stats.byEdgeType[t] ?? 0) + 1;
});

console.log('Graph built successfully:');
console.log(`  Nodes: ${stats.nodes}`);
for (const [label, count] of Object.entries(stats.byLabel)) {
  console.log(`    ${label}: ${count}`);
}
console.log(`  Edges: ${stats.edges}`);
for (const [type, count] of Object.entries(stats.byEdgeType)) {
  console.log(`    ${type}: ${count}`);
}
console.log(`  Written to: ${outPath}`);

export { buildGraph };
