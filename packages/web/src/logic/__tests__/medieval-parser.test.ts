import { describe, expect, it } from 'vitest';
import { parseMedieval } from '../medieval-parser';

function ok<T>(r: { ok: true; formula: T } | { ok: false; error: { message: string } }): T {
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return r.formula;
}

describe('medieval parser — modal proposition (long form)', () => {
  it('parses an assertoric A as mode X / reading assertoric', () => {
    const f = ok(parseMedieval('All Greeks are Mortal'));
    expect(f.kind).toBe('modal-proposition');
    if (f.kind !== 'modal-proposition') return;
    expect(f.proposition.mode).toBe('X');
    expect(f.proposition.reading).toBe('assertoric');
    expect(f.proposition.base.form).toBe('A');
  });

  it('parses a de-dicto necessity prefix', () => {
    const f = ok(parseMedieval('Necessarily, all S is P'));
    if (f.kind !== 'modal-proposition') throw new Error('kind');
    expect(f.proposition.mode).toBe('L');
    expect(f.proposition.reading).toBe('de-dicto');
    expect(f.proposition.base.form).toBe('A');
  });

  it('parses a de-dicto possibility prefix on an O proposition', () => {
    const f = ok(parseMedieval('Possibly, some S is not P'));
    if (f.kind !== 'modal-proposition') throw new Error('kind');
    expect(f.proposition.mode).toBe('M');
    expect(f.proposition.reading).toBe('de-dicto');
    expect(f.proposition.base.form).toBe('O');
  });

  it('parses a de-re necessity infix', () => {
    const f = ok(parseMedieval('All S is necessarily P'));
    if (f.kind !== 'modal-proposition') throw new Error('kind');
    expect(f.proposition.mode).toBe('L');
    expect(f.proposition.reading).toBe('de-re');
    expect(f.proposition.base.form).toBe('A');
  });

  it('parses a de-re possibility infix on an O proposition', () => {
    const f = ok(parseMedieval('Some S is not possibly P'));
    if (f.kind !== 'modal-proposition') throw new Error('kind');
    expect(f.proposition.mode).toBe('M');
    expect(f.proposition.reading).toBe('de-re');
    expect(f.proposition.base.form).toBe('O');
  });

  it('rejects mixing de-dicto prefix and de-re infix', () => {
    const r = parseMedieval('Necessarily, all S is necessarily P');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/de-dicto.*de-re|de-re.*de-dicto/);
  });

  it('rejects unknown prefix as modal modifier', () => {
    const r = parseMedieval('Apparently, all S is P');
    // "Apparently" doesn't match a modal prefix, so the parser tries to
    // read it as a quantifier and fails.
    expect(r.ok).toBe(false);
  });
});

describe('medieval parser — modal syllogism', () => {
  it('parses an LLL-1 syllogism with explicit Therefore', () => {
    const src =
      'Necessarily, all M is P\n' +
      'Necessarily, all S is M\n' +
      'Therefore necessarily all S is P';
    const f = ok(parseMedieval(src));
    if (f.kind !== 'modal-syllogism') throw new Error('kind');
    expect(f.syllogism.modalMood).toBe('LLL');
    expect(f.syllogism.assertoricMood).toBe('AAA');
    expect(f.syllogism.figure).toBe(1);
    expect(f.syllogism.reading).toBe('de-dicto');
    expect(f.syllogism.middle).toBe('M');
  });

  it('parses an LXL-1 (mixed) syllogism', () => {
    const src =
      'Necessarily, all M is P\n' +
      'All S is M\n' +
      'Therefore necessarily all S is P';
    const f = ok(parseMedieval(src));
    if (f.kind !== 'modal-syllogism') throw new Error('kind');
    expect(f.syllogism.modalMood).toBe('LXL');
    expect(f.syllogism.assertoricMood).toBe('AAA');
    expect(f.syllogism.figure).toBe(1);
  });

  it('parses an MMM-1 (de re) syllogism', () => {
    const src =
      'All M is possibly P\n' +
      'All S is possibly M\n' +
      'Therefore all S is possibly P';
    const f = ok(parseMedieval(src));
    if (f.kind !== 'modal-syllogism') throw new Error('kind');
    expect(f.syllogism.modalMood).toBe('MMM');
    expect(f.syllogism.reading).toBe('de-re');
  });

  it('rejects mixing de-re and de-dicto modal premises', () => {
    const src =
      'Necessarily, all M is P\n' +
      'All S is necessarily M\n' +
      'Therefore necessarily all S is P';
    const r = parseMedieval(src);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/de re.*de dicto/);
  });
});

describe('medieval parser — sorites', () => {
  it('parses a 3-premise Aristotelian sorites', () => {
    const src =
      'All A is B\n' +
      'All B is C\n' +
      'All C is D\n' +
      'Therefore all A is D';
    const f = ok(parseMedieval(src));
    if (f.kind !== 'sorites') throw new Error('kind');
    expect(f.chain.shape).toBe('aristotelian');
    expect(f.chain.premises).toHaveLength(3);
    expect(f.chain.conclusion.subject).toBe('A');
    expect(f.chain.conclusion.predicate).toBe('D');
  });

  it('parses a 3-premise Goclenian sorites (reverse order)', () => {
    const src =
      'All C is D\n' +
      'All B is C\n' +
      'All A is B\n' +
      'Therefore all A is D';
    const f = ok(parseMedieval(src));
    if (f.kind !== 'sorites') throw new Error('kind');
    expect(f.chain.shape).toBe('goclenian');
    expect(f.chain.conclusion.subject).toBe('A');
    expect(f.chain.conclusion.predicate).toBe('D');
  });

  it('rejects sorites where premises do not chain', () => {
    const src =
      'All A is B\n' +
      'All X is Y\n' +     // breaks the chain
      'All Y is Z\n' +
      'Therefore all A is Z';
    const r = parseMedieval(src);
    expect(r.ok).toBe(false);
  });

  it('rejects modal premises in a sorites', () => {
    const src =
      'Necessarily, all A is B\n' +
      'All B is C\n' +
      'All C is D\n' +
      'Therefore all A is D';
    const r = parseMedieval(src);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/modal/i);
  });

  it('rejects sorites whose conclusion does not match the chain ends', () => {
    const src =
      'All A is B\n' +
      'All B is C\n' +
      'All C is D\n' +
      'Therefore all B is D';   // wrong head
    const r = parseMedieval(src);
    expect(r.ok).toBe(false);
  });
});

describe('medieval parser — compact form', () => {
  it('parses LLL-1/de-re/S,M,P', () => {
    const f = ok(parseMedieval('LLL-1/de-re/S,M,P'));
    if (f.kind !== 'modal-syllogism') throw new Error('kind');
    expect(f.syllogism.modalMood).toBe('LLL');
    expect(f.syllogism.figure).toBe(1);
    expect(f.syllogism.reading).toBe('de-re');
  });

  it('parses LXL-1/de-dicto/...', () => {
    const f = ok(parseMedieval('LXL-1/de-dicto/Greeks,Mortal,Wise'));
    if (f.kind !== 'modal-syllogism') throw new Error('kind');
    expect(f.syllogism.modalMood).toBe('LXL');
    expect(f.syllogism.major.base.subject).toBe('Mortal');     // figure 1: M-P
    expect(f.syllogism.minor.base.subject).toBe('Greeks');     // figure 1: S-M
  });

  it('rejects compact form without reading suffix', () => {
    const r = parseMedieval('LLL-1/S,M,P');
    expect(r.ok).toBe(false);
  });

  it('rejects compact form with bad mode letter', () => {
    const r = parseMedieval('LZL-1/de-re/S,M,P');
    // 'Z' is not in [XLM] so the head regex doesn't match — the parser
    // doesn't recognise it as compact and the multi-line path takes
    // over (and then also fails).
    expect(r.ok).toBe(false);
  });

  it('rejects compact form with bad figure', () => {
    const r = parseMedieval('LLL-5/de-re/S,M,P');
    expect(r.ok).toBe(false);
  });
});

describe('medieval parser — error paths', () => {
  it('rejects empty input', () => {
    const r = parseMedieval('');
    expect(r.ok).toBe(false);
  });

  it('rejects two lines (neither prop nor syllogism nor sorites)', () => {
    const r = parseMedieval('All M is P\nAll S is M');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/got 2/);
  });
});
