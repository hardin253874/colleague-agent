import path from 'node:path';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { NextResponse } from 'next/server';

import {
  ensureColleagueDir,
  appendFileToMeta,
  removeFileFromMeta,
  type UploadDestination,
} from '@/lib/storage';
import {
  validateExtension,
  validateFileSize,
  validateTotalSize,
  getMaxFileBytes,
  getMaxTotalBytes,
} from '@/lib/upload-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_DESTINATIONS: UploadDestination[] = ['source', 'knowledge'];

function isValidDestination(v: string): v is UploadDestination {
  return (VALID_DESTINATIONS as string[]).includes(v);
}

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  const { slug } = await context.params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart body.' }, { status: 400 });
  }

  const destinationRaw = String(form.get('destination') ?? '');
  if (!isValidDestination(destinationRaw)) {
    return NextResponse.json(
      { error: `Invalid destination "${destinationRaw}". Must be "source" or "knowledge".` },
      { status: 400 },
    );
  }
  const destination: UploadDestination = destinationRaw;

  const files = form.getAll('files').filter((v): v is File => v instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided.' }, { status: 400 });
  }

  const maxFile = getMaxFileBytes();
  const maxTotal = getMaxTotalBytes();

  // Per-file extension + size checks.
  for (const file of files) {
    const extCheck = validateExtension(file.name);
    if (!extCheck.ok) {
      return NextResponse.json({ error: extCheck.error }, { status: 400 });
    }
    const sizeCheck = validateFileSize(file.size, maxFile);
    if (!sizeCheck.ok) {
      return NextResponse.json({ error: sizeCheck.error }, { status: 400 });
    }
  }

  // Total-request size check.
  const total = files.reduce((acc, f) => acc + f.size, 0);
  const totalCheck = validateTotalSize(total, maxTotal);
  if (!totalCheck.ok) {
    return NextResponse.json({ error: totalCheck.error }, { status: 413 });
  }

  // Ensure the destination directory exists.
  const colleagueDir = await ensureColleagueDir(slug);
  const destDir = path.join(colleagueDir, destination);
  await mkdir(destDir, { recursive: true });

  const written: Array<{ name: string; size: number; destination: UploadDestination }> = [];

  for (const file of files) {
    const safeName = path.basename(file.name); // strip any path components defensively
    const target = path.join(destDir, safeName);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(target, buf);
    await appendFileToMeta(slug, destination, safeName);
    written.push({ name: safeName, size: file.size, destination });
  }

  return NextResponse.json({ ok: true, files: written });
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  const { slug } = await context.params;

  let body: { filename?: string; destination?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const filename = typeof body.filename === 'string' ? body.filename.trim() : '';
  const destinationRaw = typeof body.destination === 'string' ? body.destination : '';

  if (filename.length === 0) {
    return NextResponse.json({ error: 'filename is required.' }, { status: 400 });
  }
  if (!isValidDestination(destinationRaw)) {
    return NextResponse.json(
      { error: `Invalid destination "${destinationRaw}".` },
      { status: 400 },
    );
  }

  const safeName = path.basename(filename);
  const colleagueDir = await ensureColleagueDir(slug);
  const target = path.join(colleagueDir, destinationRaw, safeName);

  try {
    await unlink(target);
  } catch (err) {
    // If the file is already missing, we still want meta to be consistent — continue.
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }
  await removeFileFromMeta(slug, destinationRaw, safeName);

  return NextResponse.json({ ok: true });
}
