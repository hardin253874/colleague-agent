import path from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { NextResponse } from 'next/server';

import { getDataDir } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

function personaPath(slug: string): string {
  return path.join(getDataDir(), slug, 'persona', 'persona.md');
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { slug } = await context.params;
  try {
    const text = await readFile(personaPath(slug), 'utf8');
    return NextResponse.json({ persona: text });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json(
        { error: `No persona found for ${slug}. Run analysis first.` },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: `Failed to read persona: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  const { slug } = await context.params;

  let body: { persona?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (typeof body.persona !== 'string') {
    return NextResponse.json(
      { error: 'Body must contain a string field "persona".' },
      { status: 400 },
    );
  }

  const target = personaPath(slug);
  try {
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body.persona, 'utf8');
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to save persona: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
