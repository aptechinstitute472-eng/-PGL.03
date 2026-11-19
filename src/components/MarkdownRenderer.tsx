import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs text-zinc-400">
        <span className="font-mono">{language || 'text'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed font-mono text-zinc-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="rounded bg-zinc-950 px-1.5 py-0.5 font-mono text-[0.85em] text-blue-300 border border-zinc-800"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-zinc-300 tracking-[0.01em]">
      {blocks.map((block, index) => {
        if (block.startsWith('```') && block.endsWith('```')) {
          const lines = block.slice(3, -3).split('\n');
          const language = lines[0]?.trim() || 'text';
          const code = lines.slice(1).join('\n').trim();
          return <CodeBlock key={index} code={code} language={language} />;
        }

        const lines = block.split('\n');
        return (
          <div key={index} className="space-y-1.5">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) {
                return <div key={lineIdx} className="h-1" />;
              }
              if (trimmed.startsWith('### ')) {
                return (
                  <h4
                    key={lineIdx}
                    className="pt-2 text-sm font-semibold text-zinc-50 font-display"
                  >
                    {renderInlineFormatting(trimmed.slice(4))}
                  </h4>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h3
                    key={lineIdx}
                    className="pt-2 text-base font-semibold text-white font-display"
                  >
                    {renderInlineFormatting(trimmed.slice(3))}
                  </h3>
                );
              }
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-1">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    <span className="flex-1">
                      {renderInlineFormatting(trimmed.slice(2))}
                    </span>
                  </div>
                );
              }
              const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
              if (numberedMatch) {
                return (
                  <div key={lineIdx} className="flex items-start gap-2 pl-1">
                    <span className="font-mono text-xs font-semibold text-blue-400 mt-0.5 shrink-0 tabular-nums">
                      {numberedMatch[1]}.
                    </span>
                    <span className="flex-1">
                      {renderInlineFormatting(numberedMatch[2])}
                    </span>
                  </div>
                );
              }
              return <p key={lineIdx}>{renderInlineFormatting(trimmed)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}
