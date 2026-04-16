const DEFAULT_URL =
  'https://rag-chatbot-v3-production.up.railway.app/ingest/text';
const PER_ATTEMPT_TIMEOUT_MS = 45_000;
const RETRY_DELAY_MS = 3_000;

export interface IngestInput {
  content: string;
  source: string;
}

export type IngestResult = { ok: true } | { ok: false; error: string };

function getUrl(): string {
  return process.env.RAG_INGEST_URL?.trim() || DEFAULT_URL;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attempt(body: IngestInput): Promise<IngestResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PER_ATTEMPT_TIMEOUT_MS);
  try {
    const res = await fetch(getUrl(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (res.ok) return { ok: true };
    const text = await res.text().catch(() => '');
    return {
      ok: false,
      error: `RAG ingest returned ${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`,
    };
  } catch (err) {
    return { ok: false, error: `RAG ingest network error: ${(err as Error).message}` };
  } finally {
    clearTimeout(timer);
  }
}

function isRetryable(result: IngestResult): boolean {
  if (result.ok) return false;
  if (/network error/.test(result.error)) return true;
  const match = result.error.match(/returned (\d{3})/);
  if (!match) return false;
  const code = Number(match[1]);
  return code >= 500 && code < 600;
}

/**
 * POSTs `{content, source}` JSON to the RAG `/ingest/text` endpoint.
 *
 * Retries once after a short delay on network errors or 5xx responses to
 * absorb Railway cold-starts. 4xx errors return immediately. Per-attempt
 * timeout guards against hangs.
 */
export async function ingestText(input: IngestInput): Promise<IngestResult> {
  const first = await attempt(input);
  if (first.ok || !isRetryable(first)) return first;
  await sleep(RETRY_DELAY_MS);
  return attempt(input);
}
