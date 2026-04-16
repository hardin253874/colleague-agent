export const runtime = 'nodejs';

/**
 * GET /api/health
 *
 * Lightweight liveness endpoint for Fly.io machine status checks.
 * Returns a stable `{ status: "ok" }` JSON payload with HTTP 200.
 */
export function GET(): Response {
  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
