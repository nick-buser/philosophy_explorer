import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocked before app import so the health route picks up the mock on load.
// vi.mock() is hoisted automatically — declaration order here is just for clarity.
vi.mock('../../src/db/index.js', () => ({
  db: { execute: vi.fn() },
}));

import app from '../../src/index.js';
import { db } from '../../src/db/index.js';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 when DB is reachable', async () => {
    vi.mocked(db.execute).mockResolvedValueOnce([] as never);

    const res = await app.request('/api/health');

    expect(res.status).toBe(200);
    const body = await res.json() as { status: string; db: string; env: { DATABASE_URL: boolean } };
    expect(body.status).toBe('ok');
    expect(body.db).toBe('ok');
    expect(typeof body.env.DATABASE_URL).toBe('boolean');
  });

  it('returns 503 when DB is unreachable', async () => {
    vi.mocked(db.execute).mockRejectedValueOnce(new Error('connection refused'));

    const res = await app.request('/api/health');

    expect(res.status).toBe(503);
    const body = await res.json() as { status: string; error: string };
    expect(body.status).toBe('error');
    expect(body.error).toContain('connection refused');
  });
});
