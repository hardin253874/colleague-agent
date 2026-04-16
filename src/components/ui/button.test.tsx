import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders a primary variant with indigo background classes', () => {
    render(<Button variant="primary">Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn.className).toContain('bg-indigo-500');
    expect(btn.className).toContain('hover:bg-indigo-600');
    expect(btn.className).toContain('text-white');
  });

  it('renders a secondary variant with white background and slate border', () => {
    render(<Button variant="secondary">Cancel</Button>);
    const btn = screen.getByRole('button', { name: 'Cancel' });
    expect(btn.className).toContain('bg-white');
    expect(btn.className).toContain('border-slate-300');
    expect(btn.className).toContain('text-slate-700');
  });

  it('merges a caller-supplied className alongside variant classes', () => {
    render(<Button variant="primary" className="w-full">Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    expect(btn.className).toContain('w-full');
    expect(btn.className).toContain('bg-indigo-500');
  });
});
