import { describe, expect, it } from 'vitest';
import { parseCatuskoti } from '../catuskoti-parser';
import type { Proposition } from '../catuskoti-types';

function prop(input: string): Proposition {
  const r = parseCatuskoti(input);
  if (!r.ok) throw new Error(`expected parse to succeed: ${r.error.message}`);
  return r.proposition;
}

describe('catuskoti parser — proposition', () => {
  it('parses proposition and koti', () => {
    const p = prop('proposition: the world is eternal\nkoti: affirmation');
    expect(p.text).toBe('the world is eternal');
    expect(p.koti).toBe(1);
  });

  it('defaults the reading to affirming when no reading line is given', () => {
    expect(prop('proposition: A\nkoti: both').reading).toBe('affirming');
  });

  it('parses an explicit reading line', () => {
    const p = prop('proposition: A\nkoti: negation\nreading: prasanga');
    expect(p.reading).toBe('prasanga');
  });

  it('accepts all four koṭis by their canonical word', () => {
    expect(prop('proposition: A\nkoti: affirmation').koti).toBe(1);
    expect(prop('proposition: A\nkoti: negation').koti).toBe(2);
    expect(prop('proposition: A\nkoti: both').koti).toBe(3);
    expect(prop('proposition: A\nkoti: neither').koti).toBe(4);
  });

  it('accepts koṭi aliases and bare numbers', () => {
    expect(prop('proposition: A\nkoti: is').koti).toBe(1);
    expect(prop('proposition: A\nkoti: not').koti).toBe(2);
    expect(prop('proposition: A\nkoti: ubhaya').koti).toBe(3);
    expect(prop('proposition: A\nkoti: anubhaya').koti).toBe(4);
    expect(prop('proposition: A\nkoti: 3').koti).toBe(3);
  });

  it('accepts reading aliases', () => {
    expect(prop('proposition: A\nkoti: both\nreading: positive').reading).toBe('affirming');
    expect(prop('proposition: A\nkoti: both\nreading: rejecting').reading).toBe('prasanga');
    expect(prop('proposition: A\nkoti: both\nreading: prasaṅga').reading).toBe('prasanga');
  });

  it('keeps multi-word propositions', () => {
    const p = prop('proposition: the Tathāgata exists after death\nkoti: neither');
    expect(p.text).toBe('the Tathāgata exists after death');
  });

  it('is case-insensitive on keys and values', () => {
    const p = prop('Proposition: A\nKOTI: Both\nReading: PRASANGA');
    expect(p.koti).toBe(3);
    expect(p.reading).toBe('prasanga');
  });

  it('skips -- and # line comments and blank lines', () => {
    const p = prop(
      '# the unanswered question\n' +
      'proposition: the Tathāgata exists after death  -- an avyākṛta\n' +
      '\n' +
      'koti: affirmation\n' +
      'reading: prasanga  # refused at every corner',
    );
    expect(p.text).toBe('the Tathāgata exists after death');
    expect(p.reading).toBe('prasanga');
  });
});

describe('catuskoti parser — errors', () => {
  it('rejects empty input', () => {
    expect(parseCatuskoti('   ').ok).toBe(false);
  });

  it('rejects a missing proposition', () => {
    const r = parseCatuskoti('koti: both');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/proposition/);
  });

  it('rejects a missing koti', () => {
    const r = parseCatuskoti('proposition: A');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/koti/);
  });

  it('rejects an unknown koti', () => {
    const r = parseCatuskoti('proposition: A\nkoti: maybe');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/unknown koṭi/);
  });

  it('rejects an unknown reading', () => {
    const r = parseCatuskoti('proposition: A\nkoti: both\nreading: sideways');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/unknown reading/);
  });

  it('rejects a duplicate koti line', () => {
    const r = parseCatuskoti('proposition: A\nkoti: both\nkoti: neither');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/duplicate/);
  });

  it('rejects an unknown key', () => {
    const r = parseCatuskoti('subject: A\nkoti: both');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toMatch(/unknown key/);
  });

  it('rejects a line with no colon', () => {
    expect(parseCatuskoti('proposition A\nkoti: both').ok).toBe(false);
  });
});
