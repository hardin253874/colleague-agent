// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const runAnalyzeMock = vi.fn();
vi.mock('@/lib/pipeline', () => ({
  runAnalyze: (slug: string) => runAnalyzeMock(slug),
}));

import { POST } from './route';
import { writeMeta, ensureColleagueDir } from '@/lib/storage';

let tmp: string;
let prevDataDir: string | undefined;

beforeEach(async () => {
  prevDataDir = process.env.DATA_DIR;
  tmp = mkdtempSync(path.join(tmpdir(), 'analyze-route-'));
  process.env.DATA_DIR = tmp;
  runAnalyzeMock.mockReset();
});

afterEach(() => {
  if (prevDataDir === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = prevDataDir;
  rmSync(tmp, { recursive: true, force: true });
});

async function seed(slug: string, sourceFiles: string[] = ['chat.md']) {
  const dir = await ensureColleagueDir(slug);
  const src = path.join(dir, 'source');
  mkdirSync(src, { recursive: true });
  for (const f of sourceFiles) {
    writeFileSync(path.join(src, f), 'stub content');
  }
  await writeMeta(slug, { slug, name: slug, roles: ['PM'], sourceFiles });
}

function buildRequest(slug: string): Request {
  return new Request(`http://local/api/colleagues/${slug}/analyze`, {
    method: 'POST',
  });
}

describe('POST /api/colleagues/[slug]/analyze', () => {
  it('returns 200 {ok:true} when analysis succeeds', async () => {
    await seed('alice-1');
    runAnalyzeMock.mockResolvedValueOnce({
      persona: '# Alice — Persona',
      analyzerRaw: {},
      projectList: ['NESA'],
    });
    const res = await POST(buildRequest('alice-1'), {
      params: Promise.resolve({ slug: 'alice-1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.projectList).toEqual(['NESA']);
    expect(runAnalyzeMock).toHaveBeenCalledWith('alice-1');
  });

  it('returns 400 when meta.json is missing entirely', async () => {
    const res = await POST(buildRequest('ghost-1'), {
      params: Promise.resolve({ slug: 'ghost-1' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/slug|not found|meta/i);
    expect(runAnalyzeMock).toHaveBeenCalledTimes(0);
  });

  it('returns 400 when the colleague has zero source files', async () => {
    await seed('empty-1', []);
    const res = await POST(buildRequest('empty-1'), {
      params: Promise.resolve({ slug: 'empty-1' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/source files|no files|upload/i);
    expect(runAnalyzeMock).toHaveBeenCalledTimes(0);
  });

  it('returns 500 when the pipeline throws', async () => {
    await seed('err-1');
    runAnalyzeMock.mockRejectedValueOnce(new Error('LLM exploded'));
    const res = await POST(buildRequest('err-1'), {
      params: Promise.resolve({ slug: 'err-1' }),
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/LLM exploded|analysis failed/i);
  });
});
