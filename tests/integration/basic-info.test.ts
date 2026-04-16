import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Mock the session cookie store
const cookieStore = new Map<string, { value: string; options?: Record<string, unknown> }>();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const e = cookieStore.get(name);
      return e ? { name, value: e.value } : undefined;
    },
    set: (name: string, value: string, options?: Record<string, unknown>) => {
      cookieStore.set(name, { value, options });
    },
    delete: (name: string) => { cookieStore.delete(name); },
  }),
}));

// Capture redirect calls instead of throwing NEXT_REDIRECT
const redirectMock = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => { redirectMock(url); throw new Error('__REDIRECT__'); },
}));

import { saveBasicInfo } from '@/app/wizard/basic/actions';

let tmp: string;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), 'colleague-agent-'));
  process.env.DATA_DIR = tmp;
  cookieStore.clear();
  redirectMock.mockReset();
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
  delete process.env.DATA_DIR;
});

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

describe('saveBasicInfo server action', () => {
  it('rejects empty name with a validation error (no file written, no redirect)', async () => {
    const state = await saveBasicInfo(
      { ok: false, errors: {} },
      makeFormData({ name: '', role: 'Developer', gender: 'M', mbti: 'INTJ', impression: '' }),
    );
    expect(state.ok).toBe(false);
    expect(state.errors?.name).toBeTruthy();
    expect(readdirSync(tmp)).toEqual([]);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid role', async () => {
    const state = await saveBasicInfo(
      { ok: false, errors: {} },
      makeFormData({ name: 'Oleg', role: 'Astronaut', gender: 'M', mbti: '', impression: '' }),
    );
    expect(state.ok).toBe(false);
    expect(state.errors?.role).toBeTruthy();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('writes meta.json, sets the cookie, and redirects on valid input', async () => {
    await expect(
      saveBasicInfo(
        { ok: false, errors: {} },
        makeFormData({
          name: 'Oleg Putilin',
          role: 'Developer',
          gender: 'M',
          mbti: 'INTJ',
          impression: 'Blunt, direct, senior.',
        }),
      ),
    ).rejects.toThrow('__REDIRECT__');

    // Cookie set
    expect(cookieStore.has('colleagueSlug')).toBe(true);
    const slug = cookieStore.get('colleagueSlug')!.value;
    expect(slug).toMatch(/^oleg-putilin-[a-z0-9]{6}$/);

    // Directory + meta.json written
    const colleagueDir = path.join(tmp, slug);
    const metaPath = path.join(colleagueDir, 'meta.json');
    expect(existsSync(metaPath)).toBe(true);
    const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    expect(meta).toMatchObject({
      slug,
      name: 'Oleg Putilin',
      role: 'Developer',
      gender: 'M',
      mbti: 'INTJ',
      impression: 'Blunt, direct, senior.',
    });
    expect(typeof meta.createdAt).toBe('string');
    expect(() => new Date(meta.createdAt).toISOString()).not.toThrow();

    // Redirect target
    expect(redirectMock).toHaveBeenCalledWith('/wizard/sources');
  });

  it('treats missing optional fields as empty strings', async () => {
    await expect(
      saveBasicInfo(
        { ok: false, errors: {} },
        makeFormData({ name: 'Jo', role: 'PM' }),
      ),
    ).rejects.toThrow('__REDIRECT__');

    const slug = cookieStore.get('colleagueSlug')!.value;
    const meta = JSON.parse(readFileSync(path.join(tmp, slug, 'meta.json'), 'utf8'));
    expect(meta).toMatchObject({ name: 'Jo', role: 'PM', gender: '', mbti: '', impression: '' });
  });
});
