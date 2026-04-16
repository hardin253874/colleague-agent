import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  message: string;
}

/**
 * Full-page blocking spinner overlay. Per Plan 08 § Loading/spinner screens.
 *
 * Renders a fixed overlay covering the viewport with a centred Loader2 icon
 * and a status line below it. Use inside a client component during long-running
 * network calls (e.g. LLM analysis, agent-build) where the UI must be blocked.
 */
export function Spinner({ message }: SpinnerProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" aria-hidden="true" />
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </div>
  );
}
