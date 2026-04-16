// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { runBuild } from './build';
import * as ragModule from './rag';

let tmp: string;
let prevDataDir: string | undefined;

function seed(slug: string, opts: {
  meta?: Record<string, unknown> | null;
  persona?: string | null;
  knowledge?: Record<string, string>;
}) {
  const dir = path.join(tmp, slug);
  mkdirSync(dir, { recursive: true });
  if (opts.meta !== null) {
    writeFileSync(
      path.join(dir, 'meta.json'),
      JSON.stringify(
        opts.meta ?? {
          slug,
          name: 'Oleg Putilin',
          role: 'Developer',
          createdAt: '2026-04-14T00:00:00Z',
        },
      ),
    );
  }
  if (opts.persona !== null) {
    mkdirSync(path.join(dir, 'persona'), { recursive: true });
    writeFileSync(
      path.join(dir, 'persona', 'persona.md'),
      opts.persona ?? 'Oleg persona body.',
    );
  }
  if (opts.knowledge) {
    mkdirSync(path.join(dir, 'knowledge'), { recursive: true });
    for (const [name, content] of Object.entries(opts.knowledge)) {
      writeFileSync(path.join(dir, 'knowledge', name), content);
    }
  }
}

beforeEach(() => {
  prevDataDir = process.env.DATA_DIR;
  tmp = mkdtempSync(path.join(tmpdir(), 'build-'));
  process.env.DATA_DIR = tmp;
});

afterEach(() => {
  process.env.DATA_DIR = prevDataDir;
  rmSync(tmp, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('runBuild', () => {
  it('writes the agent-package tree with agent file, .mcp.json, meta.json', async () => {
    seed('oleg', {
      knowledge: { 'handbook.md': '# Handbook\nCore architecture notes.' },
    });
    vi.spyOn(ragModule, 'ingestText').mockResolvedValue({ ok: true });

    const result = await runBuild('oleg');

    expect(result.ok).toBe(true);
    const pkg = path.join(tmp, 'oleg', 'agent-package');
    expect(existsSync(path.join(pkg, '.claude', 'agents', 'oleg.md'))).toBe(true);
    expect(existsSync(path.join(pkg, '.mcp.json'))).toBe(true);
    expect(existsSync(path.join(pkg, 'meta.json'))).toBe(true);
  });

  it('agent file contains the persona text from disk', async () => {
    seed('oleg', { persona: 'PERSONA_BODY_FIXTURE' });
    vi.spyOn(ragModule, 'ingestText').mockResolvedValue({ ok: true });

    await runBuild('oleg');

    const agent = readFileSync(
      path.join(tmp, 'oleg', 'agent-package', '.claude', 'agents', 'oleg.md'),
      'utf8',
    );
    expect(agent).toContain('PERSONA_BODY_FIXTURE');
  });

  it('agent-package meta.json captures slug/name/role/skills/createdAt', async () => {
    seed('oleg', {
      meta: {
        slug: 'oleg',
        name: 'Oleg Putilin',
        role: 'Developer',
        createdAt: '2026-04-14T00:00:00Z',
      },
    });
    vi.spyOn(ragModule, 'ingestText').mockResolvedValue({ ok: true });

    await runBuild('oleg');

    const meta = JSON.parse(
      readFileSync(path.join(tmp, 'oleg', 'agent-package', 'meta.json'), 'utf8'),
    );
    expect(meta).toMatchObject({
      slug: 'oleg',
      name: 'Oleg Putilin',
      role: 'Developer',
      skills: expect.arrayContaining(['test-driven-development']),
    });
  });

  it('POSTs each knowledge file to RAG with the filename as source', async () => {
    seed('oleg', {
      knowledge: { 'a.md': 'aaa', 'b.md': 'bbb' },
    });
    const spy = vi.spyOn(ragModule, 'ingestText').mockResolvedValue({ ok: true });

    const result = await runBuild('oleg');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ingested.sort()).toEqual(['a.md', 'b.md']);
      expect(result.failed).toEqual([]);
    }
    expect(spy).toHaveBeenCalledTimes(2);
    const sources = spy.mock.calls.map((c) => (c[0] as { source: string }).source).sort();
    expect(sources).toEqual(['a.md', 'b.md']);
  });

  it('tolerates partial RAG failures and reports them in the response', async () => {
    seed('oleg', {
      knowledge: { 'a.md': 'aaa', 'b.md': 'bbb', 'c.md': 'ccc' },
    });
    vi.spyOn(ragModule, 'ingestText').mockImplementation(async ({ source }) => {
      if (source === 'b.md') return { ok: false, error: 'boom' };
      return { ok: true };
    });

    const result = await runBuild('oleg');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ingested.sort()).toEqual(['a.md', 'c.md']);
      expect(result.failed.map((f) => f.file)).toEqual(['b.md']);
    }
  });

  it('errors out if all knowledge files fail to ingest', async () => {
    seed('oleg', { knowledge: { 'a.md': 'aaa', 'b.md': 'bbb' } });
    vi.spyOn(ragModule, 'ingestText').mockResolvedValue({
      ok: false,
      error: 'rag down',
    });

    const result = await runBuild('oleg');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/all.*knowledge/i);
  });

  it('succeeds with zero knowledge files (nothing to ingest is valid)', async () => {
    seed('oleg', {});
    const spy = vi.spyOn(ragModule, 'ingestText').mockResolvedValue({ ok: true });

    const result = await runBuild('oleg');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.ingested).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('returns ok:false when persona.md is missing', async () => {
    seed('oleg', { persona: null });
    vi.spyOn(ragModule, 'ingestText').mockResolvedValue({ ok: true });

    const result = await runBuild('oleg');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/persona/i);
  });

  it('returns ok:false when meta.json is missing', async () => {
    seed('oleg', { meta: null });
    vi.spyOn(ragModule, 'ingestText').mockResolvedValue({ ok: true });

    const result = await runBuild('oleg');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/meta/i);
  });

  it('persists {ingested, failed} to build-result.json', async () => {
    seed('oleg', {
      knowledge: { 'a.md': 'aaa', 'b.md': 'bbb' },
    });
    vi.spyOn(ragModule, 'ingestText').mockImplementation(async ({ source }) => {
      if (source === 'b.md') return { ok: false, error: 'boom' };
      return { ok: true };
    });

    const result = await runBuild('oleg');

    expect(result.ok).toBe(true);
    const persisted = JSON.parse(
      readFileSync(path.join(tmp, 'oleg', 'build-result.json'), 'utf8'),
    );
    if (result.ok) {
      expect(persisted.ingested.sort()).toEqual(result.ingested.sort());
      expect(persisted.failed).toEqual(result.failed);
    }
  });
});
