import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { getDataDir, readMeta } from './storage';
import { assembleCorpus } from './corpus';
import { callClaude } from './llm';

export interface AnalyzeResult {
  persona: string;
  analyzerRaw: Record<string, unknown>;
  projectList: string[];
}

function promptsDir(): string {
  return path.join(process.cwd(), 'prompts');
}

async function loadPrompt(name: string): Promise<string> {
  return readFile(path.join(promptsDir(), name), 'utf8');
}

function extractProjectList(analyzer: Record<string, unknown>): string[] {
  const rp = analyzer.related_projects;
  if (!Array.isArray(rp)) return [];
  const names: string[] = [];
  for (const item of rp) {
    if (item && typeof item === 'object' && 'name' in item) {
      const n = (item as { name: unknown }).name;
      if (typeof n === 'string' && n.trim().length > 0) names.push(n.trim());
    }
  }
  return names;
}

export async function runAnalyze(slug: string): Promise<AnalyzeResult> {
  const meta = await readMeta(slug);
  const sourceCount = Array.isArray(meta.sourceFiles) ? meta.sourceFiles.length : 0;
  if (sourceCount === 0) {
    throw new Error(`Cannot analyze ${slug}: no source files uploaded.`);
  }

  const corpus = await assembleCorpus(slug);

  const analyzerPrompt = await loadPrompt('unified_analyzer.md');
  const builderPrompt = await loadPrompt('unified_builder.md');

  // ---- Call 1: analyzer ----
  let analyzerText: string;
  try {
    analyzerText = await callClaude({
      system: analyzerPrompt,
      user: corpus.text,
      cacheControl: true,
    });
  } catch (err) {
    throw new Error(`Analyzer call failed for ${slug}: ${(err as Error).message}`);
  }

  let analyzerJson: Record<string, unknown>;
  try {
    analyzerJson = JSON.parse(analyzerText) as Record<string, unknown>;
  } catch {
    analyzerJson = { raw: analyzerText };
  }

  // ---- Call 2: builder ----
  const builderUser = [
    `=== ANALYZER OUTPUT (JSON) ===`,
    JSON.stringify(analyzerJson, null, 2),
    ``,
    `=== RAW CORPUS ===`,
    corpus.text,
    ``,
    `=== FLAGS ===`,
    `used_profile: ${corpus.hasProfile}`,
  ].join('\n');

  let builderText: string;
  try {
    builderText = await callClaude({
      system: builderPrompt,
      user: builderUser,
      cacheControl: true,
    });
  } catch (err) {
    throw new Error(`Builder call failed for ${slug}: ${(err as Error).message}`);
  }

  // ---- Persist artifacts ----
  const personaDir = path.join(getDataDir(), slug, 'persona');
  await mkdir(personaDir, { recursive: true });

  await writeFile(
    path.join(personaDir, 'analyzer-output.json'),
    JSON.stringify(analyzerJson, null, 2),
    'utf8',
  );
  await writeFile(path.join(personaDir, 'builder-output.md'), builderText, 'utf8');
  await writeFile(path.join(personaDir, 'persona.md'), builderText, 'utf8');

  return {
    persona: builderText,
    analyzerRaw: analyzerJson,
    projectList: extractProjectList(analyzerJson),
  };
}
