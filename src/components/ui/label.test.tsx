import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label } from './label';

describe('Label', () => {
  it('renders a label with text-sm and font-medium slate-700 classes', () => {
    render(<Label htmlFor="name">Name</Label>);
    const lbl = screen.getByText('Name');
    expect(lbl.tagName).toBe('LABEL');
    expect(lbl.className).toContain('text-sm');
    expect(lbl.className).toContain('font-medium');
    expect(lbl.className).toContain('text-slate-700');
  });
});
