export const ALLOWED_EXTENSIONS = ['.md', '.txt', '.pdf', '.json'] as const;
export const DEFAULT_MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB
export const DEFAULT_MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100 MB

export type ValidationResult = { ok: true } | { ok: false; error: string };

function getExt(filename: string): string | null {
  const i = filename.lastIndexOf('.');
  if (i < 0 || i === filename.length - 1) return null;
  return filename.slice(i).toLowerCase();
}

export function validateExtension(filename: string): ValidationResult {
  const ext = getExt(filename);
  if (ext === null) {
    return {
      ok: false,
      error: `File "${filename}" has no extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}.`,
    };
  }
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return {
      ok: false,
      error: `File "${filename}" has unsupported extension "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}.`,
    };
  }
  return { ok: true };
}

export function validateFileSize(size: number, max: number): ValidationResult {
  if (size > max) {
    return { ok: false, error: `File too large (${size} bytes, limit ${max}).` };
  }
  return { ok: true };
}

export function validateTotalSize(total: number, max: number): ValidationResult {
  if (total > max) {
    return { ok: false, error: `Total upload too large (${total} bytes, limit ${max}).` };
  }
  return { ok: true };
}

function parseIntEnv(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function getMaxFileBytes(): number {
  return parseIntEnv(process.env.MAX_FILE_BYTES, DEFAULT_MAX_FILE_BYTES);
}

export function getMaxTotalBytes(): number {
  return parseIntEnv(process.env.MAX_TOTAL_UPLOAD_BYTES, DEFAULT_MAX_TOTAL_BYTES);
}
