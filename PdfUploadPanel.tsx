import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import {
  AlertCircle,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import type { UploadedPaper } from '../types/chat';

interface PdfUploadPanelProps {
  paper: UploadedPaper | null;
  isUploading: boolean;
  uploadError: string | null;
  onUploadFile: (file: File) => Promise<void>;
  onRemovePaper: () => Promise<void>;
  onDismissError: () => void;
}

const MAX_CLIENT_BYTES = 20 * 1024 * 1024;

export function PdfUploadPanel({
  paper,
  isUploading,
  uploadError,
  onUploadFile,
  onRemovePaper,
  onDismissError,
}: PdfUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayedError = localError || uploadError;

  const validateAndSubmit = async (file: File | undefined) => {
    if (!file) return;
    setLocalError(null);
    onDismissError();

    const lowerName = file.name.toLowerCase();
    const isPdf =
      lowerName.endsWith('.pdf') || file.type === 'application/pdf';

    if (!isPdf) {
      setLocalError('Please choose a PDF file (.pdf). Other file formats are not supported.');
      return;
    }

    if (file.size === 0) {
      setLocalError('The selected PDF file is empty. Please upload a valid research paper.');
      return;
    }

    if (file.size > MAX_CLIENT_BYTES) {
      setLocalError('File exceeds the 20 MB maximum size limit. Please upload a smaller PDF.');
      return;
    }

    await onUploadFile(file);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    await validateAndSubmit(file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    const file = event.dataTransfer.files?.[0];
    await validateAndSubmit(file);
  };

  const triggerFilePicker = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <aside className="w-full lg:w-[340px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col">
      <div className="p-5 sm:p-6 flex flex-col gap-6 flex-1">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload research paper PDF"
        />

        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Research Paper
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Upload a PDF paper to extract its text and start a grounded Q&amp;A session.
          </p>
        </div>

        {!paper ? (
          <div
            role="button"
            tabIndex={0}
            aria-disabled={isUploading}
            onClick={triggerFilePicker}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerFilePicker();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group rounded-xl border border-dashed p-6 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
              isDragging
                ? 'border-blue-600 bg-blue-50/70'
                : 'border-slate-300 bg-slate-50/60 hover:border-blue-500 hover:bg-blue-50/30'
            } ${isUploading ? 'pointer-events-none opacity-75' : ''}`}
          >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-white border border-slate-200 text-blue-700 transition-colors group-hover:border-blue-200">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="h-5 w-5" aria-hidden="true" />
              )}
            </div>

            <p className="mt-4 text-sm font-medium text-slate-900">
              {isUploading ? 'Extracting paper text...' : 'Upload Research Paper PDF'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {isUploading
                ? 'Reading pages and preparing your session'
                : 'Drag and drop a PDF here, or click to browse'}
            </p>
            <p className="mt-3 font-mono text-[11px] text-slate-400 tabular-nums">
              PDF only · Up to 20 MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-blue-700">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500">
                    Uploaded PDF
                  </p>
                  <p
                    className="mt-0.5 text-sm font-semibold text-slate-900 break-words leading-snug"
                    title={paper.filename}
                  >
                    {paper.filename}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-slate-500 tabular-nums">
                    <span>
                      {paper.pageCount} {paper.pageCount === 1 ? 'page' : 'pages'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{paper.wordCount.toLocaleString()} words</span>
                  </div>
                </div>
              </div>

              {paper.truncated && (
                <p className="mt-3 text-xs text-amber-700 leading-relaxed">
                  This document is very long; the first portion was indexed for this session.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={triggerFilePicker}
                disabled={isUploading}
                className="flex-1 inline-flex items-center justify-center gap-2 min-h-[40px] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{isUploading ? 'Processing...' : 'Replace PDF'}</span>
              </button>

              <button
                type="button"
                onClick={onRemovePaper}
                disabled={isUploading}
                className="inline-flex items-center justify-center gap-1.5 min-h-[40px] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-1"
                aria-label="Remove uploaded PDF"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        )}

        {displayedError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-800 flex items-start gap-2.5"
          >
            <AlertCircle
              className="h-4 w-4 shrink-0 text-red-600 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1 leading-relaxed">{displayedError}</div>
          </div>
        )}

        <div className="mt-auto pt-5 border-t border-slate-100 space-y-2.5">
          <h3 className="text-xs font-semibold text-slate-700">
            Strict Paper Grounding
          </h3>
          <ul className="space-y-1.5 text-xs leading-relaxed text-slate-500">
            <li>Answers are derived strictly from the uploaded PDF.</li>
            <li>Page numbers and section references are cited when available.</li>
            <li>
              Topics outside the paper return{' '}
              <span className="text-slate-700 font-medium">
                &ldquo;This is not mentioned in the paper.&rdquo;
              </span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
