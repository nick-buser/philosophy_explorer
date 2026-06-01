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
import { argumentsRoute, argumentsIndexRoute } from './routes/arguments';
import { argumentNewRoute } from './routes/arguments.new';
import { argumentDetailRoute } from './routes/arguments.$';

// /arguments is a layout parent; the list (index), editor (new), and detail
// ($) are its children so the splat can't swallow the bare /arguments path.
const argumentsTree = argumentsRoute.addChildren([
  argumentsIndexRoute,
  argumentNewRoute,
  argumentDetailRoute,
]);

const routeTree = rootRoute.addChildren([
  indexRoute,
  philosopherDetailRoute,
  workDetailRoute,
  schoolDetailRoute,
  curriculaRoute,
  curriculumDetailRoute,
  logicIndexRoute,
  logicSystemRoute,
  argumentsTree,
]);

export const router = createRouter({ routeTree });

// Register the router type for full type safety across useNavigate, Link, etc.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
