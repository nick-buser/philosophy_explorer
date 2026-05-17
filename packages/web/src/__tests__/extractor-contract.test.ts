/**
 * Cross-repo contract test: parse every claim_extractor extraction through the
 * matching Logic Lab parser/renderer/validity check. The point is not to
 * re-validate the JSON (claim_extractor's pydantic schema already does that) —
 * it's to confirm the Logic Lab side never silently accepts something the
 * extractor produced, so type/parser drift between the two repos surfaces here
 * instead of in production rendering.
 *
 * Skipped (not failed) when the sibling repo is absent — e.g. CI without a
 * checkout. Set EXTRACTIONS_DIR to override the default path.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';

import type { FolFormula } from '../logic/fol-types';
import { freeVars } from '../logic/fol-types';
import { renderUnicode } from '../logic/fol-render';
import { formulaKey } from '../logic/nd-types';
import type { AristotelianFormula, Syllogism } from '../logic/aristotelian-types';
import { checkSyllogism } from '../logic/aristotelian-validity';
import { DIALOGUE_ACTS } from '../lib/argument-types';

const EXTRACTIONS_DIR =
  process.env.EXTRACTIONS_DIR ??
  resolve(homedir(), 'Projects/personal_coding/claim_extractor/extractions');

function walk(root: string): string[] {
  const out: string[] = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop()!;
    for (const ent of readdirSync(dir)) {
      const p = join(dir, ent);
      const s = statSync(p);
      if (s.isDirectory()) stack.push(p);
      else if (ent.endsWith('.json')) out.push(p);
    }
  }
  return out;
}

type Extraction = {
  extraction_id: string;
  primary:
    | { formalism: 'fol'; formula: FolFormula }
    | { formalism: 'nd'; argument: { premises: FolFormula[]; conclusion: FolFormula }; proof: FitchProofLike | null }
    | { formalism: 'aristotelian'; formula: AristotelianFormula }
    | { formalism: 'dialogical'; dialogue: { participants: string[]; moves: DialogueMoveLike[] } };
};

type FitchProofLike = {
  lines: { lineNo: number; depth: number; cites: (number | [number, number])[] }[];
  conclusionLine: number;
};

type DialogueMoveLike = {
  move_no: number;
  speaker: string;
  act: string;
  content: string;
  cites: number[];
};

const haveExtractor = existsSync(EXTRACTIONS_DIR);
const describeIf = haveExtractor ? describe : describe.skip;

describeIf(`extractor contract (${EXTRACTIONS_DIR})`, () => {
  const paths = haveExtractor ? walk(EXTRACTIONS_DIR) : [];

  it('finds at least one extraction', () => {
    expect(paths.length).toBeGreaterThan(0);
  });

  it.each(paths.map(p => [p.replace(EXTRACTIONS_DIR + '/', ''), p]))(
    '%s parses + Logic-Lab-accepts',
    (_label, path) => {
      const raw = readFileSync(path, 'utf8');
      const ext = JSON.parse(raw) as Extraction;

      switch (ext.primary.formalism) {
        case 'fol': {
          // renderUnicode and freeVars are total over a structurally valid FolFormula —
          // throwing means the extractor produced something Logic Lab can't process.
          const rendered = renderUnicode(ext.primary.formula);
          expect(rendered).toBeTruthy();
          expect(() => freeVars(ext.primary.formula as FolFormula)).not.toThrow();
          break;
        }
        case 'nd': {
          for (const p of ext.primary.argument.premises) expect(formulaKey(p)).toBeTruthy();
          expect(formulaKey(ext.primary.argument.conclusion)).toBeTruthy();

          // Proof shape (when present): every cite must reference an earlier line,
          // and conclusionLine must be a real line. The full prover isn't run here.
          const proof = ext.primary.proof;
          if (proof) {
            const lineNos = new Set(proof.lines.map(l => l.lineNo));
            expect(lineNos.has(proof.conclusionLine)).toBe(true);
            for (const line of proof.lines) {
              for (const c of line.cites) {
                const lo = Array.isArray(c) ? c[0] : c;
                const hi = Array.isArray(c) ? c[1] : c;
                expect(lo, `line ${line.lineNo} cites ${lo} which is not earlier`).toBeLessThan(
                  line.lineNo,
                );
                expect(hi).toBeLessThan(line.lineNo);
              }
            }
          }
          break;
        }
        case 'aristotelian': {
          if (ext.primary.formula.kind === 'syllogism') {
            const s: Syllogism = ext.primary.formula.syllogism;
            const result = checkSyllogism(s);
            // We don't require *valid*: the extractor may legitimately record
            // a syllogism a passage gestures at without endorsing it. We do
            // require the lookup to be defined — i.e. mood-figure is a real
            // 64-entry combination the table knows about, not something that
            // would silently fall through.
            expect(result, `syllogism lookup returned nothing for ${s.mood}-${s.figure}`).toBeTruthy();
          }
          // Single-proposition extractions are structurally trivial — the
          // pydantic schema already enforced form ∈ AEIO.
          break;
        }
        case 'dialogical': {
          const participants = new Set(ext.primary.dialogue.participants);
          for (const m of ext.primary.dialogue.moves) {
            expect(
              (DIALOGUE_ACTS as readonly string[]).includes(m.act),
              `move ${m.move_no} has act '${m.act}' which is not in DIALOGUE_ACTS`,
            ).toBe(true);
            expect(participants.has(m.speaker)).toBe(true);
          }
          break;
        }
      }
    },
  );
});
