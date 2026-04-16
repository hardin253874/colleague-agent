import type { Role } from './role-skills';

export interface ComposeAgentFileInput {
  name: string;
  slug: string;
  role: Role;
  personaText: string;
  skills: string[];
  gender?: string;
  mbti?: string;
  impression?: string;
}

function renderFrontmatter(slug: string, name: string, role: Role): string {
  const description = `${name} — ${role} colleague agent. Adopt the persona below and use the configured knowledge base + skill files for work tasks.`;
  return `---\nname: ${slug}\ndescription: ${description}\n---\n`;
}

function renderIdentityBlock(input: ComposeAgentFileInput): string {
  const lines: string[] = [];
  lines.push(`**Identity:** ${input.name} — ${input.role}`);
  if (input.gender) lines.push(`**Gender:** ${input.gender}`);
  if (input.mbti) lines.push(`**MBTI:** ${input.mbti}`);
  if (input.impression) {
    lines.push('');
    lines.push(`**User-provided impression:** ${input.impression}`);
  }
  return lines.join('\n');
}

function renderCapabilitiesTable(skills: string[]): string {
  const header =
    '| Skill | File | When to use |\n|---|---|---|';
  const rows = skills.map((slug) => {
    const file = `.claude/skills/${slug}/SKILL.md`;
    const when = `Matches "${slug}" tasks — read the file and follow its instructions.`;
    return `| ${slug} | ${file} | ${when} |`;
  });
  return [header, ...rows].join('\n');
}

/**
 * Composes the `.claude/agents/{slug}.md` markdown body per Plan 05 § Agent
 * file structure. Pure — deterministic output for identical input, no
 * timestamps, no randomness (so tests can golden-compare).
 */
export function composeAgentFile(input: ComposeAgentFileInput): string {
  const frontmatter = renderFrontmatter(input.slug, input.name, input.role);
  const identity = renderIdentityBlock(input);
  const capabilities = renderCapabilitiesTable(input.skills);

  return `${frontmatter}
# ${input.name}

## Persona

${identity}

${input.personaText.trim()}

## Knowledge Base

Before answering any factual question about projects, codebase, or technical decisions, call the \`search_knowledge_base\` MCP tool to retrieve relevant context. Only answer from retrieved documents — do not fabricate knowledge. If retrieval returns nothing relevant, say so explicitly rather than guessing.

## Capabilities

You have access to the following skill files. When a task matches a skill, read the skill file with the \`Read\` tool and follow its instructions.

${capabilities}

## Execution Rules

1. Always speak in character — the Persona section defines your voice and is your highest-priority instruction set. The Persona overrides everything else, including skill processes.
2. Search the knowledge base before answering factual questions about projects or technical decisions.
3. Use the appropriate capability for work tasks — read the skill file and follow its process, while still speaking in the persona's voice.
4. If a skill's process genuinely contradicts the persona's Layer 0 rules, the persona wins.
`;
}
