import { describe, expect, it } from 'vitest';
import { parseSaptabhangi } from '../saptabhangi-parser';
import type { Predication } from '../saptabhangi-types';

function pred(input: string): Predication {
  const r = parseSaptabhangi(input);
  if (!r.ok) throw new Error(`expected parse to succeed: ${r.error.message}`);
  return r.predication;
}

describe('saptabhangi parser — predication', () => {
  it('parses subject, predicate, and a single standpoint', () => {
    const p = pred('subject: the pot\npredicate: permanent\nstandpoint substance : asti');
    expect(p.subject).toBe('the pot');
    expect(p.predicate).toBe('permanent');
    expect(p.standpoints).toEqual([{ name: 'substance', mode: 'asti' }]);
  });

  it('parses multiple standpoints in order', () => {
    const p = pred(
      'subject: the pot\n' +
      'predicate: permanent\n' +
      'standpoint substance : asti\n' +
      'standpoint mode      : nasti\n' +
      'standpoint origin    : avaktavya',
    );
    expect(p.standpoints.map(s => s.mode)).toEqual(['asti', 'nasti', 'avaktavya']);
    expect(p.standpoints.map(s => s.name)).toEqual(['substance', 'mode', 'origin']);
  });

  it('keeps multi-word subjects, predicates, and standpoint names', () => {
    const p = pred(
      'subject: the lump of clay\n' +
      'predicate: at rest\n' +
      'standpoint its present location : asti',
    );
    expect(p.subject).toBe('the lump of clay');
    expect(p.predicate).toBe('at rest');
    expect(p.standpoints[0]!.name).toBe('its present location');
  });

  it('accepts the three canonical modes', () => {
    for (const m of ['asti', 'nasti', 'avaktavya'] as const) {
      const p = pred(`subject: s\npredicate: p\nstandpoint x : ${m}`);
      expect(p.standpoints[0]!.mode).toBe(m);
    }
  });

  it('accepts IAST and English mode aliases', () => {
    expect(pred('subject: s\npredicate: p\nstandpoint x : nāsti').standpoints[0]!.mode).toBe('nasti');
    expect(pred('subject: s\npredicate: p\nstandpoint x : is').standpoints[0]!.mode).toBe('asti');
    expect(pred('subject: s\npredicate: p\nstandpoint x : inexpressible').standpoints[0]!.mode)
      .toBe('avaktavya');
  });

  it('accepts an optional syāt particle before the mode', () => {
    expect(pred('subject: s\npredicate: p\nstandpoint x : syād asti').standpoints[0]!.mode)
      .toBe('asti');
    expect(pred('subject: s\npredicate: p\nstandpoint x : syat nasti').standpoints[0]!.mode)
      .toBe('nasti');
  });

  it('skips -- and # line comments and blank lines', () => {
    const p = pred(
      '# a predication\n' +
      'subject: the pot   -- the bearer\n' +
      '\n' +
      'predicate: permanent\n' +
      'standpoint substance : asti  # qua its clay',
    );
    expect(p.subject).toBe('the pot');
    expect(p.standpoints[0]!.mode).toBe('asti');
  });
});

describe('saptabhangi parser — errors', () => {
  it('rejects empty input', () => {
    const r = parseSaptabhangi('   ');
    expect(r.ok).toBe(false);
  });

  it('rejects a missing subject', () => {
    const r = parseSaptabhangi('predicate: permanent\nstandpoint x : asti');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/subject/);
  });

  it('rejects a missing predicate', () => {
    const r = parseSaptabhangi('subject: the pot\nstandpoint x : asti');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/predicate/);
  });

  it('rejects a predication with no standpoint', () => {
    const r = parseSaptabhangi('subject: the pot\npredicate: permanent');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/standpoint/);
  });

  it('rejects an unknown mode', () => {
    const r = parseSaptabhangi('subject: s\npredicate: p\nstandpoint x : maybe');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/unknown mode/);
  });

  it('rejects a standpoint declared twice', () => {
    const r = parseSaptabhangi(
      'subject: s\npredicate: p\nstandpoint x : asti\nstandpoint x : nasti',
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/twice/);
  });

  it('rejects a duplicate subject line', () => {
    const r = parseSaptabhangi('subject: a\nsubject: b\npredicate: p\nstandpoint x : asti');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/duplicate/);
  });

  it('rejects an unknown key', () => {
    const r = parseSaptabhangi('object: the pot\npredicate: p\nstandpoint x : asti');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/unknown key/);
  });

  it('rejects a standpoint line missing its colon', () => {
    const r = parseSaptabhangi('subject: s\npredicate: p\nstandpoint substance asti');
    expect(r.ok).toBe(false);
  });
});
