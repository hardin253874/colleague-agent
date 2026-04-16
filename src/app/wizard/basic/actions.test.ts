// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// redirect() throws internally; stub to a recognisable sentinel so tests can
// assert the redirect target without actually unmounting a page.
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    const err = new Error(`NEXT_REDIRECT:${url}`);
    (err as Error & { digest?: string }).digest = `NEXT_REDIRECT;${url}`;
    throw err;
  },
}));

// Cookie writer — stub to a noop so we don't need next/headers in node env.
vi.mock('@/lib/session', () => ({
  setSlugCookie: vi.fn(async () => {}),
}));

import { saveBasicInfo } from './actions';
import { type BasicInfoState } from './schema';
import { getDataDir } from '@/lib/storage';

let tmp: string;
let prevDataDir: string | undefined;

const INITIAL: BasicInfoState = { ok: false, errors: {} };

beforeEach(() => {
  prevDataDir = process.env.DATA_DIR;
  tmp = mkdtempSync(path.join(tmpdir(), 'basic-action-'));
  process.env.DATA_DIR = tmp;
});

afterEach(() => {
  if (prevDataDir === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = prevDataDir;
  rmSync(tmp, { recursive: true, force: true });
});

function buildForm(fields: Array<[string, string]>): FormData {
  const fd = new FormData();
  for (const [k, v] of fields) fd.append(k, v);
  return fd;
}

describe('saveBasicInfo — multi-role parsing', () => {
  it('returns an error when no role checkbox is selected', async () => {
    const fd = buildForm([
      ['name', 'Alice'],
      ['gender', ''],
    ]);
    const res = await saveBasicInfo(INITIAL, fd);
    expect(res.ok).toBe(false);
    expect(res.errors?.roles).toMatch(/at least one role|select.*role/i);
  });

  it('accepts a single role and writes roles array to meta.json', async () => {
    const fd = buildForm([
      ['name', 'Alice'],
      ['roles', 'PM'],
      ['gender', ''],
    ]);
    let redirectedTo: string | undefined;
    try {
      await saveBasicInfo(INITIAL, fd);
    } catch (err) {
      redirectedTo = (err as Error).message;
    }
    expect(redirectedTo).toMatch(/NEXT_REDIRECT:\/wizard\/sources/);

    // Find the written meta file (slug is derived from name + random suffix)
    const fs = await import('node:fs');
    const dirs = fs
      .readdirSync(getDataDir(), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    expect(dirs).toHaveLength(1);
    const slug = dirs[0];
    expect(existsSync(path.join(getDataDir(), slug, 'meta.json'))).toBe(true);
    const meta = JSON.parse(
      readFileSync(path.join(getDataDir(), slug, 'meta.json'), 'utf8'),
    );
    expect(meta.roles).toEqual(['PM']);
    expect(meta).not.toHaveProperty('role');
  });

  it('accepts multiple roles and preserves selection order, deduped', async () => {
    const fd = buildForm([
      ['name', 'Bob'],
      ['roles', 'Developer'],
      ['roles', 'PM'],
      ['roles', 'Developer'], // duplicate — must be deduped
      ['gender', ''],
    ]);
    try {
      await saveBasicInfo(INITIAL, fd);
    } catch {
      /* redirect sentinel */
    }
    const fs = await import('node:fs');
    const dirs = fs
      .readdirSync(getDataDir(), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    const slug = dirs[0];
    const meta = JSON.parse(
      readFileSync(path.join(getDataDir(), slug, 'meta.json'), 'utf8'),
    );
    expect(meta.roles).toEqual(['Developer', 'PM']);
  });

  it('rejects when any submitted role is not in ALLOWED_ROLES', async () => {
    const fd = buildForm([
      ['name', 'Carol'],
      ['roles', 'PM'],
      ['roles', 'Hacker'],
      ['gender', ''],
    ]);
    const res = await saveBasicInfo(INITIAL, fd);
    expect(res.ok).toBe(false);
    expect(res.errors?.roles).toMatch(/PM.*Developer.*Designer.*Evaluator|invalid/i);
  });

  it('still validates name alongside roles', async () => {
    const fd = buildForm([
      ['name', ''],
      ['roles', 'PM'],
      ['gender', ''],
    ]);
    const res = await saveBasicInfo(INITIAL, fd);
    expect(res.ok).toBe(false);
    expect(res.errors?.name).toMatch(/required/i);
  });
});
