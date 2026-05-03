import { describe, expect, it } from 'vitest';
import { parseFol } from '../fol-parser';
import { renderUnicode } from '../fol-render';
import type { FolFormula } from '../fol-types';

function parse(s: string): FolFormula {
  const r = parseFol(s);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message} at ${r.error.position}`);
  return r.formula;
}

function render(s: string): string {
  return renderUnicode(parse(s));
}

describe('fol-parser — propositional fragment', () => {
  it('parses a propositional letter', () => {
    expect(parse('p')).toEqual({ kind: 'pred', name: 'p', args: [] });
  });

  it('parses negation', () => {
    expect(render('~p')).toBe('¬p');
  });

  it('accepts both ASCII and Unicode connectives', () => {
    expect(render('p & q')).toBe('p ∧ q');
    expect(render('p ∧ q')).toBe('p ∧ q');
    expect(render('p | q')).toBe('p ∨ q');
    expect(render('p ∨ q')).toBe('p ∨ q');
    expect(render('p -> q')).toBe('p → q');
    expect(render('p → q')).toBe('p → q');
    expect(render('p <-> q')).toBe('p ↔ q');
    expect(render('p ↔ q')).toBe('p ↔ q');
  });

  it('respects precedence (∧ tighter than ∨)', () => {
    expect(render('p | q & r')).toBe('p ∨ q ∧ r');
  });

  it('handles right-associative implication', () => {
    expect(render('p -> q -> r')).toBe('p → q → r');
  });

  it('respects parentheses for narrow scope', () => {
    expect(render('(p -> q) -> r')).toBe('(p → q) → r');
  });

  it('parses Boolean constants', () => {
    expect(parse('true')).toEqual({ kind: 'top' });
    expect(parse('⊤')).toEqual({ kind: 'top' });
    expect(parse('\\top')).toEqual({ kind: 'top' });
    expect(parse('false')).toEqual({ kind: 'bot' });
    expect(parse('⊥')).toEqual({ kind: 'bot' });
  });

  it('rejects empty input', () => {
    const r = parseFol('');
    expect(r.ok).toBe(false);
  });

  it('reports position on unclosed paren', () => {
    const r = parseFol('(p & q');
    expect(r.ok).toBe(false);
  });
});

describe('fol-parser — predicates and terms', () => {
  it('parses a predicate atom with arguments', () => {
    expect(parse('P(x)')).toEqual({
      kind: 'pred',
      name: 'P',
      args: [{ kind: 'const', name: 'x' }],
    });
  });

  it('parses a multi-arg predicate', () => {
    const f = parse('R(x, y, z)');
    expect(f.kind).toBe('pred');
    if (f.kind === 'pred') {
      expect(f.name).toBe('R');
      expect(f.args).toHaveLength(3);
    }
  });

  it('parses nested function terms inside a predicate', () => {
    const f = parse('P(f(x), g(y, h(z)))');
    expect(f.kind).toBe('pred');
  });

  it('renders multi-letter predicates in upright in KaTeX', () => {
    // Sanity: parses without error. The KaTeX upright treatment is
    // tested in the render test file.
    expect(parse('Even(x)').kind).toBe('pred');
  });
});

describe('fol-parser — quantifiers', () => {
  it('parses a forall', () => {
    const f = parse('forall x. P(x)');
    expect(f.kind).toBe('forall');
    if (f.kind === 'forall') {
      expect(f.variable).toBe('x');
      expect(f.body.kind).toBe('pred');
    }
  });

  it('parses an exists', () => {
    const f = parse('exists x. P(x)');
    expect(f.kind).toBe('exists');
  });

  it('accepts Unicode ∀ ∃', () => {
    expect(parse('∀x. P(x)').kind).toBe('forall');
    expect(parse('∃x. P(x)').kind).toBe('exists');
  });

  it('binds wide-scope to the right', () => {
    // forall x. P(x) -> Q(x) parses as forall x.(P(x) -> Q(x))
    const f = parse('forall x. P(x) -> Q(x)');
    expect(f.kind).toBe('forall');
    if (f.kind === 'forall') {
      expect(f.body.kind).toBe('implies');
    }
  });

  it('respects parens for narrow scope', () => {
    const f = parse('(forall x. P(x)) -> Q(a)');
    expect(f.kind).toBe('implies');
    if (f.kind === 'implies') {
      expect(f.left.kind).toBe('forall');
    }
  });

  it('marks quantified variables as `var`, frees as `const`', () => {
    const f = parse('forall x. P(x, a)');
    if (f.kind !== 'forall') throw new Error('expected forall');
    if (f.body.kind !== 'pred') throw new Error('expected pred body');
    expect(f.body.args[0]).toEqual({ kind: 'var', name: 'x' });
    expect(f.body.args[1]).toEqual({ kind: 'const', name: 'a' });
  });

  it('rejects keyword as variable name', () => {
    const r = parseFol('forall forall. P(x)');
    expect(r.ok).toBe(false);
  });

  it('does not mistake `forallx` for the keyword', () => {
    // "forallx" should be a 0-arg predicate atom, not a quantifier
    // followed by a missing variable name.
    const r = parseFol('forallx');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.formula.kind).toBe('pred');
  });
});

describe('fol-parser — identity', () => {
  it('parses t = u', () => {
    expect(parse('a = b')).toEqual({
      kind: 'eq',
      left:  { kind: 'const', name: 'a' },
      right: { kind: 'const', name: 'b' },
    });
  });

  it('parses t != u as ¬(t = u)', () => {
    const f = parse('a != b');
    expect(f.kind).toBe('not');
    if (f.kind === 'not') expect(f.body.kind).toBe('eq');
  });

  it('accepts Unicode ≠', () => {
    const f = parse('a ≠ b');
    expect(f.kind).toBe('not');
  });

  it('parses identity inside a quantifier with proper var/const split', () => {
    const f = parse('forall x. x = a');
    if (f.kind !== 'forall') throw new Error('expected forall');
    if (f.body.kind !== 'eq') throw new Error('expected eq body');
    expect(f.body.left).toEqual({ kind: 'var', name: 'x' });
    expect(f.body.right).toEqual({ kind: 'const', name: 'a' });
  });

  it('parses equality on function terms', () => {
    const f = parse('f(x) = y');
    expect(f.kind).toBe('eq');
  });
});

describe('fol-parser — round-tripping (parse → render → parse)', () => {
  const cases = [
    'p',
    '¬p',
    'p ∧ q',
    'p ∨ q',
    'p → q',
    'p ↔ q',
    '(p → q) → r',
    'p ∧ (q ∨ r)',
    'P(x)',
    'P(x, y)',
    '∀x. P(x)',
    '∃x. P(x)',
    '∀x. P(x) → Q(x)',
    '(∀x. P(x)) → Q(a)',
    'a = b',
    '∀x. ∃y. R(x, y)',
  ];
  for (const c of cases) {
    it(`stable: ${c}`, () => {
      const first = render(c);
      const second = render(first);
      expect(second).toBe(first);
    });
  }
});
