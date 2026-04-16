import { describe, it, expect, vi, beforeEach } from 'vitest';

// In-memory mock store for the Next.js cookies() API
const store = new Map<string, { value: string; options?: Record<string, unknown> }>();

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const entry = store.get(name);
      return entry ? { name, value: entry.value } : undefined;
    },
    set: (name: string, value: string, options?: Record<string, unknown>) => {
      store.set(name, { value, options });
    },
    delete: (name: string) => {
      store.delete(name);
    },
  }),
}));

import { getSlugFromCookie, setSlugCookie, COOKIE_NAME } from './session';

beforeEach(() => {
  store.clear();
});

describe('session cookie', () => {
  it('returns null when no cookie is set', async () => {
    expect(await getSlugFromCookie()).toBeNull();
  });

  it('round-trips a slug via setSlugCookie / getSlugFromCookie', async () => {
    await setSlugCookie('oleg-a7fx2k');
    expect(await getSlugFromCookie()).toBe('oleg-a7fx2k');
  });

  it('stores the slug under the canonical COOKIE_NAME', async () => {
    await setSlugCookie('oleg-a7fx2k');
    expect(store.has(COOKIE_NAME)).toBe(true);
    expect(COOKIE_NAME).toBe('colleagueSlug');
  });

  it('sets HttpOnly, Secure, SameSite=lax, and Path=/ on the cookie', async () => {
    await setSlugCookie('oleg-a7fx2k');
    const entry = store.get(COOKIE_NAME)!;
    expect(entry.options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  });
});
