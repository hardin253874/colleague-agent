'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  validateExtension,
  validateFileSize,
  DEFAULT_MAX_FILE_BYTES,
} from '@/lib/upload-validation';

export type Destination = 'source' | 'knowledge';

export interface FileDropzoneProps {
  slug: string;
  destination: Destination;
  multiple: boolean;
  accept: string; // human-readable for the helper line
  initialFiles: string[];
  label?: string;
}

export function FileDropzone({
  slug,
  destination,
  multiple,
  accept,
  initialFiles,
  label,
}: FileDropzoneProps) {
  const [files, setFiles] = useState<string[]>(initialFiles);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(
    async (accepted: File[]) => {
      setError(null);
      if (accepted.length === 0) return;

      // Client-side mirror of server-side validation.
      for (const f of accepted) {
        const extOk = validateExtension(f.name);
        if (!extOk.ok) {
          setError(extOk.error);
          return;
        }
        const sizeOk = validateFileSize(f.size, DEFAULT_MAX_FILE_BYTES);
        if (!sizeOk.ok) {
          setError(sizeOk.error);
          return;
        }
      }

      const fd = new FormData();
      for (const f of accepted) fd.append('files', f);
      fd.append('destination', destination);

      setUploading(true);
      try {
        const res = await fetch(`/api/colleagues/${slug}/upload`, {
          method: 'POST',
          body: fd,
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({ error: `Upload failed (${res.status}).` }))) as {
            error?: string;
          };
          setError(body.error ?? `Upload failed (${res.status}).`);
          return;
        }
        const body = (await res.json()) as { files: Array<{ name: string }> };
        setFiles((prev) => {
          const next = multiple ? [...prev] : [];
          for (const entry of body.files) {
            if (!next.includes(entry.name)) next.push(entry.name);
          }
          return next;
        });
      } catch (err) {
        setError((err as Error).message ?? 'Network error.');
      } finally {
        setUploading(false);
      }
    },
    [slug, destination, multiple],
  );

  const remove = useCallback(
    async (filename: string) => {
      setError(null);
      try {
        const res = await fetch(`/api/colleagues/${slug}/upload`, {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ filename, destination }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setError(body.error ?? `Remove failed (${res.status}).`);
          return;
        }
        setFiles((prev) => prev.filter((f) => f !== filename));
      } catch (err) {
        setError((err as Error).message ?? 'Network error.');
      }
    },
    [slug, destination],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: upload,
    multiple,
  });

  return (
    <div>
      {label && <div className="text-sm font-medium text-slate-700 mb-2">{label}</div>}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed border-slate-300 rounded-lg p-8 text-center bg-white',
          'hover:border-slate-400 transition-colors cursor-pointer',
          isDragActive && 'border-indigo-500 bg-indigo-50',
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-slate-400" />
          )}
          <div className="text-sm text-slate-700">
            {uploading ? 'Uploading...' : 'Drag and drop files, or click to browse'}
          </div>
          <div className="text-xs text-slate-500">Accepted: {accept}</div>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((filename) => (
            <li
              key={filename}
              className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-md text-sm"
            >
              <span className="font-mono text-xs text-slate-700">{filename}</span>
              <button
                type="button"
                aria-label={`Remove ${filename}`}
                className="text-slate-400 hover:text-slate-700"
                onClick={() => remove(filename)}
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
