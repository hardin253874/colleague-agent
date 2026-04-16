// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { writeFile as fsWriteFile, mkdir as fsMkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { POST, DELETE } from './route';
import { ensureColleagueDir, writeJson, readMeta, appendFileToMeta } from '@/lib/storage';

let tmpRoot: string;
let prevDataDir: string | undefined;

beforeEach(async () => {
  prevDataDir = process.env.DATA_DIR;
  tmpRoot = mkdtempSync(path.join(tmpdir(), 'upload-route-'));
  process.env.DATA_DIR = tmpRoot;
  const dir = await ensureColleagueDir('alice-abc123');
  await writeJson(path.join(dir, 'meta.json'), { slug: 'alice-abc123', name: 'Alice' });
});

afterEach(() => {
  if (prevDataDir === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = prevDataDir;
  rmSync(tmpRoot, { recursive: true, force: true });
});

function buildRequest(files: Array<{ name: string; bytes: Uint8Array }>, destination: string): Request {
  const fd = new FormData();
  for (const f of files) {
    fd.append(
      'files',
      new File([f.bytes as BlobPart], f.name, { type: 'application/octet-stream' }),
    );
  }
  fd.append('destination', destination);
  return new Request('http://local/api/colleagues/alice-abc123/upload', {
    method: 'POST',
    body: fd,
  });
}

describe('POST /api/colleagues/[slug]/upload', () => {
  it('writes a valid file to the source directory and updates meta', async () => {
    const req = buildRequest(
      [{ name: 'profile.md', bytes: new TextEncoder().encode('# hello') }],
      'source',
    );
    const res = await POST(req, { params: Promise.resolve({ slug: 'alice-abc123' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.files).toHaveLength(1);
    expect(body.files[0].name).toBe('profile.md');

    const onDisk = path.join(tmpRoot, 'alice-abc123', 'source', 'profile.md');
    expect(existsSync(onDisk)).toBe(true);
    expect(readFileSync(onDisk, 'utf8')).toBe('# hello');

    const meta = await readMeta('alice-abc123');
    expect(meta.sourceFiles).toEqual(['profile.md']);
  });

  it('writes multiple files to the knowledge directory in one request', async () => {
    const req = buildRequest(
      [
        { name: 'a.txt', bytes: new TextEncoder().encode('a') },
        { name: 'b.txt', bytes: new TextEncoder().encode('bb') },
      ],
      'knowledge',
    );
    const res = await POST(req, { params: Promise.resolve({ slug: 'alice-abc123' }) });
    expect(res.status).toBe(200);
    const meta = await readMeta('alice-abc123');
    expect(meta.knowledgeFiles?.sort()).toEqual(['a.txt', 'b.txt']);
  });

  it('rejects an unsupported extension with 400', async () => {
    const req = buildRequest(
      [{ name: 'evil.exe', bytes: new Uint8Array([0, 1, 2]) }],
      'source',
    );
    const res = await POST(req, { params: Promise.resolve({ slug: 'alice-abc123' }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/extension/i);
  });

  it('rejects an oversized file with 400', async () => {
    const prev = process.env.MAX_FILE_BYTES;
    process.env.MAX_FILE_BYTES = '10';
    try {
      const req = buildRequest(
        [{ name: 'big.txt', bytes: new Uint8Array(100) }],
        'source',
      );
      const res = await POST(req, { params: Promise.resolve({ slug: 'alice-abc123' }) });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/too large/i);
    } finally {
      if (prev === undefined) delete process.env.MAX_FILE_BYTES;
      else process.env.MAX_FILE_BYTES = prev;
    }
  });

  it('rejects an oversized total with 413', async () => {
    const prev = process.env.MAX_TOTAL_UPLOAD_BYTES;
    process.env.MAX_TOTAL_UPLOAD_BYTES = '10';
    try {
      const req = buildRequest(
        [
          { name: 'a.txt', bytes: new Uint8Array(8) },
          { name: 'b.txt', bytes: new Uint8Array(8) },
        ],
        'source',
      );
      const res = await POST(req, { params: Promise.resolve({ slug: 'alice-abc123' }) });
      expect(res.status).toBe(413);
      const body = await res.json();
      expect(body.error).toMatch(/total/i);
    } finally {
      if (prev === undefined) delete process.env.MAX_TOTAL_UPLOAD_BYTES;
      else process.env.MAX_TOTAL_UPLOAD_BYTES = prev;
    }
  });

  it('rejects an invalid destination with 400', async () => {
    const req = buildRequest(
      [{ name: 'x.md', bytes: new TextEncoder().encode('x') }],
      'bogus',
    );
    const res = await POST(req, { params: Promise.resolve({ slug: 'alice-abc123' }) });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/colleagues/[slug]/upload', () => {
  it('removes an existing file from disk and from meta', async () => {
    const onDisk = path.join(tmpRoot, 'alice-abc123', 'source', 'profile.md');
    await fsMkdir(path.dirname(onDisk), { recursive: true });
    await fsWriteFile(onDisk, 'seed');
    await appendFileToMeta('alice-abc123', 'source', 'profile.md');

    const req = new Request('http://local/api/colleagues/alice-abc123/upload', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filename: 'profile.md', destination: 'source' }),
    });
    const res = await DELETE(req, { params: Promise.resolve({ slug: 'alice-abc123' }) });
    expect(res.status).toBe(200);
    expect(existsSync(onDisk)).toBe(false);
    const meta = await readMeta('alice-abc123');
    expect(meta.sourceFiles ?? []).not.toContain('profile.md');
  });

  it('returns 400 when filename is missing', async () => {
    const req = new Request('http://local/api/colleagues/alice-abc123/upload', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ destination: 'source' }),
    });
    const res = await DELETE(req, { params: Promise.resolve({ slug: 'alice-abc123' }) });
    expect(res.status).toBe(400);
  });
});
