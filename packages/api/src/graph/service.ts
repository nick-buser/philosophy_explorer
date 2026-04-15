/**
 * GraphService — abstract interface for the unified philosophy graph.
 *
 * Implementations:
 *   - MemoryGraphService (graphology + JSON file) — dev / test
 *   - Neo4jGraphService  (neo4j-driver + Bolt)    — staging / prod (future)
 */

import type {
  GraphNode,
  GraphEdge,
  GraphPath,
  SerializedSubgraph,
  GetEdgesOptions,
  GetNeighborsOptions,
  GetSubgraphOptions,
  ShortestPathOptions,
} from './types.js';

export interface GraphService {
  // ── Node operations ──
  getNode(key: string): Promise<GraphNode | null>;
  findNodes(label: string, filter?: Record<string, unknown>): Promise<GraphNode[]>;

  // ── Edge operations ──
  getEdges(nodeKey: string, opts?: GetEdgesOptions): Promise<GraphEdge[]>;

  // ── Traversal ──
  getNeighbors(nodeKey: string, opts?: GetNeighborsOptions): Promise<GraphNode[]>;
  getSubgraph(rootKey: string, opts?: GetSubgraphOptions): Promise<SerializedSubgraph>;
  shortestPath(from: string, to: string, opts?: ShortestPathOptions): Promise<GraphPath | null>;

  // ── Domain projections ──
  getInfluenceGraph(philosopherSlug: string, depth?: number): Promise<SerializedSubgraph>;
  getSchoolGraph(schoolSlug: string): Promise<SerializedSubgraph>;
  getCurriculumGraph(curriculumSlug: string): Promise<SerializedSubgraph>;
  getFullInfluenceNetwork(): Promise<SerializedSubgraph>;

  // ── Lifecycle ──
  ready(): Promise<void>;
  stats(): { nodeCount: number; edgeCount: number };
}
