// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { GET, POST } from './route';
import { ensureColleagueDir } from '@/lib/storage';

let tmp: string;
let prevDataDir: string | undefined;

beforeEach(() => {
  prevDataDir = process.env.DATA_DIR;
  tmp = mkdtempSync(path.join(tmpdir(), 'persona-route-'));
  process.env.DATA_DIR = tmp;
});

afterEach(() => {
  if (prevDataDir === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = prevDataDir;
  rmSync(tmp, { recursive: true, force: true });
});

async function seedPersona(slug: string, content: string) {
  const dir = await ensureColleagueDir(slug);
  const personaDir = path.join(dir, 'persona');
  mkdirSync(personaDir, { recursive: true });
  writeFileSync(path.join(personaDir, 'persona.md'), content);
}

describe('GET /api/colleagues/[slug]/persona', () => {
  it('returns the persona text when it exists', async () => {
    await seedPersona('alice-1', '# Alice\n\nPersona body here.');
    const res = await GET(new Request('http://local/x'), {
      params: Promise.resolve({ slug: 'alice-1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.persona).toBe('# Alice\n\nPersona body here.');
  });

  it('returns 404 when persona.md is missing', async () => {
    const res = await GET(new Request('http://local/x'), {
      params: Promise.resolve({ slug: 'ghost-1' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/colleagues/[slug]/persona', () => {
  it('writes the persona text to disk', async () => {
    await seedPersona('bob-1', 'old text');
    const res = await POST(
      new Request('http://local/x', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ persona: '# Bob\n\nedited body' }),
      }),
      { params: Promise.resolve({ slug: 'bob-1' }) },
    );
    expect(res.status).toBe(200);
    const onDisk = path.join(tmp, 'bob-1', 'persona', 'persona.md');
    expect(readFileSync(onDisk, 'utf8')).toBe('# Bob\n\nedited body');
  });

  it('creates persona/persona.md if the directory exists but the file does not', async () => {
    const dir = await ensureColleagueDir('carol-1');
    mkdirSync(path.join(dir, 'persona'), { recursive: true });
    const res = await POST(
      new Request('http://local/x', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ persona: 'fresh content' }),
      }),
      { params: Promise.resolve({ slug: 'carol-1' }) },
    );
    expect(res.status).toBe(200);
    expect(existsSync(path.join(tmp, 'carol-1', 'persona', 'persona.md'))).toBe(true);
  });

  it('returns 400 when body is missing persona field', async () => {
    await seedPersona('dave-1', 'x');
    const res = await POST(
      new Request('http://local/x', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notPersona: 'oops' }),
      }),
      { params: Promise.resolve({ slug: 'dave-1' }) },
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid JSON body', async () => {
    await seedPersona('eve-1', 'x');
    const res = await POST(
      new Request('http://local/x', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'not json',
      }),
      { params: Promise.resolve({ slug: 'eve-1' }) },
    );
    expect(res.status).toBe(400);
  });
});
