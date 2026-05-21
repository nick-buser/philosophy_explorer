import { describe, expect, it } from 'vitest';
import { parseMohist } from '../mohist-parser';

function ok(src: string) {
  const r = parseMohist(src);
  if (!r.ok) throw new Error(`expected parse to succeed: ${r.error.message}`);
  return r.argument;
}

function fail(src: string) {
  const r = parseMohist(src);
  if (r.ok) throw new Error('expected parse to fail');
  return r.error;
}

describe('parseMohist — well-formed input', () => {
  it('parses a minimal base / operator / outcome argument', () => {
    const a = ok('base: a white horse | a horse\noperator: ride\noutcome: shi-er-ran');
    expect(a.base).toEqual({ subject: 'a white horse', predicate: 'a horse' });
    expect(a.operator).toBe('ride');
    expect(a.outcome).toBe('shi-er-ran');
    expect(a.flag).toBeNull();
    expect(a.gloss).toBeNull();
  });

  it('splits the base pair on the single bar', () => {
    const a = ok('base: her younger brother | a handsome man\noperator: love\noutcome: shi-er-bu-ran\nflag: opacity');
    expect(a.base.subject).toBe('her younger brother');
    expect(a.base.predicate).toBe('a handsome man');
  });

  it('parses the optional flag and gloss lines', () => {
    const a = ok('base: a robber | a person\noperator: kill\noutcome: shi-er-bu-ran\nflag: opacity\ngloss: the operator takes its object under a description');
    expect(a.flag).toBe('opacity');
    expect(a.gloss).toBe('the operator takes its object under a description');
  });

  it('accepts outcome aliases — Chinese, short, numeric', () => {
    expect(ok('base: x | y\noperator: f\noutcome: 是而然').outcome).toBe('shi-er-ran');
    expect(ok('base: x | y\noperator: f\noutcome: transfers').outcome).toBe('shi-er-ran');
    expect(ok('base: x | y\noperator: f\noutcome: 3\nflag: scope').outcome).toBe('yi-zhou-yi-bu-zhou');
    expect(ok('base: x | y\noperator: f\noutcome: 一是而一非\nflag: sortal').outcome).toBe('yi-shi-yi-fei');
  });

  it('accepts flag aliases', () => {
    expect(ok('base: x | y\noperator: f\noutcome: shi-er-bu-ran\nflag: opaque').flag).toBe('opacity');
    expect(ok('base: x | y\noperator: f\noutcome: yi-zhou-yi-bu-zhou\nflag: zhou').flag).toBe('scope');
    expect(ok('base: x | y\noperator: f\noutcome: yi-shi-yi-fei\nflag: kind').flag).toBe('sortal');
  });

  it('strips -- and # line comments and blank lines', () => {
    const a = ok('-- a móu argument\nbase: x | y  # the base pair\n\noperator: f\noutcome: shi-er-ran');
    expect(a.base).toEqual({ subject: 'x', predicate: 'y' });
    expect(a.operator).toBe('f');
  });
});

describe('parseMohist — errors', () => {
  it('rejects a missing base line', () => {
    expect(fail('operator: f\noutcome: shi-er-ran').message).toMatch(/base/);
  });

  it('rejects a missing operator line', () => {
    expect(fail('base: x | y\noutcome: shi-er-ran').message).toMatch(/operator/);
  });

  it('rejects a missing outcome line', () => {
    expect(fail('base: x | y\noperator: f').message).toMatch(/outcome/);
  });

  it('rejects a base with no bar', () => {
    expect(fail('base: x is y\noperator: f\noutcome: shi-er-ran').message).toMatch(/\|/);
  });

  it('rejects a base with more than one bar', () => {
    expect(fail('base: x | y | z\noperator: f\noutcome: shi-er-ran').message).toMatch(/exactly one/);
  });

  it('rejects an empty base term', () => {
    expect(fail('base: x |\noperator: f\noutcome: shi-er-ran').message).toMatch(/second term/);
    expect(fail('base: | y\noperator: f\noutcome: shi-er-ran').message).toMatch(/first term/);
  });

  it('rejects duplicate lines', () => {
    expect(fail('base: x | y\nbase: a | b\noperator: f\noutcome: shi-er-ran').message).toMatch(/duplicate 'base:'/);
    expect(fail('base: x | y\noperator: f\noperator: g\noutcome: shi-er-ran').message).toMatch(/duplicate 'operator:'/);
    expect(fail('base: x | y\noperator: f\noutcome: shi-er-ran\nflag: opacity\nflag: scope').message).toMatch(/duplicate 'flag:'/);
  });

  it('rejects an unknown key', () => {
    expect(fail('base: x | y\noperator: f\noutcome: shi-er-ran\nverb: walk').message).toMatch(/unknown key/);
  });

  it('rejects an unknown outcome and an unknown flag', () => {
    expect(fail('base: x | y\noperator: f\noutcome: maybe').message).toMatch(/unknown outcome/);
    expect(fail('base: x | y\noperator: f\noutcome: shi-er-ran\nflag: vibes').message).toMatch(/unknown flag/);
  });

  it('reports the offending line number', () => {
    expect(fail('base: x | y\noperator: f\noutcome: nope').line).toBe(3);
  });
});
