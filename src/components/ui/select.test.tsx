import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Select } from './select';

describe('Select', () => {
  it('renders a native select with the focus-ring classes', () => {
    render(
      <Select aria-label="role">
        <option value="PM">PM</option>
        <option value="Developer">Developer</option>
      </Select>,
    );
    const sel = screen.getByLabelText('role');
    expect(sel.tagName).toBe('SELECT');
    expect(sel.className).toContain('border-slate-300');
    expect(sel.className).toContain('focus:ring-indigo-500');
  });
});
