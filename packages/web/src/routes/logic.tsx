import { Link, createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { LOGIC_SYSTEMS } from '../data/logic-systems';

export const logicIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/logic',
  component: LogicIndex,
});

function LogicIndex() {
  const available = LOGIC_SYSTEMS.filter(s => s.status === 'available');
  const stubs     = LOGIC_SYSTEMS.filter(s => s.status === 'stub');

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-6 space-y-12">
        <header>
          <h1 className="text-3xl font-bold text-gray-100">Logic Lab</h1>
          <p className="mt-3 text-gray-400 leading-relaxed max-w-2xl">
            Browse historical and modern logical notation systems, read their
            primitives, and write formulas in a live editor. The goal is to make
            the structural differences between systems visible — what each one
            can express naturally and where it breaks down.
          </p>
        </header>

        <section>
          <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-4">
            Available
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {available.map(s => (
              <Link
                key={s.slug}
                to="/logic/$system"
                params={{ system: s.slug }}
                className="group rounded-lg border border-gray-800 bg-gray-900/50 p-5 hover:border-gray-700 hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                  <h3 className="text-gray-100 font-medium group-hover:text-white">
                    {s.name}
                  </h3>
                  <span className="text-xs text-gray-500">{s.era}</span>
                </div>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                  {s.shortDescription}
                </p>
                <div className="mt-3 text-xs text-gray-600">
                  key primitive: <span className="text-gray-400">{s.keyPrimitive}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {stubs.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-4">
              Coming soon
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stubs.map(s => (
                <div
                  key={s.slug}
                  className="rounded-lg border border-dashed border-gray-800 bg-gray-900/20 p-5 opacity-70"
                >
                  <div className="flex items-baseline justify-between gap-4 flex-wrap">
                    <h3 className="text-gray-300 font-medium">{s.name}</h3>
                    <span className="text-xs text-gray-600">{s.era}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                    {s.shortDescription}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}