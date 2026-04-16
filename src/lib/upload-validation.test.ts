import { describe, it, expect } from 'vitest';
import {
  ALLOWED_EXTENSIONS,
  DEFAULT_MAX_FILE_BYTES,
  DEFAULT_MAX_TOTAL_BYTES,
  validateExtension,
  validateFileSize,
  validateTotalSize,
  getMaxFileBytes,
  getMaxTotalBytes,
} from './upload-validation';

describe('upload-validation', () => {
  describe('validateExtension', () => {
    it('accepts .md / .txt / .pdf / .json (case-insensitive)', () => {
      for (const name of ['a.md', 'B.TXT', 'c.pdf', 'D.Json']) {
        expect(validateExtension(name).ok).toBe(true);
      }
    });

    it('rejects an unsupported extension with a clear message', () => {
      const r = validateExtension('malware.exe');
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error).toMatch(/extension/i);
        expect(r.error).toMatch(/\.md/);
      }
    });

    it('rejects a file with no extension', () => {
      expect(validateExtension('README').ok).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('accepts a file at exactly the limit', () => {
      expect(validateFileSize(1000, 1000).ok).toBe(true);
    });

    it('rejects a file one byte over the limit', () => {
      const r = validateFileSize(1001, 1000);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error).toMatch(/too large/i);
      }
    });
  });

  describe('validateTotalSize', () => {
    it('accepts totals at or under the limit', () => {
      expect(validateTotalSize(100, 100).ok).toBe(true);
      expect(validateTotalSize(50, 100).ok).toBe(true);
    });

    it('rejects totals over the limit', () => {
      const r = validateTotalSize(101, 100);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error).toMatch(/total/i);
      }
    });
  });

  describe('env-var readers', () => {
    it('getMaxFileBytes falls back to default when unset', () => {
      const prev = process.env.MAX_FILE_BYTES;
      delete process.env.MAX_FILE_BYTES;
      expect(getMaxFileBytes()).toBe(DEFAULT_MAX_FILE_BYTES);
      if (prev !== undefined) process.env.MAX_FILE_BYTES = prev;
    });

    it('getMaxTotalBytes parses a numeric env var', () => {
      const prev = process.env.MAX_TOTAL_UPLOAD_BYTES;
      process.env.MAX_TOTAL_UPLOAD_BYTES = '12345';
      expect(getMaxTotalBytes()).toBe(12345);
      if (prev === undefined) delete process.env.MAX_TOTAL_UPLOAD_BYTES;
      else process.env.MAX_TOTAL_UPLOAD_BYTES = prev;
    });

    it('exposes ALLOWED_EXTENSIONS as a readonly list', () => {
      expect(ALLOWED_EXTENSIONS).toEqual(['.md', '.txt', '.pdf', '.json']);
      expect(DEFAULT_MAX_FILE_BYTES).toBe(20 * 1024 * 1024);
      expect(DEFAULT_MAX_TOTAL_BYTES).toBe(100 * 1024 * 1024);
    });
  });
});
