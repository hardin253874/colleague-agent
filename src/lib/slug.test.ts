import { describe, it, expect } from 'vitest';
import { generateSlug } from './slug';

describe('generateSlug', () => {
  it('lowercases and kebab-cases a simple name', () => {
    const slug = generateSlug('Oleg Putilin');
    expect(slug).toMatch(/^oleg-putilin-[a-z0-9]{6}$/);
  });

  it('collapses consecutive separators', () => {
    const slug = generateSlug('Oleg   Putilin__Jr');
    expect(slug).toMatch(/^oleg-putilin-jr-[a-z0-9]{6}$/);
  });

  it('strips punctuation and diacritics-ish characters', () => {
    const slug = generateSlug("O'Brien, Jr.");
    expect(slug).toMatch(/^obrien-jr-[a-z0-9]{6}$/);
  });

  it('trims leading and trailing hyphens', () => {
    const slug = generateSlug('--Oleg--');
    expect(slug).toMatch(/^oleg-[a-z0-9]{6}$/);
  });

  it('defaults to "colleague" when the name has no slug-safe characters', () => {
    const slug = generateSlug('!!!');
    expect(slug).toMatch(/^colleague-[a-z0-9]{6}$/);
  });

  it('always produces a different suffix on repeated calls with the same name', () => {
    const a = generateSlug('Oleg');
    const b = generateSlug('Oleg');
    expect(a).not.toBe(b);
  });

  it('produces exactly a 6-char lowercase alphanumeric suffix', () => {
    const slug = generateSlug('Oleg');
    const suffix = slug.split('-').pop()!;
    expect(suffix).toHaveLength(6);
    expect(suffix).toMatch(/^[a-z0-9]{6}$/);
  });
});
