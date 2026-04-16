export type Role = 'PM' | 'Developer' | 'Designer' | 'Evaluator';

export const SUPPORTED_ROLES: Role[] = ['PM', 'Developer', 'Designer', 'Evaluator'];

const TABLE: Record<Role, string[]> = {
  PM: ['brainstorming', 'writing-plans'],
  Developer: [
    'test-driven-development',
    'systematic-debugging',
    'writing-plans',
    'executing-plans',
    'requesting-code-review',
  ],
  Designer: ['brainstorming'],
  Evaluator: [
    'test-driven-development',
    'systematic-debugging',
    'verification-before-completion',
  ],
};

/**
 * Role → skill-slug list, per Plan 05 § Role → skills table (narrowed to v1
 * roles). Unknown roles fall back to the Developer list — a conservative
 * default so generated agents always ship a usable skill set.
 */
export function skillsForRole(role: Role): string[] {
  return [...(TABLE[role] ?? TABLE.Developer)];
}
