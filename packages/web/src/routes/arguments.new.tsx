import { createRoute, useNavigate } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { ArgumentEditor } from '../components/ArgumentEditor';

// Static path — outranks the `/arguments/$` splat in TanStack's route matching.
export const argumentNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/arguments/new',
  component: NewArgumentPage,
});

function NewArgumentPage() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-6">
        <ArgumentEditor
          mode="create"
          onSaved={id => navigate({ to: '/arguments/$', params: { _splat: id } })}
          onCancel={() => navigate({ to: '/arguments' })}
        />
      </div>
    </main>
  );
}
