import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders a textarea with the same focus-ring classes as Input', () => {
    render(<Textarea aria-label="impression" />);
    const ta = screen.getByLabelText('impression');
    expect(ta.tagName).toBe('TEXTAREA');
    expect(ta.className).toContain('border-slate-300');
    expect(ta.className).toContain('focus:ring-indigo-500');
  });
});
