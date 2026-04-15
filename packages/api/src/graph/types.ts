/**
 * Shared types for the graph service layer.
 *
 * These types define the contract between the GraphService interface and
 * its consumers (API routes, build scripts, tests). They map cleanly to
 * Neo4j's labeled property graph model while remaining storage-agnostic.
 */

// ── Node & Edge Labels ───────────────────────────────────────────────────────

export const NODE_LABELS = ['Philosopher', 'Work', 'School', 'CurriculumItem'] as const;
export type NodeLabel = (typeof NODE_LABELS)[number];

export const EDGE_TYPES = [
  'INFLUENCED',
  'MEMBER_OF',
  'AUTHORED',
  'PREREQ_OF',
  'REFERENCES_WORK',
  'REFERENCES_PHILOSOPHER',
] as const;
export type EdgeType = (typeof EDGE_TYPES)[number];

// ── Core data types ──────────────────────────────────────────────────────────

export interface GraphNode {
  key: string;
  label: NodeLabel;
  attributes: Record<string, unknown>;
}

export interface GraphEdge {
  key: string;
  source: string;
  target: string;
  type: EdgeType;
  attributes: Record<string, unknown>;
}

export interface GraphPath {
  nodes: GraphNode[];
  edges: GraphEdge[];
  length: number;
}

export interface SerializedSubgraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SubgraphResponse {
  graph: SerializedSubgraph;
  meta: {
    nodeCount: number;
    edgeCount: number;
    rootKey?: string;
    depth?: number;
  };
}

// ── Key helpers ──────────────────────────────────────────────────────────────

export function nodeKey(label: NodeLabel, slug: string): string {
  return `${label.toLowerCase()}:${slug}`;
}

export function parseNodeKey(key: string): { label: string; slug: string } {
  const idx = key.indexOf(':');
  if (idx === -1) throw new Error(`Invalid node key: ${key}`);
  return { label: key.slice(0, idx), slug: key.slice(idx + 1) };
}

export function edgeKey(
  type: EdgeType,
  sourceSlug: string,
  targetSlug: string,
  qualifier?: string,
): string {
  const parts = [type.toLowerCase(), `${sourceSlug}->${targetSlug}`];
  if (qualifier) parts.push(qualifier);
  return parts.join(':');
}

// ── Direction for traversal queries ──────────────────────────────────────────

export type TraversalDirection = 'in' | 'out' | 'both';

// ── Query option bags ────────────────────────────────────────────────────────

export interface GetEdgesOptions {
  direction?: TraversalDirection;
  edgeType?: EdgeType;
}

export interface GetNeighborsOptions {
  depth?: number;
  direction?: TraversalDirection;
  edgeTypes?: EdgeType[];
  nodeLabels?: NodeLabel[];
}

export interface GetSubgraphOptions {
  depth?: number;
  direction?: TraversalDirection;
  edgeTypes?: EdgeType[];
}

export interface ShortestPathOptions {
  edgeTypes?: EdgeType[];
  maxDepth?: number;
}
