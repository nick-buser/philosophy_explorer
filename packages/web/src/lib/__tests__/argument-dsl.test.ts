import { describe, it, expect } from 'vitest';
import { parseFol } from '../../logic/fol-parser';
import { parseArgument } from '../../logic/nd-parser';
import { parseAristotelian } from '../../logic/aristotelian-parser';
import { renderUnicode } from '../../logic/fol-render';
import { folToDsl, ndToDsl, aristotelianToDsl, formalizationToDsl } from '../argument-dsl';
import type { Formalization } from '../argument-types';

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
});

describe('formalizationToDsl dispatch', () => {
  it('serializes wired formalisms and returns null for the rest', () => {
    const fol = parseFol('p -> p');
    if (!fol.ok) throw new Error('fixture parse failed');
    const folFormalization: Formalization = { ...base, formalism: 'fol', ast: { formula: fol.formula } };
    expect(formalizationToDsl(folFormalization)).toBe('p → p');

    const kripkeFormalization: Formalization = { ...base, formalism: 'kripke', ast: { box: 'p' } };
    expect(formalizationToDsl(kripkeFormalization)).toBeNull();
  });
});
