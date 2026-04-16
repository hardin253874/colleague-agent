// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';

import { GET } from './route';

let tmp: string;
let prevDataDir: string | undefined;

const SEED_META = {
  slug: 'oleg',
  name: 'Oleg Putilin',
  role: 'Developer',
  skills: ['writing-plans', 'test-driven-development'],
  createdAt: '2026-04-14T00:00:00Z',
};

function seedMetaOnly(slug: string) {
  const base = path.join(tmp, slug);
  mkdirSync(base, { recursive: true });
  writeFileSync(path.join(base, 'meta.json'), JSON.stringify(SEED_META));
}

function seedFullPackage(slug: string) {
  seedMetaOnly(slug);
  const pkg = path.join(tmp, slug, 'agent-package');
  mkdirSync(path.join(pkg, '.claude', 'agents'), { recursive: true });
  writeFileSync(
    path.join(pkg, '.claude', 'agents', `${slug}.md`),
    '# agent body\n',
  );
  writeFileSync(path.join(pkg, '.mcp.json'), JSON.stringify({ mcpServers: {} }));
  writeFileSync(path.join(pkg, 'meta.json'), JSON.stringify(SEED_META, null, 2));
}

async function callGet(slug: string): Promise<Response> {
  // The route handler only reads `ctx.params` — `_req` is unused, so an empty
  // Request stub is sufficient.
  return GET(new Request('http://test/') as unknown as Parameters<typeof GET>[0], {
    params: Promise.resolve({ slug }),
  });
}

beforeEach(() => {
  prevDataDir = process.env.DATA_DIR;
  tmp = mkdtempSync(path.join(tmpdir(), 'download-'));
  process.env.DATA_DIR = tmp;
});

afterEach(() => {
  process.env.DATA_DIR = prevDataDir;
  rmSync(tmp, { recursive: true, force: true });
});

describe('GET /api/colleagues/[slug]/download', () => {
  it('returns 404 when no colleague exists for the slug', async () => {
    const res = await callGet('ghost');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/no colleague/i);
  });

  it('returns 400 when the agent-package has not been built', async () => {
    seedMetaOnly('oleg');
    const res = await callGet('oleg');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/agent-package|build agent/i);
  });

  it('streams a zip with the correct headers when the agent-package exists', async () => {
    seedFullPackage('oleg');
    const res = await callGet('oleg');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/zip');
    const disp = res.headers.get('content-disposition') ?? '';
    expect(disp).toContain('attachment');
    expect(disp).toContain('filename="oleg.zip"');
  });

  it('response body is a valid zip containing README.md', async () => {
    seedFullPackage('oleg');
    const res = await callGet('oleg');
    const buf = Buffer.from(await res.arrayBuffer());
    const zip = await JSZip.loadAsync(buf);
    expect(zip.file('README.md')).toBeTruthy();
  });
});
