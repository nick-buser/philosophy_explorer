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
import type { BoolFormula } from '../logic/boolean-types';
import { canonicalKey as boolCanonicalKey } from '../logic/boolean-types';
import type { EgNode } from '../logic/eg-ast';
import { collectHooks } from '../logic/eg-ast';
import { egToFol } from '../logic/eg-fol';
import type { ModalFormula, KripkeModel } from '../logic/kripke-types';
import { renderUnicode as renderModal } from '../logic/kripke-render';
import type { MedievalFormula } from '../logic/medieval-types';
import { checkModalSyllogism } from '../logic/medieval-validity';
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

// Hooks referenced inside `eq` nodes (left + right). Used by the eg contract
// check below — every identity-line side should appear on some atom too.
function collectEqHooks(n: EgNode): string[] {
  const out: string[] = [];
  function walk(node: EgNode): void {
    if (node.kind === 'eq') {
      out.push(node.left, node.right);
      return;
    }
    if (node.kind === 'atom') return;
    for (const c of node.children) walk(c);
  }
  walk(n);
  return out;
}

type Extraction = {
  extraction_id: string;
  primary:
    | { formalism: 'fol'; formula: FolFormula }
    | { formalism: 'nd'; argument: { premises: FolFormula[]; conclusion: FolFormula }; proof: FitchProofLike | null }
    | { formalism: 'aristotelian'; formula: AristotelianFormula }
    | { formalism: 'boolean'; formula: BoolFormula }
    | { formalism: 'eg'; graph: EgNode }
    | { formalism: 'kripke'; formula: ModalFormula; model: KripkeModel | null }
    | { formalism: 'medieval'; formula: MedievalFormula }
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
          const formula = ext.primary.formula;
          const rendered = renderUnicode(formula);
          expect(rendered).toBeTruthy();
          expect(() => freeVars(formula)).not.toThrow();
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
        case 'boolean': {
          // canonicalKey is total over a structurally valid BoolFormula —
          // throwing means the extractor's kind tag drifted from the TS union.
          expect(boolCanonicalKey(ext.primary.formula)).toBeTruthy();
          break;
        }
        case 'kripke': {
          // renderUnicode is total over ModalFormula.
          expect(renderModal(ext.primary.formula)).toBeTruthy();
          // If a model is attached, every edge endpoint must be a known world,
          // and the designated world (if set) must exist. Cheap structural
          // sanity that pydantic doesn't do.
          const model = ext.primary.model;
          if (model) {
            const worldIds = new Set(model.worlds.map(w => w.id));
            for (const e of model.edges) {
              expect(worldIds.has(e.from), `edge ${e.from}->${e.to} references unknown 'from'`).toBe(true);
              expect(worldIds.has(e.to), `edge ${e.from}->${e.to} references unknown 'to'`).toBe(true);
            }
            if (model.designated) {
              expect(worldIds.has(model.designated)).toBe(true);
            }
          }
          break;
        }
        case 'eg': {
          // egToFol is total over a structurally valid EgNode and is the
          // strongest cross-check we have — if the AST drifted, this
          // translation either throws or returns a malformed FolFormula.
          const fol = egToFol(ext.primary.graph);
          expect(fol).toBeTruthy();
          // Every hook referenced inside an `eq` node should also appear as a
          // hook on at least one atom — a line of identity that doesn't
          // connect to a predicate is meaningless. Symmetric across both eq
          // sides; we collect once and check membership.
          const allHooks = new Set(collectHooks(ext.primary.graph));
          const eqHooks = collectEqHooks(ext.primary.graph);
          for (const h of eqHooks) {
            expect(
              allHooks.has(h),
              `eq references line of identity '${h}' that no atom hooks`,
            ).toBe(true);
          }
          break;
        }
        case 'medieval': {
          const formula = ext.primary.formula;
          if (formula.kind === 'modal-syllogism') {
            const result = checkModalSyllogism(formula.syllogism);
            // We don't require validity (Buridan deliberately writes invalid
            // modal syllogisms as counter-examples). We do require the
            // validity engine to return a defined verdict — non-undefined
            // means the (modalMood, figure, reading, assertoricMood) tuple
            // is recognized, not silently falling through.
            expect(result, `checkModalSyllogism returned undefined`).toBeTruthy();
          }
          if (formula.kind === 'sorites') {
            // Pydantic already enforced premises.length >= 3; nothing further
            // to check structurally that's worth a contract test.
            expect(formula.chain.premises.length).toBeGreaterThanOrEqual(3);
          }
          // modal-proposition is structurally trivial after pydantic parse.
          break;
        }
      }
    },
  );
});
