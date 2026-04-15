import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/db/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/db/index.js')>();
  return {
    ...actual,
    db: {
      ...actual.db,
      execute: vi.fn(),
    },
  };
});

vi.mock('../../src/graph/index.js', async () => {
  const { MemoryGraphService } = await import('../../src/graph/memory-graph.js');
  const types = await import('../../src/graph/types.js');

  const plato = types.nodeKey('Philosopher', 'plato');
  const aristotle = types.nodeKey('Philosopher', 'aristotle');
  const kant = types.nodeKey('Philosopher', 'kant');
  const platonism = types.nodeKey('School', 'platonism');
  const republic = types.nodeKey('Work', 'republic');

  const testData = {
    options: { type: 'directed' as const, multi: true, allowSelfLoops: false },
    nodes: [
      { key: plato, attributes: { label: 'Philosopher', slug: 'plato', name: 'Plato' } },
      { key: aristotle, attributes: { label: 'Philosopher', slug: 'aristotle', name: 'Aristotle' } },
      { key: kant, attributes: { label: 'Philosopher', slug: 'kant', name: 'Kant' } },
      { key: platonism, attributes: { label: 'School', slug: 'platonism', name: 'Platonism' } },
      { key: republic, attributes: { label: 'Work', slug: 'republic', name: 'Republic' } },
    ],
    edges: [
      {
        source: plato,
        target: aristotle,
        attributes: { type: 'INFLUENCED', influenceType: 'direct' },
      },
      {
        source: plato,
        target: platonism,
        attributes: { type: 'MEMBER_OF', role: 'founder' },
      },
      {
        source: plato,
        target: republic,
        attributes: { type: 'AUTHORED' },
      },
      {
        source: aristotle,
        target: plato,
        attributes: { type: 'INFLUENCED', influenceType: 'critical' },
      },
    ],
  };

  const service = new MemoryGraphService({ data: testData });

  return {
    graphService: service,
    NODE_LABELS: types.NODE_LABELS,
    EDGE_TYPES: types.EDGE_TYPES,
    nodeKey: types.nodeKey,
    parseNodeKey: types.parseNodeKey,
    edgeKey: types.edgeKey,
  };
});

import app from '../../src/index.js';
import { db } from '../../src/db/index.js';

type GraphEdgeShape = { key: string; source: string; target: string; type: string; attributes: Record<string, unknown> };
type GraphNodeShape = { key: string; label: string; attributes: Record<string, unknown> };

type SubgraphBody = {
  graph: { nodes: GraphNodeShape[]; edges: GraphEdgeShape[] };
  meta: { nodeCount: number; edgeCount: number; rootKey?: string; depth?: number };
};

type PathBody = {
  path: {
    nodes: GraphNodeShape[];
    edges: GraphEdgeShape[];
    length: number;
  } | null;
};

describe('Graph API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.execute).mockResolvedValue([] as never);
  });

  it('GET /api/graph/stats returns 200 with nodeCount and edgeCount', async () => {
    const res = await app.request('/api/graph/stats');
    expect(res.status).toBe(200);
    const body = await res.json() as { nodeCount: number; edgeCount: number };
    expect(body.nodeCount).toBe(5);
    expect(body.edgeCount).toBe(4);
  });

  it('GET /api/graph/node/:key returns 200 with node data', async () => {
    const res = await app.request(`/api/graph/node/${encodeURIComponent('philosopher:plato')}`);
    expect(res.status).toBe(200);
    const body = await res.json() as { key: string; label: string; attributes: Record<string, unknown> };
    expect(body.key).toBe('philosopher:plato');
    expect(body.label).toBe('Philosopher');
    expect(body.attributes.slug).toBe('plato');
  });

  it('GET /api/graph/node/:key returns 404 for missing node', async () => {
    const res = await app.request(`/api/graph/node/${encodeURIComponent('philosopher:missing')}`);
    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Node not found');
  });

  it('GET /api/graph/neighbors/:key?depth=1 returns 200 with subgraph', async () => {
    const res = await app.request(
      `/api/graph/neighbors/${encodeURIComponent('philosopher:plato')}?depth=1`,
    );
    expect(res.status).toBe(200);
    const body = await res.json() as SubgraphBody;
    expect(body.meta.rootKey).toBe('philosopher:plato');
    expect(body.meta.depth).toBe(1);
    expect(body.meta.nodeCount).toBe(body.graph.nodes.length);
    expect(body.meta.edgeCount).toBe(body.graph.edges.length);
    const keys = body.graph.nodes.map((n) => n.key).sort();
    expect(keys).toEqual(
      ['philosopher:aristotle', 'philosopher:plato', 'school:platonism', 'work:republic'].sort(),
    );
  });

  it('GET /api/graph/path returns 200 (null path when unreachable)', async () => {
    const res = await app.request(
      '/api/graph/path?' +
        new URLSearchParams({
          from: 'philosopher:plato',
          to: 'philosopher:kant',
        }).toString(),
    );
    expect(res.status).toBe(200);
    const body = await res.json() as PathBody;
    expect(body.path).toBeNull();
  });

  it('GET /api/graph/influence/:slug returns 200 with influence subgraph', async () => {
    const res = await app.request('/api/graph/influence/plato');
    expect(res.status).toBe(200);
    const body = await res.json() as SubgraphBody;
    expect(body.meta.rootKey).toBe('philosopher:plato');
    expect(body.graph.edges.every((e: { type: string }) => e.type === 'INFLUENCED')).toBe(true);
    const keys = body.graph.nodes.map((n) => n.key).sort();
    expect(keys).toEqual(['philosopher:aristotle', 'philosopher:plato'].sort());
  });

  it('GET /api/graph/school/:slug returns 200', async () => {
    const res = await app.request('/api/graph/school/platonism');
    expect(res.status).toBe(200);
    const body = await res.json() as SubgraphBody;
    expect(body.meta.rootKey).toBe('school:platonism');
    const keys = body.graph.nodes.map((n) => n.key).sort();
    expect(keys).toEqual(['philosopher:plato', 'school:platonism'].sort());
    expect(body.graph.edges).toHaveLength(1);
  });

  it('GET /api/graph/influence-network returns 200 with all philosophers', async () => {
    const res = await app.request('/api/graph/influence-network');
    expect(res.status).toBe(200);
    const body = await res.json() as SubgraphBody;
    expect(body.graph.nodes).toHaveLength(3);
    expect(body.graph.nodes.every((n) => n.label === 'Philosopher')).toBe(true);
    expect(body.graph.edges).toHaveLength(2);
    expect(body.graph.edges.every((e: { type: string }) => e.type === 'INFLUENCED')).toBe(true);
  });
});
