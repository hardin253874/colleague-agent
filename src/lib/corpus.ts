import path from 'node:path';
import { getDataDir, readMeta } from './storage';
import { parseFile } from './parsers';

export interface CorpusResult {
  text: string;
  warnings: string[];
  hasProfile: boolean;
}

function formatBasicInfo(meta: Record<string, unknown>): string {
  const lines: string[] = ['=== BASIC INFO ==='];
  const push = (label: string, key: string) => {
    const v = meta[key];
    if (typeof v === 'string' && v.trim().length > 0) {
      lines.push(`${label}: ${v.trim()}`);
    }
  };
  push('Name', 'name');
  push('Role', 'role');
  push('Gender', 'gender');
  push('MBTI', 'mbti');
  push('Impression', 'impression');
  return lines.join('\n');
}

export async function assembleCorpus(slug: string): Promise<CorpusResult> {
  const meta = await readMeta(slug);
  const sections: string[] = [formatBasicInfo(meta as unknown as Record<string, unknown>)];
  const warnings: string[] = [];

  const sourceDir = path.join(getDataDir(), slug, 'source');
  const sourceFiles = Array.isArray(meta.sourceFiles) ? meta.sourceFiles : [];

  let profileFile: string | null = null;
  let chatFiles: string[] = [];
  if (sourceFiles.length >= 2) {
    profileFile = sourceFiles[0];
    chatFiles = sourceFiles.slice(1);
  } else {
    chatFiles = sourceFiles;
  }

  if (profileFile) {
    const parsed = await parseFile(path.join(sourceDir, profileFile));
    warnings.push(...parsed.warnings);
    sections.push(`=== PROFILE ===\n${parsed.text}`);
  }

  for (const file of chatFiles) {
    const parsed = await parseFile(path.join(sourceDir, file));
    warnings.push(...parsed.warnings);
    sections.push(`=== CHAT HISTORY: ${file} ===\n${parsed.text}`);
  }

  return {
    text: sections.join('\n\n'),
    warnings,
    hasProfile: profileFile !== null,
  };
}
