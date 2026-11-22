import type { ReactNode } from 'react';

interface FormattedAnswerProps {
  content: string;
}

function renderInlineFormatting(text: string): ReactNode[] {
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token.length}`;

    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={key} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={key}
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.875em] text-slate-800"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    } else {
      parts.push(token);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function FormattedAnswer({ content }: FormattedAnswerProps) {
  const trimmed = content.trim();

  if (trimmed === 'This is not mentioned in the paper.') {
    return (
      <p className="text-[15px] leading-relaxed text-slate-700 italic">
        This is not mentioned in the paper.
      </p>
    );
  }

  const lines = trimmed.split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      i += 1;
      continue;
    }

    // Markdown heading (### or ## or #)
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      blocks.push(
        <h4
          key={`h-${i}`}
          className="pt-1 text-[15px] font-semibold text-slate-900 leading-snug"
        >
          {renderInlineFormatting(headingMatch[1])}
        </h4>,
      );
      i += 1;
      continue;
    }

    // Unordered list
    if (/^[-*•]\s+/.test(line)) {
      const items: string[] = [];
      const startIndex = i;
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ul
          key={`ul-${startIndex}`}
          className="list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-slate-800"
        >
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineFormatting(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list
    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      const startIndex = i;
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s+/, ''));
        i += 1;
      }
      blocks.push(
        <ol
          key={`ol-${startIndex}`}
          className="list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-slate-800"
        >
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineFormatting(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Regular paragraph (group consecutive plain lines)
    const paragraphLines: string[] = [];
    const startIndex = i;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^#{1,3}\s+/.test(lines[i].trim()) &&
      !/^[-*•]\s+/.test(lines[i].trim()) &&
      !/^\d+[.)]\s+/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i].trim());
      i += 1;
    }

    blocks.push(
      <p
        key={`p-${startIndex}`}
        className="text-[15px] leading-relaxed text-slate-800"
      >
        {renderInlineFormatting(paragraphLines.join(' '))}
      </p>,
    );
  }

  return <div className="space-y-3">{blocks}</div>;
}
