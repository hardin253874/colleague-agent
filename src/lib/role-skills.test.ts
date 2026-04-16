import { describe, it, expect } from 'vitest';
import { skillsForRole, skillsForRoles, SUPPORTED_ROLES, type Role } from './role-skills';

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

describe('skillsForRoles', () => {
  it('returns the single-role list when given one role', () => {
    expect(skillsForRoles(['Designer'])).toEqual(['brainstorming']);
  });

  it('returns the union (deduped) across multiple roles', () => {
    // PM: ['brainstorming', 'writing-plans']
    // Developer: ['test-driven-development','systematic-debugging','writing-plans','executing-plans','requesting-code-review']
    // Union, first-seen insertion order preserved:
    expect(skillsForRoles(['PM', 'Developer'])).toEqual([
      'brainstorming',
      'writing-plans',
      'test-driven-development',
      'systematic-debugging',
      'executing-plans',
      'requesting-code-review',
    ]);
  });

  it('preserves role order — swapping input order swaps output order', () => {
    expect(skillsForRoles(['Developer', 'PM'])).toEqual([
      'test-driven-development',
      'systematic-debugging',
      'writing-plans',
      'executing-plans',
      'requesting-code-review',
      'brainstorming',
    ]);
  });

  it('deduplicates when two roles share a skill', () => {
    // Evaluator and Developer both contain test-driven-development + systematic-debugging
    const out = skillsForRoles(['Evaluator', 'Developer']);
    const tdd = out.filter((s) => s === 'test-driven-development');
    const sd = out.filter((s) => s === 'systematic-debugging');
    expect(tdd).toHaveLength(1);
    expect(sd).toHaveLength(1);
  });

  it('falls back to Developer skills when roles array is empty (defensive)', () => {
    expect(skillsForRoles([])).toEqual(skillsForRole('Developer'));
  });

  it('ignores unknown roles while still returning known-role skills', () => {
    // Unknown role contributes nothing; PM still contributes its skills.
    expect(skillsForRoles(['PM', 'Ghost' as Role])).toEqual(['brainstorming', 'writing-plans']);
  });
});
