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

/**
 * `LLM_BASE_URL` follows the provider-agnostic convention where the URL
 * includes the `/v1` version prefix (e.g. `https://api.anthropic.com/v1`,
 * `https://api.openai.com/v1`, `https://<azure>/v1`). Keeps config portable
 * across providers.
 *
 * The `@anthropic-ai/sdk` internally appends its own `/v1/messages` path to
 * the `baseURL`, so if we pass a URL that already ends in `/v1` we'd get
 * `/v1/v1/messages` → 404. Strip the trailing `/v1` before handing to the
 * SDK, while leaving the env var as the full provider-style base.
 */
export function normaliseAnthropicBaseURL(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.replace(/\/+$/, '');
  if (trimmed.length === 0) return undefined;
  return trimmed.endsWith('/v1') ? trimmed.slice(0, -'/v1'.length) : trimmed;
}

export async function callClaude(opts: CallClaudeOptions): Promise<string> {
  const apiKey = requireEnv('LLM_API_KEY');
  const model = requireEnv('LLM_MODEL');
  const baseURL = normaliseAnthropicBaseURL(process.env.LLM_BASE_URL);

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
