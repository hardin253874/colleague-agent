// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ingestText } from './rag';

const ORIGINAL_FETCH = global.fetch;
const ORIGINAL_URL = process.env.RAG_INGEST_URL;

beforeEach(() => {
  process.env.RAG_INGEST_URL = 'https://rag.test.local/ingest/text';
  vi.useFakeTimers();
});

afterEach(() => {
  global.fetch = ORIGINAL_FETCH;
  process.env.RAG_INGEST_URL = ORIGINAL_URL;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ingestText', () => {
  it('POSTs content + source as JSON to the configured URL and returns ok on 200', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{"ok":true}', { status: 200 }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await ingestText({ content: 'hello', source: 'a.md' });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://rag.test.local/ingest/text');
    expect((init as RequestInit).method).toBe('POST');
    expect((init as RequestInit).headers).toMatchObject({
      'content-type': 'application/json',
    });
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      content: 'hello',
      source: 'a.md',
    });
  });

  it('retries once on a 5xx response and succeeds on the second attempt', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('bad gateway', { status: 502 }))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const promise = ingestText({ content: 'x', source: 's' });
    await vi.advanceTimersByTimeAsync(3_500);
    const result = await promise;

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries once on a network error and returns ok on success', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const promise = ingestText({ content: 'x', source: 's' });
    await vi.advanceTimersByTimeAsync(3_500);
    const result = await promise;

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns ok:false with an error message after two failed attempts', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('server down', { status: 503 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const promise = ingestText({ content: 'x', source: 's' });
    await vi.advanceTimersByTimeAsync(3_500);
    const result = await promise;

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/503/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns ok:false with a 4xx error without retrying', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('bad', { status: 400 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await ingestText({ content: 'x', source: 's' });

    expect(result.ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses the default URL when RAG_INGEST_URL is unset', async () => {
    delete process.env.RAG_INGEST_URL;
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await ingestText({ content: 'x', source: 's' });

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://rag-chatbot-v3-production.up.railway.app/ingest/text',
    );
  });
});
