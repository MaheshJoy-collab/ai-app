import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import {
  AlertCircle,
  BookOpen,
  FileText,
  Loader2,
  Send,
  X,
} from 'lucide-react';
import type { ChatMessage, UploadedPaper } from '../types/chat';
import { FormattedAnswer } from './FormattedAnswer';

interface ChatPanelProps {
  paper: UploadedPaper | null;
  messages: ChatMessage[];
  isSending: boolean;
  chatError: string | null;
  onSendMessage: (question: string) => Promise<void>;
  onDismissError: () => void;
}

const STARTER_QUESTIONS = [
  'What is the main research question and objective of this paper?',
  'Summarize the methodology and experimental setup.',
  'What are the key findings and limitations mentioned by the authors?',
];

export function ChatPanel({
  paper,
  messages,
  isSending,
  chatError,
  onSendMessage,
  onDismissError,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const submitQuestion = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || !paper || isSending) return;
    setInput('');
    await onSendMessage(trimmed);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitQuestion(input);
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await submitQuestion(input);
    }
  };

  const canSend = Boolean(paper && input.trim() && !isSending);

  return (
    <section
      aria-label="Research paper chat"
      className="flex-1 flex flex-col min-h-0 bg-slate-50"
    >
      {/* Scrollable conversation area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mx-auto max-w-3xl h-full flex flex-col">
          {!paper ? (
            <div className="my-auto py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2
                className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900"
                style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
              >
                Ask questions grounded in your research paper
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm sm:text-[15px] leading-relaxed text-slate-600">
                Upload a PDF in the panel on the left to begin. Every response is generated strictly from your document with page and section citations.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="my-auto py-8">
              <div className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-slate-200 text-blue-700">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2
                  className="mt-4 text-xl sm:text-2xl font-semibold tracking-tight text-slate-900"
                  style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
                >
                  Ready to discuss your paper
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600 leading-relaxed">
                  Loaded <span className="font-medium text-slate-900">{paper.filename}</span> ({paper.pageCount}{' '}
                  {paper.pageCount === 1 ? 'page' : 'pages'}). Ask any question below or start with one of these prompts.
                </p>
              </div>

              <div className="mt-8 grid gap-2.5 sm:grid-cols-1 max-w-xl mx-auto">
                {STARTER_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => submitQuestion(question)}
                    disabled={isSending}
                    className="w-full text-left rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700 hover:border-blue-300 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={message.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">
                        {isUser ? 'You' : 'Research Paper AI Assistant'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px] tabular-nums">
                        {message.timestamp}
                      </span>
                    </div>

                    {isUser ? (
                      <div className="max-w-[85%] sm:max-w-[78%] rounded-2xl rounded-tr-sm bg-blue-700 px-4 py-3 text-[15px] leading-relaxed text-white whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    ) : (
                      <div className="max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-5 py-4 text-slate-800 break-words">
                        <FormattedAnswer content={message.content} />
                      </div>
                    )}
                  </div>
                );
              })}

              {isSending && (
                <div className="flex flex-col items-start" aria-live="polite">
                  <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      Research Paper AI Assistant
                    </span>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-5 py-4 flex items-center gap-3 text-sm text-slate-600">
                    <Loader2
                      className="h-4 w-4 animate-spin text-blue-700 shrink-0"
                      aria-hidden="true"
                    />
                    <span>Reading paper and generating answer...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Inline API error banner */}
      {chatError && (
        <div className="px-4 sm:px-6 lg:px-8 pb-3">
          <div
            role="alert"
            className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-3"
          >
            <AlertCircle
              className="h-4 w-4 shrink-0 text-red-600 mt-0.5"
              aria-hidden="true"
            />
            <p className="flex-1 text-xs sm:text-sm leading-relaxed">
              {chatError}
            </p>
            <button
              type="button"
              onClick={onDismissError}
              className="shrink-0 rounded p-1 text-red-600 hover:bg-red-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              aria-label="Dismiss error message"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Composer bar */}
      <div className="border-t border-slate-200 bg-white px-4 sm:px-6 lg:px-8 py-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-3xl flex items-end gap-3"
        >
          <div className="flex-1">
            <label htmlFor="question-input" className="sr-only">
              Ask a question about the uploaded research paper
            </label>
            <textarea
              id="question-input"
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!paper || isSending}
              placeholder={
                paper
                  ? `Ask a question about ${paper.filename}...`
                  : 'Upload a research paper PDF to start asking questions...'
              }
              className="block w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm sm:text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={!canSend}
            className="inline-flex items-center justify-center gap-2 min-h-[46px] rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 transition-colors cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Send</span>
          </button>
        </form>
      </div>
    </section>
  );
}
