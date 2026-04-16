import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RadioGroup, Radio } from './radio-group';

describe('RadioGroup', () => {
  it('renders a radiogroup container with nested Radio inputs', () => {
    render(
      <RadioGroup aria-label="gender">
        <Radio name="gender" value="M" label="M" />
        <Radio name="gender" value="F" label="F" />
      </RadioGroup>,
    );
    const group = screen.getByRole('radiogroup', { name: 'gender' });
    expect(group).toBeInTheDocument();

    const m = screen.getByLabelText('M') as HTMLInputElement;
    expect(m.type).toBe('radio');
    expect(m.value).toBe('M');
    expect(m.className).toContain('text-indigo-500');
  });
});
