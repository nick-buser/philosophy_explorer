import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { queryClient } from '../lib/query-client';

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <header className="border-b border-gray-800 bg-gray-950 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-8">
          <Link to="/" className="text-gray-100 font-semibold text-sm hover:text-white transition-colors">
            Philosophy Explorer
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors [&.active]:text-gray-100"
            >
              Browse
            </Link>
            <Link
              to="/curricula"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors [&.active]:text-gray-100"
            >
              Curricula
            </Link>
          </nav>
        </div>
      </header>
      <Outlet />
      {import.meta.env.DEV && (
        <>
          <ReactQueryDevtools buttonPosition="bottom-right" />
          <TanStackRouterDevtools position="bottom-left" />
        </>
      )}
    </QueryClientProvider>
  );
}

export const rootRoute = createRootRoute({
  component: RootLayout,
});
