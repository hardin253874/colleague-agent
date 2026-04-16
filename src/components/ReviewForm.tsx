'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export interface ReviewFormProps {
  /** Draft persona markdown to pre-fill the editable textarea. */
  initialPersona: string;
  /**
   * Placeholder form action — Developer will wire this in a later pass (2c-ii Task 9).
   *
   * Receives the submitted FormData (the `persona` field carries the edited text).
   * For the current Designer pass, Page 4 passes a no-op; the real implementation
   * will POST to `/api/colleagues/[slug]/persona` then redirect to `/wizard/download`.
   */
  action: (formData: FormData) => Promise<void>;
}

/**
 * Page 4 review form — presentational scaffold.
 *
 * Renders an always-editable monospace textarea pre-filled with `initialPersona`,
 * plus a Previous link (to `/wizard/knowledge`) and a Build Agent submit button.
 *
 * TODO(developer): wire the real submit flow. This component currently calls the
 * `action` prop with the form data and leaves navigation / error handling to the
 * caller. Task 9 of sprint-2c-ii will replace this shell with a client component
 * that POSTs `/api/colleagues/[slug]/persona` and calls `router.push('/wizard/download')`.
 */
export function ReviewForm({ initialPersona, action }: ReviewFormProps) {
  const [persona, setPersona] = useState(initialPersona);

  return (
    <form action={action}>
      <label htmlFor="persona-textarea" className="sr-only">
        Persona markdown
      </label>
      <Textarea
        id="persona-textarea"
        name="persona"
        aria-label="Persona markdown"
        value={persona}
        onChange={(e) => setPersona(e.target.value)}
        className="font-mono text-sm min-h-[500px] p-4"
      />

      <div className="flex justify-between pt-8">
        <Link href="/wizard/knowledge">
          <Button variant="secondary" type="button">
            Previous
          </Button>
        </Link>
        <Button variant="primary" type="submit">
          Build Agent
        </Button>
      </div>
    </form>
  );
}
