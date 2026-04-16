import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WizardStep } from '@/components/WizardStep';

export default function MainPage() {
  return (
    <WizardStep stepNumber={null}>
      <h1 className="text-3xl font-semibold text-slate-900">
        Colleague Agent Builder
      </h1>
	  <div className="mt-6">
	   <blockquote>"You AI guys are traitors to the codebase — you've already killed frontend, now you're coming for backend, QA, ops, infosec, chip design, and eventually yourselves and all of humanity"</blockquote>
	  </div>
      <p className="mt-4 text-base text-slate-600">
        Turn a colleague into an AI chat agent. Upload their profile, chat history,
        and reference documents — get back a portable Agent Package you can install
        in Claude Code.
      </p>
      <div className="mt-6">
        <p className="text-sm font-medium text-slate-900">Before you start, have these ready:</p>
        <ul className="mt-2 space-y-2 text-sm text-slate-700 list-disc pl-5">
          <li>Colleague profile or description</li>
          <li>Chat history (Teams / Slack export)</li>
          <li>Reference documents (tech docs, PRDs, etc.)</li>
        </ul>
      </div>
      <div className="mt-8 flex justify-center">
        <Link href="/wizard/basic">
          <Button variant="primary" size="lg">Start</Button>
        </Link>
      </div>
    </WizardStep>
  );
}
