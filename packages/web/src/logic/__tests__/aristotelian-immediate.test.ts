import { describe, expect, it } from 'vitest';
import {
  allImmediateInferences,
  contrapose,
  convert,
  convertPerAccidens,
  formatProposition,
  obvert,
} from '../aristotelian-immediate';
import type { CategoricalProposition, PropForm } from '../aristotelian-types';

function prop(form: PropForm, subject = 'S', predicate = 'P'): CategoricalProposition {
  return { form, subject, predicate };
}

describe('convert', () => {
  it('E converts simply (No S is P ⇔ No P is S)', () => {
    const r = convert(prop('E'));
    expect(r.validity).toBe('simple');
    expect(r.result).toEqual({ form: 'E', subject: 'P', predicate: 'S' });
  });

  it('I converts simply (Some S is P ⇔ Some P is S)', () => {
    const r = convert(prop('I'));
    expect(r.validity).toBe('simple');
    expect(r.result).toEqual({ form: 'I', subject: 'P', predicate: 'S' });
  });

  it('A does not convert simply', () => {
    expect(convert(prop('A')).validity).toBe('invalid');
  });

  it('O does not convert at all', () => {
    expect(convert(prop('O')).validity).toBe('invalid');
  });
});

describe('convertPerAccidens', () => {
  it('A → I per accidens (All S is P ⇒ Some P is S)', () => {
    const r = convertPerAccidens(prop('A'));
    expect(r).not.toBeNull();
    expect(r!.validity).toBe('per-accidens');
    expect(r!.result).toEqual({ form: 'I', subject: 'P', predicate: 'S' });
  });

  it('E → O per accidens (No S is P ⇒ Some P is not S)', () => {
    const r = convertPerAccidens(prop('E'));
    expect(r).not.toBeNull();
    expect(r!.validity).toBe('per-accidens');
    expect(r!.result).toEqual({ form: 'O', subject: 'P', predicate: 'S' });
  });

  it('I has no per-accidens conversion', () => {
    expect(convertPerAccidens(prop('I'))).toBeNull();
  });

  it('O has no per-accidens conversion', () => {
    expect(convertPerAccidens(prop('O'))).toBeNull();
  });
});

describe('obvert', () => {
  it.each<[PropForm, PropForm, string]>([
    ['A', 'E', 'non-P'],
    ['E', 'A', 'non-P'],
    ['I', 'O', 'non-P'],
    ['O', 'I', 'non-P'],
  ])('%s obverts to %s with predicate %s', (input, expectedForm, expectedPred) => {
    const r = obvert(prop(input));
    expect(r.validity).toBe('simple');
    expect(r.result.form).toBe(expectedForm);
    expect(r.result.subject).toBe('S');
    expect(r.result.predicate).toBe(expectedPred);
  });

  it('double obversion returns to the original form (and original predicate)', () => {
    for (const form of ['A', 'E', 'I', 'O'] as PropForm[]) {
      const once = obvert(prop(form));
      const twice = obvert(once.result);
      expect(twice.result.form).toBe(form);
      expect(twice.result.subject).toBe('S');
      expect(twice.result.predicate).toBe('P'); // double-complement cancels
    }
  });
});

describe('contrapose', () => {
  it('A contraposes simply (All S is P ⇔ All non-P is non-S)', () => {
    const r = contrapose(prop('A'));
    expect(r.validity).toBe('simple');
    expect(r.result).toEqual({ form: 'A', subject: 'non-P', predicate: 'non-S' });
  });

  it('O contraposes simply', () => {
    const r = contrapose(prop('O'));
    expect(r.validity).toBe('simple');
    expect(r.result.form).toBe('O');
  });

  it('E contraposes only by limitation (per accidens)', () => {
    expect(contrapose(prop('E')).validity).toBe('per-accidens');
  });

  it('I has no valid contrapositive', () => {
    expect(contrapose(prop('I')).validity).toBe('invalid');
  });
});

describe('allImmediateInferences', () => {
  it('returns 4 inferences for A and E (incl. per-accidens conversion)', () => {
    expect(allImmediateInferences(prop('A')).length).toBe(4);
    expect(allImmediateInferences(prop('E')).length).toBe(4);
  });

  it('returns 3 inferences for I and O (no per-accidens conversion)', () => {
    expect(allImmediateInferences(prop('I')).length).toBe(3);
    expect(allImmediateInferences(prop('O')).length).toBe(3);
  });

  it('order is conversion, [conversion-per-accidens], obversion, contraposition', () => {
    const a = allImmediateInferences(prop('A'));
    expect(a.map(i => i.kind)).toEqual([
      'conversion', 'conversion-per-accidens', 'obversion', 'contraposition',
    ]);
    const i = allImmediateInferences(prop('I'));
    expect(i.map(x => x.kind)).toEqual(['conversion', 'obversion', 'contraposition']);
  });
});

describe('formatProposition', () => {
  it.each<[PropForm, string]>([
    ['A', 'All S is P'],
    ['E', 'No S is P'],
    ['I', 'Some S is P'],
    ['O', 'Some S is not P'],
  ])('%s renders as "%s"', (form, expected) => {
    expect(formatProposition(prop(form))).toBe(expected);
  });
});
