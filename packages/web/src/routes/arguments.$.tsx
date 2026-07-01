import { useState } from 'react';
import { createRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { argumentsRoute } from './arguments';
import { ArgumentCard } from '../components/ArgumentCard';
import { ArgumentEditor } from '../components/ArgumentEditor';
import { apiBaseUrl } from '../lib/api';

const API = apiBaseUrl;

// Splat route: argument ids carry the claim_extractor extraction_id verbatim
// (author/work/slug), which contains slashes — so `_splat` holds the full id.
// Nested under argumentsRoute so the bare /arguments hits the index, not this.
export const argumentDetailRoute = createRoute({
  getParentRoute: () => argumentsRoute,
  path: '$',
  component: ArgumentDetailPage,
});

function ArgumentDetailPage() {
  const { _splat } = argumentDetailRoute.useParams();
  const id = _splat ?? '';
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const del = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/api/arguments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arguments'] });
      navigate({ to: '/arguments' });
    },
  });

  return (
    <main className="min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/arguments" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← All arguments
          </Link>
          {!editing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(true)}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-700 text-gray-200 hover:border-gray-500"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Delete this argument? This cannot be undone.')) del.mutate();
                }}
                disabled={del.isPending}
                className="text-sm px-3 py-1.5 rounded-lg border border-red-900/60 text-red-400 hover:border-red-700 disabled:opacity-50"
              >
                {del.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-6">
          {editing ? (
            <ArgumentEditor
              mode="edit"
              id={id}
              onSaved={() => setEditing(false)}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <ArgumentCard argumentId={id} />
          )}
        </div>
      </div>
    </main>
  );
}
