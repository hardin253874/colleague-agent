'use server';

import path from 'node:path';
import { redirect } from 'next/navigation';

import { generateSlug } from '@/lib/slug';
import { ensureColleagueDir, writeJson } from '@/lib/storage';
import { setSlugCookie } from '@/lib/session';

export const ALLOWED_ROLES = ['PM', 'Developer', 'Designer', 'Evaluator'] as const;
export type Role = (typeof ALLOWED_ROLES)[number];

export const ALLOWED_GENDERS = ['M', 'F', 'U', ''] as const;
export type Gender = (typeof ALLOWED_GENDERS)[number];

export interface BasicInfoState {
  ok: boolean;
  errors?: {
    name?: string;
    role?: string;
    gender?: string;
  };
}

export async function saveBasicInfo(
  _prev: BasicInfoState,
  formData: FormData,
): Promise<BasicInfoState> {
  const name = String(formData.get('name') ?? '').trim();
  const role = String(formData.get('role') ?? '').trim();
  const gender = String(formData.get('gender') ?? '').trim();
  const mbti = String(formData.get('mbti') ?? '').trim();
  const impression = String(formData.get('impression') ?? '').trim();

  const errors: NonNullable<BasicInfoState['errors']> = {};
  if (name.length === 0) errors.name = 'Name is required.';
  if (!(ALLOWED_ROLES as readonly string[]).includes(role)) {
    errors.role = 'Role must be one of PM, Developer, Designer, Evaluator.';
  }
  if (!(ALLOWED_GENDERS as readonly string[]).includes(gender)) {
    errors.gender = 'Gender must be M, F, or unspecified.';
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const slug = generateSlug(name);
  const dir = await ensureColleagueDir(slug);
  await writeJson(path.join(dir, 'meta.json'), {
    slug,
    name,
    role,
    gender,
    mbti,
    impression,
    createdAt: new Date().toISOString(),
  });
  await setSlugCookie(slug);

  redirect('/wizard/sources');
}
