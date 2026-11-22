export interface UploadedPaper {
  sessionId: string;
  filename: string;
  pageCount: number;
  wordCount: number;
  truncated?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
