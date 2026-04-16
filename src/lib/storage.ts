import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function getDataDir(): string {
  const raw = process.env.DATA_DIR ?? './data/colleagues';
  return path.resolve(raw);
}

export async function ensureColleagueDir(slug: string): Promise<string> {
  const dir = path.join(getDataDir(), slug);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

export type UploadDestination = 'source' | 'knowledge';

export interface ColleagueMeta {
  slug: string;
  name: string;
  roles?: string[];
  gender?: string;
  mbti?: string;
  impression?: string;
  createdAt?: string;
  sourceFiles?: string[];
  knowledgeFiles?: string[];
  [key: string]: unknown;
}

function fileListKey(destination: UploadDestination): 'sourceFiles' | 'knowledgeFiles' {
  return destination === 'source' ? 'sourceFiles' : 'knowledgeFiles';
}

export async function readMeta(slug: string): Promise<ColleagueMeta> {
  const dir = path.join(getDataDir(), slug);
  return readJson<ColleagueMeta>(path.join(dir, 'meta.json'));
}

export async function writeMeta(slug: string, meta: ColleagueMeta): Promise<void> {
  const dir = await ensureColleagueDir(slug);
  await writeJson(path.join(dir, 'meta.json'), meta);
}

export async function appendFileToMeta(
  slug: string,
  destination: UploadDestination,
  filename: string,
): Promise<void> {
  const meta = await readMeta(slug);
  const key = fileListKey(destination);
  const list = Array.isArray(meta[key]) ? [...(meta[key] as string[])] : [];
  if (!list.includes(filename)) list.push(filename);
  meta[key] = list;
  await writeMeta(slug, meta);
}

export async function removeFileFromMeta(
  slug: string,
  destination: UploadDestination,
  filename: string,
): Promise<void> {
  const meta = await readMeta(slug);
  const key = fileListKey(destination);
  const list = Array.isArray(meta[key]) ? (meta[key] as string[]) : [];
  meta[key] = list.filter((f) => f !== filename);
  await writeMeta(slug, meta);
}
