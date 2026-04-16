import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface ParseResult {
  text: string;
  warnings: string[];
}

function getExt(filename: string): string {
  const i = filename.lastIndexOf('.');
  return i < 0 ? '' : filename.slice(i).toLowerCase();
}

async function parseMarkdownOrText(absolutePath: string): Promise<ParseResult> {
  const text = await readFile(absolutePath, 'utf8');
  return { text, warnings: [] };
}

function flattenJson(value: unknown, prefix: string, lines: string[]): void {
  if (value === null || value === undefined) {
    lines.push(`${prefix}: ${value === null ? 'null' : ''}`);
    return;
  }
  if (Array.isArray(value)) {
    // Special-case: array of chat-style records with {from, content}.
    if (value.every((v) => v && typeof v === 'object' && !Array.isArray(v))) {
      for (let i = 0; i < value.length; i++) {
        const rec = value[i] as Record<string, unknown>;
        if ('from' in rec || 'content' in rec) {
          if ('from' in rec) lines.push(`from: ${String(rec.from)}`);
          if ('content' in rec) lines.push(`content: ${String(rec.content)}`);
          lines.push('');
          continue;
        }
        // Generic object inside array — recurse with indexed prefix
        flattenJson(rec, prefix ? `${prefix}[${i}]` : `[${i}]`, lines);
      }
      return;
    }
    // Primitive array
    for (let i = 0; i < value.length; i++) {
      flattenJson(value[i], prefix ? `${prefix}[${i}]` : `[${i}]`, lines);
    }
    return;
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const next = prefix ? `${prefix}.${k}` : k;
      flattenJson(v, next, lines);
    }
    return;
  }
  lines.push(`${prefix}: ${String(value)}`);
}

async function parseJson(absolutePath: string): Promise<ParseResult> {
  const raw = await readFile(absolutePath, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return {
      text: '',
      warnings: [
        `Malformed JSON in ${path.basename(absolutePath)}: ${(err as Error).message}`,
      ],
    };
  }
  const lines: string[] = [];
  flattenJson(parsed, '', lines);
  return { text: lines.join('\n'), warnings: [] };
}

async function parsePdf(absolutePath: string): Promise<ParseResult> {
  try {
    const { extractText, getDocumentProxy } = await import('unpdf');
    const buf = await readFile(absolutePath);
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: false });
    const pages = Array.isArray(text) ? text : [text];
    const joined = pages.filter((p) => typeof p === 'string').join('\n\n');
    if (joined.length === 0) {
      return {
        text: '',
        warnings: [
          `PDF ${path.basename(absolutePath)} produced no extractable text (scanned or empty).`,
        ],
      };
    }
    return { text: joined, warnings: [] };
  } catch (err) {
    return {
      text: '',
      warnings: [
        `Failed to parse PDF ${path.basename(absolutePath)}: ${(err as Error).message}`,
      ],
    };
  }
}

export async function parseFile(absolutePath: string): Promise<ParseResult> {
  const ext = getExt(absolutePath);
  switch (ext) {
    case '.md':
    case '.txt':
      return parseMarkdownOrText(absolutePath);
    case '.json':
      return parseJson(absolutePath);
    case '.pdf':
      return parsePdf(absolutePath);
    default:
      return {
        text: '',
        warnings: [`Unsupported extension "${ext || '(none)'}" for ${path.basename(absolutePath)}.`],
      };
  }
}
