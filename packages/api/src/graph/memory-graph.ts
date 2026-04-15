/**
 * In-memory GraphService backed by graphology.
 *
 * Persistence: loads from / saves to a JSON file in graphology's native
 * export format. Used in dev and test environments.
 */

import Graph from 'graphology';
import { bidirectional } from 'graphology-shortest-path/unweighted.js';
import type { GraphService } from './service.js';
import type {
  GraphNode,
  GraphEdge,
  GraphPath,
  SerializedSubgraph,
  GetEdgesOptions,
  GetNeighborsOptions,
  GetSubgraphOptions,
  ShortestPathOptions,
  EdgeType,
  NodeLabel,
} from './types.js';
import { nodeKey } from './types.js';

export interface MemoryGraphOptions {
  data?: SerializedGraphologyExport;
}

/** The shape produced by graph.export() / consumed by graph.import(). */
export interface SerializedGraphologyExport {
  attributes?: Record<string, unknown>;
  options?: {
    type?: 'mixed' | 'directed' | 'undirected';
    multi?: boolean;
    allowSelfLoops?: boolean;
  };
  nodes: Array<{ key: string; attributes?: Record<string, unknown> }>;
  edges: Array<{
    key?: string;
    source: string;
    target: string;
    attributes?: Record<string, unknown>;
  }>;
}

export class MemoryGraphService implements GraphService {
  private graph: Graph;

  constructor(opts?: MemoryGraphOptions) {
    this.graph = new Graph({ type: 'directed', multi: true, allowSelfLoops: false });
    if (opts?.data) {
      this.graph.import(opts.data);
    }
  }

  async ready(): Promise<void> {
    /* noop — already loaded */
  }

  stats(): { nodeCount: number; edgeCount: number } {
    return { nodeCount: this.graph.order, edgeCount: this.graph.size };
  }

  /** Expose the raw graphology export for serialization / testing. */
  exportJSON(): SerializedGraphologyExport {
    return this.graph.export() as SerializedGraphologyExport;
  }

  // ── Node operations ──────────────────────────────────────────────────────

  async getNode(key: string): Promise<GraphNode | null> {
    if (!this.graph.hasNode(key)) return null;
    const attrs = this.graph.getNodeAttributes(key);
    return { key, label: attrs.label as NodeLabel, attributes: { ...attrs } };
  }

  async findNodes(label: string, filter?: Record<string, unknown>): Promise<GraphNode[]> {
    const result: GraphNode[] = [];
    this.graph.forEachNode((key: string, attrs: Record<string, unknown>) => {
      if (attrs.label !== label) return;
      if (filter) {
        for (const [k, v] of Object.entries(filter)) {
          if (attrs[k] !== v) return;
        }
      }
      result.push({ key, label: attrs.label as NodeLabel, attributes: { ...attrs } });
    });
    return result;
  }

  // ── Edge operations ──────────────────────────────────────────────────────

  async getEdges(nk: string, opts?: GetEdgesOptions): Promise<GraphEdge[]> {
    if (!this.graph.hasNode(nk)) return [];
    const dir = opts?.direction ?? 'both';
    const result: GraphEdge[] = [];

    const collectEdge = (ek: string) => {
      const attrs = this.graph.getEdgeAttributes(ek);
      if (opts?.edgeType && attrs.type !== opts.edgeType) return;
      result.push({
        key: ek,
        source: this.graph.source(ek),
        target: this.graph.target(ek),
        type: attrs.type as EdgeType,
        attributes: { ...attrs },
      });
    };

    if (dir === 'out' || dir === 'both') this.graph.forEachOutEdge(nk, collectEdge);
    if (dir === 'in' || dir === 'both') this.graph.forEachInEdge(nk, collectEdge);

    return result;
  }

  // ── Traversal ────────────────────────────────────────────────────────────

  async getNeighbors(nk: string, opts?: GetNeighborsOptions): Promise<GraphNode[]> {
    if (!this.graph.hasNode(nk)) return [];
    const depth = opts?.depth ?? 1;
    const dir = opts?.direction ?? 'both';
    const edgeTypes = opts?.edgeTypes ? new Set(opts.edgeTypes as string[]) : null;
    const nodeLabels = opts?.nodeLabels ? new Set(opts.nodeLabels as string[]) : null;

    const visited = new Set<string>();
    const result: GraphNode[] = [];
    const queue: Array<{ key: string; d: number }> = [{ key: nk, d: 0 }];
    visited.add(nk);

    while (queue.length > 0) {
      const { key: current, d } = queue.shift()!;
      if (d >= depth) continue;

      const neighborKeys = new Set<string>();

      const collectNeighbor = (ek: string) => {
        const attrs = this.graph.getEdgeAttributes(ek);
        if (edgeTypes && !edgeTypes.has(attrs.type as string)) return;
        const src = this.graph.source(ek);
        const tgt = this.graph.target(ek);
        const neighbor = src === current ? tgt : src;
        neighborKeys.add(neighbor);
      };

      if (dir === 'out' || dir === 'both') this.graph.forEachOutEdge(current, collectNeighbor);
      if (dir === 'in' || dir === 'both') this.graph.forEachInEdge(current, collectNeighbor);

      for (const nbr of neighborKeys) {
        if (visited.has(nbr)) continue;
        visited.add(nbr);

        const nbrAttrs = this.graph.getNodeAttributes(nbr);
        if (nodeLabels && !nodeLabels.has(nbrAttrs.label as string)) continue;

        result.push({
          key: nbr,
          label: nbrAttrs.label as NodeLabel,
          attributes: { ...nbrAttrs },
        });
        queue.push({ key: nbr, d: d + 1 });
      }
    }

    return result;
  }

  async getSubgraph(rootKey: string, opts?: GetSubgraphOptions): Promise<SerializedSubgraph> {
    if (!this.graph.hasNode(rootKey)) return { nodes: [], edges: [] };

    const depth = opts?.depth ?? 2;
    const dir = opts?.direction ?? 'both';
    const edgeTypes = opts?.edgeTypes ? new Set(opts.edgeTypes as string[]) : null;

    const nodeSet = new Set<string>();
    const edgeSet = new Set<string>();
    const queue: Array<{ key: string; d: number }> = [{ key: rootKey, d: 0 }];
    nodeSet.add(rootKey);

    while (queue.length > 0) {
      const { key: current, d } = queue.shift()!;
      if (d >= depth) continue;

      const collectEdge = (ek: string) => {
        const attrs = this.graph.getEdgeAttributes(ek);
        if (edgeTypes && !edgeTypes.has(attrs.type as string)) return;

        edgeSet.add(ek);
        const src = this.graph.source(ek);
        const tgt = this.graph.target(ek);
        const neighbor = src === current ? tgt : src;

        if (!nodeSet.has(neighbor)) {
          nodeSet.add(neighbor);
          queue.push({ key: neighbor, d: d + 1 });
        }
      };

      if (dir === 'out' || dir === 'both') this.graph.forEachOutEdge(current, collectEdge);
      if (dir === 'in' || dir === 'both') this.graph.forEachInEdge(current, collectEdge);
    }

    return this.materialize(nodeSet, edgeSet);
  }

  async shortestPath(
    from: string,
    to: string,
    opts?: ShortestPathOptions,
  ): Promise<GraphPath | null> {
    if (!this.graph.hasNode(from) || !this.graph.hasNode(to)) return null;

    let searchGraph: Graph = this.graph;
    if (opts?.edgeTypes && opts.edgeTypes.length > 0) {
      const allowed = new Set(opts.edgeTypes as string[]);
      searchGraph = this.graph.copy();
      const toDrop: string[] = [];
      searchGraph.forEachEdge((ek: string, attrs: Record<string, unknown>) => {
        if (!allowed.has(attrs.type as string)) toDrop.push(ek);
      });
      for (const ek of toDrop) searchGraph.dropEdge(ek);
    }

    const path: string[] | null = bidirectional(searchGraph, from, to);
    if (!path) return null;
    if (opts?.maxDepth && path.length - 1 > opts.maxDepth) return null;

    const nodes: GraphNode[] = path.map((k: string) => {
      const attrs = this.graph.getNodeAttributes(k);
      return { key: k, label: attrs.label as NodeLabel, attributes: { ...attrs } };
    });

    const edges: GraphEdge[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const edgeKeys = this.graph.edges(path[i], path[i + 1]);
      if (edgeKeys.length > 0) {
        const ek = edgeKeys[0];
        const attrs = this.graph.getEdgeAttributes(ek);
        edges.push({
          key: ek,
          source: this.graph.source(ek),
          target: this.graph.target(ek),
          type: attrs.type as EdgeType,
          attributes: { ...attrs },
        });
      }
    }

    return { nodes, edges, length: path.length - 1 };
  }

  // ── Domain projections ───────────────────────────────────────────────────

  async getInfluenceGraph(philosopherSlug: string, depth = 1): Promise<SerializedSubgraph> {
    const key = nodeKey('Philosopher', philosopherSlug);
    return this.getSubgraph(key, { depth, direction: 'both', edgeTypes: ['INFLUENCED'] });
  }

  async getSchoolGraph(schoolSlug: string): Promise<SerializedSubgraph> {
    const key = nodeKey('School', schoolSlug);
    if (!this.graph.hasNode(key)) return { nodes: [], edges: [] };

    const memberKeys = new Set<string>();
    this.graph.forEachInEdge(key, (ek: string) => {
      const attrs = this.graph.getEdgeAttributes(ek);
      if (attrs.type === 'MEMBER_OF') memberKeys.add(this.graph.source(ek));
    });

    const nodeSet = new Set<string>([key, ...memberKeys]);
    const edgeSet = new Set<string>();

    this.graph.forEachInEdge(key, (ek: string) => {
      const attrs = this.graph.getEdgeAttributes(ek);
      if (attrs.type === 'MEMBER_OF') edgeSet.add(ek);
    });

    for (const mk of memberKeys) {
      this.graph.forEachOutEdge(mk, (ek: string) => {
        const attrs = this.graph.getEdgeAttributes(ek);
        if (attrs.type === 'INFLUENCED' && memberKeys.has(this.graph.target(ek))) {
          edgeSet.add(ek);
        }
      });
    }

    return this.materialize(nodeSet, edgeSet);
  }

  async getCurriculumGraph(curriculumSlug: string): Promise<SerializedSubgraph> {
    const prefix = `curriculumitem:${curriculumSlug}:`;
    const nodeSet = new Set<string>();
    const edgeSet = new Set<string>();

    this.graph.forEachNode((k: string) => {
      if (k.startsWith(prefix)) nodeSet.add(k);
    });

    for (const nk of nodeSet) {
      this.graph.forEachOutEdge(nk, (ek: string) => {
        const attrs = this.graph.getEdgeAttributes(ek);
        const target = this.graph.target(ek);
        if (attrs.type === 'PREREQ_OF' && nodeSet.has(target)) {
          edgeSet.add(ek);
        } else if (attrs.type === 'REFERENCES_WORK' || attrs.type === 'REFERENCES_PHILOSOPHER') {
          edgeSet.add(ek);
          nodeSet.add(target);
        }
      });
    }

    return this.materialize(nodeSet, edgeSet);
  }

  async getFullInfluenceNetwork(): Promise<SerializedSubgraph> {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    this.graph.forEachNode((k: string, attrs: Record<string, unknown>) => {
      if (attrs.label === 'Philosopher') {
        nodes.push({ key: k, label: 'Philosopher', attributes: { ...attrs } });
      }
    });

    this.graph.forEachEdge((ek: string, attrs: Record<string, unknown>) => {
      if (attrs.type === 'INFLUENCED') {
        edges.push({
          key: ek,
          source: this.graph.source(ek),
          target: this.graph.target(ek),
          type: 'INFLUENCED',
          attributes: { ...attrs },
        });
      }
    });

    return { nodes, edges };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private materialize(nodeSet: Set<string>, edgeSet: Set<string>): SerializedSubgraph {
    return {
      nodes: [...nodeSet].map((k) => {
        const attrs = this.graph.getNodeAttributes(k);
        return { key: k, label: attrs.label as NodeLabel, attributes: { ...attrs } };
      }),
      edges: [...edgeSet].map((ek) => {
        const attrs = this.graph.getEdgeAttributes(ek);
        return {
          key: ek,
          source: this.graph.source(ek),
          target: this.graph.target(ek),
          type: attrs.type as EdgeType,
          attributes: { ...attrs },
        };
      }),
    };
  }
}
