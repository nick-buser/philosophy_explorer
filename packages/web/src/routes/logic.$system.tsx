import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';

export const logicSystemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/logic/$system',
}).lazy(() => import('./logic.$system.lazy').then(m => m.Route));
