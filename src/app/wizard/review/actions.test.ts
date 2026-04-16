// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { ensureColleagueDir } from '@/lib/storage';

// next/navigation is server-only; stub redirect so it throws a recognisable
// sentinel like Next's real implementation does (redirect() never returns —
// it throws to unwind the render). We assert the sentinel was raised with
// the expected path.
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    const err = new Error(`NEXT_REDIRECT:${url}`);
    (err as Error & { digest?: string }).digest = `NEXT_REDIRECT;${url}`;
    throw err;
  },
}));

// Cookie-backed session reader — stub to return a deterministic slug.
vi.mock('@/lib/session', () => ({
  getSlugFromCookie: vi.fn(async () => 'alice-1'),
}));

// Build orchestrator — stub to a default success so persona-write tests pass;
// individual tests can override via vi.mocked().
vi.mock('@/lib/build', () => ({
  runBuild: vi.fn(async () => ({ ok: true, ingested: [], failed: [] })),
}));

import { saveAndProceed } from './actions';
import { getSlugFromCookie } from '@/lib/session';
import { runBuild } from '@/lib/build';

let tmp: string;
let prevDataDir: string | undefined;

beforeEach(() => {
  prevDataDir = process.env.DATA_DIR;
  tmp = mkdtempSync(path.join(tmpdir(), 'review-action-'));
  process.env.DATA_DIR = tmp;
});

afterEach(() => {
  if (prevDataDir === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = prevDataDir;
  rmSync(tmp, { recursive: true, force: true });
  vi.mocked(getSlugFromCookie).mockResolvedValue('alice-1');
  vi.mocked(runBuild).mockResolvedValue({ ok: true, ingested: [], failed: [] });
});

describe('saveAndProceed (Page 4 server action)', () => {
  it('writes the submitted persona field to persona/persona.md then redirects to /wizard/download', async () => {
    const dir = await ensureColleagueDir('alice-1');
    mkdirSync(path.join(dir, 'persona'), { recursive: true });

    const form = new FormData();
    form.set('persona', '# Alice — edited\n\nBody.');

    await expect(saveAndProceed(form)).rejects.toThrow(/NEXT_REDIRECT:\/wizard\/download/);

    const onDisk = path.join(tmp, 'alice-1', 'persona', 'persona.md');
    expect(readFileSync(onDisk, 'utf8')).toBe('# Alice — edited\n\nBody.');
  });
});

describe('saveAndProceed — Build wiring (2d)', () => {
  beforeEach(() => {
    const dir = path.join(tmp, 'alice-1');
    mkdirSync(path.join(dir, 'persona'), { recursive: true });
    writeFileSync(
      path.join(dir, 'meta.json'),
      JSON.stringify({ slug: 'alice-1', name: 'Alice', roles: ['Developer'] }),
    );
  });

  it('writes persona.md then calls runBuild with the slug before redirecting', async () => {
    vi.mocked(runBuild).mockResolvedValue({ ok: true, ingested: [], failed: [] });

    const fd = new FormData();
    fd.set('persona', 'edited persona body');

    let redirectedTo: string | undefined;
    try {
      await saveAndProceed(fd);
    } catch (err) {
      redirectedTo = (err as { digest?: string }).digest;
    }

    expect(readFileSync(path.join(tmp, 'alice-1', 'persona', 'persona.md'), 'utf8'))
      .toBe('edited persona body');
    expect(runBuild).toHaveBeenCalledWith('alice-1');
    expect(redirectedTo).toMatch(/\/wizard\/download/);
  });

  it('propagates a build failure as a thrown error (no redirect)', async () => {
    vi.mocked(runBuild).mockResolvedValue({ ok: false, error: 'rag down' });

    const fd = new FormData();
    fd.set('persona', 'body');

    await expect(saveAndProceed(fd)).rejects.toThrow(/rag down/);
  });
});
