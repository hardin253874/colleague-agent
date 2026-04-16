import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { getDataDir, readMeta } from './storage';
import { parseFile } from './parsers';
import { ingestText } from './rag';
import { skillsForRole, SUPPORTED_ROLES, type Role } from './role-skills';
import { buildMcpConfig } from './mcp-config';
import { composeAgentFile } from './agent-file';

export interface BuildFailure {
  file: string;
  error: string;
}

export type BuildResult =
  | { ok: true; ingested: string[]; failed: BuildFailure[] }
  | { ok: false; error: string };

function normaliseRole(raw: unknown): Role {
  if (typeof raw === 'string' && (SUPPORTED_ROLES as string[]).includes(raw)) {
    return raw as Role;
  }
  return 'Developer';
}

async function listKnowledgeFiles(slug: string): Promise<string[]> {
  const dir = path.join(getDataDir(), slug, 'knowledge');
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => e.name);
  } catch {
    return [];
  }
}

/**
 * Orchestrates the Agent Package build for a colleague slug:
 *
 *   1. Read `meta.json` + `persona/persona.md`
 *   2. List + parse + RAG-ingest each knowledge file
 *   3. Compose `.claude/agents/{slug}.md`, `.mcp.json`, `agent-package/meta.json`
 *   4. Write the tree under `{DATA_DIR}/{slug}/agent-package/`
 *
 * Partial RAG failures are tolerated (reported via `failed`). The build only
 * fails when meta or persona is missing, or when knowledge files exist and
 * every single one fails to ingest.
 */
export async function runBuild(slug: string): Promise<BuildResult> {
  // 1. Read meta + persona.
  let meta;
  try {
    meta = await readMeta(slug);
  } catch {
    return { ok: false, error: `meta.json not found for slug "${slug}"` };
  }

  const personaPath = path.join(getDataDir(), slug, 'persona', 'persona.md');
  let personaText: string;
  try {
    personaText = await readFile(personaPath, 'utf8');
  } catch {
    return { ok: false, error: `persona.md not found at ${personaPath}` };
  }

  const role = normaliseRole(meta.role);
  const skills = skillsForRole(role);

  // 2. Ingest knowledge files.
  const knowledgeDir = path.join(getDataDir(), slug, 'knowledge');
  const files = await listKnowledgeFiles(slug);

  const ingested: string[] = [];
  const failed: BuildFailure[] = [];

  for (const file of files) {
    const abs = path.join(knowledgeDir, file);
    const parsed = await parseFile(abs);
    if (!parsed.text) {
      failed.push({ file, error: parsed.warnings.join('; ') || 'no extractable text' });
      continue;
    }
    const result = await ingestText({ content: parsed.text, source: file });
    if (result.ok) ingested.push(file);
    else failed.push({ file, error: result.error });
  }

  if (files.length > 0 && ingested.length === 0) {
    return {
      ok: false,
      error: `All knowledge files failed to ingest: ${failed
        .map((f) => `${f.file} (${f.error})`)
        .join('; ')}`,
    };
  }

  // 3. Compose artefacts.
  const agentFile = composeAgentFile({
    name: String(meta.name ?? slug),
    slug,
    role,
    personaText,
    skills,
    gender: typeof meta.gender === 'string' ? meta.gender : undefined,
    mbti: typeof meta.mbti === 'string' ? meta.mbti : undefined,
    impression: typeof meta.impression === 'string' ? meta.impression : undefined,
  });
  const mcp = buildMcpConfig();
  const packageMeta = {
    slug,
    name: meta.name,
    role,
    skills,
    createdAt: meta.createdAt ?? new Date().toISOString(),
  };

  // 4. Write tree.
  const pkgRoot = path.join(getDataDir(), slug, 'agent-package');
  const agentsDir = path.join(pkgRoot, '.claude', 'agents');
  await mkdir(agentsDir, { recursive: true });
  await writeFile(path.join(agentsDir, `${slug}.md`), agentFile, 'utf8');
  await writeFile(
    path.join(pkgRoot, '.mcp.json'),
    JSON.stringify(mcp, null, 2),
    'utf8',
  );
  await writeFile(
    path.join(pkgRoot, 'meta.json'),
    JSON.stringify(packageMeta, null, 2),
    'utf8',
  );

  // Persist the ingest summary so Page 5 (/wizard/download) can surface RAG
  // failures without re-running the pipeline. Idempotent; overwritten on
  // each rebuild.
  await writeFile(
    path.join(getDataDir(), slug, 'build-result.json'),
    JSON.stringify({ ingested, failed }, null, 2),
    'utf8',
  );

  return { ok: true, ingested, failed };
}
