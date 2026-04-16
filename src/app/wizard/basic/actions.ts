'use server';

import path from 'node:path';
import { redirect } from 'next/navigation';

import { generateSlug } from '@/lib/slug';
import { ensureColleagueDir, writeJson } from '@/lib/storage';
import { setSlugCookie } from '@/lib/session';
import {
  ALLOWED_ROLES,
  ALLOWED_GENDERS,
  type Role,
  type BasicInfoState,
} from './schema';

function parseRoles(formData: FormData): { roles: Role[]; invalid: boolean } {
  const raw = formData.getAll('roles');
  const seen = new Set<Role>();
  const out: Role[] = [];
  let invalid = false;
  for (const v of raw) {
    if (typeof v !== 'string') continue;
    const trimmed = v.trim();
    if (trimmed.length === 0) continue;
    if (!(ALLOWED_ROLES as readonly string[]).includes(trimmed)) {
      invalid = true;
      continue;
    }
    const role = trimmed as Role;
    if (seen.has(role)) continue;
    seen.add(role);
    out.push(role);
  }
  return { roles: out, invalid };
}

export async function saveBasicInfo(
  _prev: BasicInfoState,
  formData: FormData,
): Promise<BasicInfoState> {
  const name = String(formData.get('name') ?? '').trim();
  const gender = String(formData.get('gender') ?? '').trim();
  const mbti = String(formData.get('mbti') ?? '').trim();
  const impression = String(formData.get('impression') ?? '').trim();
  const { roles, invalid: rolesInvalid } = parseRoles(formData);

  const errors: NonNullable<BasicInfoState['errors']> = {};
  if (name.length === 0) errors.name = 'Name is required.';
  if (rolesInvalid) {
    errors.roles =
      'Each role must be one of PM, Developer, Designer, Evaluator.';
  } else if (roles.length === 0) {
    errors.roles = 'Select at least one role (PM, Developer, Designer, or Evaluator).';
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
    roles,
    gender,
    mbti,
    impression,
    createdAt: new Date().toISOString(),
  });
  await setSlugCookie(slug);

  redirect('/wizard/sources');
}
