import { describe, expect, it } from 'vitest';
import { formatInference, parseInference } from '../indian-parser';

describe('indian-parser', () => {
  it('parses the canonical smoke-on-the-mountain inference', () => {
    const r = parseInference([
      'paksha:   the mountain',
      'sadhya:   fiery',
      'hetu:     smoky',
      'sapaksha: kitchen, forge',
      'vipaksha: lake, dewy ground',
    ].join('\n'));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.inference.paksha).toBe('the mountain');
    expect(r.inference.sadhya).toBe('fiery');
    expect(r.inference.hetu).toBe('smoky');
    expect(r.inference.pakshaHasHetu).toBe(true);
    expect(r.inference.examples).toHaveLength(4);
    expect(r.inference.examples[0]).toEqual({ name: 'kitchen', hasHetu: true, side: 'sapaksha' });
    expect(r.inference.examples[3]).toEqual({ name: 'dewy ground', hasHetu: false, side: 'vipaksha' });
  });

  it('respects + / - markers on examples', () => {
    const r = parseInference([
      'paksha: x',
      'sadhya: y',
      'hetu:   z',
      'sapaksha: a, b-',
      'vipaksha: c, d+',
    ].join('\n'));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const ex = Object.fromEntries(r.inference.examples.map(e => [e.name, e.hasHetu]));
    expect(ex.a).toBe(true);   // sapakṣa default +
    expect(ex.b).toBe(false);  // sapakṣa with explicit −
    expect(ex.c).toBe(false);  // vipakṣa default −
    expect(ex.d).toBe(true);   // vipakṣa with explicit +
  });

  it('flips pakshaHasHetu when paksha has trailing −', () => {
    const r = parseInference('paksha: the lake -\nsadhya: fiery\nhetu: smoky');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.inference.paksha).toBe('the lake');
    expect(r.inference.pakshaHasHetu).toBe(false);
  });

  it('accepts (no hetu) as the negative pakṣa marker', () => {
    const r = parseInference('paksha: the lake (no hetu)\nsadhya: fiery\nhetu: smoky');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.inference.paksha).toBe('the lake');
    expect(r.inference.pakshaHasHetu).toBe(false);
  });

  it('reports a parse error when paksha is missing', () => {
    const r = parseInference('sadhya: y\nhetu: z');
    expect(r.ok).toBe(false);
  });

  it('reports a parse error on a duplicate key', () => {
    const r = parseInference('paksha: a\nsadhya: b\nhetu: c\npaksha: d');
    expect(r.ok).toBe(false);
  });

  it('reports a parse error when an empty value is required', () => {
    const r = parseInference('paksha:\nsadhya: y\nhetu: z');
    expect(r.ok).toBe(false);
  });

  it('skips comment lines and blank lines', () => {
    const r = parseInference([
      '# pratijñā',
      'paksha: the mountain',
      '',
      'sadhya: fiery',
      'hetu:   smoky',
    ].join('\n'));
    expect(r.ok).toBe(true);
  });

  it('round-trips through formatInference', () => {
    const src = [
      'paksha:   the mountain',
      'sadhya:   fiery',
      'hetu:     smoky',
      'sapaksha: kitchen, forge',
      'vipaksha: lake, dewy ground',
    ].join('\n');
    const r = parseInference(src);
    if (!r.ok) throw new Error('parse failed');
    const reparsed = parseInference(formatInference(r.inference));
    expect(reparsed.ok).toBe(true);
    if (!reparsed.ok) return;
    expect(reparsed.inference).toEqual(r.inference);
  });
});
