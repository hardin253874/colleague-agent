import { NextResponse } from 'next/server';
import { readMeta } from '@/lib/storage';
import { runAnalyze } from '@/lib/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes — LLM calls can run long

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(_request: Request, context: RouteContext): Promise<Response> {
  const { slug } = await context.params;

  // Validate meta.json exists and source files are present.
  try {
    const meta = await readMeta(slug);
    const count = Array.isArray(meta.sourceFiles) ? meta.sourceFiles.length : 0;
    if (count === 0) {
      return NextResponse.json(
        { error: `Cannot analyze: no source files uploaded for ${slug}. Upload a profile or chat history on Page 2 first.` },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: `Colleague slug "${slug}" not found. Start the wizard from Page 1.` },
      { status: 400 },
    );
  }

  try {
    const result = await runAnalyze(slug);
    return NextResponse.json({
      ok: true,
      projectList: result.projectList,
    });
  } catch (err) {
    const message = (err as Error).message ?? 'Unknown error';
    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 },
    );
  }
}
