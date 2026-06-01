import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';

import { rootRoute } from '../__root';
import { indexRoute } from '../index';
import { philosopherDetailRoute } from '../philosophers.$slug';
import { workDetailRoute } from '../works.$slug';
import { schoolDetailRoute } from '../schools.$slug';
import { curriculaRoute } from '../curricula';
import { curriculumDetailRoute } from '../curricula.$slug';
import { logicIndexRoute } from '../logic';
import { logicSystemRoute } from '../logic.$system';
import { argumentsRoute, argumentsIndexRoute } from '../arguments';
import { argumentNewRoute } from '../arguments.new';
import { argumentDetailRoute } from '../arguments.$';

// Mirror the production routeTree (packages/web/src/router.tsx) so matching is realistic.
const argumentsTree = argumentsRoute.addChildren([
  argumentsIndexRoute,
  argumentNewRoute,
  argumentDetailRoute,
]);

const routeTree = rootRoute.addChildren([
  indexRoute,
  philosopherDetailRoute,
  workDetailRoute,
  schoolDetailRoute,
  curriculaRoute,
  curriculumDetailRoute,
  logicIndexRoute,
  logicSystemRoute,
  argumentsTree,
]);

function renderAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  // Keep useQuery from doing real network in jsdom; the assertions only care
  // about which route component mounts, not data.
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in test'))));
});

describe('arguments route matching', () => {
  it('/arguments renders the LIST page (not the detail splat with an empty id)', async () => {
    renderAt('/arguments');
    // The list page has an <h1>Arguments</h1> and a "+ New argument" link.
    // The detail page (the bug) renders ArgumentCard + a "← All arguments" link instead.
    expect(await screen.findByRole('heading', { level: 1, name: 'Arguments' })).toBeInTheDocument();
    expect(screen.getByText('+ New argument')).toBeInTheDocument();
    expect(screen.queryByText('← All arguments')).not.toBeInTheDocument();
  });

  it('/arguments/new renders the editor', async () => {
    renderAt('/arguments/new');
    expect(await screen.findByRole('heading', { name: 'New argument' })).toBeInTheDocument();
  });

  it('/arguments/<id> renders the detail page', async () => {
    renderAt('/arguments/aristotle/categories/001-said-of-transitivity');
    expect(await screen.findByText('← All arguments')).toBeInTheDocument();
  });
});
