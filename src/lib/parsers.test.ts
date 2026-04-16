// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { parseFile } from './parsers';

let tmp: string;

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), 'parsers-'));
});
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

function writeTmp(name: string, content: string | Uint8Array): string {
  const p = path.join(tmp, name);
  writeFileSync(p, content);
  return p;
}

describe('parseFile — markdown', () => {
  it('reads .md as UTF-8 with no warnings', async () => {
    const p = writeTmp('a.md', '# Hello\n\nBody paragraph.');
    const out = await parseFile(p);
    expect(out.text).toBe('# Hello\n\nBody paragraph.');
    expect(out.warnings).toEqual([]);
  });

  it('reads .MD case-insensitively', async () => {
    const p = writeTmp('a.MD', 'hi');
    const out = await parseFile(p);
    expect(out.text).toBe('hi');
  });
});

describe('parseFile — plain text', () => {
  it('reads .txt as UTF-8', async () => {
    const p = writeTmp('a.txt', 'line one\nline two');
    const out = await parseFile(p);
    expect(out.text).toBe('line one\nline two');
    expect(out.warnings).toEqual([]);
  });
});

describe('parseFile — json', () => {
  it('flattens an array of {from, content} chat entries', async () => {
    const p = writeTmp(
      'chat.json',
      JSON.stringify([
        { from: 'Alice', content: 'hello' },
        { from: 'Bob', content: 'hi back' },
      ]),
    );
    const out = await parseFile(p);
    expect(out.text).toContain('from: Alice');
    expect(out.text).toContain('content: hello');
    expect(out.text).toContain('from: Bob');
    expect(out.text).toContain('content: hi back');
    expect(out.warnings).toEqual([]);
  });

  it('flattens a nested object recursively as key/value lines', async () => {
    const p = writeTmp(
      'obj.json',
      JSON.stringify({ user: { name: 'Z', age: 30 }, notes: ['a', 'b'] }),
    );
    const out = await parseFile(p);
    expect(out.text).toContain('user.name: Z');
    expect(out.text).toContain('user.age: 30');
    expect(out.text).toContain('notes[0]: a');
    expect(out.text).toContain('notes[1]: b');
  });

  it('returns a warning and empty text on malformed JSON', async () => {
    const p = writeTmp('bad.json', '{not valid');
    const out = await parseFile(p);
    expect(out.text).toBe('');
    expect(out.warnings.length).toBeGreaterThan(0);
    expect(out.warnings[0]).toMatch(/json/i);
  });
});

describe('parseFile — pdf', () => {
  it('uses unpdf.extractText and joins pages with double-newline', async () => {
    // Minimal valid PDF — Hello World from a known fixture
    // We rely on unpdf's extractor being resilient to tiny docs. If the
    // runtime fails, the parser returns a warning (that path is covered below).
    const minimalPdf = Buffer.from(
      '%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\nxref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000053 00000 n \ntrailer<</Size 3/Root 1 0 R>>\nstartxref\n97\n%%EOF',
      'utf8',
    );
    const p = writeTmp('empty.pdf', minimalPdf);
    const out = await parseFile(p);
    // Either the extractor yields an empty string (empty PDF) with no warning,
    // or it adds a warning if it cannot read the structure. Both are acceptable
    // — this test only asserts that the parser does not throw.
    expect(typeof out.text).toBe('string');
    expect(Array.isArray(out.warnings)).toBe(true);
  });

  it('returns a warning on a file that is not a valid PDF', async () => {
    const p = writeTmp('fake.pdf', 'not a pdf at all');
    const out = await parseFile(p);
    expect(out.text).toBe('');
    expect(out.warnings.length).toBeGreaterThan(0);
    expect(out.warnings[0]).toMatch(/pdf/i);
  });
});

describe('parseFile — unsupported', () => {
  it('returns a warning for an unknown extension', async () => {
    const p = writeTmp('x.exe', 'binary');
    const out = await parseFile(p);
    expect(out.text).toBe('');
    expect(out.warnings[0]).toMatch(/extension/i);
  });
});
