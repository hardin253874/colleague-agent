import { cookies } from 'next/headers';

export const COOKIE_NAME = 'colleagueSlug';

export async function getSlugFromCookie(): Promise<string | null> {
  const jar = await cookies();
  const entry = jar.get(COOKIE_NAME);
  return entry?.value ?? null;
}

export async function setSlugCookie(slug: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, slug, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
}
