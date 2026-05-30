import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeanVerifyBadge } from '../labs/NaturalDeductionLab';

// The badge maps a /api/verify verdict (or the in-flight / errored request
// state) onto a label. The live request path is exercised by the M1
// integration tests; this pins the pure rendering.
describe('LeanVerifyBadge', () => {
  it('shows a checking state while the request is in flight', () => {
    render(<LeanVerifyBadge isLoading={true} isError={false} data={undefined} />);
    expect(screen.getByTestId('lean-badge').textContent).toMatch(/checking/i);
  });

  it('shows verified when Lean accepts the proof', () => {
    render(
      <LeanVerifyBadge
        isLoading={false}
        isError={false}
        data={{ verdict: 'verified', diagnostics: [], message: '' }}
      />,
    );
    expect(screen.getByTestId('lean-badge').textContent).toMatch(/verified/i);
  });

  it('shows rejected when Lean fails the proof', () => {
    render(
      <LeanVerifyBadge
        isLoading={false}
        isError={false}
        data={{ verdict: 'failed', diagnostics: [], message: '' }}
      />,
    );
    expect(screen.getByTestId('lean-badge').textContent).toMatch(/rejected/i);
  });

  it('shows timeout for a Lean timeout verdict', () => {
    render(
      <LeanVerifyBadge
        isLoading={false}
        isError={false}
        data={{ verdict: 'timeout', diagnostics: [], message: 'too slow' }}
      />,
    );
    expect(screen.getByTestId('lean-badge').textContent).toMatch(/timeout/i);
  });

  it('shows unavailable when the request errored', () => {
    render(<LeanVerifyBadge isLoading={false} isError={true} data={undefined} />);
    expect(screen.getByTestId('lean-badge').textContent).toMatch(/unavailable/i);
  });
});
