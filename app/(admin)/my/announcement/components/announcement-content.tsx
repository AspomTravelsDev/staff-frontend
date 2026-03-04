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
          line-height: 1.6;
          color: inherit;
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: normal;
        }
        .announcement-rich-content p {
          margin-bottom: 1rem;
        }
        .announcement-rich-content ul {
          list-style-type: disc !important;
          margin-bottom: 1rem;
          padding-left: 1.25rem !important;
          display: block !important;
        }
        .announcement-rich-content ol {
          list-style-type: decimal !important;
          margin-bottom: 1rem;
          padding-left: 1.25rem !important;
          display: block !important;
        }
        .announcement-rich-content li {
          margin-bottom: 0.25rem;
          display: list-item !important;
        }
        .announcement-rich-content strong,
        .announcement-rich-content b {
          font-weight: 700;
        }
        .announcement-rich-content a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
      `}</style>
    </>
  );
}
