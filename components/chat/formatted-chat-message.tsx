"use client";

import React from "react";

interface FormattedChatMessageProps {
  content?: string;
  children?: React.ReactNode;
  className?: string;
  isOwn?: boolean;
}

function parseInlineTokens(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match URLs, inline code, bold (**bold** or *bold*), italic (__italic__ or _italic_), strikethrough (~~strike~~ or ~strike~)
  const regex =
    /(https?:\/\/[^\s<]+[^<.,:;"')\]\s]|`[^`\n]+`|\*{1,2}[^\s*](?:[^*]*?[^\s*])?\*{1,2}|_{1,2}[^\s_](?:[^_]*?[^\s_])?_{1,2}|~{1,2}[^\s~](?:[^~]*?[^\s~])?~{1,2})/g;

  const parts = text.split(regex);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    if (part.startsWith("http://") || part.startsWith("https://")) {
      elements.push(
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:opacity-80 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    } else if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      elements.push(
        <code
          key={i}
          className="rounded bg-black/10 dark:bg-white/15 px-1 py-0.5 font-mono text-[0.88em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    } else if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      const inner = part.replace(/^\*+/, "").replace(/\*+$/, "");
      elements.push(
        <strong key={i} className="font-semibold">
          {parseInlineTokens(inner)}
        </strong>
      );
    } else if (part.startsWith("_") && part.endsWith("_") && part.length >= 2) {
      const inner = part.replace(/^_+/, "").replace(/_+$/, "");
      elements.push(
        <em key={i} className="italic">
          {parseInlineTokens(inner)}
        </em>
      );
    } else if (part.startsWith("~") && part.endsWith("~") && part.length >= 2) {
      const inner = part.replace(/^~+/, "").replace(/~+$/, "");
      elements.push(
        <del key={i} className="line-through opacity-80">
          {parseInlineTokens(inner)}
        </del>
      );
    } else {
      elements.push(part);
    }
  }

  return elements;
}

type Block =
  | { type: "code-block"; content: string }
  | { type: "bullet-list"; items: string[] }
  | { type: "numbered-list"; items: string[] }
  | { type: "quote"; lines: string[] }
  | { type: "paragraph"; lines: string[] };

function parseBlocks(content: string): Block[] {
  // First isolate multi-line code blocks: ```...```
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const sections: { isCode: boolean; text: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      sections.push({ isCode: false, text: content.slice(lastIndex, match.index) });
    }
    sections.push({ isCode: true, text: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    sections.push({ isCode: false, text: content.slice(lastIndex) });
  }

  const blocks: Block[] = [];

  for (const section of sections) {
    if (section.isCode) {
      blocks.push({ type: "code-block", content: section.text.trim() });
      continue;
    }

    const lines = section.text.split(/\r?\n/);
    let currentBulletList: string[] = [];
    let currentNumberedList: string[] = [];
    let currentQuote: string[] = [];
    let currentParagraph: string[] = [];

    const flushBulletList = () => {
      if (currentBulletList.length > 0) {
        blocks.push({ type: "bullet-list", items: [...currentBulletList] });
        currentBulletList = [];
      }
    };

    const flushNumberedList = () => {
      if (currentNumberedList.length > 0) {
        blocks.push({ type: "numbered-list", items: [...currentNumberedList] });
        currentNumberedList = [];
      }
    };

    const flushQuote = () => {
      if (currentQuote.length > 0) {
        blocks.push({ type: "quote", lines: [...currentQuote] });
        currentQuote = [];
      }
    };

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        blocks.push({ type: "paragraph", lines: [...currentParagraph] });
        currentParagraph = [];
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();

      // Check bullet list: "- item", "-item", "• item", "•item", or "* item" (not ending with *)
      const bulletMatch =
        line.match(/^[-•]\s*(.+)$/) ||
        (!line.endsWith("*") && line.match(/^\*\s+(.+)$/));
      if (bulletMatch && bulletMatch[1].trim()) {
        flushNumberedList();
        flushQuote();
        flushParagraph();
        currentBulletList.push(bulletMatch[1].trim());
        continue;
      }

      // Check numbered list: "1. item" or "1.item"
      const numberedMatch = line.match(/^(\d+\.)\s*(.+)$/);
      if (numberedMatch) {
        flushBulletList();
        flushQuote();
        flushParagraph();
        currentNumberedList.push(numberedMatch[2]);
        continue;
      }

      // Check quote: "> quote"
      const quoteMatch = line.match(/^>\s?(.*)$/);
      if (quoteMatch) {
        flushBulletList();
        flushNumberedList();
        flushParagraph();
        currentQuote.push(quoteMatch[1]);
        continue;
      }

      // Empty line -> separate paragraphs
      if (line.trim() === "") {
        flushBulletList();
        flushNumberedList();
        flushQuote();
        flushParagraph();
        continue;
      }

      // Normal text line
      flushBulletList();
      flushNumberedList();
      flushQuote();
      currentParagraph.push(line);
    }

    flushBulletList();
    flushNumberedList();
    flushQuote();
    flushParagraph();
  }

  return blocks;
}

export function FormattedChatMessage({
  content,
  children,
  className = "",
  isOwn = false,
}: FormattedChatMessageProps) {
  let textContent = content ?? (typeof children === "string" ? children : "");
  if (!textContent) return <>{children}</>;
  textContent = textContent.replace(/^[\u200B\s]*\[forwarded\][\u200B\s]*/i, "");

  const blocks = parseBlocks(textContent);

  return (
    <div className={`space-y-1.5 leading-relaxed [overflow-wrap:anywhere] ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "code-block":
            return (
              <pre
                key={idx}
                className="my-1.5 overflow-x-auto rounded-md bg-black/15 dark:bg-white/10 p-2 font-mono text-[0.82em] whitespace-pre"
              >
                <code>{block.content}</code>
              </pre>
            );

          case "bullet-list":
            return (
              <ul key={idx} className="my-1 list-disc pl-4 space-y-0.5">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-snug">
                    {parseInlineTokens(item)}
                  </li>
                ))}
              </ul>
            );

          case "numbered-list":
            return (
              <ol key={idx} className="my-1 list-decimal pl-4 space-y-0.5">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="leading-snug">
                    {parseInlineTokens(item)}
                  </li>
                ))}
              </ol>
            );

          case "quote":
            return (
              <blockquote
                key={idx}
                className={`my-1 border-l-2 pl-2.5 py-0.5 italic opacity-90 ${
                  isOwn ? "border-primary-foreground/50" : "border-primary/50"
                }`}
              >
                {block.lines.map((line, lineIdx) => (
                  <div key={lineIdx}>{parseInlineTokens(line)}</div>
                ))}
              </blockquote>
            );

          case "paragraph":
            return (
              <p key={idx} className="whitespace-pre-wrap">
                {block.lines.map((line, lineIdx) => (
                  <React.Fragment key={lineIdx}>
                    {lineIdx > 0 && <br />}
                    {parseInlineTokens(line)}
                  </React.Fragment>
                ))}
              </p>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

/**
 * Converts rich pasted HTML (e.g. from Word, Google Docs, or web pages)
 * into WhatsApp-style markdown for the composer input.
 */
export function htmlToWhatsAppMarkdown(html: string): string {
  if (typeof window === "undefined" || !html) return "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.body;
    if (!body || !body.childNodes.length) return "";

    function walk(node: Node): string {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || "";
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return "";
      }

      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const style = el.getAttribute("style") || "";

      let inner = "";
      for (const child of Array.from(el.childNodes)) {
        inner += walk(child);
      }

      const isBold =
        tag === "b" ||
        tag === "strong" ||
        /font-weight\s*:\s*(bold|[6-9]00)/i.test(style);
      const isItalic =
        tag === "i" ||
        tag === "em" ||
        /font-style\s*:\s*italic/i.test(style);
      const isStrike =
        tag === "s" ||
        tag === "strike" ||
        tag === "del" ||
        /text-decoration\s*:\s*line-through/i.test(style);
      const isCode = tag === "code";
      const isPre = tag === "pre";

      let res = inner;
      if (isBold && res.trim()) {
        res = `*${res.trim()}*`;
      }
      if (isItalic && res.trim()) {
        res = `_${res.trim()}_`;
      }
      if (isStrike && res.trim()) {
        res = `~${res.trim()}~`;
      }
      if (isCode && !el.closest("pre") && res.trim()) {
        res = `\`${res.trim()}\``;
      }
      if (isPre) {
        res = `\n\`\`\`\n${res.trim()}\n\`\`\`\n`;
      }

      if (tag === "li") {
        const parent = el.parentElement;
        const isOrdered = parent?.tagName.toLowerCase() === "ol";
        if (isOrdered) {
          const index = Array.from(parent?.children || []).indexOf(el) + 1;
          res = `${index}. ${res.trim()}\n`;
        } else {
          res = `- ${res.trim()}\n`;
        }
      } else if (tag === "p" || tag === "div") {
        res = `${res}\n`;
      } else if (tag === "br") {
        res = "\n";
      }

      return res;
    }

    return walk(body).trim();
  } catch {
    return "";
  }
}
