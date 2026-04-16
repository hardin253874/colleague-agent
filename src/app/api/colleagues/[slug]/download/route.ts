import type { NextRequest } from 'next/server';
import path from 'node:path';
import { stat } from 'node:fs/promises';

import { buildZipBuffer } from '@/lib/zip';
import { getDataDir } from '@/lib/storage';

export const runtime = 'nodejs';

/**
 * GET /api/colleagues/[slug]/download
 *
 * Streams the assembled `{slug}.zip` for the colleague. Returns 404 if the
 * slug is unknown (no meta.json on disk) and 400 if the agent-package has
 * not been built yet (user needs to run Build Agent first).
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await ctx.params;

  const metaPath = path.join(getDataDir(), slug, 'meta.json');
  try {
    await stat(metaPath);
  } catch {
    return Response.json(
      { error: `No colleague found for slug "${slug}"` },
      { status: 404 },
    );
  }

  let buffer: Buffer;
  try {
    buffer = await buildZipBuffer(slug);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Build failed' },
      { status: 400 },
    );
  }

  // Convert Node Buffer to a Uint8Array for the Web Response body.
  const body = new Uint8Array(buffer);

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${slug}.zip"`,
      'Content-Length': String(buffer.byteLength),
    },
  });
}
