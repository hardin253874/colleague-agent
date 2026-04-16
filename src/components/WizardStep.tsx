import type { ReactNode } from 'react';

export interface WizardStepProps {
  stepNumber: number | null;
  children: ReactNode;
  maxWidth?: 'max-w-2xl' | 'max-w-3xl';
}

export function WizardStep({ stepNumber, children, maxWidth = 'max-w-2xl' }: WizardStepProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">
            Colleague Agent Builder
          </div>
          {stepNumber !== null && (
            <div className="text-xs text-slate-500">Step {stepNumber} of 5</div>
          )}
        </div>
      </header>
      <main className={`mx-auto ${maxWidth} px-6 py-12`}>
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
