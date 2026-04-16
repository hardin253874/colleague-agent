import { describe, it, expect } from 'vitest';
import { skillsForRole, SUPPORTED_ROLES, type Role } from './role-skills';

describe('skillsForRole', () => {
  it('returns the PM skills list', () => {
    expect(skillsForRole('PM')).toEqual(['brainstorming', 'writing-plans']);
  });

  it('returns the Developer skills list', () => {
    expect(skillsForRole('Developer')).toEqual([
      'test-driven-development',
      'systematic-debugging',
      'writing-plans',
      'executing-plans',
      'requesting-code-review',
    ]);
  });

  it('returns the Designer skills list', () => {
    expect(skillsForRole('Designer')).toEqual(['brainstorming']);
  });

  it('returns the Evaluator skills list', () => {
    expect(skillsForRole('Evaluator')).toEqual([
      'test-driven-development',
      'systematic-debugging',
      'verification-before-completion',
    ]);
  });

  it('returns the Developer fallback for an unknown role', () => {
    expect(skillsForRole('Unknown' as Role)).toEqual(skillsForRole('Developer'));
  });

  it('exports SUPPORTED_ROLES matching the v1 spec', () => {
    expect(SUPPORTED_ROLES).toEqual(['PM', 'Developer', 'Designer', 'Evaluator']);
  });
});
