import { createRoute, z } from '@hono/zod-openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

const app = new OpenAPIHono();

const envSchema = z.object({
  DATABASE_URL:    z.boolean(),
  ALLOWED_ORIGINS: z.boolean(),
});

const healthRoute = createRoute({
  method: 'get',
  path: '/api/health',
  tags: ['Health'],
  summary: 'Health check — reports DB connectivity and env var presence',
  responses: {
    200: {
      description: 'Server is healthy',
      content: {
        'application/json': {
          schema: z.object({ status: z.string(), db: z.string(), env: envSchema }),
        },
      },
    },
    503: {
      description: 'Service unavailable',
      content: {
        'application/json': {
          schema: z.object({ status: z.string(), error: z.string(), env: envSchema }),
        },
      },
    },
  },
});

const envStatus = () => ({
  DATABASE_URL:    !!process.env.DATABASE_URL,
  ALLOWED_ORIGINS: !!process.env.ALLOWED_ORIGINS,
});

app.openapi(healthRoute, async (c) => {
  try {
    await db.execute(sql`SELECT 1`);
    return c.json({ status: 'ok', db: 'ok', env: envStatus() }, 200);
  } catch (err) {
    return c.json({ status: 'error', error: String(err), env: envStatus() }, 503);
  }
});

export default app;
