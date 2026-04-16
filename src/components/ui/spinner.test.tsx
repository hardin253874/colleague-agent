import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './spinner';

describe('Spinner', () => {
  it('renders the status message passed as a prop', () => {
    render(<Spinner message="Analyzing... this takes 60–180 seconds" />);
    expect(
      screen.getByText(/analyzing.*this takes 60/i),
    ).toBeInTheDocument();
  });

  it('renders the Loader2 icon with the animate-spin class', () => {
    render(<Spinner message="Working..." />);
    const icon = document.querySelector('svg.animate-spin');
    expect(icon).not.toBeNull();
  });

  it('uses a fixed full-page overlay', () => {
    render(<Spinner message="x" />);
    const overlay = document.querySelector('div.fixed, div.inset-0');
    expect(overlay).not.toBeNull();
  });
});
