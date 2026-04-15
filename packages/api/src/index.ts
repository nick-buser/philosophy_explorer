import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import healthRoutes from './routes/health.js';
import philosopherRoutes from './routes/philosophers.js';
import catalogRoutes from './routes/catalog.js';
import graphRoutes from './routes/graph.js';

const app = new OpenAPIHono();

// /ping is registered first, before any route that touches the DB or env vars.
// Diagnostic guide:
//   /ping → 404: function crashed at startup (check logs for ERR_MODULE_NOT_FOUND)
//   /ping → 200, /api/health → 503: function loaded but DB is unreachable
app.get('/ping', (c) => c.json({ ok: true }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .filter(Boolean);
app.use('*', cors({ origin: allowedOrigins }));

app.route('/', healthRoutes);
app.route('/', philosopherRoutes);
app.route('/', catalogRoutes);
app.route('/', graphRoutes);

app.doc('/api/doc/openapi.json', {
  openapi: '3.0.0',
  info: { title: 'Philosophy Explorer API', version: '0.0.1' },
});
app.get('/api/doc', swaggerUI({ url: '/api/doc/openapi.json' }));

export default app;
