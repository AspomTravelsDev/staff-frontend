"use client";

import { useMemo } from "react";

interface AnnouncementContentProps {
  content: string;
  className?: string;
}

export function AnnouncementContent({
  content,
  className,
}: AnnouncementContentProps) {
  // Replace &nbsp; with regular spaces to allow natural word wrapping.
  const cleanContent = useMemo(() => {
    if (!content) return "";
    return content.replace(/&nbsp;/g, " ");
  }, [content]);

  return (
    <>
      <div
        dangerouslySetInnerHTML={{ __html: cleanContent }}
        className={`announcement-rich-content ${className || ""}`}
      />
      <style jsx global>{`
        .announcement-rich-content {
          line-height: 1.8;
          color: hsl(var(--foreground));
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: normal;
          hyphens: auto;
        }
        .announcement-rich-content h2 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          line-height: 1.2;
        }
        .announcement-rich-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.3;
        }
        .announcement-rich-content p {
          margin-bottom: 1.5rem;
          white-space: normal;
        }
        .announcement-rich-content ul {
          list-style-type: disc !important;
          margin-bottom: 1.5rem;
          padding-left: 1.5rem !important;
          display: block !important;
        }
        .announcement-rich-content ol {
          list-style-type: decimal !important;
          margin-bottom: 1.5rem;
          padding-left: 1.5rem !important;
          display: block !important;
        }
        .announcement-rich-content li {
          margin-bottom: 0.5rem;
          display: list-item !important;
        }
        .announcement-rich-content blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1.5rem;
          font-style: italic;
          margin: 2rem 0;
          background-color: hsl(var(--muted) / 0.3);
          padding: 1.5rem;
          border-radius: 0 0.75rem 0.75rem 0;
        }
        .announcement-rich-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.75rem;
          margin: 2rem 0;
        }
        .announcement-rich-content a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .announcement-rich-content strong,
        .announcement-rich-content b {
          font-weight: 700;
        }
        .announcement-rich-content pre {
          overflow-x: auto;
          white-space: pre-wrap;
          word-spacing: normal;
          word-break: normal;
          word-wrap: break-word;
          padding: 1rem;
          border-radius: 0.5rem;
          background-color: hsl(var(--muted));
        }
        .announcement-rich-content code {
          word-break: normal;
          overflow-wrap: break-word;
        }
      `}</style>
    </>
  );
}
