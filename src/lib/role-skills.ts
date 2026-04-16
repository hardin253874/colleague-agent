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

/**
 * Multi-role skill resolution: returns the deduped UNION of skills across the
 * supplied roles, preserving first-seen insertion order (roles in caller
 * order; within each role, the table's listed order).
 *
 * Unknown role values are silently ignored (they contribute nothing).
 *
 * If `roles` is empty (shouldn't happen because UI validation requires ≥ 1),
 * falls back to the Developer skill list — matches `skillsForRole`'s defensive
 * behaviour so generated agents always ship a non-empty skill set.
 */
export function skillsForRoles(roles: Role[]): string[] {
  if (roles.length === 0) return skillsForRole('Developer');
  const seen = new Set<string>();
  const out: string[] = [];
  for (const role of roles) {
    const list = TABLE[role];
    if (!list) continue;
    for (const skill of list) {
      if (seen.has(skill)) continue;
      seen.add(skill);
      out.push(skill);
    }
  }
  // If the input was a non-empty list of unknown roles, fall back.
  if (out.length === 0) return skillsForRole('Developer');
  return out;
}
