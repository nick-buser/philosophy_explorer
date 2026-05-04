import { describe, expect, it } from 'vitest';
import { classify } from '../indian-engine';
import { HETU_CAKRA, type Inference } from '../indian-types';

function inf(partial: Partial<Inference>): Inference {
  return {
    paksha: 'the mountain',
    sadhya: 'fiery',
    hetu: 'smoky',
    pakshaHasHetu: true,
    examples: [],
    ...partial,
  };
}

describe('indian-engine — trairūpya', () => {
  it('reports pakṣa-dharmatā satisfied when hetu is in the subject', () => {
    const r = classify(inf({ pakshaHasHetu: true, examples: [
      { name: 'kitchen', hasHetu: true,  side: 'sapaksha' },
      { name: 'lake',    hasHetu: false, side: 'vipaksha' },
    ]}));
    expect(r.trairupya.pakshadharmata.satisfied).toBe(true);
    expect(r.verdict.kind).toBe('valid');
  });

  it('reports pakṣa-dharmatā failure as asiddha — and still places the cell', () => {
    const r = classify(inf({ pakshaHasHetu: false, examples: [
      { name: 'kitchen', hasHetu: true,  side: 'sapaksha' },
      { name: 'lake',    hasHetu: false, side: 'vipaksha' },
    ]}));
    expect(r.trairupya.pakshadharmata.satisfied).toBe(false);
    expect(r.verdict.kind).toBe('unestablished');
    // The wheel cell *would* have been valid, even though the verdict isn't.
    expect(r.verdict.cell.id).toBe('sap-all/vip-none');
  });

  it('treats an empty sapakṣa list as failing sapakṣe-sattvam', () => {
    const r = classify(inf({ examples: [
      { name: 'lake', hasHetu: false, side: 'vipaksha' },
    ]}));
    expect(r.trairupya.sapakshasattva.satisfied).toBe(false);
    expect(r.trairupya.sapakshasattva.count).toBe('none');
  });

  it('treats an empty vipakṣa list as vacuously satisfying vipakṣe-asattva', () => {
    const r = classify(inf({ examples: [
      { name: 'kitchen', hasHetu: true, side: 'sapaksha' },
    ]}));
    expect(r.trairupya.vipakshasattva.satisfied).toBe(true);
    expect(r.trairupya.vipakshasattva.count).toBe('none');
  });
});

describe('indian-engine — hetu-cakra', () => {
  it('classifies sap-all/vip-none as valid (sad-hetu)', () => {
    const r = classify(inf({ examples: [
      { name: 'kitchen', hasHetu: true,  side: 'sapaksha' },
      { name: 'forge',   hasHetu: true,  side: 'sapaksha' },
      { name: 'lake',    hasHetu: false, side: 'vipaksha' },
      { name: 'pond',    hasHetu: false, side: 'vipaksha' },
    ]}));
    expect(r.verdict.kind).toBe('valid');
    expect(r.verdict.cell.id).toBe('sap-all/vip-none');
  });

  it('classifies sap-some/vip-none as valid (eka-deśa)', () => {
    const r = classify(inf({ examples: [
      { name: 'pot',       hasHetu: true,  side: 'sapaksha' },
      { name: 'lightning', hasHetu: false, side: 'sapaksha' },
      { name: 'space',     hasHetu: false, side: 'vipaksha' },
    ]}));
    expect(r.verdict.kind).toBe('valid');
    expect(r.verdict.cell.id).toBe('sap-some/vip-none');
  });

  it('classifies sap-all/vip-all as inconclusive (sādhāraṇa)', () => {
    const r = classify(inf({ examples: [
      { name: 'pot',   hasHetu: true, side: 'sapaksha' },
      { name: 'cloth', hasHetu: true, side: 'sapaksha' },
      { name: 'space', hasHetu: true, side: 'vipaksha' },
      { name: 'time',  hasHetu: true, side: 'vipaksha' },
    ]}));
    expect(r.verdict.kind).toBe('inconclusive');
    expect(r.verdict.cell.id).toBe('sap-all/vip-all');
  });

  it('classifies sap-none/vip-all as contradictory (viruddha)', () => {
    const r = classify(inf({ examples: [
      { name: 'space', hasHetu: false, side: 'sapaksha' },
      { name: 'time',  hasHetu: false, side: 'sapaksha' },
      { name: 'pot',   hasHetu: true,  side: 'vipaksha' },
      { name: 'cloth', hasHetu: true,  side: 'vipaksha' },
    ]}));
    expect(r.verdict.kind).toBe('contradictory');
    expect(r.verdict.cell.id).toBe('sap-none/vip-all');
  });

  it('classifies sap-none/vip-none as inconclusive (asādhāraṇa)', () => {
    const r = classify(inf({ examples: [
      { name: 'pot',   hasHetu: false, side: 'sapaksha' },
      { name: 'cloth', hasHetu: false, side: 'sapaksha' },
      { name: 'space', hasHetu: false, side: 'vipaksha' },
    ]}));
    expect(r.verdict.kind).toBe('inconclusive');
    expect(r.verdict.cell.id).toBe('sap-none/vip-none');
  });
});

describe('hetu-cakra geometry', () => {
  it('has nine cells, two valid, two contradictory, five inconclusive', () => {
    expect(HETU_CAKRA).toHaveLength(9);
    expect(HETU_CAKRA.filter(c => c.status === 'valid')).toHaveLength(2);
    expect(HETU_CAKRA.filter(c => c.status === 'contradictory')).toHaveLength(2);
    expect(HETU_CAKRA.filter(c => c.status === 'inconclusive')).toHaveLength(5);
  });
});
