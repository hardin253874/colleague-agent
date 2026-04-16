// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Hoisted mock — vi.mock is hoisted to top of file
const callClaudeMock = vi.fn();
vi.mock('./llm', () => ({
  callClaude: (args: unknown) => callClaudeMock(args),
}));

import { runAnalyze } from './pipeline';
import { writeMeta, ensureColleagueDir } from './storage';

let tmp: string;
let prevDataDir: string | undefined;

beforeEach(async () => {
  prevDataDir = process.env.DATA_DIR;
  tmp = mkdtempSync(path.join(tmpdir(), 'pipeline-'));
  process.env.DATA_DIR = tmp;
  process.env.LLM_MODEL = 'claude-test-model';
  process.env.LLM_API_KEY = 'test-key';
  callClaudeMock.mockReset();
});

afterEach(() => {
  if (prevDataDir === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = prevDataDir;
  rmSync(tmp, { recursive: true, force: true });
});

async function seed(slug: string, files: Record<string, string>, meta: Record<string, unknown> = {}) {
  const dir = await ensureColleagueDir(slug);
  const src = path.join(dir, 'source');
  mkdirSync(src, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(path.join(src, name), content);
  }
  await writeMeta(slug, {
    slug,
    name: (meta.name as string) ?? slug,
    sourceFiles: Object.keys(files),
    ...meta,
  });
}

describe('runAnalyze — happy path', () => {
  it('makes 2 LLM calls and writes three artifacts', async () => {
    await seed('alice-1', { 'chat.md': 'Hi Alice' }, { name: 'Alice', roles: ['PM'] });

    const analyzerJson = {
      identity: { name: 'Alice', role: 'PM', company: null, language_notes: null, bio_notes: [] },
      voice: {},
      behavior: {},
      technical: {},
      decisions: {},
      related_projects: [{ name: 'NESA', role: 'tech lead' }],
      relationship_dynamic: null,
      evidence_quotes: [],
      conflicts: [],
      gaps: [],
      used_profile: false,
    };

    callClaudeMock
      .mockResolvedValueOnce(JSON.stringify(analyzerJson)) // analyzer call
      .mockResolvedValueOnce('# Alice — Persona\n\n## 1. Snapshot\n\nAlice is a PM.'); // builder call

    const out = await runAnalyze('alice-1');

    expect(callClaudeMock).toHaveBeenCalledTimes(2);
    expect(out.persona).toContain('# Alice — Persona');
    expect(out.projectList).toEqual(['NESA']);

    const analyzerPath = path.join(tmp, 'alice-1', 'persona', 'analyzer-output.json');
    const builderPath = path.join(tmp, 'alice-1', 'persona', 'builder-output.md');
    const personaPath = path.join(tmp, 'alice-1', 'persona', 'persona.md');
    expect(existsSync(analyzerPath)).toBe(true);
    expect(existsSync(builderPath)).toBe(true);
    expect(existsSync(personaPath)).toBe(true);
    expect(readFileSync(personaPath, 'utf8')).toContain('Alice is a PM.');
    expect(readFileSync(builderPath, 'utf8')).toContain('Alice is a PM.');
    expect(JSON.parse(readFileSync(analyzerPath, 'utf8'))).toEqual(analyzerJson);
  });

  it('passes cacheControl: true on both calls (prompt caching on system)', async () => {
    await seed('bob-1', { 'chat.md': 'Hi' }, { name: 'Bob', roles: ['PM'] });
    callClaudeMock
      .mockResolvedValueOnce('{"identity":{},"related_projects":[],"gaps":[],"used_profile":false}')
      .mockResolvedValueOnce('# Bob — Persona');
    await runAnalyze('bob-1');
    for (const call of callClaudeMock.mock.calls) {
      expect((call[0] as { cacheControl: boolean }).cacheControl).toBe(true);
    }
  });

  it('passes used_profile=true to the builder when corpus has a profile', async () => {
    await seed(
      'carol-1',
      { 'profile.md': 'Carol profile text', 'chat.md': 'Hi' },
      { name: 'Carol', roles: ['PM'], sourceFiles: ['profile.md', 'chat.md'] },
    );
    callClaudeMock
      .mockResolvedValueOnce('{"identity":{},"related_projects":[],"gaps":[],"used_profile":true}')
      .mockResolvedValueOnce('# Carol — Persona');
    await runAnalyze('carol-1');

    const builderCall = callClaudeMock.mock.calls[1][0] as { user: string };
    expect(builderCall.user).toMatch(/used_profile\s*[:=]\s*true/i);
  });
});

describe('runAnalyze — error paths', () => {
  it('throws when there are zero source files', async () => {
    await seed('empty-1', {}, { name: 'Empty', roles: ['PM'], sourceFiles: [] });
    await expect(runAnalyze('empty-1')).rejects.toThrow(/no source files/i);
    expect(callClaudeMock).toHaveBeenCalledTimes(0);
  });

  it('still writes artifacts when analyzer output is not valid JSON (raw-fallback)', async () => {
    await seed('rawfb-1', { 'chat.md': 'hi' }, { name: 'R', roles: ['PM'] });
    callClaudeMock
      .mockResolvedValueOnce('not valid json at all')
      .mockResolvedValueOnce('# R — Persona');
    const out = await runAnalyze('rawfb-1');
    expect(out.projectList).toEqual([]);
    const analyzerPath = path.join(tmp, 'rawfb-1', 'persona', 'analyzer-output.json');
    // Falls back to { raw: "..." }
    const stored = JSON.parse(readFileSync(analyzerPath, 'utf8'));
    expect(stored.raw).toBe('not valid json at all');
  });

  it('propagates an LLM error with slug context', async () => {
    await seed('err-1', { 'chat.md': 'hi' }, { name: 'E', roles: ['PM'] });
    callClaudeMock.mockRejectedValueOnce(new Error('boom'));
    await expect(runAnalyze('err-1')).rejects.toThrow(/err-1|boom/);
  });
});
