import { describe, expect, it } from 'vitest';
import { parseArgument } from '../nd-parser';

describe('nd-parser', () => {
  it('parses a single-line argument with comma-separated premises', () => {
    const r = parseArgument('p, p -> q |- q');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.argument.premises).toHaveLength(2);
    expect(r.argument.conclusion.kind).toBe('pred');
  });

  it('parses a no-premise argument', () => {
    const r = parseArgument('|- p -> p');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.argument.premises).toHaveLength(0);
    expect(r.argument.conclusion.kind).toBe('implies');
  });

  it('treats a bare formula as `|- formula`', () => {
    const r = parseArgument('p -> p');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.argument.premises).toHaveLength(0);
  });

  it('accepts ⊢ as the turnstile', () => {
    const r = parseArgument('p, p -> q ⊢ q');
    expect(r.ok).toBe(true);
  });

  it('accepts therefore as a turnstile keyword', () => {
    const r = parseArgument('p, p -> q therefore q');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.argument.premises).toHaveLength(2);
  });

  it('accepts newline-separated premises', () => {
    const r = parseArgument('p\np -> q\n|- q');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.argument.premises).toHaveLength(2);
  });

  it('does not split on commas inside parentheses', () => {
    const r = parseArgument('R(a, b), R(a, b) -> P |- P');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.argument.premises).toHaveLength(2);
  });

  it('reports an error on a malformed premise', () => {
    const r = parseArgument('p &, p -> q |- q');
    expect(r.ok).toBe(false);
  });

  it('reports an error when no conclusion follows the turnstile', () => {
    const r = parseArgument('p, q |-');
    expect(r.ok).toBe(false);
  });
});
