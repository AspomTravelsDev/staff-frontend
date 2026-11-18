"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { cn } from "@/lib/utils";

export interface WhatsAppChatInputRef {
  focus: () => void;
  selectionStart: number;
  selectionEnd: number;
  setSelectionRange: (start: number, end: number) => void;
  value: string;
}

interface WhatsAppChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
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

export function formatWhatsAppMarkupToHtml(rawText: string): string {
  if (!rawText) return "";

  const lines = rawText.split("\n");
  const formattedLines = lines.map((line) => {
    let formatted = escapeHtml(line);

    // Unordered bullet list: -item, - item, •item, • item
    const bulletMatch = formatted.match(/^([-•])\s*(.*)$/);
    if (bulletMatch) {
      formatted =
        '<span class="text-primary font-bold inline-block mr-1.5 select-none" data-bullet="true">•</span>' +
        bulletMatch[2];
    } else {
      // Ordered list: 1.item or 1. item
      const numMatch = formatted.match(/^(\d+\.)\s*(.*)$/);
      if (numMatch) {
        formatted =
          `<span class="text-primary font-semibold inline-block mr-1.5 select-none" data-number="${numMatch[1]} ">${numMatch[1]} </span>` +
          numMatch[2];
      }
    }

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
  });

  return formattedLines.join("<br>");
}

function getPlainTextFromDom(element: HTMLElement): string {
  let text = "";

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.nodeValue || "";
    } else if (node.nodeName === "BR") {
      text += "\n";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      // If it's a bullet marker, restore standard hyphen bullet
      if (el.dataset.bullet) {
        text += "-";
      } else if (el.dataset.number) {
        text += el.dataset.number;
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

  // Normalize bullet symbols (•) back to standard WhatsApp '-' markers
  return text.replace(/^•/gm, "-");
}

function getCaretOffsetWithin(root: HTMLElement): number {
  if (typeof window === "undefined") return 0;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return 0;

  const range = sel.getRangeAt(0);
  const preRange = range.cloneRange();
  preRange.selectNodeContents(root);
  preRange.setEnd(range.endContainer, range.endOffset);
  return preRange.toString().length;
}

function setCaretOffsetWithin(root: HTMLElement, targetOffset: number): void {
  if (typeof window === "undefined") return;
  const sel = window.getSelection();
  if (!sel) return;

  let current = 0;
  let targetNode: any = null;
  let targetNodeOffset = 0;

  function walk(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.nodeValue?.length || 0;
      if (current + len >= targetOffset) {
        targetNode = node;
        targetNodeOffset = targetOffset - current;
        return true;
      }
      current += len;
    } else if (node.nodeName === "BR") {
      if (current + 1 >= targetOffset) {
        targetNode = node.parentNode;
        targetNodeOffset =
          Array.from(node.parentNode?.childNodes || []).indexOf(
            node as ChildNode
          ) + 1;
        return true;
      }
      current += 1;
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        if (walk(node.childNodes[i])) return true;
      }
    }
    return false;
  }

  walk(root);

  if (targetNode) {
    const range = document.createRange();
    const maxOffset =
      targetNode.nodeType === Node.TEXT_NODE
        ? (targetNode as Text).length
        : targetNode.childNodes.length;
    range.setStart(targetNode, Math.min(targetNodeOffset, maxOffset));
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

export const WhatsAppChatInput = forwardRef<
  WhatsAppChatInputRef,
  WhatsAppChatInputProps
>(function WhatsAppChatInput(
  {
    value,
    onChange,
    onSend,
    onPaste,
    placeholder = "Type a message...",
    disabled = false,
    className,
    "aria-label": ariaLabel = "Message",
  },
  ref
) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const isComposingRef = useRef(false);
  const lastSyncValueRef = useRef(value);

  // Sync external value changes (e.g. clear on send, insert emoji, reply quote)
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
    if (currentDomText !== value) {
      const caret = getCaretOffsetWithin(el);
      el.innerHTML = formatWhatsAppMarkupToHtml(value);
      setCaretOffsetWithin(el, Math.min(caret, value.length));
      lastSyncValueRef.current = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el || isComposingRef.current) return;

    const rawText = getPlainTextFromDom(el);
    lastSyncValueRef.current = rawText;
    onChange(rawText);

    // Apply live WhatsApp formatting preview in-box
    const formattedHtml = formatWhatsAppMarkupToHtml(rawText);
    if (el.innerHTML !== formattedHtml && (rawText.includes("*") || rawText.includes("_") || rawText.includes("-") || rawText.includes("1.") || rawText.includes("~") || rawText.includes("`"))) {
      const caret = getCaretOffsetWithin(el);
      el.innerHTML = formattedHtml;
      setCaretOffsetWithin(el, caret);
    }
  }, [onChange]);

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

    // Enter without Shift -> Send
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSend();
    }
  };

  const toggleFormat = (marker: string) => {
    const el = editorRef.current;
    if (!el) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const selectedText = sel.toString();
    const currentText = getPlainTextFromDom(el);
    const caret = getCaretOffsetWithin(el);

    if (selectedText) {
      const start = Math.max(0, caret - selectedText.length);
      const end = caret;
      const next =
        currentText.slice(0, start) +
        `${marker}${selectedText}${marker}` +
        currentText.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.innerHTML = formatWhatsAppMarkupToHtml(next);
        setCaretOffsetWithin(el, end + marker.length * 2);
      });
    } else {
      const next =
        currentText.slice(0, caret) +
        `${marker}${marker}` +
        currentText.slice(caret);
      onChange(next);
      requestAnimationFrame(() => {
        el.innerHTML = formatWhatsAppMarkupToHtml(next);
        setCaretOffsetWithin(el, caret + marker.length);
      });
    }
  };

  const handleNativePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (onPaste) {
      onPaste(e);
      if (e.defaultPrevented) return;
    }

    // If paste wasn't prevented by file handling, paste as plain text
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;

    const el = editorRef.current;
    if (!el) return;

    const currentText = getPlainTextFromDom(el);
    const caret = getCaretOffsetWithin(el);
    const next =
      currentText.slice(0, caret) + text + currentText.slice(caret);

    onChange(next);
    requestAnimationFrame(() => {
      el.innerHTML = formatWhatsAppMarkupToHtml(next);
      setCaretOffsetWithin(el, caret + text.length);
    });
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

  return (
    <div
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
        !value && "before:content-[attr(data-placeholder)] before:text-muted-foreground before:pointer-events-none before:select-none",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    />
  );
});
