// @vitest-environment node
import { describe, it, expect } from 'vitest';

import { GET } from './route';

describe('GET /api/health', () => {
  it('returns 200 with application/json content type', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('responds with { status: "ok" }', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({ status: 'ok' });
  });
});
