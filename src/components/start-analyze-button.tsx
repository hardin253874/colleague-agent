'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export interface StartAnalyzeButtonProps {
  slug: string;
}

/**
 * Client-side Start Analyze trigger for Page 3 of the wizard.
 *
 * Fires a POST to `/api/colleagues/{slug}/analyze`, blocks the UI with a
 * full-page <Spinner /> for the 30–90s LLM round-trip, then either navigates
 * to `/wizard/review` on success or renders an inline red error panel with a
 * Retry button that re-fires the POST.
 *
 * Error messages come from the response body's `error` field per Plan 06 §
 * Error handling — no generic "analysis failed" fallback except as a last
 * resort when the body can't be parsed.
 */
export function StartAnalyzeButton({ slug }: StartAnalyzeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/colleagues/${slug}/analyze`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `Analysis failed (${res.status}).`);
        setLoading(false);
        return;
      }
      // Success — navigate to review page. Keep spinner visible until navigation.
      router.push('/wizard/review');
    } catch (err) {
      setError((err as Error).message ?? 'Network error.');
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Spinner message="Analyzing... this takes 30–90 seconds" />}
      {error && (
        <div
          className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-medium">Analysis failed</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={run}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
      <Button variant="primary" onClick={run} disabled={loading}>
        Start Analyze
      </Button>
    </>
  );
}
