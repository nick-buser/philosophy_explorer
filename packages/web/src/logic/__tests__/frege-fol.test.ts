import { describe, expect, it } from 'vitest';
import { parseFrege } from '../frege-parser';
import { fregeToKatex, fregeToUnicode } from '../frege-fol';

function uni(src: string): string {
  const r = parseFrege(src);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return fregeToUnicode(r.formula);
}

function tex(src: string): string {
  const r = parseFrege(src);
  if (!r.ok) throw new Error(`parse failed: ${r.error.message}`);
  return fregeToKatex(r.formula);
}

describe('fregeToUnicode — propositional', () => {
  it('renders an atom under judgment', () => {
    expect(uni('|- p')).toBe('⊢ p');
  });

  it('renders mere content without the turnstile', () => {
    expect(uni('p')).toBe('p');
  });

  it('renders negation', () => {
    expect(uni('|- ~p')).toBe('⊢ ¬p');
  });

  it('renders right-associative implication', () => {
    expect(uni('|- a -> b -> c')).toBe('⊢ a → b → c');
  });

  it('parenthesises a left-nested conditional', () => {
    expect(uni('|- (a -> b) -> c')).toBe('⊢ (a → b) → c');
  });
});

describe('fregeToUnicode — quantifiers', () => {
  it('renders a wide-scope universal without trailing parens', () => {
    // The body is on the open right edge, so no parens around the
    // implication body.
    expect(uni('|- all x. F(x) -> G(x)')).toBe('⊢ ∀x. F(x) → G(x)');
  });

  it('renders an existential', () => {
    expect(uni('|- exists x. F(x)')).toBe('⊢ ∃x. F(x)');
  });

  it('parenthesises a quantifier appearing on a left slot', () => {
    // `(∀x. F(x)) → G(a)` keeps the parens because the universal sits
    // on the left of an implication — there *is* something following
    // it in the enclosing context.
    expect(uni('|- (all x. F(x)) -> G(a)')).toBe('⊢ (∀x. F(x)) → G(a)');
  });

  it('preserves nested quantifier order', () => {
    expect(uni('|- all x. exists y. R(x, y)')).toBe('⊢ ∀x. ∃y. R(x, y)');
  });
});

describe('fregeToUnicode — identity of content', () => {
  it('renders == as ≡', () => {
    expect(uni('|- p == q')).toBe('⊢ p ≡ q');
  });

  it('binds looser than ->', () => {
    // No parens around the conditional — `→` binds tighter than `≡`.
    expect(uni('|- a -> b == c')).toBe('⊢ a → b ≡ c');
  });

  it('parenthesises a left-nested identity', () => {
    expect(uni('|- (a == b) == c')).toBe('⊢ (a ≡ b) ≡ c');
  });

  it('renders Frege’s axiom 52 substitution shape', () => {
    expect(uni('|- (a == b) -> (P(a) -> P(b))'))
      .toBe('⊢ (a ≡ b) → P(a) → P(b)');
  });
});

describe('fregeToUnicode — higher-order quantification', () => {
  it('renders a predicate-bound universal with the user’s capital letter', () => {
    expect(uni('|- all F. F(a)')).toBe('⊢ ∀F. F(a)');
  });

  it('renders Leibniz indiscernibility (second-order)', () => {
    expect(uni('|- (a == b) -> (all F. F(a) -> F(b))'))
      .toBe('⊢ (a ≡ b) → ∀F. F(a) → F(b)');
  });

  it('renders a mixed individual + predicate quantification', () => {
    expect(uni('|- all x. exists F. F(x)'))
      .toBe('⊢ ∀x. ∃F. F(x)');
  });
});

describe('fregeToKatex', () => {
  it('uses TeX glyphs for the connectives', () => {
    expect(tex('|- p -> q')).toBe('\\vdash\\, p \\to q');
  });

  it('uses \\equiv for ==', () => {
    expect(tex('|- p == q')).toBe('\\vdash\\, p \\equiv q');
  });

  it('uses \\forall for higher-order quantifiers as well', () => {
    expect(tex('|- all F. F(a)')).toBe('\\vdash\\, \\forall F.\\, F(a)');
  });

  it('uses \\neg for negation', () => {
    expect(tex('|- ~p')).toBe('\\vdash\\, \\neg p');
  });

  it('parenthesises a quantifier that lands on a left slot', () => {
    expect(tex('|- (all x. F(x)) -> G(a)'))
      .toBe('\\vdash\\, (\\forall x.\\, F(x)) \\to G(a)');
  });
});
