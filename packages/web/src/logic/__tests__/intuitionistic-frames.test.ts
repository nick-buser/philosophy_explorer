import { describe, expect, it } from 'vitest';
import {
  closeFrame,
  closeValuation,
  intuitionisticDiagnostics,
  isMonotone,
} from '../intuitionistic-frames';
import type { KripkeModel } from '../kripke-types';

describe('isMonotone', () => {
  it('monotone — atoms persist along R', () => {
    const m: KripkeModel = {
      worlds: [
        { id: 'w0', atoms: ['p'] },
        { id: 'w1', atoms: ['p', 'q'] },
      ],
      edges: [{ from: 'w0', to: 'w1' }],
    };
    expect(isMonotone(m)).toEqual({ holds: true });
  });

  it('non-monotone — w0 has p but w1 doesn’t', () => {
    const m: KripkeModel = {
      worlds: [
        { id: 'w0', atoms: ['p'] },
        { id: 'w1', atoms: [] },
      ],
      edges: [{ from: 'w0', to: 'w1' }],
    };
    const r = isMonotone(m);
    expect(r.holds).toBe(false);
    if (!r.holds) {
      expect(r.witness).toEqual({ from: 'w0', to: 'w1', atom: 'p' });
    }
  });
});

describe('intuitionisticDiagnostics', () => {
  it('valid pre-order with monotone V passes all three', () => {
    const m: KripkeModel = {
      worlds: [
        { id: 'w0', atoms: [] },
        { id: 'w1', atoms: ['p'] },
      ],
      edges: [
        { from: 'w0', to: 'w0' },
        { from: 'w0', to: 'w1' },
        { from: 'w1', to: 'w1' },
      ],
    };
    const d = intuitionisticDiagnostics(m);
    expect(d.reflexive.holds).toBe(true);
    expect(d.transitive.holds).toBe(true);
    expect(d.monotone.holds).toBe(true);
    expect(d.isValidFrame).toBe(true);
  });

  it('non-reflexive fails', () => {
    const m: KripkeModel = {
      worlds: [{ id: 'w0', atoms: [] }],
      edges: [],
    };
    const d = intuitionisticDiagnostics(m);
    expect(d.reflexive.holds).toBe(false);
    expect(d.isValidFrame).toBe(false);
  });
});

describe('closeFrame', () => {
  it('takes reflexive-transitive closure of R', () => {
    const m: KripkeModel = {
      worlds: [
        { id: 'a', atoms: [] },
        { id: 'b', atoms: [] },
        { id: 'c', atoms: [] },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
      ],
    };
    const closed = closeFrame(m);
    const d = intuitionisticDiagnostics(closed);
    expect(d.reflexive.holds).toBe(true);
    expect(d.transitive.holds).toBe(true);
  });
});

describe('closeValuation', () => {
  it('lifts atoms forward along R so V is monotone', () => {
    const m: KripkeModel = {
      worlds: [
        { id: 'w0', atoms: ['p'] },
        { id: 'w1', atoms: [] },
      ],
      edges: [{ from: 'w0', to: 'w1' }],
    };
    const lifted = closeValuation(m);
    const w1 = lifted.worlds.find(w => w.id === 'w1')!;
    expect(w1.atoms).toContain('p');
    expect(isMonotone(lifted)).toEqual({ holds: true });
  });

  it('idempotent', () => {
    const m: KripkeModel = {
      worlds: [
        { id: 'w0', atoms: ['p'] },
        { id: 'w1', atoms: [] },
      ],
      edges: [{ from: 'w0', to: 'w1' }],
    };
    const once  = closeValuation(m);
    const twice = closeValuation(once);
    expect(twice.worlds.map(w => w.atoms)).toEqual(once.worlds.map(w => w.atoms));
  });
});
