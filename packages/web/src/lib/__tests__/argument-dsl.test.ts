import { describe, it, expect } from 'vitest';
import { parseFol } from '../../logic/fol-parser';
import { parseArgument } from '../../logic/nd-parser';
import { parseAristotelian } from '../../logic/aristotelian-parser';
import { parseBool } from '../../logic/boolean-parser';
import { parseInference } from '../../logic/indian-parser';
import { parseModal } from '../../logic/kripke-parser';
import { parseCtl } from '../../logic/ctl-parser';
import { parseEpistemic } from '../../logic/epistemic-parser';
import { parseTemporal } from '../../logic/temporal-parser';
import { renderUnicode } from '../../logic/fol-render';
import { renderUnicode as renderBoolUnicode } from '../../logic/boolean-render';
import { renderUnicode as renderModalUnicode } from '../../logic/kripke-render';
import { renderUnicodeCtl } from '../../logic/ctl-render';
import { renderUnicodeE } from '../../logic/epistemic-render';
import { renderUnicodeT } from '../../logic/temporal-render';
import {
  folToDsl, ndToDsl, aristotelianToDsl, booleanToDsl, indianToDsl,
  kripkeToDsl, ctlToDsl, epistemicToDsl, temporalToDsl, intuitionisticToDsl,
  formalizationToDsl,
} from '../argument-dsl';
import type {
  Formalization, KripkeAst, CtlAst, EpistemicAst, TemporalAst, IntuitionisticAst,
} from '../argument-types';

const base = { id: 'f1', isPrimary: true, fitScore: null, reason: null, distortionRisk: null } as const;

describe('argument-dsl serializers round-trip through their parsers', () => {
  it('fol: serialized DSL re-parses to the same formula', () => {
    const p = parseFol('forall x. P(x) -> Q(x)');
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const dsl = folToDsl({ formula: p.formula });
    const p2 = parseFol(dsl);
    expect(p2.ok).toBe(true);
    if (!p2.ok) return;
    expect(renderUnicode(p2.formula)).toBe(renderUnicode(p.formula));
  });

  it('nd: serialized sequent re-parses to the same premises ⊢ conclusion', () => {
    const p = parseArgument('p, p -> q |- q');
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const dsl = ndToDsl({ argument: p.argument, proof: null });
    expect(dsl).toContain('⊢');
    const p2 = parseArgument(dsl);
    expect(p2.ok).toBe(true);
    if (!p2.ok) return;
    expect(p2.argument.premises.map(renderUnicode)).toEqual(p.argument.premises.map(renderUnicode));
    expect(renderUnicode(p2.argument.conclusion)).toBe(renderUnicode(p.argument.conclusion));
  });

  it('nd: zero-premise tautology serializes as `⊢ φ`', () => {
    const p = parseArgument('|- p -> p');
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const dsl = ndToDsl({ argument: p.argument, proof: null });
    expect(dsl.startsWith('⊢')).toBe(true);
    expect(parseArgument(dsl).ok).toBe(true);
  });

  it('aristotelian: syllogism long-form re-parses to the same AST', () => {
    const p = parseAristotelian('All men are mortal\nAll Greeks are men\nTherefore all Greeks are mortal');
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const dsl = aristotelianToDsl({ formula: p.formula });
    const p2 = parseAristotelian(dsl);
    expect(p2.ok).toBe(true);
    if (!p2.ok) return;
    expect(p2.formula).toEqual(p.formula);
  });

  it('aristotelian: single proposition round-trips', () => {
    const p = parseAristotelian('Some swans are not white');
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const dsl = aristotelianToDsl({ formula: p.formula });
    expect(parseAristotelian(dsl)).toEqual(p);
  });

  it('boolean: serialized DSL re-parses to the same formula', () => {
    const p = parseBool('P + ~P');
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const dsl = booleanToDsl({ formula: p.formula });
    const p2 = parseBool(dsl);
    expect(p2.ok).toBe(true);
    if (!p2.ok) return;
    expect(renderBoolUnicode(p2.formula)).toBe(renderBoolUnicode(p.formula));
  });

  it('indian: serialized inference re-parses to the same inference', () => {
    const p = parseInference('paksha: the mountain\nsadhya: fire\nhetu: smoke\nsapaksha: kitchen\nvipaksha: lake');
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const dsl = indianToDsl({ inference: p.inference });
    const p2 = parseInference(dsl);
    expect(p2.ok).toBe(true);
    if (!p2.ok) return;
    expect(p2.inference).toEqual(p.inference);
  });

  // Modal serializers emit only the formula source (the model/trace stays on the
  // argument). Each renderer's Unicode output must re-parse — that's what makes
  // the ?dsl= lab prefill land without a parse error.
  it('kripke: formula DSL round-trips', () => {
    const p = parseModal('[]p -> p');
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const dsl = kripkeToDsl({ formula: p.formula } as KripkeAst);
    const p2 = parseModal(dsl);
    expect(p2.ok).toBe(true);
    if (!p2.ok) return;
    expect(renderModalUnicode(p2.formula)).toBe(renderModalUnicode(p.formula));
  });

  it('intuitionistic: formula DSL round-trips (kripke syntax)', () => {
    const p = parseModal('p -> ~~p');
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const dsl = intuitionisticToDsl({ formula: p.formula } as IntuitionisticAst);
    expect(parseModal(dsl).ok).toBe(true);
  });

  it('ctl: formula DSL round-trips', () => {
    const p = parseCtl('AG (p -> EF q)');
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const dsl = ctlToDsl({ formula: p.formula } as CtlAst);
    const p2 = parseCtl(dsl);
    expect(p2.ok).toBe(true);
    if (!p2.ok) return;
    expect(renderUnicodeCtl(p2.formula)).toBe(renderUnicodeCtl(p.formula));
  });

  it('epistemic: formula DSL round-trips', () => {
    const p = parseEpistemic('K_alice rain');
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const dsl = epistemicToDsl({ formula: p.formula } as EpistemicAst);
    const p2 = parseEpistemic(dsl);
    expect(p2.ok).toBe(true);
    if (!p2.ok) return;
    expect(renderUnicodeE(p2.formula)).toBe(renderUnicodeE(p.formula));
  });

  it('temporal: formula DSL round-trips', () => {
    const p = parseTemporal('G (p -> X q)');
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    const dsl = temporalToDsl({ formula: p.formula } as TemporalAst);
    const p2 = parseTemporal(dsl);
    expect(p2.ok).toBe(true);
    if (!p2.ok) return;
    expect(renderUnicodeT(p2.formula)).toBe(renderUnicodeT(p.formula));
  });
});

describe('formalizationToDsl dispatch', () => {
  it('serializes wired formalisms and returns null for the rest', () => {
    const fol = parseFol('p -> p');
    if (!fol.ok) throw new Error('fixture parse failed');
    const folFormalization: Formalization = { ...base, formalism: 'fol', ast: { formula: fol.formula } };
    expect(formalizationToDsl(folFormalization)).toBe('p → p');

    // resolution has no wired DSL serializer yet → null (generic AST view).
    const genericFormalization: Formalization = { ...base, formalism: 'resolution', ast: { clauses: [] } };
    expect(formalizationToDsl(genericFormalization)).toBeNull();
  });
});
