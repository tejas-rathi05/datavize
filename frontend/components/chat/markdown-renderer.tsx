"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Customize heading styles
          h1: ({ children, ...props }) => (
            <h1 className="text-2xl font-bold mb-4 mt-6 text-foreground" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-xl font-semibold mb-3 mt-5 text-foreground" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-lg font-medium mb-2 mt-4 text-foreground" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-base font-medium mb-2 mt-3 text-foreground" {...props}>
              {children}
            </h4>
          ),
          h5: ({ children, ...props }) => (
            <h5 className="text-sm font-medium mb-1 mt-2 text-foreground" {...props}>
              {children}
            </h5>
          ),
          h6: ({ children, ...props }) => (
            <h6 className="text-xs font-medium mb-1 mt-2 text-foreground" {...props}>
              {children}
            </h6>
          ),
          
          // Customize paragraph styles
          p: ({ children, ...props }) => (
            <p className="mb-3 text-foreground leading-relaxed" {...props}>
              {children}
            </p>
          ),
          
          // Customize list styles
          ul: ({ children, ...props }) => (
            <ul className="mb-3 ml-6 list-disc text-foreground space-y-1" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="mb-3 ml-6 list-decimal text-foreground space-y-1" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-foreground" {...props}>
              {children}
            </li>
          ),
          
          // Customize code block styles
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <pre className="bg-muted border rounded-lg p-4 overflow-x-auto mb-3">
                <code
                  className={cn(
                    "text-sm font-mono text-foreground",
                    match && `language-${match[1]}`
                  )}
                  {...props}
                >
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground"
                {...props}
              >
                {children}
              </code>
            );
          },
          
          // Customize blockquote styles
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-primary pl-4 py-2 mb-3 bg-muted/50 italic text-foreground" {...props}>
              {children}
            </blockquote>
          ),
          
          // Customize table styles
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border-collapse border border-border" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-muted" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody className="bg-background" {...props}>
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr className="border-b border-border hover:bg-muted/50" {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th className="border border-border px-3 py-2 text-left font-medium text-foreground" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-border px-3 py-2 text-foreground" {...props}>
              {children}
            </td>
          ),
          
          // Customize link styles
          a: ({ children, href, ...props }) => (
            <a
              href={href}
              className="text-primary hover:text-primary/80 underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          
          // Customize emphasis styles
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-foreground" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic text-foreground" {...props}>
              {children}
            </em>
          ),
          
          // Customize horizontal rule
          hr: ({ ...props }) => (
            <hr className="border-t border-border my-6" {...props} />
          ),
          
          // Customize image styles
          img: ({ src, alt, ...props }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-lg border border-border my-3"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
