import { describe, it, expect } from 'vitest';
import { composeAgentFile } from './agent-file';

const BASE = {
  name: 'Oleg Putilin',
  slug: 'oleg',
  roles: ['Developer'] as ('Developer' | 'PM' | 'Designer' | 'Evaluator')[],
  personaText: 'Oleg is a senior developer who opens messages by name.',
  skills: ['test-driven-development', 'systematic-debugging'],
};

describe('composeAgentFile', () => {
  it('emits YAML frontmatter with name and description', () => {
    const out = composeAgentFile(BASE);
    expect(out).toMatch(/^---\nname: oleg\ndescription: .*\n---\n/);
  });

  it('includes the persona text verbatim under ## Persona', () => {
    const out = composeAgentFile(BASE);
    expect(out).toContain('## Persona');
    expect(out).toContain('Oleg is a senior developer who opens messages by name.');
  });

  it('includes a Knowledge Base section referencing the search_knowledge_base tool', () => {
    const out = composeAgentFile(BASE);
    expect(out).toContain('## Knowledge Base');
    expect(out).toContain('search_knowledge_base');
  });

  it('renders a Capabilities table with one row per skill', () => {
    const out = composeAgentFile(BASE);
    expect(out).toContain('## Capabilities');
    expect(out).toContain('.claude/skills/test-driven-development/SKILL.md');
    expect(out).toContain('.claude/skills/systematic-debugging/SKILL.md');
  });

  it('includes an Execution Rules section with persona-overrides-all language', () => {
    const out = composeAgentFile(BASE);
    expect(out).toContain('## Execution Rules');
    expect(out).toMatch(/Persona.*overrides/i);
  });

  it('renders optional MBTI / gender / impression metadata when provided', () => {
    const out = composeAgentFile({
      ...BASE,
      gender: 'M',
      mbti: 'INTJ',
      impression: 'Blunt, data-driven.',
    });
    expect(out).toContain('INTJ');
    expect(out).toContain('Blunt, data-driven.');
  });

  it('omits optional metadata lines when absent', () => {
    const out = composeAgentFile(BASE);
    expect(out).not.toMatch(/MBTI:/);
    expect(out).not.toMatch(/Gender:/);
  });

  it('emits a stable output for the same input (no timestamps, no randomness)', () => {
    expect(composeAgentFile(BASE)).toBe(composeAgentFile(BASE));
  });

  it('renders multiple roles joined with " / " in the frontmatter description', () => {
    const out = composeAgentFile({ ...BASE, roles: ['Developer', 'PM'] });
    expect(out).toMatch(/description: .*Developer \/ PM/);
  });

  it('renders multiple roles joined with " / " in the Identity line', () => {
    const out = composeAgentFile({ ...BASE, roles: ['Developer', 'PM'] });
    expect(out).toContain('**Identity:** Oleg Putilin — Developer / PM');
  });
});
