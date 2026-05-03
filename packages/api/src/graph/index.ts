/**
 * Graph service factory.
 *
 * Strategy pattern mirroring the DB adapter in src/db/index.ts:
 *   - GRAPH_DATABASE_URL unset or "memory" → MemoryGraphService (dev/test)
 *   - GRAPH_DATABASE_URL = "bolt://..." or "neo4j://..." → Neo4jGraphService (prod)
 *
 * The Neo4j implementation is a future ticket; for now, only memory is wired.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MemoryGraphService } from './memory-graph.js';
import type { GraphService } from './service.js';
import type { SerializedGraphologyExport } from './memory-graph.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const graphUrl = process.env.GRAPH_DATABASE_URL ?? 'memory';

function createGraphService(): GraphService {
  if (graphUrl.startsWith('bolt://') || graphUrl.startsWith('neo4j://')) {
    // Future: return new Neo4jGraphService(graphUrl);
    throw new Error(
      `Neo4j graph service not yet implemented. ` +
      `Set GRAPH_DATABASE_URL=memory (or unset it) for the in-memory graph.`,
    );
  }

  const dataPath = resolve(__dirname, '../../../../data/graph-data.json');
  let data: SerializedGraphologyExport | undefined;
  try {
    const raw = readFileSync(dataPath, 'utf-8');
    data = JSON.parse(raw) as SerializedGraphologyExport;
  } catch {
    console.warn(
      `[graph] No graph-data.json found at ${dataPath}. ` +
      `Run "npm run graph:build" to generate it. Starting with empty graph.`,
    );
  }

  return new MemoryGraphService({ data });
}

export const graphService: GraphService = createGraphService();
export type { GraphService } from './service.js';
export {
  type GraphNode,
  type GraphEdge,
  type GraphPath,
  type SerializedSubgraph,
  type SubgraphResponse,
  nodeKey,
  parseNodeKey,
  edgeKey,
  NODE_LABELS,
  EDGE_TYPES,
} from './types.js';
