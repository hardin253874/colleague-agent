import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FileDropzone } from './file-dropzone';

describe('FileDropzone', () => {
  it('renders the empty-state helper text and accepted formats', () => {
    render(
      <FileDropzone
        slug="x-abc123"
        destination="source"
        multiple={false}
        accept=".md, .txt, .pdf, .json"
        initialFiles={[]}
      />,
    );
    expect(screen.getByText(/drag.*drop|drop.*files|click to browse/i)).toBeInTheDocument();
    expect(screen.getByText(/\.md/)).toBeInTheDocument();
  });

  it('renders pre-existing files from initialFiles', () => {
    render(
      <FileDropzone
        slug="x-abc123"
        destination="knowledge"
        multiple
        accept=".md, .txt, .pdf, .json"
        initialFiles={['doc1.md', 'doc2.pdf']}
      />,
    );
    expect(screen.getByText('doc1.md')).toBeInTheDocument();
    expect(screen.getByText('doc2.pdf')).toBeInTheDocument();
  });
});
