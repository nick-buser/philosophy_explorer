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
import type { FregeFormula, FregeContent } from '../logic/frege-types';
import { orderOf } from '../logic/frege-types';
import { fregeToUnicode } from '../logic/frege-fol';
import type { ModalFormula, KripkeModel } from '../logic/kripke-types';
import { renderUnicode as renderModal } from '../logic/kripke-render';
import type { EpistemicFormula, EpistemicModel } from '../logic/epistemic-types';
import { renderUnicodeE } from '../logic/epistemic-render';
import { intuitionisticDiagnostics } from '../logic/intuitionistic-frames';
import type { TemporalFormula, Trace } from '../logic/temporal-types';
import { renderUnicodeT } from '../logic/temporal-render';
import type { MedievalFormula } from '../logic/medieval-types';
import { checkModalSyllogism } from '../logic/medieval-validity';
import type { CtlFormula } from '../logic/ctl-types';
import { renderUnicodeCtl } from '../logic/ctl-render';
import type { Inference } from '../logic/indian-types';
import { fiveSteps } from '../logic/indian-render';
import { classify as classifyIndian } from '../logic/indian-engine';
import type { Program } from '../logic/resolution-types';
import { formatClause, formatRule, formatGoal, atomHasFunctor } from '../logic/resolution-types';
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
    | { formalism: 'frege'; formula: FregeFormula }
    | { formalism: 'kripke'; formula: ModalFormula; model: KripkeModel | null }
    | { formalism: 'epistemic'; formula: EpistemicFormula; model: EpistemicModel | null }
    | { formalism: 'intuitionistic'; formula: ModalFormula; model: KripkeModel | null }
    | { formalism: 'temporal'; formula: TemporalFormula; trace: Trace | null }
    | { formalism: 'medieval'; formula: MedievalFormula }
    | { formalism: 'ctl'; formula: CtlFormula; model: KripkeModel | null }
    | { formalism: 'indian'; inference: Inference }
    | { formalism: 'resolution'; program: Program }
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
        case 'frege': {
          // fregeToUnicode is total over a structurally valid FregeFormula —
          // throwing or returning empty means the extractor's kind tags
          // (judgment/content + atom/not/cond/iden/forall/exists) drifted
          // from the TS union.
          const formula = ext.primary.formula;
          expect(fregeToUnicode(formula)).toBeTruthy();
          // orderOf returns the propositional/first-order/higher-order chip
          // value the Lab UI surfaces. Any new content kind that the
          // extractor produces would either fall through the switch
          // (returning the default 'propositional' even when quantified) or
          // throw — running it here surfaces that drift.
          const order = orderOf(formula);
          expect(['propositional', 'first-order', 'higher-order']).toContain(order);
          // Cross-check the order tag against the body's quantifier content
          // by walking it ourselves. If `orderOf` ever drifts from the
          // mirrored AST shape, the two walks disagree.
          let observed: 'propositional' | 'first-order' | 'higher-order' = 'propositional';
          function walk(c: FregeContent): void {
            switch (c.kind) {
              case 'atom': return;
              case 'not':  walk(c.body); return;
              case 'cond': walk(c.antecedent); walk(c.consequent); return;
              case 'iden': walk(c.left); walk(c.right); return;
              case 'forall':
              case 'exists':
                if (c.sort === 'predicate') observed = 'higher-order';
                else if (observed !== 'higher-order') observed = 'first-order';
                walk(c.body);
                return;
            }
          }
          walk(formula.body);
          expect(order).toBe(observed);
          break;
        }
        case 'epistemic': {
          // renderUnicodeE is total over a structurally valid EpistemicFormula —
          // throwing means the extractor's kind tags
          // (atom/not/know/consider/and/or/implies/iff) drifted from the TS
          // union or an agent-indexed operator is missing its `agent` field.
          const rendered = renderUnicodeE(ext.primary.formula);
          expect(rendered).toBeTruthy();
          // Every know/consider node carries an agent string — empty agents
          // would render as bare 'K' / 'M' and break the per-agent palette
          // on the Lab side, so reject them as structurally invalid for
          // cross-repo purposes.
          function walkAgents(n: EpistemicFormula): void {
            switch (n.kind) {
              case 'atom':     return;
              case 'not':      walkAgents(n.body); return;
              case 'know':
              case 'consider':
                expect(n.agent.length, `${n.kind} node has empty agent`).toBeGreaterThan(0);
                walkAgents(n.body);
                return;
              case 'and':
              case 'or':
              case 'implies':
              case 'iff':
                walkAgents(n.left);
                walkAgents(n.right);
                return;
            }
          }
          walkAgents(ext.primary.formula);
          // If a model is attached, every edge endpoint must be a known
          // world, the designated world (if set) must exist, and every edge
          // agent must appear in the declared roster. The TS side silently
          // ignores edges referencing undeclared agents at eval time; the
          // contract check is stricter because that drift would be invisible
          // to consumers otherwise.
          const model = ext.primary.model;
          if (model) {
            const worldIds = new Set(model.worlds.map(w => w.id));
            const agents = new Set(model.agents);
            for (const e of model.edges) {
              expect(worldIds.has(e.from), `edge ${e.from}->${e.to} references unknown 'from'`).toBe(true);
              expect(worldIds.has(e.to), `edge ${e.from}->${e.to} references unknown 'to'`).toBe(true);
              expect(
                agents.has(e.agent),
                `edge ${e.from}->${e.to} references undeclared agent '${e.agent}'`,
              ).toBe(true);
            }
            if (model.designated) {
              expect(worldIds.has(model.designated)).toBe(true);
            }
          }
          break;
        }
        case 'intuitionistic': {
          // Intuitionistic reuses the kripke ModalFormula AST on the TS side
          // but the Pydantic mirror forbids box/dia (no intuitionistic
          // reading). Cross-check that here: renderModal accepts every
          // ModalFormula, but a well-formed intuitionistic extraction must
          // not contain a box or dia node.
          const formula = ext.primary.formula;
          expect(renderModal(formula)).toBeTruthy();
          function containsModal(n: ModalFormula): boolean {
            switch (n.kind) {
              case 'atom':    return false;
              case 'box':
              case 'dia':     return true;
              case 'not':     return containsModal(n.body);
              case 'and':
              case 'or':
              case 'implies':
              case 'iff':     return containsModal(n.left) || containsModal(n.right);
            }
          }
          expect(
            containsModal(formula),
            'intuitionistic extraction contains box/dia — those have no intuitionistic reading',
          ).toBe(false);
          // If a model is attached we don't require it to be a valid
          // intuitionistic frame (reflexive + transitive + monotone) — the
          // Lab can close it on the fly — but we do run the diagnostics so
          // a drift in the diagnostic shape surfaces here. World endpoints
          // are still required to be well-formed.
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
            const diag = intuitionisticDiagnostics(model);
            expect(typeof diag.isValidFrame).toBe('boolean');
          }
          break;
        }
        case 'temporal': {
          // renderUnicodeT is total over a structurally valid TemporalFormula
          // — throwing means the kind discriminator
          // (atom/not/and/or/implies/iff/next/eventually/always/until)
          // drifted from the TS union.
          expect(renderUnicodeT(ext.primary.formula)).toBeTruthy();
          // The Pydantic mirror enforces lasso-trace invariants
          // (0 ≤ loopBack < states.length, non-empty states, 0 ≤ start <
          // states.length). Re-check here so a TS-side change to those
          // invariants surfaces on the contract boundary instead of in
          // production rendering.
          const trace = ext.primary.trace;
          if (trace) {
            const n = trace.states.length;
            expect(n).toBeGreaterThan(0);
            expect(trace.loopBack).toBeGreaterThanOrEqual(0);
            expect(trace.loopBack).toBeLessThan(n);
            if (trace.start !== undefined && trace.start !== null) {
              expect(trace.start).toBeGreaterThanOrEqual(0);
              expect(trace.start).toBeLessThan(n);
            }
            // State ids must be unique — duplicate ids would silently
            // collapse states on the visualization side.
            const ids = new Set(trace.states.map(s => s.id));
            expect(ids.size).toBe(n);
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
        case 'ctl': {
          // renderUnicodeCtl is total over a structurally valid CtlFormula —
          // throwing means the discriminator (the propositional kinds plus the
          // uppercase path-quantified operators AX/EX/AF/EF/AG/EG/AU/EU)
          // drifted from the TS union.
          expect(renderUnicodeCtl(ext.primary.formula)).toBeTruthy();
          // CTL reuses KripkeModel. If a model is attached, every edge
          // endpoint must be a known world and the designated world (if set)
          // must exist. CTL evaluation expects a *serial* frame (every state
          // has a successor), but a non-serial model is a legitimate payload
          // for a passage that argues about closing the frame — seriality is
          // a Lab-side diagnostic (ctlAxiomVerdicts), not a contract invariant.
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
        case 'indian': {
          // fiveSteps builds the canonical pañcāvayava (the five-membered
          // Nyāya inference) and is total over a structurally valid
          // Inference. It must return exactly five steps in ordinal order —
          // a drift in the Inference field names would throw or misbuild.
          const steps = fiveSteps(ext.primary.inference);
          expect(steps.map(s => s.ordinal)).toEqual([1, 2, 3, 4, 5]);
          // classify runs trairūpya and places the hetu on Dignāga's
          // nine-cell wheel. Invoke it so a drift in the Inference shape
          // surfaces here; the verdict must be one of the four kinds the
          // engine emits (an unrecognised kind would mean the engine and
          // the mirror disagree on the wheel).
          const { verdict } = classifyIndian(ext.primary.inference);
          expect(['valid', 'inconclusive', 'contradictory', 'unestablished']).toContain(
            verdict.kind,
          );
          // Every example sits on a declared side. The engine's hetu counts
          // silently skip an example whose `side` it doesn't recognise, so a
          // drift in the ExampleSide tag would otherwise vanish — pydantic
          // enforces the literal, and the contract re-checks it on the joint.
          for (const example of ext.primary.inference.examples) {
            expect(
              ['sapaksha', 'vipaksha'],
              `example '${example.name}' has unknown side '${example.side}'`,
            ).toContain(example.side);
          }
          break;
        }
        case 'resolution': {
          // The format* helpers are total renderers over a structurally
          // valid program — throwing means a Term `kind` (var/const/compound)
          // or the `mode` discriminator drifted from the TS union. The empty
          // clause renders as ⊥ and the empty goal as □, both truthy.
          const program = ext.primary.program;
          if (program.mode === 'clauses') {
            for (const c of program.clauses) expect(formatClause(c)).toBeTruthy();
            for (const g of program.goals) expect(formatClause(g)).toBeTruthy();
          } else if (program.mode === 'horn') {
            for (const r of program.rules) expect(formatRule(r)).toBeTruthy();
            expect(formatGoal(program.query)).toBeTruthy();
          } else {
            // datalog. Render every rule, and enforce the function-symbol-
            // free restriction: datalog evaluation (semi-naïve forward
            // chaining) relies on a finite Herbrand base, which a compound
            // functor breaks. The pydantic mirror rejects this at validation;
            // re-checking here catches a drift between the two checks.
            for (const r of program.rules) {
              expect(formatRule(r)).toBeTruthy();
              expect(
                atomHasFunctor(r.head),
                'datalog rule head carries a function symbol',
              ).toBe(false);
              for (const b of r.body) {
                expect(atomHasFunctor(b), 'datalog rule body carries a function symbol').toBe(
                  false,
                );
              }
            }
            if (program.query) {
              for (const a of program.query.atoms) {
                expect(
                  atomHasFunctor(a),
                  'datalog query carries a function symbol',
                ).toBe(false);
              }
            }
          }
          break;
        }
      }
    },
  );
});
