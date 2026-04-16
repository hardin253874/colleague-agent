import { randomBytes } from 'node:crypto';

const SUFFIX_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomSuffix(length = 6): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += SUFFIX_ALPHABET[bytes[i] % SUFFIX_ALPHABET.length];
  }
  return out;
}

function kebabCase(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return cleaned.length > 0 ? cleaned : 'colleague';
}

export function generateSlug(name: string): string {
  return `${kebabCase(name)}-${randomSuffix(6)}`;
}
