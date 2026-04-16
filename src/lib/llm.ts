import Anthropic from '@anthropic-ai/sdk';

export interface CallClaudeOptions {
  /** The system prompt text. Loaded by the caller from prompts/*.md. */
  system: string;
  /** The user message text (the data payload — corpus, analyzer JSON, etc). */
  user: string;
  /** When true, marks the system block with cache_control: ephemeral. */
  cacheControl: boolean;
  /** Optional max_tokens override. Defaults to 8192. */
  maxTokens?: number;
}

function requireEnv(name: string): string {
  const raw = process.env[name];
  if (!raw || raw.trim().length === 0) {
    throw new Error(`Missing required env var ${name}.`);
  }
  return raw;
}

export async function callClaude(opts: CallClaudeOptions): Promise<string> {
  const apiKey = requireEnv('LLM_API_KEY');
  const model = requireEnv('LLM_MODEL');
  const baseURL = process.env.LLM_BASE_URL; // optional

  const client = new Anthropic({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });

  const systemPayload = opts.cacheControl
    ? [
        {
          type: 'text' as const,
          text: opts.system,
          cache_control: { type: 'ephemeral' as const },
        },
      ]
    : opts.system;

  let response;
  try {
    response = await client.messages.create({
      model,
      max_tokens: opts.maxTokens ?? 8192,
      system: systemPayload,
      messages: [
        {
          role: 'user',
          content: opts.user,
        },
      ],
    });
  } catch (err) {
    throw new Error(`LLM call failed: ${(err as Error).message}`);
  }

  const block = (response.content ?? []).find(
    (b: { type: string }) => b.type === 'text',
  ) as { type: 'text'; text: string } | undefined;
  if (!block) {
    throw new Error('LLM response contained no text block.');
  }
  return block.text;
}
