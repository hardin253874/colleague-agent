import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { redirect } from 'next/navigation';

import { WizardStep } from '@/components/WizardStep';
import { ReviewForm } from '@/components/ReviewForm';
import { getSlugFromCookie } from '@/lib/session';
import { getDataDir } from '@/lib/storage';
import { saveAndProceed } from './actions';

export const dynamic = 'force-dynamic';

async function loadPersona(slug: string): Promise<string | null> {
  const target = path.join(getDataDir(), slug, 'persona', 'persona.md');
  try {
    return await readFile(target, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

export default async function ReviewPage() {
  const slug = await getSlugFromCookie();
  if (!slug) redirect('/wizard/basic');

  const persona = await loadPersona(slug);

  // If the user navigated directly to /wizard/review without running analyze,
  // there's no persona.md on disk yet. Send them back to Page 3 to run it.
  if (persona === null) redirect('/wizard/knowledge');

  return (
    <WizardStep stepNumber={4} maxWidth="max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">Review analyze result</h1>
      <p className="mt-2 text-sm text-slate-600 mb-4">
        Below is the draft persona the LLM generated from your inputs. Read through it and edit
        anything that&rsquo;s wrong. Your edits will be baked into the agent package when you click{' '}
        <strong>Build Agent</strong>.
      </p>

      <div className="mt-6">
        <ReviewForm initialPersona={persona} action={saveAndProceed} />
      </div>
    </WizardStep>
  );
}
