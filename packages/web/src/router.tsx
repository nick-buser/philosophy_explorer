import { createRouter } from '@tanstack/react-router';
import { rootRoute } from './routes/__root';
import { indexRoute } from './routes/index';
import { philosopherDetailRoute } from './routes/philosophers.$slug';
import { workDetailRoute } from './routes/works.$slug';
import { schoolDetailRoute } from './routes/schools.$slug';
import { curriculaRoute } from './routes/curricula';
import { curriculumDetailRoute } from './routes/curricula.$slug';
import { logicIndexRoute } from './routes/logic';
import { logicSystemRoute } from './routes/logic.$system';
import { argumentsRoute } from './routes/arguments';
import { argumentNewRoute } from './routes/arguments.new';
import { argumentDetailRoute } from './routes/arguments.$';

const routeTree = rootRoute.addChildren([
  indexRoute,
  philosopherDetailRoute,
  workDetailRoute,
  schoolDetailRoute,
  curriculaRoute,
  curriculumDetailRoute,
  logicIndexRoute,
  logicSystemRoute,
  argumentsRoute,
  argumentNewRoute,
  argumentDetailRoute,
]);

export const router = createRouter({ routeTree });

// Register the router type for full type safety across useNavigate, Link, etc.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
