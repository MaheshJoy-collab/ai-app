import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ChatPanel } from './components/ChatPanel';
import { PdfUploadPanel } from './components/PdfUploadPanel';
import type { ChatMessage, UploadedPaper } from './types/chat';

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function createMessageId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function App() {
  const [paper, setPaper] = useState<UploadedPaper | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  const handleUploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setChatError(null);

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      if (paper?.sessionId) {
        formData.append('previousSessionId', paper.sessionId);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof payload.error === 'string'
            ? payload.error
            : 'Failed to process the uploaded PDF file.',
        );
      }

      setPaper({
        sessionId: payload.sessionId,
        filename: payload.filename,
        pageCount: payload.pageCount,
        wordCount: payload.wordCount,
        truncated: Boolean(payload.truncated),
      });
      setMessages([]);
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Unable to upload the PDF. Please try again.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePaper = async () => {
    const activeSessionId = paper?.sessionId;
    setPaper(null);
    setMessages([]);
    setUploadError(null);
    setChatError(null);

    if (activeSessionId) {
      try {
        await fetch(`/api/session/${encodeURIComponent(activeSessionId)}`, {
          method: 'DELETE',
        });
      } catch {
        // Ignore network errors during background cleanup
      }
    }
  };

  const handleSendMessage = async (question: string) => {
    if (!paper) return;

    setChatError(null);
    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: question,
      timestamp: formatTimestamp(new Date()),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: paper.sessionId,
          question,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 404) {
          setPaper(null);
        }
        throw new Error(
          typeof payload.error === 'string'
            ? payload.error
            : 'Unable to get an answer from the AI service.',
        );
      }

      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: 'assistant',
        content: String(payload.answer ?? ''),
        timestamp: formatTimestamp(new Date()),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setChatError(
        err instanceof Error
          ? err.message
          : 'An unexpected network error occurred. Please try again.',
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = async () => {
    setMessages([]);
    setChatError(null);

    if (paper?.sessionId) {
      try {
        await fetch('/api/chat/clear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: paper.sessionId }),
        });
      } catch {
        // Local chat is already cleared; ignore transient clear error
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      <header className="h-16 shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          <h1
            className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Research Paper AI Assistant
          </h1>

          <button
            type="button"
            onClick={handleClearChat}
            disabled={messages.length === 0 || isSending}
            className="inline-flex items-center gap-2 min-h-[40px] rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Clear Chat</span>
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex flex-col lg:flex-row mx-auto w-full max-w-[1440px] overflow-y-auto lg:overflow-hidden">
        <PdfUploadPanel
          paper={paper}
          isUploading={isUploading}
          uploadError={uploadError}
          onUploadFile={handleUploadFile}
          onRemovePaper={handleRemovePaper}
          onDismissError={() => setUploadError(null)}
        />

        <ChatPanel
          paper={paper}
          messages={messages}
          isSending={isSending}
          chatError={chatError}
          onSendMessage={handleSendMessage}
          onDismissError={() => setChatError(null)}
        />
      </main>
    </div>
  );
}
