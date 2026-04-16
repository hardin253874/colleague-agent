import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { getDataDir, ensureColleagueDir, writeJson, readJson } from './storage';

let tmp: string;
const originalDataDir = process.env.DATA_DIR;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), 'colleague-agent-'));
  process.env.DATA_DIR = tmp;
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
  if (originalDataDir === undefined) {
    delete process.env.DATA_DIR;
  } else {
    process.env.DATA_DIR = originalDataDir;
  }
});

describe('getDataDir', () => {
  it('returns DATA_DIR when set', () => {
    expect(getDataDir()).toBe(tmp);
  });

  it('defaults to ./data/colleagues when DATA_DIR is unset', () => {
    delete process.env.DATA_DIR;
    expect(getDataDir()).toBe(path.resolve('./data/colleagues'));
  });
});

describe('ensureColleagueDir', () => {
  it('creates the colleague directory and returns its absolute path', async () => {
    const dir = await ensureColleagueDir('oleg-a7fx2k');
    expect(dir).toBe(path.join(tmp, 'oleg-a7fx2k'));
    expect(existsSync(dir)).toBe(true);
  });

  it('is idempotent (no throw when directory already exists)', async () => {
    await ensureColleagueDir('oleg-a7fx2k');
    await expect(ensureColleagueDir('oleg-a7fx2k')).resolves.toBeTypeOf('string');
  });
});

describe('writeJson / readJson', () => {
  it('round-trips a JSON object', async () => {
    const dir = await ensureColleagueDir('oleg-a7fx2k');
    const target = path.join(dir, 'meta.json');
    const data = { slug: 'oleg-a7fx2k', name: 'Oleg', role: 'Developer' };

    await writeJson(target, data);
    const read = await readJson<typeof data>(target);

    expect(read).toEqual(data);
  });

  it('writes JSON pretty-printed with 2-space indent', async () => {
    const dir = await ensureColleagueDir('oleg-a7fx2k');
    const target = path.join(dir, 'meta.json');
    await writeJson(target, { a: 1 });

    const raw = readFileSync(target, 'utf8');
    expect(raw).toBe('{\n  "a": 1\n}');
  });

  it('throws ENOENT when reading a missing file', async () => {
    const target = path.join(tmp, 'missing.json');
    await expect(readJson(target)).rejects.toThrow();
  });
});

// --- 2b additions: meta.json file-list helpers ---

import { appendFileToMeta, removeFileFromMeta, readMeta } from './storage';

describe('appendFileToMeta', () => {
  it('adds a filename to sourceFiles on a meta with no existing array', async () => {
    const dir = await ensureColleagueDir('meta-append-a');
    const metaPath = path.join(dir, 'meta.json');
    await writeJson(metaPath, { slug: 'meta-append-a', name: 'X' });
    await appendFileToMeta('meta-append-a', 'source', 'profile.md');
    const m = await readMeta('meta-append-a');
    expect(m.sourceFiles).toEqual(['profile.md']);
  });

  it('appends without duplicating when the same filename is added twice', async () => {
    const dir = await ensureColleagueDir('meta-append-b');
    await writeJson(path.join(dir, 'meta.json'), { slug: 'meta-append-b', name: 'Y' });
    await appendFileToMeta('meta-append-b', 'knowledge', 'doc.pdf');
    await appendFileToMeta('meta-append-b', 'knowledge', 'doc.pdf');
    const m = await readMeta('meta-append-b');
    expect(m.knowledgeFiles).toEqual(['doc.pdf']);
  });
});

describe('removeFileFromMeta', () => {
  it('removes a filename from sourceFiles when present', async () => {
    const dir = await ensureColleagueDir('meta-remove-a');
    await writeJson(path.join(dir, 'meta.json'), {
      slug: 'meta-remove-a',
      name: 'Z',
      sourceFiles: ['a.md', 'b.md'],
    });
    await removeFileFromMeta('meta-remove-a', 'source', 'a.md');
    const m = await readMeta('meta-remove-a');
    expect(m.sourceFiles).toEqual(['b.md']);
  });
});
