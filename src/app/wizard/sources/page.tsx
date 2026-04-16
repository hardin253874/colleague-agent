import { redirect } from 'next/navigation';
import Link from 'next/link';

import { WizardStep } from '@/components/WizardStep';
import { Button } from '@/components/ui/button';
import { FileDropzone } from '@/components/ui/file-dropzone';
import { getSlugFromCookie } from '@/lib/session';
import { readMeta } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export default async function SourcesPage() {
  const slug = await getSlugFromCookie();
  if (!slug) redirect('/wizard/basic');

  let sourceFiles: string[] = [];
  try {
    const meta = await readMeta(slug);
    sourceFiles = Array.isArray(meta.sourceFiles) ? meta.sourceFiles : [];
  } catch {
    // meta.json missing or unreadable — start with an empty list
  }

  // First file = "profile" (single). Remaining = "chat history" (multi).
  // For v1 simplicity, both dropzones share the same `source` destination and
  // the split is presentational only — see Plan 07 § Page 2.
  const profileFile = sourceFiles[0];
  const chatFiles = sourceFiles.slice(1);

  return (
    <WizardStep stepNumber={2}>
      <h1 className="text-2xl font-semibold text-slate-900">Profile and chat history</h1>
      <p className="mt-2 text-sm text-slate-600">
        Upload a profile document (optional) and any exported chat-history files. These feed the
        persona analysis. All fields are optional.
      </p>

      <div className="mt-6 space-y-8">
        <section>
          <h2 className="text-lg font-medium text-slate-900 mb-2">Profile (optional, single file)</h2>
          <FileDropzone
            slug={slug}
            destination="source"
            multiple={false}
            accept=".md, .txt, .pdf, .json"
            initialFiles={profileFile ? [profileFile] : []}
          />
        </section>

        <section className="border-t border-slate-200 pt-6">
          <h2 className="text-lg font-medium text-slate-900 mb-2">Chat history (multiple files)</h2>
          <FileDropzone
            slug={slug}
            destination="source"
            multiple
            accept=".md, .txt, .pdf, .json"
            initialFiles={chatFiles}
          />
        </section>
      </div>

      <div className="flex justify-between pt-8">
        <Link href="/wizard/basic">
          <Button variant="secondary">Previous</Button>
        </Link>
        <Link href="/wizard/knowledge">
          <Button variant="primary">Next Page</Button>
        </Link>
      </div>
    </WizardStep>
  );
}
