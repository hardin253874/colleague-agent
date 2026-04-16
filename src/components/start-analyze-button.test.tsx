import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StartAnalyzeButton } from './start-analyze-button';

// Mock next/navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

beforeEach(() => {
  pushMock.mockReset();
});

describe('StartAnalyzeButton', () => {
  it('renders the primary button label', () => {
    render(<StartAnalyzeButton slug="alice-1" />);
    expect(screen.getByRole('button', { name: /start analyze/i })).toBeInTheDocument();
  });

  it('shows the spinner while the analyze call is in flight', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StartAnalyzeButton slug="alice-1" />);
    fireEvent.click(screen.getByRole('button', { name: /start analyze/i }));
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/wizard/review'));
    vi.unstubAllGlobals();
  });

  it('renders the error panel with Retry when the analyze call fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'LLM exploded' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<StartAnalyzeButton slug="alice-1" />);
    fireEvent.click(screen.getByRole('button', { name: /start analyze/i }));
    await waitFor(() => {
      expect(screen.getByText(/analysis failed/i)).toBeInTheDocument();
      expect(screen.getByText(/LLM exploded/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
    vi.unstubAllGlobals();
  });
});
