import { describe, expect, it } from 'vitest';
import { parseMedieval } from '../medieval-parser';
import { checkSorites } from '../medieval-validity';
import type { SoritesChain } from '../medieval-types';

function chainOf(src: string): SoritesChain {
  const r = parseMedieval(src);
  if (!r.ok || r.formula.kind !== 'sorites') {
    throw new Error(`expected sorites for: ${src}`);
  }
  return r.formula.chain;
}

describe('sorites validity', () => {
  it('accepts a 3-premise Aristotelian Barbara chain', () => {
    const c = chainOf(
      'All A is B\nAll B is C\nAll C is D\nTherefore all A is D',
    );
    const r = checkSorites(c);
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.shape).toBe('aristotelian');
      expect(r.length).toBe(3);
      expect(r.stepNames.every(n => n === 'Barbara')).toBe(true);
    }
  });

  it('accepts a 4-premise Aristotelian chain', () => {
    const c = chainOf(
      'All A is B\nAll B is C\nAll C is D\nAll D is E\nTherefore all A is E',
    );
    const r = checkSorites(c);
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.length).toBe(4);
    }
  });

  it('accepts a 3-premise Goclenian chain (reverse order)', () => {
    const c = chainOf(
      'All C is D\nAll B is C\nAll A is B\nTherefore all A is D',
    );
    const r = checkSorites(c);
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.shape).toBe('goclenian');
  });

  it('rejects a chain where the conclusion does not match the chain ends', () => {
    // Parser guards this directly — assert that parseMedieval fails so
    // checkSorites never sees the malformed chain.
    const r = parseMedieval(
      'All A is B\nAll B is C\nAll C is D\nTherefore all A is C',
    );
    expect(r.ok).toBe(false);
  });

  it('rejects a sorites with non-A premises', () => {
    // Parser accepts any AEIO; checkSorites then bails on the
    // mixed-form step. Construct a chain where the last premise is E
    // and watch checkSorites flag the failure.
    //
    // Note: with an E premise the chain pattern still works (B → C, C →
    // D, but No D is E breaks the 'subject = previous predicate' rule
    // since a Goclenian-style change is needed). For phase 1 we just
    // assert the case is rejected somewhere — either by the parser or
    // by checkSorites.
    const r = parseMedieval(
      'All A is B\nAll B is C\nNo C is D\nTherefore no A is D',
    );
    if (!r.ok) {
      // Parser-level rejection is also acceptable (the chain ends
      // include a non-A predicate which the conclusion-shape check
      // catches).
      return;
    }
    if (r.formula.kind !== 'sorites') {
      throw new Error(`expected sorites, got ${r.formula.kind}`);
    }
    const result = checkSorites(r.formula.chain);
    expect(result.valid).toBe(false);
  });
});
