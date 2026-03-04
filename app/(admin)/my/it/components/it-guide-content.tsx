"use client";

interface ITGuideContentProps {
  content: string;
}

export function ITGuideContent({ content }: ITGuideContentProps) {
  return (
    <>
      <div
        dangerouslySetInnerHTML={{ __html: content }}
        className="rich-text-content"
      />
      <style jsx global>{`
        .rich-text-content {
          line-height: 1.8;
          color: hsl(var(--foreground));
        }
        .rich-text-content h2 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          line-height: 1.2;
        }
        .rich-text-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.3;
        }
        .rich-text-content p {
          margin-bottom: 1.5rem;
        }
        .rich-text-content ul {
          list-style-type: disc !important;
          margin-bottom: 1.5rem;
          padding-left: 1.5rem !important;
          display: block !important;
        }
        .rich-text-content ol {
          list-style-type: decimal !important;
          margin-bottom: 1.5rem;
          padding-left: 1.5rem !important;
          display: block !important;
        }
        .rich-text-content li {
          margin-bottom: 0.5rem;
          display: list-item !important;
        }
        .rich-text-content blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1.5rem;
          font-style: italic;
          margin: 2rem 0;
          background-color: hsl(var(--muted) / 0.3);
          padding: 1.5rem;
          border-radius: 0 0.75rem 0.75rem 0;
        }
        .rich-text-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.75rem;
          margin: 2rem 0;
        }
        .rich-text-content a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .rich-text-content strong,
        .rich-text-content b {
          font-weight: 700;
        }
      `}</style>
    </>
  );
}
