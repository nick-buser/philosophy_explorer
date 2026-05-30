#!/usr/bin/env node
// Convert claim_extractor extractions into an Arguments seed JSON.
//
// Reads:  ../claim_extractor/extractions/<author>/<work>/<NNN>-<slug>.json
// Writes: data/seed/arguments.json
//
// The output is a flat list of ArgumentSeed records. The F# seeder consumes it
// in Db/Seed.fs. AST payloads are passed through verbatim — they're the same
// TS-mirrored shape the Logic Lab parses, so no translation here.
//
// Clause/formalism mapping (whole-AST, position-aligned):
//   fol            : 1 clause, role 'claim'
//   nd             : N premises + 1 conclusion → roles 'premise'×N, 'conclusion'
//   aristotelian   : syllogism → major/minor/conclusion (3); proposition → 1 'claim'
//   dialogical     : 1 synthetic clause role 'composite' (UI renders moves from AST)
//
// The argument id is the extraction_id verbatim (e.g.
// "plato/meno/001-virtue-same-in-all") — globally unique, stable, and
// human-readable. The API serves it via a catch-all route so the slashes
// are fine in the URL. Child-row ids are derived from it deterministically
// so the seed is idempotent.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO = resolve(__dirname, '..');
const EXTRACTIONS_DIR = resolve(REPO, '..', 'claim_extractor', 'extractions');
const WORKS_SEED = resolve(REPO, 'data', 'seed', 'works.json');
const PHILOSOPHERS_SEED = resolve(REPO, 'data', 'seed', 'philosophers.json');
const OUT = resolve(REPO, 'data', 'seed', 'arguments.json');

function findExtractions(root) {
  const out = [];
  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (st.isFile() && entry.endsWith('.json')) out.push(p);
    }
  }
  walk(root);
  return out.sort();
}

function loadWorkSlugs() {
  const works = JSON.parse(readFileSync(WORKS_SEED, 'utf8'));
  return new Set(works.map(w => w.slug));
}

function loadPhilosopherSlugs() {
  const phils = JSON.parse(readFileSync(PHILOSOPHERS_SEED, 'utf8'));
  return phils.map(p => p.slug);
}

// claim_extractor uses short author slugs ('russell', 'spinoza'); the
// philosophers seed uses full-name slugs ('bertrand-russell', 'baruch-spinoza').
// Resolve by exact match, then by a *unique* '-<authorSlug>' suffix. Ambiguous
// (>1 match) or absent → null, and the caller emits no attribution.
function resolvePhilosopherSlug(authorSlug, slugs) {
  if (slugs.includes(authorSlug)) return authorSlug;
  const matches = slugs.filter(s => s.endsWith('-' + authorSlug));
  return matches.length === 1 ? matches[0] : null;
}

// Resolve a claim_extractor work_id like "plato/meno" against the works.json
// slug list. The work slug is the second segment of the work_id.
function resolveWorkSlug(workId, knownSlugs) {
  const parts = workId.split('/');
  if (parts.length !== 2) return null;
  const slug = parts[1];
  return knownSlugs.has(slug) ? slug : null;
}

// Clause layout per formalism. Clauses are the positional "standard form" rows
// the UI aligns to the AST. nd and (syllogistic) aristotelian decompose into
// premises + conclusion; everything else carries a single load-bearing clause
// (role 'claim', or 'composite' for dialogical where the UI renders moves from
// the AST). The single-clause formalisms mirror how 'fol' is handled.
function clausesFor(primary) {
  const out = [];
  const push = (role, position) =>
    out.push({ role, position, verbalText: null, sourceExcerpt: null });

  switch (primary.formalism) {
    case 'nd': {
      const n = primary.argument.premises.length;
      for (let i = 0; i < n; i++) push('premise', i);
      push('conclusion', n);
      return out;
    }
    case 'aristotelian':
      if (primary.formula.kind === 'syllogism') {
        push('premise', 0);   // major
        push('premise', 1);   // minor
        push('conclusion', 2);
      } else {
        push('claim', 0);
      }
      return out;
    case 'dialogical':
      // One synthetic clause; the UI renders the move list from the AST.
      push('composite', 0);
      return out;
    // Single-clause formalisms — the AST carries the whole structure and the
    // UI renders it via the matching Logic Lab renderer (or a JSON fallback).
    case 'fol':
    case 'boolean':
    case 'frege':
    case 'medieval':
    case 'kripke':
    case 'epistemic':
    case 'intuitionistic':
    case 'temporal':
    case 'ctl':
    case 'eg':
    case 'indian':
    case 'resolution':
      push('claim', 0);
      return out;
    default:
      throw new Error(`Unknown formalism: ${primary.formalism}`);
  }
}

// Pull the inner AST payload that the F# side stores verbatim as ast_json. Each
// formalism's payload is kept exactly as-shipped from claim_extractor (keys
// mirror schemas/extraction.py's PrimaryExtraction members) so the existing
// Logic Lab parsers/renderers consume it without translation. Optional members
// (model / trace / proof) are normalized to null when absent.
function astFor(primary) {
  switch (primary.formalism) {
    // formula-only
    case 'fol':           return { formula:   primary.formula };
    case 'boolean':       return { formula:   primary.formula };
    case 'frege':         return { formula:   primary.formula };
    case 'medieval':      return { formula:   primary.formula };
    case 'aristotelian':  return { formula:   primary.formula };
    // formula + optional model
    case 'kripke':        return { formula:   primary.formula, model: primary.model ?? null };
    case 'epistemic':     return { formula:   primary.formula, model: primary.model ?? null };
    case 'intuitionistic':return { formula:   primary.formula, model: primary.model ?? null };
    case 'ctl':           return { formula:   primary.formula, model: primary.model ?? null };
    // formula + optional trace
    case 'temporal':      return { formula:   primary.formula, trace: primary.trace ?? null };
    // bespoke payload keys
    case 'nd':            return { argument:  primary.argument, proof: primary.proof ?? null };
    case 'dialogical':    return { dialogue:  primary.dialogue };
    case 'eg':            return { graph:     primary.graph };
    case 'indian':        return { inference: primary.inference };
    case 'resolution':    return { program:   primary.program };
    default:
      throw new Error(`Unknown formalism: ${primary.formalism}`);
  }
}

function build() {
  const knownSlugs = loadWorkSlugs();
  const philSlugs = loadPhilosopherSlugs();
  const paths = findExtractions(EXTRACTIONS_DIR);
  console.log(`Found ${paths.length} extractions under ${EXTRACTIONS_DIR}`);

  const out = [];
  for (const p of paths) {
    let extraction;
    try {
      extraction = JSON.parse(readFileSync(p, 'utf8'));
    } catch (e) {
      console.warn(`  ! skipping unreadable JSON: ${p} — ${e.message}`);
      continue;
    }

    const id = extraction.extraction_id;
    const workSlug = resolveWorkSlug(extraction.work_id, knownSlugs);
    if (workSlug === null) {
      console.warn(`  ~ no matching work for ${extraction.work_id} (extraction ${extraction.extraction_id}) — work_id will be null`);
    }

    const clauses = clausesFor(extraction.primary);
    const primaryAst = astFor(extraction.primary);

    const formalizations = [
      {
        formalism: extraction.primary.formalism,
        isPrimary: true,
        reason: null,
        distortionRisk: null,
        fitScore: null,
        astJson: JSON.stringify(primaryAst),
      },
    ];

    const assessments = (extraction.secondary_assessments ?? []).map(a => ({
      formalism: a.formalism,
      fitScore: a.fit_score,
      reason: a.reason,
      distortionRisk: a.distortion_risk ?? null,
    }));

    // Auto-attribution: extraction_id is "<author-slug>/<work-slug>/<NNN>-...",
    // so the first segment is the philosopher slug. The seeder resolves it
    // against the philosophers table; unknown slugs cause the attribution row
    // to be skipped with a warning (the argument still seeds without it).
    const authorSlug = extraction.work_id.split('/')[0];
    const philSlug = resolvePhilosopherSlug(authorSlug, philSlugs);
    const attributions = [];
    if (philSlug) {
      attributions.push({
        philosopherSlug: philSlug,
        workSlug: workSlug ?? '',
        formalizationLabel: 'primary',
        provenance: 'auto',
        sourceText: extraction.source_span.excerpt ?? null,
        note: null,
      });
    } else {
      console.warn(`  ~ no philosopher matches author slug '${authorSlug}' for ${extraction.extraction_id} — no attribution emitted`);
    }

    out.push({
      id,
      extractionId: extraction.extraction_id,
      origin: 'import',
      workSlug,
      sourceFile: extraction.source_span.file,
      sourceStartLine: extraction.source_span.start_line,
      sourceEndLine: extraction.source_span.end_line,
      sourceExcerpt: extraction.source_span.excerpt,
      intent: extraction.intent,
      extractorNote: extraction.extractor_note ?? null,
      clauses,
      formalizations,
      assessments,
      reviewerNotes: extraction.reviewer_notes ?? [],
      attributions,
    });
  }

  out.sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  console.log(`Wrote ${out.length} arguments → ${OUT}`);
}

build();
