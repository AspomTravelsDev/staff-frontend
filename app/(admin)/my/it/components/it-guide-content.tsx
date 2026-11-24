export interface ITGuideHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

function slugifyHeading(text: string, index: number): string {
  const base = text
    .toLowerCase()
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return base ? `${base}-${index + 1}` : `section-${index + 1}`;
}

function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractITGuideHeadings(rawContent: string): {
  html: string;
  headings: ITGuideHeading[];
} {
  if (!rawContent) return { html: "", headings: [] };

  // Normalize non-breaking spaces and collapse consecutive empty spacer paragraphs (<p><br></p>)
  const normalized = rawContent
    .replace(/&nbsp;/gi, " ")
    .replace(/(?:<p>\s*(?:<br\s*\/?>)?\s*<\/p>\s*){2,}/gi, "<p><br></p>");

  const headings: ITGuideHeading[] = [];
  let headingIndex = 0;

  const html = normalized.replace(
    /<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi,
    (fullMatch, tag: string, attrs: string, inner: string) => {
      const text = stripTags(inner);
      if (!text) return fullMatch;
      const level = tag.toLowerCase() === "h2" ? 2 : 3;
      const existingIdMatch = attrs.match(/\bid=["']([^"']+)["']/i);
      const id = existingIdMatch?.[1] || slugifyHeading(text, headingIndex);
      headingIndex += 1;
      headings.push({ id, text, level });
      if (existingIdMatch) return fullMatch;
      return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
    },
  );

  return { html, headings };
}

export function estimateReadingTimeMinutes(rawContent: string): number {
  const plain = stripTags(rawContent || "");
  if (!plain) return 1;
  const words = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

interface ITGuideContentProps {
  content: string;
  className?: string;
}

export function ITGuideContent({ content, className }: ITGuideContentProps) {
  const { html } = extractITGuideHeadings(content);

  return (
    <>
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        className={`rich-text-content ${className ?? ""}`}
      />
      <style>{`
        .rich-text-content {
          line-height: 1.75;
          font-size: 1rem;
          color: var(--foreground);
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: normal;
          counter-reset: ql-list-0 ql-list-1 ql-list-2 ql-list-3 ql-list-4 ql-list-5 ql-list-6 ql-list-7 ql-list-8 ql-list-9;
        }
        .rich-text-content > *:first-child {
          margin-top: 0 !important;
        }
        .rich-text-content h1 {
          font-size: 2rem;
          font-weight: 800;
          margin-top: 2rem;
          margin-bottom: 0.85rem;
          line-height: 1.2;
          letter-spacing: -0.02em;
          color: var(--foreground);
          counter-reset: ql-list-0 ql-list-1 ql-list-2 ql-list-3;
        }
        .rich-text-content h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.4rem;
          border-bottom: 1px solid var(--border);
          line-height: 1.25;
          letter-spacing: -0.015em;
          color: var(--foreground);
          scroll-margin-top: 5.5rem;
          counter-reset: ql-list-0 ql-list-1 ql-list-2 ql-list-3;
        }
        .rich-text-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.35;
          color: var(--foreground);
          scroll-margin-top: 5.5rem;
          counter-reset: ql-list-0 ql-list-1 ql-list-2 ql-list-3;
        }
        .rich-text-content h4 {
          font-size: 1.075rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.4rem;
          line-height: 1.4;
          color: var(--foreground);
        }
        .rich-text-content p {
          margin-top: 0;
          margin-bottom: 0.9rem;
          white-space: normal;
          counter-reset: ql-list-0 ql-list-1 ql-list-2 ql-list-3;
        }
        /* Prevent empty Quill spacer paragraphs (<p><br></p>) from creating huge vertical gaps */
        .rich-text-content p:empty,
        .rich-text-content p:has(> br:only-child) {
          margin-bottom: 0.35rem;
          min-height: 0.5rem;
          line-height: 0.5;
        }
        /* Standard HTML lists (<ul> and <ol> without Quill v2 data-list attributes) */
        .rich-text-content ul {
          list-style-type: disc;
          margin-top: 0.35rem;
          margin-bottom: 1.1rem;
          padding-left: 1.6rem;
        }
        .rich-text-content ul ul {
          list-style-type: circle;
          margin-top: 0.25rem;
          margin-bottom: 0.35rem;
        }
        .rich-text-content ol {
          list-style-type: decimal;
          margin-top: 0.35rem;
          margin-bottom: 1.1rem;
          padding-left: 1.6rem;
        }
        .rich-text-content li {
          margin-bottom: 0.35rem;
          line-height: 1.65;
        }
        .rich-text-content li > p {
          margin-bottom: 0.25rem;
        }

        /* Quill v2 list rendering (<ol><li data-list="bullet|ordered">) */
        .rich-text-content li[data-list] {
          list-style-type: none !important;
          position: relative;
          padding-left: 1.5em;
        }
        .rich-text-content ol:has(> li[data-list]) {
          list-style-type: none !important;
          padding-left: 0.25rem;
        }
        .rich-text-content li[data-list] > .ql-ui {
          display: none;
        }
        .rich-text-content li[data-list]::before {
          position: absolute;
          left: 0;
          width: 1.25em;
          text-align: right;
          white-space: nowrap;
          font-weight: 600;
          color: var(--primary);
        }
        /* Quill v2 Bullet lists */
        .rich-text-content li[data-list="bullet"]::before {
          content: "•";
          font-size: 1.1em;
          line-height: 1.5;
          text-align: center;
        }
        .rich-text-content li[data-list="bullet"].ql-indent-1::before {
          content: "◦";
        }
        .rich-text-content li[data-list="bullet"].ql-indent-2::before,
        .rich-text-content li[data-list="bullet"].ql-indent-3::before {
          content: "▪";
          font-size: 0.85em;
        }
        .rich-text-content li[data-list="bullet"] {
          counter-reset: ql-list-1 ql-list-2 ql-list-3;
        }

        /* Quill v2 Ordered lists */
        .rich-text-content li[data-list="ordered"] {
          counter-increment: ql-list-0;
          counter-reset: ql-list-1 ql-list-2 ql-list-3;
        }
        .rich-text-content li[data-list="ordered"]::before {
          content: counter(ql-list-0, decimal) ".";
        }
        .rich-text-content li[data-list="ordered"].ql-indent-1 {
          counter-increment: ql-list-1;
          counter-reset: ql-list-2 ql-list-3;
        }
        .rich-text-content li[data-list="ordered"].ql-indent-1::before {
          content: counter(ql-list-1, lower-alpha) ".";
        }
        .rich-text-content li[data-list="ordered"].ql-indent-2 {
          counter-increment: ql-list-2;
          counter-reset: ql-list-3;
        }
        .rich-text-content li[data-list="ordered"].ql-indent-2::before {
          content: counter(ql-list-2, lower-roman) ".";
        }
        .rich-text-content li[data-list="ordered"].ql-indent-3 {
          counter-increment: ql-list-3;
        }
        .rich-text-content li[data-list="ordered"].ql-indent-3::before {
          content: counter(ql-list-3, decimal) ".";
        }

        /* Quill Indentation levels */
        .rich-text-content .ql-indent-1 { margin-left: 1.75rem; }
        .rich-text-content .ql-indent-2 { margin-left: 3.5rem; }
        .rich-text-content .ql-indent-3 { margin-left: 5.25rem; }
        .rich-text-content .ql-indent-4 { margin-left: 7rem; }

        /* Font sizes */
        .rich-text-content .ql-size-small {
          font-size: 0.85em;
        }
        .rich-text-content .ql-size-large {
          font-size: 1.225em;
          line-height: 1.6;
        }
        .rich-text-content .ql-size-huge {
          font-size: 1.65em;
          line-height: 1.35;
        }

        /* Font families & Alignment */
        .rich-text-content .ql-font-serif {
          font-family: Georgia, "Times New Roman", serif;
        }
        .rich-text-content .ql-font-monospace {
          font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .rich-text-content .ql-align-center {
          text-align: center;
        }
        .rich-text-content .ql-align-right {
          text-align: right;
        }
        .rich-text-content .ql-align-justify {
          text-align: justify;
        }

        /* Callout Blockquotes */
        .rich-text-content blockquote {
          border-left: 4px solid var(--primary);
          background-color: color-mix(in oklab, var(--primary) 8%, var(--muted));
          padding: 0.95rem 1.25rem;
          margin: 1.25rem 0;
          border-radius: 0 0.65rem 0.65rem 0;
          color: var(--foreground);
          font-style: normal;
        }
        .rich-text-content blockquote p:last-child {
          margin-bottom: 0;
        }
        .rich-text-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.75rem;
          margin: 1.5rem 0;
          border: 1px solid var(--border);
        }
        .rich-text-content a {
          color: var(--primary);
          text-decoration: underline;
          text-underline-offset: 3px;
          font-weight: 500;
        }
        .rich-text-content strong,
        .rich-text-content b {
          font-weight: 700;
        }
        .rich-text-content pre,
        .rich-text-content .ql-code-block-container {
          font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: normal;
          word-wrap: break-word;
          padding: 1rem 1.25rem;
          margin: 1.15rem 0;
          border-radius: 0.6rem;
          background-color: #0f172a;
          color: #f8fafc;
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .rich-text-content code {
          font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875em;
          background-color: var(--muted);
          color: var(--foreground);
          padding: 0.15rem 0.4rem;
          border-radius: 0.3rem;
          border: 1px solid var(--border);
        }
        .rich-text-content pre code {
          background: transparent;
          border: 0;
          padding: 0;
          color: inherit;
        }
        .rich-text-content hr {
          border: 0;
          border-top: 1px solid var(--border);
          margin: 1.75rem 0;
        }
      `}</style>
    </>
  );
}

