// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildReadme } from './readme';

const INPUT = {
  name: 'Oleg Putilin',
  slug: 'oleg',
  role: 'Developer',
  skills: [
    'test-driven-development',
    'systematic-debugging',
    'writing-plans',
    'executing-plans',
    'requesting-code-review',
  ],
};

describe('buildReadme', () => {
  it('includes the colleague name in the title', () => {
    const out = buildReadme(INPUT);
    expect(out).toMatch(/# Oleg Putilin/);
  });

  it('references the slug in the agent file path', () => {
    const out = buildReadme(INPUT);
    expect(out).toContain('.claude/agents/oleg.md');
  });

  it('lists every skill path under .claude/skills/', () => {
    const out = buildReadme(INPUT);
    for (const s of INPUT.skills) {
      expect(out).toContain(`.claude/skills/${s}/SKILL.md`);
    }
  });

  it('includes numbered install steps mentioning restarting Claude Code', () => {
    const out = buildReadme(INPUT);
    expect(out).toMatch(/1\.[^\n]*[Uu]nzip/);
    expect(out).toMatch(/[Rr]estart Claude Code/);
  });

  it('mentions OpenClaw / Codex portability note', () => {
    const out = buildReadme(INPUT);
    expect(out.toLowerCase()).toMatch(/openclaw|codex/);
  });
});
