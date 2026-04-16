import { redirect } from 'next/navigation';
import Link from 'next/link';

import { WizardStep } from '@/components/WizardStep';
import { Button } from '@/components/ui/button';
import { FileDropzone } from '@/components/ui/file-dropzone';
import { StartAnalyzeButton } from '@/components/start-analyze-button';
import { getSlugFromCookie } from '@/lib/session';
import { readMeta } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export default async function KnowledgePage() {
  const slug = await getSlugFromCookie();
  if (!slug) redirect('/wizard/basic');

  let knowledgeFiles: string[] = [];
  try {
    const meta = await readMeta(slug);
    knowledgeFiles = Array.isArray(meta.knowledgeFiles) ? meta.knowledgeFiles : [];
  } catch {
    // meta.json missing — empty list
  }

  return (
    <WizardStep stepNumber={3}>
      <h1 className="text-2xl font-semibold text-slate-900">Knowledge base files</h1>
      <p className="mt-2 text-sm text-slate-600">
        Upload tech docs, PRDs, codebase notes, or other reference material the agent should be
        able to cite. All files are optional.
      </p>

      <div className="mt-6">
        <FileDropzone
          slug={slug}
          destination="knowledge"
          multiple
          accept=".md, .txt, .pdf, .json"
          initialFiles={knowledgeFiles}
        />
      </div>

      <div className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
        <p className="font-medium">When you click &ldquo;Start Analyze&rdquo;, the system will:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Ingest knowledge files into the RAG index</li>
          <li>Run the persona analysis on Pages 1 + 2 inputs</li>
          <li>Produce a persona draft you can review and edit</li>
        </ul>
      </div>

      <div className="flex justify-between pt-8">
        <Link href="/wizard/sources">
          <Button variant="secondary">Previous</Button>
        </Link>
        <StartAnalyzeButton slug={slug} />
      </div>
    </WizardStep>
  );
}
