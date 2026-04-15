import { createRoute, z } from '@hono/zod-openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { graphService, NODE_LABELS, EDGE_TYPES } from '../graph/index.js';
import type { EdgeType, NodeLabel, TraversalDirection } from '../graph/types.js';

const app = new OpenAPIHono();

// ── Shared response schemas ──────────────────────────────────────────────────

const GraphNodeSchema = z.object({
  key: z.string(),
  label: z.string(),
  attributes: z.record(z.unknown()),
});

const GraphEdgeSchema = z.object({
  key: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string(),
  attributes: z.record(z.unknown()),
});

const SubgraphResponseSchema = z.object({
  graph: z.object({
    nodes: z.array(GraphNodeSchema),
    edges: z.array(GraphEdgeSchema),
  }),
  meta: z.object({
    nodeCount: z.number(),
    edgeCount: z.number(),
    rootKey: z.string().optional(),
    depth: z.number().optional(),
  }),
});

const PathResponseSchema = z.object({
  path: z.object({
    nodes: z.array(GraphNodeSchema),
    edges: z.array(GraphEdgeSchema),
    length: z.number(),
  }).nullable(),
});

const StatsResponseSchema = z.object({
  nodeCount: z.number(),
  edgeCount: z.number(),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseDirection(d?: string): TraversalDirection {
  if (d === 'in' || d === 'out' || d === 'both') return d;
  return 'both';
}

function parseEdgeTypes(raw?: string): EdgeType[] | undefined {
  if (!raw) return undefined;
  return raw.split(',').filter((t) => (EDGE_TYPES as readonly string[]).includes(t)) as EdgeType[];
}

function parseNodeLabels(raw?: string): NodeLabel[] | undefined {
  if (!raw) return undefined;
  return raw.split(',').filter((l) => (NODE_LABELS as readonly string[]).includes(l)) as NodeLabel[];
}

// ── GET /api/graph/stats ─────────────────────────────────────────────────────

const statsRoute = createRoute({
  method: 'get',
  path: '/api/graph/stats',
  tags: ['Graph'],
  summary: 'Graph statistics (node and edge counts)',
  responses: {
    200: {
      description: 'Current graph statistics',
      content: { 'application/json': { schema: StatsResponseSchema } },
    },
  },
});

app.openapi(statsRoute, async (c) => {
  return c.json(graphService.stats(), 200);
});

// ── GET /api/graph/node/:key ─────────────────────────────────────────────────

const nodeRoute = createRoute({
  method: 'get',
  path: '/api/graph/node/{key}',
  tags: ['Graph'],
  summary: 'Get a single graph node by compound key',
  request: {
    params: z.object({ key: z.string().openapi({ example: 'philosopher:immanuel-kant' }) }),
  },
  responses: {
    200: {
      description: 'Node found',
      content: { 'application/json': { schema: GraphNodeSchema } },
    },
    404: {
      description: 'Node not found',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
    },
  },
});

app.openapi(nodeRoute, async (c) => {
  const { key } = c.req.valid('param');
  const node = await graphService.getNode(key);
  if (!node) return c.json({ error: 'Node not found' }, 404);
  return c.json(node, 200);
});

// ── GET /api/graph/neighbors/:key ────────────────────────────────────────────

const neighborsRoute = createRoute({
  method: 'get',
  path: '/api/graph/neighbors/{key}',
  tags: ['Graph'],
  summary: 'Get the ego-graph (neighbors) around a node',
  request: {
    params: z.object({ key: z.string() }),
    query: z.object({
      depth: z.coerce.number().int().min(1).max(6).default(1).optional(),
      direction: z.enum(['in', 'out', 'both']).default('both').optional(),
      edgeTypes: z.string().optional(),
      nodeLabels: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Subgraph around the node',
      content: { 'application/json': { schema: SubgraphResponseSchema } },
    },
    404: {
      description: 'Root node not found',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } },
    },
  },
});

app.openapi(neighborsRoute, async (c) => {
  const { key } = c.req.valid('param');
  const q = c.req.valid('query');

  const node = await graphService.getNode(key);
  if (!node) return c.json({ error: 'Root node not found' }, 404);

  const depth = q.depth ?? 1;
  const subgraph = await graphService.getSubgraph(key, {
    depth,
    direction: parseDirection(q.direction),
    edgeTypes: parseEdgeTypes(q.edgeTypes),
  });

  return c.json({
    graph: subgraph,
    meta: {
      nodeCount: subgraph.nodes.length,
      edgeCount: subgraph.edges.length,
      rootKey: key,
      depth,
    },
  }, 200);
});

// ── GET /api/graph/path ──────────────────────────────────────────────────────

const pathRoute = createRoute({
  method: 'get',
  path: '/api/graph/path',
  tags: ['Graph'],
  summary: 'Shortest path between two nodes',
  request: {
    query: z.object({
      from: z.string().openapi({ example: 'philosopher:plato' }),
      to: z.string().openapi({ example: 'philosopher:brandom' }),
      edgeTypes: z.string().optional(),
      maxDepth: z.coerce.number().int().min(1).max(10).default(6).optional(),
    }),
  },
  responses: {
    200: {
      description: 'Path result (null if no path found)',
      content: { 'application/json': { schema: PathResponseSchema } },
    },
  },
});

app.openapi(pathRoute, async (c) => {
  const { from, to, edgeTypes, maxDepth } = c.req.valid('query');
  const path = await graphService.shortestPath(from, to, {
    edgeTypes: parseEdgeTypes(edgeTypes),
    maxDepth: maxDepth ?? 6,
  });
  return c.json({ path }, 200);
});

// ── GET /api/graph/influence/:slug ───────────────────────────────────────────

const influenceRoute = createRoute({
  method: 'get',
  path: '/api/graph/influence/{slug}',
  tags: ['Graph'],
  summary: 'Influence ego-graph for a philosopher',
  request: {
    params: z.object({ slug: z.string().openapi({ example: 'immanuel-kant' }) }),
    query: z.object({
      depth: z.coerce.number().int().min(1).max(4).default(1).optional(),
    }),
  },
  responses: {
    200: {
      description: 'Influence subgraph',
      content: { 'application/json': { schema: SubgraphResponseSchema } },
    },
  },
});

app.openapi(influenceRoute, async (c) => {
  const { slug } = c.req.valid('param');
  const depth = c.req.valid('query').depth ?? 1;
  const subgraph = await graphService.getInfluenceGraph(slug, depth);
  return c.json({
    graph: subgraph,
    meta: {
      nodeCount: subgraph.nodes.length,
      edgeCount: subgraph.edges.length,
      rootKey: `philosopher:${slug}`,
      depth,
    },
  }, 200);
});

// ── GET /api/graph/school/:slug ──────────────────────────────────────────────

const schoolGraphRoute = createRoute({
  method: 'get',
  path: '/api/graph/school/{slug}',
  tags: ['Graph'],
  summary: 'School membership graph with inter-member influences',
  request: {
    params: z.object({ slug: z.string().openapi({ example: 'german-idealism' }) }),
  },
  responses: {
    200: {
      description: 'School subgraph',
      content: { 'application/json': { schema: SubgraphResponseSchema } },
    },
  },
});

app.openapi(schoolGraphRoute, async (c) => {
  const { slug } = c.req.valid('param');
  const subgraph = await graphService.getSchoolGraph(slug);
  return c.json({
    graph: subgraph,
    meta: {
      nodeCount: subgraph.nodes.length,
      edgeCount: subgraph.edges.length,
      rootKey: `school:${slug}`,
    },
  }, 200);
});

// ── GET /api/graph/curriculum/:slug ──────────────────────────────────────────

const curriculumGraphRoute = createRoute({
  method: 'get',
  path: '/api/graph/curriculum/{slug}',
  tags: ['Graph'],
  summary: 'Curriculum prerequisite DAG with work/philosopher references',
  request: {
    params: z.object({ slug: z.string().openapi({ example: 'ancient-greek-foundations' }) }),
  },
  responses: {
    200: {
      description: 'Curriculum subgraph',
      content: { 'application/json': { schema: SubgraphResponseSchema } },
    },
  },
});

app.openapi(curriculumGraphRoute, async (c) => {
  const { slug } = c.req.valid('param');
  const subgraph = await graphService.getCurriculumGraph(slug);
  return c.json({
    graph: subgraph,
    meta: {
      nodeCount: subgraph.nodes.length,
      edgeCount: subgraph.edges.length,
      rootKey: `curriculum:${slug}`,
    },
  }, 200);
});

// ── GET /api/graph/influence-network ─────────────────────────────────────────

const networkRoute = createRoute({
  method: 'get',
  path: '/api/graph/influence-network',
  tags: ['Graph'],
  summary: 'Full philosopher influence network',
  responses: {
    200: {
      description: 'Complete influence network',
      content: { 'application/json': { schema: SubgraphResponseSchema } },
    },
  },
});

app.openapi(networkRoute, async (c) => {
  const subgraph = await graphService.getFullInfluenceNetwork();
  return c.json({
    graph: subgraph,
    meta: {
      nodeCount: subgraph.nodes.length,
      edgeCount: subgraph.edges.length,
    },
  }, 200);
});

export default app;
