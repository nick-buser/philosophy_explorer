import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Stub TanStack router's Link — the component renders it inside attribution
// lines and the real Link needs a RouterProvider that's overkill for unit tests.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, ...rest }: { children: React.ReactNode } & Record<string, unknown>) => (
    <a {...(rest as object)}>{children}</a>
  ),
}));

import { ArgumentCard } from '../ArgumentCard';
import type { ArgumentDetail } from '../../lib/argument-types';

// ── Fixtures ──────────────────────────────────────────────────────────────

// fol: a single quantified claim, no human verbalization (auto-render path).
const folArgument: ArgumentDetail = {
  id: 'aristotle/ne/001',
  extractionId: 'aristotle/ne/001',
  workId: 'w1',
  workSlug: 'nicomachean-ethics',
  workTitle: 'Nicomachean Ethics',
  source: { file: 'src.txt', startLine: 1, endLine: 3, excerpt: 'Every art ... aims at some good' },
  intent: 'Every art aims at some good.',
  extractorNote: null,
  clauses: [{ id: 'c0', role: 'claim', position: 0, verbalText: null, sourceExcerpt: null }],
  formalizations: [
    {
      id: 'f0',
      formalism: 'fol',
      isPrimary: true,
      fitScore: null,
      reason: null,
      distortionRisk: null,
      ast: {
        formula: {
          kind: 'forall',
          variable: 'x',
          body: {
            kind: 'implies',
            left: { kind: 'pred', name: 'Art', args: [{ kind: 'var', name: 'x' }] },
            right: { kind: 'pred', name: 'AimsAtGood', args: [{ kind: 'var', name: 'x' }] },
          },
        },
      },
    },
  ],
  assessments: [
    { formalism: 'aristotelian', fitScore: 0.3, reason: 'term logic loses the relation', distortionRisk: null },
  ],
  reviewerNotes: ['Hedged in the original by "it is thought".'],
  attributions: [
    {
      id: 'at0',
      philosopherId: 'p1',
      philosopherSlug: 'aristotle',
      philosopherName: 'Aristotle',
      workId: 'w1',
      workSlug: 'nicomachean-ethics',
      workTitle: 'Nicomachean Ethics',
      formalizationId: 'f0',
      provenance: 'auto',
      sourceText: 'Every art, and every science … aims, it is thought, at some good',
      note: null,
    },
  ],
};

// nd: 1 premise + 1 conclusion, premise has a human verbalization.
const ndArgument: ArgumentDetail = {
  id: 'plato/meno/001',
  extractionId: 'plato/meno/001',
  workId: null,
  workSlug: null,
  workTitle: null,
  source: { file: null, startLine: null, endLine: null, excerpt: null },
  intent: 'Virtue is the same in all.',
  extractorNote: 'Lossy in the elenctic rhythm.',
  clauses: [
    { id: 'c0', role: 'premise', position: 0, verbalText: 'All good people are temperate.', sourceExcerpt: null },
    { id: 'c1', role: 'conclusion', position: 1, verbalText: null, sourceExcerpt: null },
  ],
  formalizations: [
    {
      id: 'f0',
      formalism: 'nd',
      isPrimary: true,
      fitScore: null,
      reason: null,
      distortionRisk: null,
      ast: {
        argument: {
          premises: [{ kind: 'pred', name: 'P', args: [] }],
          conclusion: { kind: 'pred', name: 'Q', args: [] },
        },
        proof: null,
      },
    },
  ],
  assessments: [],
  reviewerNotes: [],
  attributions: [
    {
      id: 'at0',
      philosopherId: 'p2',
      philosopherSlug: 'plato',
      philosopherName: 'Plato',
      workId: null,
      workSlug: null,
      workTitle: null,
      formalizationId: 'f0',
      provenance: 'sanity_checked',
      sourceText: null,
      note: null,
    },
  ],
};

// dialogical: rendered as a move list, not a clause table.
const dialogicalArgument: ArgumentDetail = {
  id: 'plato/meno/003',
  extractionId: 'plato/meno/003',
  workId: null,
  workSlug: null,
  workTitle: null,
  source: { file: null, startLine: null, endLine: null, excerpt: null },
  intent: 'The slave-boy exchange.',
  extractorNote: null,
  clauses: [{ id: 'c0', role: 'composite', position: 0, verbalText: null, sourceExcerpt: null }],
  formalizations: [
    {
      id: 'f0',
      formalism: 'dialogical',
      isPrimary: true,
      fitScore: null,
      reason: null,
      distortionRisk: null,
      ast: {
        dialogue: {
          participants: ['Socrates', 'Boy'],
          summary: 'Recovering the answer by question.',
          moves: [
            { move_no: 1, speaker: 'Socrates', act: 'question', content: 'Is this a square?', cites: [] },
            { move_no: 2, speaker: 'Boy', act: 'concession', content: 'It is.', cites: [1] },
          ],
        },
      },
    },
  ],
  assessments: [],
  reviewerNotes: [],
  attributions: [],
};

function renderCard(argumentId: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ArgumentCard argumentId={argumentId} />
    </QueryClientProvider>,
  );
}

function mockFetch(detail: ArgumentDetail) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => detail })),
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('ArgumentCard', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('renders a fol argument and auto-renders the formula when no verbal text exists', async () => {
    mockFetch(folArgument);
    renderCard(folArgument.id);

    await waitFor(() => expect(screen.getByText(folArgument.intent)).toBeInTheDocument());

    // The formula renders in the symbolic column, and — since this clause has
    // no human verbalization — the verbal column auto-renders the same formula.
    expect(screen.getAllByText(/∀x\./)).toHaveLength(2);
    expect(screen.getByText('auto')).toBeInTheDocument();
  });

  it('renders an nd argument with one row per clause and uses real verbal text when present', async () => {
    mockFetch(ndArgument);
    renderCard(ndArgument.id);

    await waitFor(() => expect(screen.getByText(ndArgument.intent)).toBeInTheDocument());

    expect(screen.getByText('Premise')).toBeInTheDocument();
    expect(screen.getByText('Conclusion')).toBeInTheDocument();
    // Premise has a human verbalization — shown verbatim, not auto-tagged.
    expect(screen.getByText('All good people are temperate.')).toBeInTheDocument();
    // Conclusion has none → auto-rendered.
    expect(screen.getByText('auto')).toBeInTheDocument();
  });

  it('renders a dialogical argument as a move list', async () => {
    mockFetch(dialogicalArgument);
    renderCard(dialogicalArgument.id);

    await waitFor(() => expect(screen.getByText(dialogicalArgument.intent)).toBeInTheDocument());

    expect(screen.getByText('Is this a square?')).toBeInTheDocument();
    expect(screen.getByText('It is.')).toBeInTheDocument();
    expect(screen.getByText('Socrates')).toBeInTheDocument();
    // No clause-table headers for dialogical.
    expect(screen.queryByText('Premise')).not.toBeInTheDocument();
  });

  it('flags an unknown dialogue act (outside DIALOGUE_ACTS)', async () => {
    // Simulate an extraction whose `act` is not in the closed vocabulary —
    // e.g. claim_extractor evolves and adds an act the UI doesn't yet know.
    // The runtime can't reject the data wholesale, but it must not render it
    // as if it were known. Cast through unknown so the test bypasses the
    // closed DialogueAct type and exercises the runtime guard.
    const rogue = JSON.parse(JSON.stringify(dialogicalArgument)) as ArgumentDetail;
    (rogue.formalizations[0].ast as { dialogue: { moves: { act: string }[] } })
      .dialogue.moves[0].act = 'meta_question';
    mockFetch(rogue);
    renderCard(rogue.id);

    await waitFor(() => expect(screen.getByText(rogue.intent)).toBeInTheDocument());
    expect(screen.getByTestId('unknown-act')).toHaveTextContent('meta_question');
  });

  it('renders attribution with philosopher, work, and a provenance badge', async () => {
    mockFetch(folArgument);
    renderCard(folArgument.id);

    await waitFor(() => expect(screen.getByText('Aristotle')).toBeInTheDocument());
    expect(screen.getByText('Nicomachean Ethics')).toBeInTheDocument();
    expect(screen.getByText('auto-generated')).toBeInTheDocument();
  });

  it('shows the sanity_checked provenance label when set', async () => {
    mockFetch(ndArgument);
    renderCard(ndArgument.id);

    await waitFor(() => expect(screen.getByText('Plato')).toBeInTheDocument());
    expect(screen.getByText('sanity-checked')).toBeInTheDocument();
  });

  it('renders the attribution source-text quote when present', async () => {
    mockFetch(folArgument);
    renderCard(folArgument.id);

    await waitFor(() => expect(screen.getByText('Aristotle')).toBeInTheDocument());
    expect(
      screen.getByText(/Every art, and every science … aims, it is thought, at some good/)
    ).toBeInTheDocument();
  });

  it('omits the attribution quote when sourceText is null', async () => {
    mockFetch(ndArgument);
    const { container } = renderCard(ndArgument.id);

    await waitFor(() => expect(screen.getByText('Plato')).toBeInTheDocument());
    expect(container.querySelector('blockquote')).toBeNull();
  });

  it('reveals source, assessments and reviewer notes when context is expanded', async () => {
    mockFetch(folArgument);
    renderCard(folArgument.id);

    await waitFor(() => expect(screen.getByText(folArgument.intent)).toBeInTheDocument());

    // Context is collapsed by default.
    expect(screen.queryByText(/Every art \.\.\. aims at some good/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByText(/Source, notes & assessments/));

    expect(screen.getByText(/Every art \.\.\. aims at some good/)).toBeInTheDocument();
    expect(screen.getByText(/term logic loses the relation/)).toBeInTheDocument();
    expect(screen.getByText(/Hedged in the original/)).toBeInTheDocument();
  });
});
