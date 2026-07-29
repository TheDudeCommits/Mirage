import React, { type ReactNode } from "react";

interface SafeMessageContentProps {
  text: string;
  className?: string;
}

function renderInlineText(text: string, lineIndex: number): ReactNode[] {
  const nodes: ReactNode[] = [];
  const markup = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = markup.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong
          key={`${lineIndex}-${match.index}`}
          className="font-semibold text-[var(--askmira-primary)]"
        >
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      nodes.push(
        <em
          key={`${lineIndex}-${match.index}`}
          className="italic text-[var(--askmira-text)]"
        >
          {token.slice(1, -1)}
        </em>,
      );
    }
    cursor = match.index + token.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }
  return nodes;
}

export default function SafeMessageContent({
  text,
  className,
}: SafeMessageContentProps) {
  return (
    <div className={className}>
      {text.split(/\r?\n/).map((line, index) => {
        const numbered = /^(\d+)\.\s+(.+)$/.exec(line);
        if (numbered) {
          return (
            <div key={index} className="my-2 pl-2">
              <span className="font-bold text-[var(--askmira-primary)]">
                {numbered[1]}.
              </span>{" "}
              {renderInlineText(numbered[2], index)}
            </div>
          );
        }

        const bullet = /^[-•*]\s+(.+)$/.exec(line);
        if (bullet) {
          return (
            <div key={index} className="my-1 pl-2">
              <span className="text-[var(--askmira-primary)]">•</span>{" "}
              {renderInlineText(bullet[1], index)}
            </div>
          );
        }

        if (!line) {
          return <div key={index} className="h-3" aria-hidden="true" />;
        }

        return <div key={index}>{renderInlineText(line, index)}</div>;
      })}
    </div>
  );
}
