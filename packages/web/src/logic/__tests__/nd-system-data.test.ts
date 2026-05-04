import { describe, expect, it } from 'vitest';
import { LOGIC_SYSTEMS } from '../../data/logic-systems';
import { parseArgument } from '../nd-parser';
import { proveArgument } from '../nd-prover';
import { buildGentzenTree } from '../nd-gentzen';

const system = LOGIC_SYSTEMS.find(s => s.slug === 'natural-deduction')!;

describe('natural-deduction seed data', () => {
  it('is registered as available', () => {
    expect(system).toBeDefined();
    expect(system.status).toBe('available');
  });

  it('every example parses', () => {
    for (const ex of system.examples) {
      const r = parseArgument(ex.dsl);
      expect(r.ok, `example ${ex.slug} should parse: ${!r.ok ? r.error.message : ''}`).toBe(true);
    }
  });

  it('every example has a classical proof', () => {
    for (const ex of system.examples) {
      const p = parseArgument(ex.dsl);
      if (!p.ok) throw new Error(`parse failed for ${ex.slug}`);
      const r = proveArgument(p.argument, 'classical');
      expect(r.ok, `${ex.slug} should be provable classically`).toBe(true);
      if (r.ok) {
        const tree = buildGentzenTree(r.proof);
        expect(tree).toBeDefined();
      }
    }
  });

  it('classical-only examples fail intuitionistically', () => {
    const classicalOnly = ['lem', 'double-negation-elim', 'peirce', 'demorgan-reverse', 'contraposition-reverse'];
    for (const slug of classicalOnly) {
      const ex = system.examples.find(e => e.slug === slug);
      if (!ex) throw new Error(`example ${slug} missing from seed`);
      const p = parseArgument(ex.dsl);
      if (!p.ok) throw new Error(`parse failed for ${slug}`);
      const r = proveArgument(p.argument, 'intuitionistic');
      expect(r.ok, `${slug} should NOT be provable intuitionistically`).toBe(false);
    }
  });
});
