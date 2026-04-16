// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---- Mock the SDK BEFORE importing the module under test ----

const createMock = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class {
      baseURL: string | undefined;
      apiKey: string | undefined;
      constructor(opts: { baseURL?: string; apiKey?: string }) {
        this.baseURL = opts.baseURL;
        this.apiKey = opts.apiKey;
      }
      messages = {
        create: (args: unknown) => createMock(args),
      };
    },
  };
});

import { callClaude } from './llm';

let prevBaseUrl: string | undefined;
let prevModel: string | undefined;
let prevKey: string | undefined;

beforeEach(() => {
  prevBaseUrl = process.env.LLM_BASE_URL;
  prevModel = process.env.LLM_MODEL;
  prevKey = process.env.LLM_API_KEY;
  process.env.LLM_BASE_URL = 'https://api.example.test';
  process.env.LLM_MODEL = 'claude-test-model';
  process.env.LLM_API_KEY = 'test-key-xxx';
  createMock.mockReset();
  createMock.mockResolvedValue({
    content: [{ type: 'text', text: 'hello from mock' }],
  });
});

afterEach(() => {
  if (prevBaseUrl === undefined) delete process.env.LLM_BASE_URL;
  else process.env.LLM_BASE_URL = prevBaseUrl;
  if (prevModel === undefined) delete process.env.LLM_MODEL;
  else process.env.LLM_MODEL = prevModel;
  if (prevKey === undefined) delete process.env.LLM_API_KEY;
  else process.env.LLM_API_KEY = prevKey;
});

describe('callClaude', () => {
  it('returns the text of the first text block', async () => {
    const out = await callClaude({
      system: 'you are a test',
      user: 'hi',
      cacheControl: false,
    });
    expect(out).toBe('hello from mock');
  });

  it('passes the model from LLM_MODEL env', async () => {
    await callClaude({ system: 'x', user: 'y', cacheControl: false });
    const args = createMock.mock.calls[0][0] as { model: string };
    expect(args.model).toBe('claude-test-model');
  });

  it('applies cache_control: ephemeral on the system block when cacheControl: true', async () => {
    await callClaude({ system: 'big system prompt', user: 'hi', cacheControl: true });
    const args = createMock.mock.calls[0][0] as {
      system: Array<{ type: string; text: string; cache_control?: { type: string } }>;
    };
    expect(Array.isArray(args.system)).toBe(true);
    expect(args.system[0].type).toBe('text');
    expect(args.system[0].text).toBe('big system prompt');
    expect(args.system[0].cache_control).toEqual({ type: 'ephemeral' });
  });

  it('does NOT set cache_control when cacheControl: false', async () => {
    await callClaude({ system: 's', user: 'u', cacheControl: false });
    const args = createMock.mock.calls[0][0] as {
      system: Array<{ cache_control?: unknown }> | string;
    };
    if (Array.isArray(args.system)) {
      expect(args.system[0].cache_control).toBeUndefined();
    } else {
      // Acceptable fallback: when cacheControl is false, system may be a plain string
      expect(typeof args.system).toBe('string');
    }
  });

  it('passes the user message as a single user message', async () => {
    await callClaude({ system: 's', user: 'hello user', cacheControl: true });
    const args = createMock.mock.calls[0][0] as {
      messages: Array<{ role: string; content: unknown }>;
    };
    expect(args.messages).toHaveLength(1);
    expect(args.messages[0].role).toBe('user');
    // content can be a string or a content-block array — accept either
    const c = args.messages[0].content;
    if (typeof c === 'string') {
      expect(c).toBe('hello user');
    } else {
      expect(Array.isArray(c)).toBe(true);
    }
  });

  it('throws with a clear message when LLM_API_KEY is missing', async () => {
    delete process.env.LLM_API_KEY;
    await expect(
      callClaude({ system: 's', user: 'u', cacheControl: false }),
    ).rejects.toThrow(/LLM_API_KEY/);
  });

  it('throws with a clear message when LLM_MODEL is missing', async () => {
    delete process.env.LLM_MODEL;
    await expect(
      callClaude({ system: 's', user: 'u', cacheControl: false }),
    ).rejects.toThrow(/LLM_MODEL/);
  });

  it('throws a contextual error when the API call rejects', async () => {
    createMock.mockRejectedValueOnce(new Error('429 rate limit'));
    await expect(
      callClaude({ system: 's', user: 'u', cacheControl: false }),
    ).rejects.toThrow(/429 rate limit|LLM call failed/);
  });
});
