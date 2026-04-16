import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';

import { getDataDir } from './storage';
import { buildReadme } from './readme';

interface PackageMeta {
  slug: string;
  name: string;
  role: string;
  skills: string[];
  createdAt?: string;
}

/**
 * Assembles the colleague agent zip bundle for `slug` and returns it as a
 * `Buffer`. Expects `{DATA_DIR}/{slug}/agent-package/` to already contain
 * `.claude/agents/{slug}.md`, `.mcp.json`, and `meta.json` (produced by
 * `runBuild`). Skill content is pulled from the checked-in `src/skills/`
 * copies so the bundle is reproducible offline.
 *
 * Throws if the agent-package directory is missing, or if any skill listed in
 * meta.json has no corresponding `src/skills/{name}/SKILL.md` file.
 *
 * Bundle tree (exact, per Plan 05 § Download ZIP format):
 *   README.md
 *   meta.json
 *   .mcp.json
 *   .claude/agents/{slug}.md
 *   .claude/skills/{skill}/SKILL.md  (one per meta.skills entry)
 */
export async function buildZipBuffer(slug: string): Promise<Buffer> {
  const pkgRoot = path.join(getDataDir(), slug, 'agent-package');

  try {
    await stat(pkgRoot);
  } catch {
    throw new Error(
      `agent-package not found for slug "${slug}" — run Build Agent first`,
    );
  }

  const metaRaw = await readFile(path.join(pkgRoot, 'meta.json'), 'utf8');
  const meta = JSON.parse(metaRaw) as PackageMeta;

  const mcpBytes = await readFile(path.join(pkgRoot, '.mcp.json'));
  const agentBytes = await readFile(
    path.join(pkgRoot, '.claude', 'agents', `${slug}.md`),
  );

  const skillFiles: Array<{ skill: string; content: Buffer }> = [];
  for (const skill of meta.skills) {
    const src = path.join(process.cwd(), 'src', 'skills', skill, 'SKILL.md');
    try {
      const content = await readFile(src);
      skillFiles.push({ skill, content });
    } catch {
      throw new Error(
        `skill source missing: src/skills/${skill}/SKILL.md — add it to the checked-in skill set`,
      );
    }
  }

  const readme = buildReadme({
    name: meta.name,
    slug,
    role: meta.role,
    skills: meta.skills,
  });

  const zip = new JSZip();
  zip.file('README.md', readme);
  zip.file('meta.json', metaRaw);
  zip.file('.mcp.json', mcpBytes);
  zip.file(`.claude/agents/${slug}.md`, agentBytes);
  for (const { skill, content } of skillFiles) {
    zip.file(`.claude/skills/${skill}/SKILL.md`, content);
  }

  return zip.generateAsync({ type: 'nodebuffer' });
}
