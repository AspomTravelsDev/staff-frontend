"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";

const ZERO_WIDTH_SPACE = "\u200B";

export interface WhatsAppChatInputRef {
  focus: () => void;
  selectionStart: number;
  selectionEnd: number;
  setSelectionRange: (start: number, end: number) => void;
  value: string;
}

interface WhatsAppChatInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSend?: () => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  showToolbar?: boolean;
  maxLength?: number;
  className?: string;
  "aria-label"?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInlineMarkup(escaped: string): string {
  let formatted = escaped;

  // Bold: *bold* or **bold**
  formatted = formatted.replace(
    /(\*{1,2})([^*\n]+)(\*{1,2})/g,
    '<strong class="font-bold text-foreground">$1$2$3</strong>'
  );

  // Italic: _italic_ or __italic__
  formatted = formatted.replace(
    /(_{1,2})([^_\n]+)(_{1,2})/g,
    '<em class="italic text-foreground">$1$2$3</em>'
  );

  // Strikethrough: ~strike~ or ~~strike~~
  formatted = formatted.replace(
    /(~{1,2})([^~\n]+)(~{1,2})/g,
    '<del class="line-through text-muted-foreground">$1$2$3</del>'
  );

  // Inline Code: `code`
  formatted = formatted.replace(
    /(`)([^`\n]+)(`)/g,
    '<code class="rounded bg-muted px-1 py-0.5 font-mono text-[0.88em]">$1$2$3</code>'
  );

  return formatted;
}

export function formatWhatsAppMarkupToHtml(rawText: string): string {
  if (!rawText) return "";

  const lines = rawText.split("\n");
  const formattedLines = lines.map((line, index) => {
    // Unordered bullet list: "- " or "• "
    const bulletMatch = line.match(/^([-•]) (.*)$/);
    if (bulletMatch) {
      const body = formatInlineMarkup(escapeHtml(bulletMatch[2]));
      return (
        '<span class="text-primary font-bold inline-block mr-1.5 select-none" contenteditable="false" data-bullet="true">•</span>' +
        (body || ZERO_WIDTH_SPACE)
      );
    }

    // Ordered list: "1. ", "2. ", etc.
    const numMatch = line.match(/^(\d+\.) (.*)$/);
    if (numMatch) {
      const prefix = escapeHtml(`${numMatch[1]} `);
      const body = formatInlineMarkup(escapeHtml(numMatch[2]));
      return (
        `<span class="text-primary font-semibold inline-block mr-1.5 select-none" contenteditable="false" data-number="${prefix}">${prefix}</span>` +
        (body || ZERO_WIDTH_SPACE)
      );
    }

    if (line === "" && (lines.length > 1 || index > 0)) {
      return ZERO_WIDTH_SPACE;
    }

    return formatInlineMarkup(escapeHtml(line));
  });

  return formattedLines.join("<br>");
}

function normalizeTextChunk(str: string): string {
  return str.replace(/\u200B/g, "").replace(/\u00A0/g, " ");
}

function getPlainTextFromDom(element: HTMLElement): string {
  let text = "";

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += normalizeTextChunk(node.nodeValue || "");
    } else if (node.nodeName === "BR") {
      text += "\n";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.dataset.bullet) {
        const extra = normalizeTextChunk(el.textContent || "").replace(
          /^[•-]\s?/,
          ""
        );
        text += `- ${extra}`;
      } else if (el.dataset.number) {
        const prefix = el.dataset.number;
        const content = normalizeTextChunk(el.textContent || "");
        text += content.startsWith(prefix) ? content : `${prefix}${content}`;
      } else if (el.nodeName === "DIV" || el.nodeName === "P") {
        if (text.length > 0 && !text.endsWith("\n")) {
          text += "\n";
        }
        for (let i = 0; i < el.childNodes.length; i++) {
          walk(el.childNodes[i]);
        }
      } else {
        for (let i = 0; i < el.childNodes.length; i++) {
          walk(el.childNodes[i]);
        }
      }
    }
  }

  for (let i = 0; i < element.childNodes.length; i++) {
    walk(element.childNodes[i]);
  }

  return text;
}

function getCaretOffsetWithin(root: HTMLElement): number {
  if (typeof window === "undefined") return 0;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;

  const range = sel.getRangeAt(0);
  const { endContainer, endOffset } = range;

  if (!root.contains(endContainer)) return 0;

  let offset = 0;
  let found = false;

  function walk(node: Node): void {
    if (found) return;

    if (node === endContainer) {
      if (node.nodeType === Node.TEXT_NODE) {
        const slice = (node.nodeValue || "").slice(0, endOffset);
        offset += normalizeTextChunk(slice).length;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        for (let i = 0; i < endOffset && i < el.childNodes.length; i++) {
          walk(el.childNodes[i]);
          if (found) return;
        }
      }
      found = true;
      return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      offset += normalizeTextChunk(node.nodeValue || "").length;
    } else if (node.nodeName === "BR") {
      offset += 1;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.dataset.bullet) {
        if (el.contains(endContainer)) {
          offset += 2;
          found = true;
          return;
        }
        offset += 2;
      } else if (el.dataset.number) {
        const len = el.dataset.number.length;
        if (el.contains(endContainer)) {
          offset += len;
          found = true;
          return;
        }
        offset += len;
      } else if (el.nodeName === "DIV" || el.nodeName === "P") {
        if (offset > 0) offset += 1;
        for (let i = 0; i < el.childNodes.length; i++) {
          walk(el.childNodes[i]);
          if (found) return;
        }
      } else {
        for (let i = 0; i < el.childNodes.length; i++) {
          walk(el.childNodes[i]);
          if (found) return;
        }
      }
    }
  }

  walk(root);
  return offset;
}

function setCaretOffsetWithin(root: HTMLElement, targetOffset: number): void {
  if (typeof window === "undefined") return;
  const sel = window.getSelection();
  if (!sel) return;

  const clampedTarget = Math.max(0, targetOffset);
  let current = 0;
  let placed = false;
  let lastEditableTextNode: Text | null = null;

  function placeAt(node: Node, offset: number) {
    const range = document.createRange();
    const maxOffset =
      node.nodeType === Node.TEXT_NODE
        ? (node as Text).length
        : node.childNodes.length;
    range.setStart(node, Math.min(Math.max(0, offset), maxOffset));
    range.collapse(true);
    sel!.removeAllRanges();
    sel!.addRange(range);
    placed = true;
  }

  function walk(node: Node): void {
    if (placed) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      lastEditableTextNode = textNode;
      const raw = textNode.nodeValue || "";
      const strippedLen = normalizeTextChunk(raw).length;

      if (current + strippedLen >= clampedTarget) {
        const needed = clampedTarget - current;
        if (needed === 0 && raw === ZERO_WIDTH_SPACE) {
          placeAt(textNode, 1);
          return;
        }
        let seen = 0;
        let rawPos = 0;
        while (rawPos < raw.length && seen < needed) {
          if (raw[rawPos] !== ZERO_WIDTH_SPACE) {
            seen++;
          }
          rawPos++;
        }
        // Step past any leading zero-width space when placing at start of sentinel node
        while (rawPos < raw.length && raw[rawPos] === ZERO_WIDTH_SPACE) {
          rawPos++;
        }
        placeAt(textNode, rawPos);
        return;
      }

      current += strippedLen;
    } else if (node.nodeName === "BR") {
      if (current === clampedTarget && node.parentNode) {
        const idx = Array.from(node.parentNode.childNodes).indexOf(
          node as ChildNode
        );
        placeAt(node.parentNode, idx);
        return;
      }
      current += 1;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      // Never place caret inside non-editable bullet/number marker spans
      if (el.dataset.bullet) {
        current += 2;
        return;
      }
      if (el.dataset.number) {
        current += el.dataset.number.length;
        return;
      }
      for (let i = 0; i < el.childNodes.length; i++) {
        walk(el.childNodes[i]);
        if (placed) return;
      }
    }
  }

  walk(root);

  if (!placed) {
    if (lastEditableTextNode) {
      placeAt(lastEditableTextNode, (lastEditableTextNode as Text).length);
    } else {
      placeAt(root, root.childNodes.length);
    }
  }
}

export const WhatsAppChatInput = forwardRef<
  WhatsAppChatInputRef,
  WhatsAppChatInputProps
>(function WhatsAppChatInput(
  {
    id,
    value,
    onChange,
    onSend,
    onPaste,
    placeholder = "Type a message...",
    disabled = false,
    multiline = false,
    showToolbar = false,
    maxLength,
    className,
    "aria-label": ariaLabel = "Message",
  },
  ref
) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const isComposingRef = useRef(false);
  const lastSyncValueRef = useRef(value);

  const commitTextAndCaret = useCallback(
    (nextText: string, nextCaret: number) => {
      const el = editorRef.current;
      const bounded =
        typeof maxLength === "number" ? nextText.slice(0, maxLength) : nextText;
      const boundedCaret = Math.min(nextCaret, bounded.length);
      lastSyncValueRef.current = bounded;
      onChange(bounded);
      if (el) {
        el.innerHTML = formatWhatsAppMarkupToHtml(bounded);
        setCaretOffsetWithin(el, boundedCaret);
      }
    },
    [maxLength, onChange]
  );

  // Sync external value changes (e.g. clear on send, insert emoji, reply quote, form reset)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    if (value === "") {
      if (el.innerHTML !== "") {
        el.innerHTML = "";
      }
      lastSyncValueRef.current = "";
      return;
    }

    const currentDomText = getPlainTextFromDom(el);
    const expectedHtml = formatWhatsAppMarkupToHtml(value);
    if (currentDomText !== value || (el.innerHTML === "" && expectedHtml !== "")) {
      const isFocused = document.activeElement === el;
      const caret = isFocused ? getCaretOffsetWithin(el) : value.length;
      el.innerHTML = expectedHtml;
      if (isFocused) {
        setCaretOffsetWithin(el, Math.min(caret, value.length));
      }
      lastSyncValueRef.current = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el || isComposingRef.current) return;

    let rawText = getPlainTextFromDom(el);
    let caret = getCaretOffsetWithin(el);

    if (typeof maxLength === "number" && rawText.length > maxLength) {
      rawText = rawText.slice(0, maxLength);
      caret = Math.min(caret, maxLength);
    }

    lastSyncValueRef.current = rawText;
    onChange(rawText);

    const formattedHtml = formatWhatsAppMarkupToHtml(rawText);
    if (el.innerHTML !== formattedHtml) {
      el.innerHTML = formattedHtml;
      setCaretOffsetWithin(el, caret);
    }
  }, [maxLength, onChange]);

  const toggleFormat = useCallback(
    (marker: string) => {
      const el = editorRef.current;
      if (!el || disabled) return;

      el.focus();
      const sel = window.getSelection();
      const selectedText = sel && sel.rangeCount > 0 ? normalizeTextChunk(sel.toString()) : "";
      const currentText = getPlainTextFromDom(el);
      const caret = getCaretOffsetWithin(el);

      if (selectedText) {
        const start = Math.max(0, caret - selectedText.length);
        const end = caret;
        const next =
          currentText.slice(0, start) +
          `${marker}${selectedText}${marker}` +
          currentText.slice(end);
        commitTextAndCaret(next, end + marker.length * 2);
      } else {
        const next =
          currentText.slice(0, caret) +
          `${marker}${marker}` +
          currentText.slice(caret);
        commitTextAndCaret(next, caret + marker.length);
      }
    },
    [commitTextAndCaret, disabled]
  );

  const toggleLinePrefix = useCallback(
    (kind: "bullet" | "number") => {
      const el = editorRef.current;
      if (!el || disabled) return;

      el.focus();
      const currentText = getPlainTextFromDom(el);
      const caret = getCaretOffsetWithin(el);
      const lastNewline = currentText.lastIndexOf("\n", Math.max(0, caret - 1));
      const lineStart = lastNewline + 1;
      const lineEndIdx = currentText.indexOf("\n", caret);
      const lineEnd = lineEndIdx === -1 ? currentText.length : lineEndIdx;
      const line = currentText.slice(lineStart, lineEnd);

      const bulletMatch = line.match(/^([-•]) /);
      const numMatch = line.match(/^(\d+\.) /);

      let nextLine = line;
      let delta = 0;

      if (kind === "bullet") {
        if (bulletMatch) {
          nextLine = line.slice(bulletMatch[0].length);
          delta = -bulletMatch[0].length;
        } else if (numMatch) {
          nextLine = `- ${line.slice(numMatch[0].length)}`;
          delta = 2 - numMatch[0].length;
        } else {
          nextLine = `- ${line}`;
          delta = 2;
        }
      } else {
        if (numMatch) {
          nextLine = line.slice(numMatch[0].length);
          delta = -numMatch[0].length;
        } else if (bulletMatch) {
          nextLine = `1. ${line.slice(bulletMatch[0].length)}`;
          delta = 3 - bulletMatch[0].length;
        } else {
          nextLine = `1. ${line}`;
          delta = 3;
        }
      }

      const next =
        currentText.slice(0, lineStart) + nextLine + currentText.slice(lineEnd);
      commitTextAndCaret(next, Math.max(lineStart, caret + delta));
    },
    [commitTextAndCaret, disabled]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    // Ctrl+B / Cmd+B toggles *
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      toggleFormat("*");
      return;
    }

    // Ctrl+I / Cmd+I toggles _
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      toggleFormat("_");
      return;
    }

    // Backspace right after a list marker removes the list marker cleanly
    if (e.key === "Backspace" && !e.nativeEvent.isComposing) {
      const sel = window.getSelection();
      const el = editorRef.current;
      if (el && sel && sel.isCollapsed) {
        const rawText = getPlainTextFromDom(el);
        const caret = getCaretOffsetWithin(el);
        const lastNewline = rawText.lastIndexOf("\n", Math.max(0, caret - 1));
        const lineStart = lastNewline + 1;
        const beforeCaretOnLine = rawText.slice(lineStart, caret);
        if (/^([-•] |\d+\. )$/.test(beforeCaretOnLine)) {
          e.preventDefault();
          const next = rawText.slice(0, lineStart) + rawText.slice(caret);
          commitTextAndCaret(next, lineStart);
          return;
        }
      }
    }

    // Enter handling
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      if (!multiline && !e.shiftKey) {
        e.preventDefault();
        onSend?.();
        return;
      }

      // Multiline newline (Enter in multiline mode, or Shift+Enter in chat mode)
      const el = editorRef.current;
      if (!el) return;
      e.preventDefault();

      const rawText = getPlainTextFromDom(el);
      const caret = getCaretOffsetWithin(el);
      const lastNewline = rawText.lastIndexOf("\n", Math.max(0, caret - 1));
      const lineStart = lastNewline + 1;
      const lineEndIdx = rawText.indexOf("\n", caret);
      const lineEnd = lineEndIdx === -1 ? rawText.length : lineEndIdx;
      const lineBeforeCaret = rawText.slice(lineStart, caret);
      const restOfLine = rawText.slice(caret, lineEnd);

      // Pressing Enter on an empty bullet/numbered item exits the list
      if (/^([-•] |\d+\. )$/.test(lineBeforeCaret) && restOfLine === "") {
        const next = rawText.slice(0, lineStart) + rawText.slice(caret);
        commitTextAndCaret(next, lineStart);
        return;
      }

      // Auto-continue bullet list
      const bulletLine = lineBeforeCaret.match(/^([-•]) /);
      if (bulletLine) {
        const insert = "\n- ";
        const next = rawText.slice(0, caret) + insert + rawText.slice(caret);
        commitTextAndCaret(next, caret + insert.length);
        return;
      }

      // Auto-continue numbered list
      const numLine = lineBeforeCaret.match(/^(\d+)\. /);
      if (numLine) {
        const nextNum = Number.parseInt(numLine[1], 10) + 1;
        const insert = `\n${nextNum}. `;
        const next = rawText.slice(0, caret) + insert + rawText.slice(caret);
        commitTextAndCaret(next, caret + insert.length);
        return;
      }

      const next = rawText.slice(0, caret) + "\n" + rawText.slice(caret);
      commitTextAndCaret(next, caret + 1);
    }
  };

  const handleNativePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (onPaste) {
      onPaste(e);
      if (e.defaultPrevented) return;
    }

    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;

    const el = editorRef.current;
    if (!el) return;

    const currentText = getPlainTextFromDom(el);
    const caret = getCaretOffsetWithin(el);
    const next = currentText.slice(0, caret) + text + currentText.slice(caret);
    commitTextAndCaret(next, caret + text.length);
  };

  useImperativeHandle(ref, () => ({
    focus: () => editorRef.current?.focus(),
    get selectionStart() {
      return editorRef.current ? getCaretOffsetWithin(editorRef.current) : 0;
    },
    get selectionEnd() {
      return editorRef.current ? getCaretOffsetWithin(editorRef.current) : 0;
    },
    setSelectionRange: (start: number, end: number) => {
      if (editorRef.current) {
        setCaretOffsetWithin(editorRef.current, end);
      }
    },
    get value() {
      return editorRef.current ? getPlainTextFromDom(editorRef.current) : value;
    },
  }));

  const editorElement = (
    <div
      id={id}
      ref={editorRef}
      contentEditable={!disabled}
      role="textbox"
      aria-multiline="true"
      aria-label={ariaLabel}
      data-placeholder={placeholder}
      tabIndex={0}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handleNativePaste}
      onCompositionStart={() => {
        isComposingRef.current = true;
      }}
      onCompositionEnd={() => {
        isComposingRef.current = false;
        handleInput();
      }}
      className={cn(
        "flex-1 min-w-0 min-h-9 max-h-36 overflow-y-auto px-3 py-2 text-base sm:text-sm bg-muted/30 focus:bg-background rounded-md outline-none transition-colors border border-transparent focus:border-input",
        "whitespace-pre-wrap break-words font-sans leading-relaxed select-text",
        !value &&
          "before:content-[attr(data-placeholder)] before:text-muted-foreground before:pointer-events-none before:select-none",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    />
  );

  if (!showToolbar) {
    return editorElement;
  }

  return (
    <div className="rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 px-2 py-1.5">
        <button
          type="button"
          disabled={disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            toggleLinePrefix("bullet");
          }}
          className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          title="Bullet list (- )"
        >
          <List className="h-3.5 w-3.5" />
          <span>Bullets</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            toggleLinePrefix("number");
          }}
          className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          title="Numbered list (1. )"
        >
          <ListOrdered className="h-3.5 w-3.5" />
          <span>Numbered</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            toggleFormat("*");
          }}
          className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          title="Bold (*text*)"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onMouseDown={(e) => {
            e.preventDefault();
            toggleFormat("_");
          }}
          className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          title="Italic (_text_)"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">
          Type <code>- </code> or <code>1. </code> for lists
        </span>
      </div>
      {editorElement}
    </div>
  );
});
