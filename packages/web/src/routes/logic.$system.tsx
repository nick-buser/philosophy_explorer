import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';

export const logicSystemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/logic/$system',
  // Optional ?dsl= prefill: an argument's "Open in Logic Lab" link passes the
  // serialized DSL so the lab opens populated with that formula (no copy-paste).
  validateSearch: (search: Record<string, unknown>): { dsl?: string } => ({
    dsl: typeof search.dsl === 'string' ? search.dsl : undefined,
  }),
}).lazy(() => import('./logic.$system.lazy').then(m => m.Route));
