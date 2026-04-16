import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './input';

describe('Input', () => {
  it('renders an input with the rag-chatbot-v3 focus-ring classes', () => {
    render(<Input aria-label="name" />);
    const input = screen.getByLabelText('name');
    expect(input.tagName).toBe('INPUT');
    expect(input.className).toContain('border-slate-300');
    expect(input.className).toContain('focus:ring-indigo-500');
  });
});
