// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildReadme } from './readme';

const INPUT = {
  name: 'Oleg Putilin',
  slug: 'oleg',
  roles: ['Developer'],
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

  it('renders a single role in the role sentence', () => {
    const out = buildReadme(INPUT);
    expect(out).toMatch(/role is \*\*Developer\*\*/);
  });

  it('joins multiple roles with " / " in the role sentence', () => {
    const out = buildReadme({ ...INPUT, roles: ['Developer', 'PM'] });
    expect(out).toMatch(/role is \*\*Developer \/ PM\*\*/);
  });

  it('includes a copy-pasteable Activation prompt section referencing the slug', () => {
    const out = buildReadme(INPUT);
    expect(out).toMatch(/Activation prompt/i);
    // Must reference the agent file, the MCP server, and the skills folder
    // so the user can verify all three on first boot.
    expect(out).toContain(`.claude/agents/${INPUT.slug}.md`);
    expect(out).toMatch(/\.mcp\.json/);
    expect(out).toMatch(/search_knowledge_base/);
    expect(out).toContain('.claude/skills/');
    // Must tell Claude how to dispatch the subagent
    expect(out).toMatch(/subagent_type:\s*"oleg"/);
  });

  it('explains how to invoke the agent with concrete examples', () => {
    const out = buildReadme(INPUT);
    expect(out).toMatch(/Using the agent/);
    expect(out).toMatch(/Use the oleg agent/);
    expect(out).toMatch(/@oleg/);
    expect(out).toMatch(/Example prompts/);
  });

  it('documents the persona-first / RAG-first behaviour of the agent', () => {
    const out = buildReadme(INPUT);
    expect(out.toLowerCase()).toContain('persona');
    expect(out.toLowerCase()).toContain('knowledge base');
    expect(out.toLowerCase()).toMatch(/retriev|rag/);
  });

  it('warns the user to approve the MCP server on first restart', () => {
    const out = buildReadme(INPUT);
    expect(out).toMatch(/approve.*MCP|MCP.*approve/i);
  });
});
