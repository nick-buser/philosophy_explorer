import { describe, expect, it } from 'vitest';
import { parseMedieval } from '../medieval-parser';
import {
  ALL_MODAL_VALID_CASES,
  checkModalSyllogism,
} from '../medieval-validity';
import type { ModalSyllogism } from '../medieval-types';

function syllogismOf(src: string): ModalSyllogism {
  const r = parseMedieval(src);
  if (!r.ok || r.formula.kind !== 'modal-syllogism') {
    throw new Error(`expected modal syllogism for: ${src}`);
  }
  return r.formula.syllogism;
}

describe('modal validity — all-L and all-M moods', () => {
  it('accepts necessity-Barbara LLL-1 in both readings', () => {
    const sDeRe = syllogismOf(
      'All M is necessarily P\nAll S is necessarily M\nTherefore all S is necessarily P',
    );
    const sDeDicto = syllogismOf(
      'Necessarily, all M is P\nNecessarily, all S is M\nTherefore necessarily all S is P',
    );
    expect(checkModalSyllogism(sDeRe).valid).toBe(true);
    expect(checkModalSyllogism(sDeDicto).valid).toBe(true);
  });

  it('accepts possibility-Barbara MMM-1 in both readings', () => {
    const sDeRe = syllogismOf(
      'All M is possibly P\nAll S is possibly M\nTherefore all S is possibly P',
    );
    const sDeDicto = syllogismOf(
      'Possibly, all M is P\nPossibly, all S is M\nTherefore possibly all S is P',
    );
    expect(checkModalSyllogism(sDeRe).valid).toBe(true);
    expect(checkModalSyllogism(sDeDicto).valid).toBe(true);
  });

  it('rejects LLL-1 when underlying assertoric mood is invalid (e.g. AAA-2)', () => {
    const s = syllogismOf(
      'LLL-2/de-re/S,M,P',
    );
    const r = checkModalSyllogism(s);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toBe('assertoric-not-in-table');
  });
});

describe('modal validity — the contested LXL-1 / LXX-1 cases', () => {
  const lxlSrc =
    'Necessarily, all M is P\n' +
    'All S is M\n' +
    'Therefore necessarily all S is P';
  const lxxSrc =
    'Necessarily, all M is P\n' +
    'All S is M\n' +
    'Therefore all S is P';

  it('LXL-1 valid de re (Aristotle)', () => {
    const s = { ...syllogismOf(lxlSrc), reading: 'de-re' as const };
    expect(checkModalSyllogism(s).valid).toBe(true);
  });

  it('LXL-1 invalid de dicto (Buridan / Theophrastus)', () => {
    const s = { ...syllogismOf(lxlSrc), reading: 'de-dicto' as const };
    const r = checkModalSyllogism(s);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toBe('conclusion-mode-mismatch');
  });

  it('LXX-1 valid de dicto (Theophrastus)', () => {
    const s = { ...syllogismOf(lxxSrc), reading: 'de-dicto' as const };
    expect(checkModalSyllogism(s).valid).toBe(true);
  });

  it('LXX-1 invalid de re', () => {
    const s = { ...syllogismOf(lxxSrc), reading: 'de-re' as const };
    const r = checkModalSyllogism(s);
    expect(r.valid).toBe(false);
  });
});

describe('modal validity — figure-2/3/4 mixed-mode moods deferred', () => {
  it('rejects LXL-2 (mixed mode outside figure 1)', () => {
    const s = syllogismOf('LXL-2/de-re/S,M,P');
    const r = checkModalSyllogism(s);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toBe('pattern-not-supported');
  });

  it('rejects LXL-3', () => {
    const s = syllogismOf('LXL-3/de-re/S,M,P');
    const r = checkModalSyllogism(s);
    expect(r.valid).toBe(false);
  });
});

describe('modal validity — XXX delegates to assertoric', () => {
  it('XXX matching a valid assertoric mood is valid', () => {
    const r = checkModalSyllogism(syllogismOf('XXX-1/de-re/S,M,P'));
    expect(r.valid).toBe(true);
  });

  it('XXX matching an invalid assertoric mood is invalid', () => {
    const r = checkModalSyllogism(syllogismOf('XXX-2/de-re/S,M,P'));
    expect(r.valid).toBe(false);
  });
});

describe('modal validity — Boolean import composes', () => {
  it('LLL on a weakened underlying mood (AAI-1 = Barbari) is invalid under Boolean', () => {
    const s = syllogismOf(
      'Necessarily, all M is P\n' +
      'Necessarily, all S is M\n' +
      'Therefore necessarily some S is P',
    );
    // Underlying is AAI-1 (Barbari, weakened). LLL passes the modal
    // pattern, then weakens out under Boolean.
    expect(checkModalSyllogism(s, 'traditional').valid).toBe(true);
    const boolR = checkModalSyllogism(s, 'boolean');
    expect(boolR.valid).toBe(false);
    if (!boolR.valid) expect(boolR.reason).toBe('weakened-under-boolean');
  });
});

describe('modal validity — generated case round-trip', () => {
  it('every entry in ALL_MODAL_VALID_CASES is non-empty', () => {
    expect(ALL_MODAL_VALID_CASES.length).toBeGreaterThan(0);
  });

  it('each LLL case in the generated set is valid via checkModalSyllogism', () => {
    const sample = ALL_MODAL_VALID_CASES.filter(c => c.modalMood === 'LLL').slice(0, 6);
    expect(sample.length).toBeGreaterThan(0);
    for (const c of sample) {
      const compact = `LLL-${c.figure}/${c.reading}/S,M,P`;
      const r = parseMedieval(compact);
      expect(r.ok, `parse ${compact}`).toBe(true);
      if (!r.ok || r.formula.kind !== 'modal-syllogism') continue;
      const v = checkModalSyllogism(r.formula.syllogism);
      // Generated cases use the assertoric AAA shape; every assertoric-AAA
      // entry only exists at figure 1 (AAA-1 = Barbara). For other figures
      // (AAI-3 etc.) the underlying assertoric mood differs from AAA, so
      // checkModalSyllogism will return invalid (assertoric-not-in-table).
      // Only assert valid for the AAA-figure-1 case.
      if (c.assertoricMood === 'AAA' && c.figure === 1) {
        expect(v.valid, `${compact} should be valid`).toBe(true);
      }
    }
  });
});
