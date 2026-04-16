'use server';

import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { redirect } from 'next/navigation';

import { getSlugFromCookie } from '@/lib/session';
import { getDataDir } from '@/lib/storage';
import { runBuild } from '@/lib/build';

/**
 * Page 4 Build Agent server action.
 *
 * Reads the `persona` field from the submitted FormData, writes it to
 * `{DATA_DIR}/{slug}/persona/persona.md` (creating the directory if needed,
 * never touching `builder-output.md` — the LLM original is preserved for
 * future revert support), then redirects to `/wizard/download`.
 *
 * Slug comes from the wizard cookie. If the cookie is missing we send the
 * user back to Page 1 instead of failing — defensive only; the Page 4
 * server component already redirects on missing slug before render.
 */
export async function saveAndProceed(formData: FormData): Promise<void> {
  const slug = await getSlugFromCookie();
  if (!slug) redirect('/wizard/basic');

  const raw = formData.get('persona');
  const persona = typeof raw === 'string' ? raw : '';

  const target = path.join(getDataDir(), slug, 'persona', 'persona.md');
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, persona, 'utf8');

  const result = await runBuild(slug);
  if (!result.ok) {
    throw new Error(result.error);
  }

  redirect('/wizard/download');
}
