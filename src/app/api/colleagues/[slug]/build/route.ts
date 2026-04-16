import { NextRequest, NextResponse } from 'next/server';
import { runBuild } from '@/lib/build';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * POST /api/colleagues/[slug]/build
 *
 * Triggers the Agent Package build for a colleague slug. Writes the
 * composed package tree under `{DATA_DIR}/{slug}/agent-package/`. Returns
 * the ingest summary on success or the error on failure.
 */
export async function POST(_req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const { slug } = await ctx.params;
  try {
    const result = await runBuild(slug);
    if (!result.ok) {
      return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
