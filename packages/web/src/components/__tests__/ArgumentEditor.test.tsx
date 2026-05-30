import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ArgumentEditor } from '../ArgumentEditor';

// Branch the global fetch on URL + method.
function installFetch(onPost?: (body: unknown) => void) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    const method = init?.method ?? 'GET';
    if (u.endsWith('/api/philosophers'))
      return jsonResp([{ slug: 'aristotle', name: 'Aristotle' }]);
    if (u.endsWith('/api/works'))
      return jsonResp([{ slug: 'nicomachean-ethics', title: 'Nicomachean Ethics' }]);
    if (u.endsWith('/api/arguments') && method === 'POST') {
      onPost?.(JSON.parse(String(init?.body)));
      return jsonResp({ id: 'created-id' }, 201);
    }
    return jsonResp({}, 404);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function jsonResp(body: unknown, status = 200) {
  return {
    ok: status < 400,
    status,
    json: async () => body,
  } as Response;
}

function renderEditor(props: Partial<Parameters<typeof ArgumentEditor>[0]> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onSaved = vi.fn();
  const onCancel = vi.fn();
  render(
    <QueryClientProvider client={qc}>
      <ArgumentEditor mode="create" onSaved={onSaved} onCancel={onCancel} {...props} />
    </QueryClientProvider>,
  );
  return { onSaved, onCancel };
}

describe('ArgumentEditor (create)', () => {
  beforeEach(() => installFetch());
  afterEach(() => vi.unstubAllGlobals());

  it('renders the create heading', () => {
    renderEditor();
    expect(screen.getByText('New argument')).toBeInTheDocument();
  });

  it('blocks submit when intent is empty', async () => {
    const { onSaved } = renderEditor();
    await userEvent.click(screen.getByRole('button', { name: /create argument/i }));
    expect(await screen.findByText(/intent is required/i)).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('reports invalid AST JSON', async () => {
    renderEditor();
    await userEvent.type(screen.getByPlaceholderText(/what this argument captures/i), 'My intent');
    const ast = screen.getByText('AST (JSON)').parentElement!.querySelector('textarea')!;
    await userEvent.clear(ast);
    await userEvent.type(ast, 'not json{{');
    await userEvent.click(screen.getByRole('button', { name: /create argument/i }));
    expect(await screen.findByText(/not valid JSON/i)).toBeInTheDocument();
  });

  it('POSTs a valid argument and calls onSaved with the new id', async () => {
    let posted: unknown = null;
    installFetch(b => { posted = b; });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const onSaved = vi.fn();
    render(
      <QueryClientProvider client={qc}>
        <ArgumentEditor mode="create" onSaved={onSaved} onCancel={() => {}} />
      </QueryClientProvider>,
    );
    await userEvent.type(screen.getByPlaceholderText(/what this argument captures/i), 'A valid intent');
    await userEvent.click(screen.getByRole('button', { name: /create argument/i }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('created-id'));
    expect((posted as { intent: string }).intent).toBe('A valid intent');
    // default form ships one primary fol formalization with a valid-JSON ast
    expect((posted as { formalizations: { formalism: string; isPrimary: boolean }[] }).formalizations[0])
      .toMatchObject({ formalism: 'fol', isPrimary: true });
  });
});
