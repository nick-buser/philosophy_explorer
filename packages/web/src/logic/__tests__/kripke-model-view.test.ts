import { describe, expect, it } from 'vitest';
import { buildGraph } from '../KripkeModelView';
import type { KripkeModel } from '../kripke-types';

function model(partial: Partial<KripkeModel>): KripkeModel {
  return { worlds: [], edges: [], ...partial };
}

describe('buildGraph — nodes', () => {
  it('marks the designated world', () => {
    const { nodes } = buildGraph(model({
      worlds: [{ id: 'w0', atoms: [] }, { id: 'w1', atoms: [] }],
      designated: 'w1',
    }));
    expect(nodes.find(n => n.id === 'w0')?.data.designated).toBe(false);
    expect(nodes.find(n => n.id === 'w1')?.data.designated).toBe(true);
  });

  it('detects reflexivity from self-loop edges', () => {
    const { nodes } = buildGraph(model({
      worlds: [{ id: 'w0', atoms: [] }, { id: 'w1', atoms: [] }],
      edges: [{ from: 'w0', to: 'w0' }],
    }));
    expect(nodes.find(n => n.id === 'w0')?.data.reflexive).toBe(true);
    expect(nodes.find(n => n.id === 'w1')?.data.reflexive).toBe(false);
  });

  it('preserves world atoms verbatim', () => {
    const { nodes } = buildGraph(model({
      worlds: [{ id: 'w0', atoms: ['p', 'q'] }],
    }));
    expect(nodes[0].data.atoms).toEqual(['p', 'q']);
  });

  it('uses the world label when provided', () => {
    const { nodes } = buildGraph(model({
      worlds: [{ id: 'w0', label: 'actual', atoms: [] }],
    }));
    expect(nodes[0].data.worldId).toBe('actual');
  });
});

describe('buildGraph — edges', () => {
  it('drops self-loops from the rendered edges', () => {
    const { edges } = buildGraph(model({
      worlds: [{ id: 'w0', atoms: [] }],
      edges: [{ from: 'w0', to: 'w0' }],
    }));
    expect(edges).toHaveLength(0);
  });

  it('renders a one-way edge as a single arrow', () => {
    const { edges } = buildGraph(model({
      worlds: [{ id: 'w0', atoms: [] }, { id: 'w1', atoms: [] }],
      edges: [{ from: 'w0', to: 'w1' }],
    }));
    expect(edges).toHaveLength(1);
    expect(edges[0].markerEnd).toBeDefined();
    expect(edges[0].markerStart).toBeUndefined();
  });

  it('collapses a symmetric pair into one double-headed edge', () => {
    const { edges } = buildGraph(model({
      worlds: [{ id: 'w0', atoms: [] }, { id: 'w1', atoms: [] }],
      edges: [
        { from: 'w0', to: 'w1' },
        { from: 'w1', to: 'w0' },
      ],
    }));
    expect(edges).toHaveLength(1);
    expect(edges[0].markerEnd).toBeDefined();
    expect(edges[0].markerStart).toBeDefined();
  });

  it('handles three-world S5 closure without duplicating edges', () => {
    // 3 worlds, all bidirectional + reflexive
    const ids = ['w0', 'w1', 'w2'];
    const all: { from: string; to: string }[] = [];
    for (const a of ids) for (const b of ids) all.push({ from: a, to: b });
    const { edges, nodes } = buildGraph(model({
      worlds: ids.map(id => ({ id, atoms: [] })),
      edges: all,
    }));
    // 3 reflexive (dropped) + 3 unique pairs (collapsed) = 3 rendered edges
    expect(edges).toHaveLength(3);
    // each non-self pair has both markers
    for (const e of edges) {
      expect(e.markerStart).toBeDefined();
      expect(e.markerEnd).toBeDefined();
    }
    // every world reads as reflexive
    expect(nodes.every(n => n.data.reflexive)).toBe(true);
  });
});
