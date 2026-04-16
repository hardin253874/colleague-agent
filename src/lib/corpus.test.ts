// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { assembleCorpus } from './corpus';
import { writeMeta, ensureColleagueDir } from './storage';

let tmp: string;
let prevDataDir: string | undefined;

beforeEach(() => {
  prevDataDir = process.env.DATA_DIR;
  tmp = mkdtempSync(path.join(tmpdir(), 'corpus-'));
  process.env.DATA_DIR = tmp;
});
afterEach(() => {
  if (prevDataDir === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = prevDataDir;
  rmSync(tmp, { recursive: true, force: true });
});

async function seed(slug: string, meta: Record<string, unknown>, files: Record<string, string>) {
  const dir = await ensureColleagueDir(slug);
  const src = path.join(dir, 'source');
  mkdirSync(src, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(path.join(src, name), content);
  }
  await writeMeta(slug, { slug, name: (meta.name as string) ?? slug, ...meta });
}

describe('assembleCorpus', () => {
  it('includes a BASIC INFO section from meta fields', async () => {
    await seed(
      'alice-1',
      { name: 'Alice', roles: ['PM'], gender: 'F', mbti: 'INTJ', impression: 'sharp' },
      {},
    );
    const out = await assembleCorpus('alice-1');
    expect(out.text).toContain('=== BASIC INFO ===');
    expect(out.text).toContain('Name: Alice');
    expect(out.text).toContain('Role: PM');
    expect(out.text).toContain('Gender: F');
    expect(out.text).toContain('MBTI: INTJ');
    expect(out.text).toContain('Impression: sharp');
  });

  it('joins multiple roles with " / " in the Role line', async () => {
    await seed('multi-1', { name: 'Multi', roles: ['Developer', 'PM'] }, {});
    const out = await assembleCorpus('multi-1');
    expect(out.text).toContain('Role: Developer / PM');
  });

  it('treats sourceFiles[0] as profile when there are 2+ files', async () => {
    await seed(
      'bob-1',
      {
        name: 'Bob',
        roles: ['Developer'],
        sourceFiles: ['profile.md', 'chat-a.md', 'chat-b.md'],
      },
      {
        'profile.md': 'Bob is a senior dev.',
        'chat-a.md': 'Hello world A',
        'chat-b.md': 'Hello world B',
      },
    );
    const out = await assembleCorpus('bob-1');
    expect(out.text).toContain('=== PROFILE ===');
    expect(out.text).toContain('Bob is a senior dev.');
    expect(out.text).toContain('=== CHAT HISTORY: chat-a.md ===');
    expect(out.text).toContain('Hello world A');
    expect(out.text).toContain('=== CHAT HISTORY: chat-b.md ===');
    expect(out.text).toContain('Hello world B');
    expect(out.hasProfile).toBe(true);
  });

  it('treats a single sourceFile as chat history (no profile)', async () => {
    await seed(
      'carol-1',
      { name: 'Carol', roles: ['Designer'], sourceFiles: ['only-chat.md'] },
      { 'only-chat.md': 'just a chat export' },
    );
    const out = await assembleCorpus('carol-1');
    expect(out.text).not.toContain('=== PROFILE ===');
    expect(out.text).toContain('=== CHAT HISTORY: only-chat.md ===');
    expect(out.text).toContain('just a chat export');
    expect(out.hasProfile).toBe(false);
  });

  it('aggregates parser warnings', async () => {
    await seed(
      'dave-1',
      { name: 'Dave', roles: ['Developer'], sourceFiles: ['a.md', 'bad.json'] },
      { 'a.md': 'ok', 'bad.json': '{not valid' },
    );
    const out = await assembleCorpus('dave-1');
    expect(out.warnings.length).toBeGreaterThan(0);
    expect(out.warnings.some((w) => /json/i.test(w))).toBe(true);
  });

  it('works with no source files at all', async () => {
    await seed('eve-1', { name: 'Eve', roles: ['PM'], sourceFiles: [] }, {});
    const out = await assembleCorpus('eve-1');
    expect(out.text).toContain('=== BASIC INFO ===');
    expect(out.hasProfile).toBe(false);
  });
});
