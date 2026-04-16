// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

import * as buildModule from '@/lib/build';
import { POST } from './route';

function request(): NextRequest {
  return new NextRequest('http://test.local/api/colleagues/oleg/build', {
    method: 'POST',
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/colleagues/[slug]/build', () => {
  it('returns 200 with the build summary on success', async () => {
    vi.spyOn(buildModule, 'runBuild').mockResolvedValue({
      ok: true,
      ingested: ['a.md'],
      failed: [],
    });

    const res = await POST(request(), { params: Promise.resolve({ slug: 'oleg' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, ingested: ['a.md'], failed: [] });
  });

  it('forwards the slug from the route params to runBuild', async () => {
    const spy = vi.spyOn(buildModule, 'runBuild').mockResolvedValue({
      ok: true,
      ingested: [],
      failed: [],
    });

    await POST(request(), { params: Promise.resolve({ slug: 'oleg' }) });

    expect(spy).toHaveBeenCalledWith('oleg');
  });

  it('returns 500 with the error on build failure', async () => {
    vi.spyOn(buildModule, 'runBuild').mockResolvedValue({
      ok: false,
      error: 'persona missing',
    });

    const res = await POST(request(), { params: Promise.resolve({ slug: 'oleg' }) });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: 'persona missing' });
  });

  it('returns 500 with a generic message on an unexpected throw', async () => {
    vi.spyOn(buildModule, 'runBuild').mockRejectedValue(new Error('disk exploded'));

    const res = await POST(request(), { params: Promise.resolve({ slug: 'oleg' }) });

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/disk exploded/);
  });
});
