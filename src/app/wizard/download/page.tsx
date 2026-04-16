import path from 'node:path';
import { readFile } from 'node:fs/promises';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, Download as DownloadIcon, AlertTriangle } from 'lucide-react';

import { WizardStep } from '@/components/WizardStep';
import { Button } from '@/components/ui/button';
import { getSlugFromCookie } from '@/lib/session';
import { getDataDir } from '@/lib/storage';
import { buildReadme } from '@/lib/readme';

export const dynamic = 'force-dynamic';

type PackageMeta = {
  name: string;
  slug: string;
  role: string;
  skills: string[];
  createdAt?: string;
};

type BuildSummary = {
  ingested: string[];
  failed: Array<{ file: string; error: string }>;
};

async function loadPackageMeta(slug: string): Promise<PackageMeta | null> {
  const target = path.join(getDataDir(), slug, 'agent-package', 'meta.json');
  try {
    const raw = await readFile(target, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PackageMeta>;
    if (
      typeof parsed.name === 'string' &&
      typeof parsed.slug === 'string' &&
      typeof parsed.role === 'string' &&
      Array.isArray(parsed.skills) &&
      parsed.skills.every((s) => typeof s === 'string')
    ) {
      return {
        name: parsed.name,
        slug: parsed.slug,
        role: parsed.role,
        skills: parsed.skills,
        createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function loadBuildSummary(slug: string): Promise<BuildSummary | null> {
  // Missing file → treat as "build not run"; the page still renders, the
  // download anchor just yields a clean 400 if clicked. Never crashes the page.
  const target = path.join(getDataDir(), slug, 'build-result.json');
  try {
    const raw = await readFile(target, 'utf8');
    const parsed = JSON.parse(raw) as Partial<BuildSummary>;
    if (Array.isArray(parsed.ingested) && Array.isArray(parsed.failed)) {
      return {
        ingested: parsed.ingested.filter((f): f is string => typeof f === 'string'),
        failed: parsed.failed.filter(
          (f): f is { file: string; error: string } =>
            typeof f === 'object' &&
            f !== null &&
            typeof (f as { file: unknown }).file === 'string' &&
            typeof (f as { error: unknown }).error === 'string',
        ),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default async function DownloadPage() {
  const slug = await getSlugFromCookie();
  if (!slug) redirect('/wizard/basic');

  const meta = await loadPackageMeta(slug);
  // If the package hasn't been built (or meta is malformed), send the user
  // back to Review so they can run Build Agent again.
  if (!meta) redirect('/wizard/review');

  const summary = await loadBuildSummary(slug);
  const readme = buildReadme({
    name: meta.name,
    slug: meta.slug,
    role: meta.role,
    skills: meta.skills,
  });

  const downloadHref = `/api/colleagues/${encodeURIComponent(slug)}/download`;
  const hasFailures = summary !== null && summary.failed.length > 0;
  const ingestedCount = summary?.ingested.length ?? 0;
  const failedCount = summary?.failed.length ?? 0;

  return (
    <WizardStep stepNumber={5} maxWidth="max-w-3xl">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" aria-hidden="true" />
        <h1 className="text-2xl font-semibold text-slate-900">
          Your agent package is ready
        </h1>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Download <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">{slug}.zip</code> and
        unzip it into the root of your Claude Code project.
      </p>

      {summary !== null && (
        <div
          className={
            hasFailures
              ? 'mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900'
              : 'mt-6 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700'
          }
        >
          {hasFailures ? (
            <div className="flex items-start gap-2">
              <AlertTriangle
                className="h-5 w-5 flex-none text-amber-500"
                aria-hidden="true"
              />
              <div>
                <div className="font-medium">
                  Ingested {ingestedCount} knowledge file{ingestedCount === 1 ? '' : 's'};{' '}
                  {failedCount} failed to ingest.
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {summary.failed.map((f) => (
                    <li key={f.file}>
                      <span className="font-mono">{f.file}</span>
                      <span className="text-amber-800/80"> — {f.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div>
              Ingested {ingestedCount} knowledge file{ingestedCount === 1 ? '' : 's'} into the
              RAG knowledge base.
            </div>
          )}
        </div>
      )}

      {/*
        v1: raw markdown rendered as pre-formatted text. Rich markdown rendering
        is a v1.x polish item — the README content is also shipped verbatim in
        the zip, so users always have the canonical copy.
      */}
      <div className="mt-8 prose prose-sm max-w-none">
        <pre className="whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 p-4 font-sans text-sm text-slate-800">
          {readme}
        </pre>
      </div>

      <div className="mt-8 flex justify-between pt-6">
        <Link href="/wizard/review" className="no-underline">
          <Button variant="secondary">Previous</Button>
        </Link>
        <a
          href={downloadHref}
          download={`${slug}.zip`}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-500 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors duration-150 hover:bg-indigo-600 active:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <DownloadIcon className="h-4 w-4" aria-hidden="true" />
          Download {slug}.zip
        </a>
      </div>
    </WizardStep>
  );
}
