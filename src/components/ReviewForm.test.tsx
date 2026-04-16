import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewForm } from './ReviewForm';

describe('ReviewForm', () => {
  it('renders the initial persona inside an editable textarea', () => {
    const noop = vi.fn(async () => {});
    render(<ReviewForm initialPersona="# Alice — Persona\n\nHi." action={noop} />);
    const ta = screen.getByRole('textbox', { name: /persona/i }) as HTMLTextAreaElement;
    expect(ta.value).toContain('# Alice — Persona');
    expect(ta.readOnly).toBe(false);
  });

  it('shows Previous (link to /wizard/knowledge) and Build Agent buttons', () => {
    const noop = vi.fn(async () => {});
    render(<ReviewForm initialPersona="x" action={noop} />);

    const previousLink = screen.getByRole('link', { name: /previous/i });
    expect(previousLink).toHaveAttribute('href', '/wizard/knowledge');

    expect(screen.getByRole('button', { name: /build agent/i })).toBeInTheDocument();
  });
});
