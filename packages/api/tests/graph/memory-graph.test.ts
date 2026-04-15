import { describe, it, expect } from 'vitest';
import { MemoryGraphService } from '../../src/graph/memory-graph.js';
import { nodeKey } from '../../src/graph/types.js';

const plato = nodeKey('Philosopher', 'plato');
const aristotle = nodeKey('Philosopher', 'aristotle');
const kant = nodeKey('Philosopher', 'kant');
const platonism = nodeKey('School', 'platonism');
const republic = nodeKey('Work', 'republic');

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

function createService(): MemoryGraphService {
  return new MemoryGraphService({ data: testData });
}

describe('MemoryGraphService', () => {
  it('stats() returns correct counts', () => {
    const g = createService();
    expect(g.stats()).toEqual({ nodeCount: 5, edgeCount: 4 });
  });

  it('getNode() returns node with attributes, returns null for missing', async () => {
    const g = createService();
    const node = await g.getNode(plato);
    expect(node).not.toBeNull();
    expect(node!.key).toBe(plato);
    expect(node!.label).toBe('Philosopher');
    expect(node!.attributes.slug).toBe('plato');
    expect(node!.attributes.name).toBe('Plato');

    expect(await g.getNode('philosopher:missing')).toBeNull();
  });

  it("findNodes('Philosopher') returns only philosopher nodes", async () => {
    const g = createService();
    const philosophers = await g.findNodes('Philosopher');
    const keys = philosophers.map((n) => n.key).sort();
    expect(keys).toEqual([aristotle, kant, plato].sort());
    expect(philosophers.every((n) => n.label === 'Philosopher')).toBe(true);
  });

  it('getEdges() respects direction and edgeType filter', async () => {
    const g = createService();
    const out = await g.getEdges(plato, { direction: 'out' });
    expect(out).toHaveLength(3);
    expect(out.map((e) => e.type).sort()).toEqual(['AUTHORED', 'INFLUENCED', 'MEMBER_OF'].sort());

    const inn = await g.getEdges(plato, { direction: 'in' });
    expect(inn).toHaveLength(1);
    expect(inn[0]!.type).toBe('INFLUENCED');
    expect(inn[0]!.source).toBe(aristotle);

    const both = await g.getEdges(plato, { direction: 'both' });
    expect(both).toHaveLength(4);

    const influencedOut = await g.getEdges(plato, { direction: 'out', edgeType: 'INFLUENCED' });
    expect(influencedOut).toHaveLength(1);
    expect(influencedOut[0]!.target).toBe(aristotle);
  });

  it('getNeighbors() at depth 1 and depth 2', async () => {
    const g = createService();
    const d1 = await g.getNeighbors(plato, { depth: 1 });
    const d1Keys = d1.map((n) => n.key).sort();
    expect(d1Keys).toEqual([aristotle, platonism, republic].sort());

    const d2 = await g.getNeighbors(plato, { depth: 2 });
    const d2Keys = d2.map((n) => n.key).sort();
    expect(d2Keys).toEqual(d1Keys);
  });

  it('getSubgraph() returns correct nodes and edges within depth', async () => {
    const g = createService();
    const sg1 = await g.getSubgraph(plato, { depth: 1, direction: 'both' });
    const n1 = sg1.nodes.map((n) => n.key).sort();
    expect(n1).toEqual([aristotle, plato, platonism, republic].sort());
    expect(sg1.edges).toHaveLength(4);

    const sg2 = await g.getSubgraph(plato, { depth: 2, direction: 'both' });
    const n2 = sg2.nodes.map((n) => n.key).sort();
    expect(n2).toEqual(n1);
  });

  it('shortestPath() finds a path and returns null when no path exists', async () => {
    const g = createService();
    const ok = await g.shortestPath(plato, aristotle);
    expect(ok).not.toBeNull();
    expect(ok!.length).toBe(1);
    expect(ok!.nodes.map((n) => n.key)).toEqual([plato, aristotle]);

    const none = await g.shortestPath(plato, kant);
    expect(none).toBeNull();
  });

  it('getInfluenceGraph() returns only INFLUENCED edges', async () => {
    const g = createService();
    const inf = await g.getInfluenceGraph('plato', 1);
    const nodeKeys = inf.nodes.map((n) => n.key).sort();
    expect(nodeKeys).toEqual([aristotle, plato].sort());
    expect(inf.edges).toHaveLength(2);
    expect(inf.edges.every((e) => e.type === 'INFLUENCED')).toBe(true);
  });

  it('getSchoolGraph() returns school + members + inter-member influences', async () => {
    const g = createService();
    const school = await g.getSchoolGraph('platonism');
    const nodeKeys = school.nodes.map((n) => n.key).sort();
    expect(nodeKeys).toEqual([plato, platonism].sort());
    expect(school.edges).toHaveLength(1);
    expect(school.edges[0]!.type).toBe('MEMBER_OF');
  });

  it('getFullInfluenceNetwork() returns only philosophers and INFLUENCED edges', async () => {
    const g = createService();
    const net = await g.getFullInfluenceNetwork();
    expect(net.nodes).toHaveLength(3);
    expect(net.nodes.every((n) => n.label === 'Philosopher')).toBe(true);
    expect(net.edges).toHaveLength(2);
    expect(net.edges.every((e) => e.type === 'INFLUENCED')).toBe(true);
  });

  it('exportJSON() produces valid graphology format', () => {
    const g = createService();
    const exported = g.exportJSON();
    expect(exported.options?.type).toBe('directed');
    expect(exported.options?.multi).toBe(true);
    expect(exported.options?.allowSelfLoops).toBe(false);
    expect(Array.isArray(exported.nodes)).toBe(true);
    expect(exported.nodes).toHaveLength(5);
    expect(Array.isArray(exported.edges)).toBe(true);
    expect(exported.edges).toHaveLength(4);
    for (const n of exported.nodes) {
      expect(typeof n.key).toBe('string');
      expect(n.attributes).toBeDefined();
    }
    for (const e of exported.edges) {
      expect(typeof e.source).toBe('string');
      expect(typeof e.target).toBe('string');
    }
  });
});
