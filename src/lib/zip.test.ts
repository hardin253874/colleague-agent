// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';

import { buildZipBuffer } from './zip';

let tmp: string;
let prevDataDir: string | undefined;

const SEED_META = {
  slug: 'oleg',
  name: 'Oleg Putilin',
  role: 'Developer',
  skills: ['writing-plans', 'test-driven-development'],
  createdAt: '2026-04-14T00:00:00Z',
};
const SEED_AGENT_BODY = '---\nname: oleg\n---\n\n# Oleg persona body\n';
const SEED_MCP = { mcpServers: { 'rag-chatbot': { type: 'sse', url: 'https://example/sse' } } };

function seedAgentPackage(slug: string, opts: { includePackage?: boolean } = {}) {
  const base = path.join(tmp, slug);
  mkdirSync(base, { recursive: true });
  writeFileSync(path.join(base, 'meta.json'), JSON.stringify(SEED_META));

  if (opts.includePackage !== false) {
    const pkg = path.join(base, 'agent-package');
    const agentsDir = path.join(pkg, '.claude', 'agents');
    mkdirSync(agentsDir, { recursive: true });
    writeFileSync(path.join(agentsDir, `${slug}.md`), SEED_AGENT_BODY);
    writeFileSync(path.join(pkg, '.mcp.json'), JSON.stringify(SEED_MCP, null, 2));
    writeFileSync(path.join(pkg, 'meta.json'), JSON.stringify(SEED_META, null, 2));
  }
}

beforeEach(() => {
  prevDataDir = process.env.DATA_DIR;
  tmp = mkdtempSync(path.join(tmpdir(), 'zip-'));
  process.env.DATA_DIR = tmp;
});

afterEach(() => {
  process.env.DATA_DIR = prevDataDir;
  rmSync(tmp, { recursive: true, force: true });
});

describe('buildZipBuffer', () => {
  it('throws when agent-package directory does not exist', async () => {
    seedAgentPackage('oleg', { includePackage: false });
    await expect(buildZipBuffer('oleg')).rejects.toThrow(/agent-package not found/i);
  });

  it('produces a zip whose top-level entries match Plan 05', async () => {
    seedAgentPackage('oleg');
    const buf = await buildZipBuffer('oleg');
    const zip = await JSZip.loadAsync(buf);
    const entries = Object.keys(zip.files)
      .filter((k) => !zip.files[k].dir)
      .sort();
    expect(entries).toEqual(
      [
        'README.md',
        'meta.json',
        '.mcp.json',
        '.claude/agents/oleg.md',
        '.claude/skills/writing-plans/SKILL.md',
        '.claude/skills/test-driven-development/SKILL.md',
      ].sort(),
    );
  });

  it('embeds the agent file at .claude/agents/{slug}.md', async () => {
    seedAgentPackage('oleg');
    const buf = await buildZipBuffer('oleg');
    const zip = await JSZip.loadAsync(buf);
    const agent = await zip.file('.claude/agents/oleg.md')!.async('string');
    expect(agent).toBe(SEED_AGENT_BODY);
  });

  it('embeds each skill from meta.json at .claude/skills/{name}/SKILL.md', async () => {
    seedAgentPackage('oleg');
    const buf = await buildZipBuffer('oleg');
    const zip = await JSZip.loadAsync(buf);

    for (const skill of SEED_META.skills) {
      const zipped = await zip.file(`.claude/skills/${skill}/SKILL.md`)!.async('string');
      const source = readFileSync(
        path.join(process.cwd(), 'src', 'skills', skill, 'SKILL.md'),
        'utf8',
      );
      expect(zipped).toBe(source);
    }
  });

  it('embeds the generated README using buildReadme output', async () => {
    seedAgentPackage('oleg');
    const buf = await buildZipBuffer('oleg');
    const zip = await JSZip.loadAsync(buf);
    const readme = await zip.file('README.md')!.async('string');
    expect(readme).toContain('# Oleg Putilin');
    expect(readme).toContain('oleg');
  });

  it('preserves meta.json contents verbatim', async () => {
    seedAgentPackage('oleg');
    const buf = await buildZipBuffer('oleg');
    const zip = await JSZip.loadAsync(buf);
    const metaStr = await zip.file('meta.json')!.async('string');
    expect(JSON.parse(metaStr)).toEqual(SEED_META);
  });
});
