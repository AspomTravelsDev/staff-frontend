"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] w-full rounded-lg border bg-muted/40 animate-pulse" />
  ),
});

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, false] }, { size: ["small", false, "large", "huge"] }],
  ["bold", "italic", "underline", "strike", "code"],
  [{ color: [] }, { background: [] }],
  [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
  [{ align: [] }],
  ["blockquote", "code-block", "link"],
  ["clean"],
];

const FORMATS = [
  "header",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "code",
  "color",
  "background",
  "list",
  "indent",
  "align",
  "blockquote",
  "code-block",
  "link",
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  stickyToolbar?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
  className,
  stickyToolbar = false,
}: RichTextEditorProps) {
  return (
    <div
      className={cn(
        "aspom-rich-editor rounded-lg border border-border bg-card shadow-xs transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15",
        stickyToolbar && "rich-text-editor--sticky",
        className,
      )}
    >
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={{ toolbar: TOOLBAR_OPTIONS }}
        formats={FORMATS}
      />
      <style>{`
        .aspom-rich-editor .ql-toolbar.ql-snow {
          border: 0;
          border-bottom: 1px solid var(--border);
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background-color: color-mix(in oklab, var(--muted) 65%, var(--card));
          padding: 0.5rem 0.75rem;
          font-family: inherit;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.25rem;
        }
        .aspom-rich-editor .ql-toolbar.ql-snow .ql-formats {
          margin-right: 0.35rem;
          display: inline-flex;
          align-items: center;
          gap: 1px;
        }
        .aspom-rich-editor .ql-container.ql-snow {
          border: 0;
          font-family: inherit;
          font-size: 1rem;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          min-height: 360px;
          color: var(--foreground);
        }
        .aspom-rich-editor .ql-editor {
          min-height: 360px;
          padding: 1.25rem 1.5rem;
          line-height: 1.75;
          font-size: 1rem;
          color: var(--foreground);
        }
        .aspom-rich-editor.rich-text-editor--sticky .ql-toolbar.ql-snow {
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(8px);
          background-color: color-mix(in oklab, var(--card) 90%, var(--muted));
        }
        .aspom-rich-editor .ql-editor.ql-blank::before {
          color: var(--muted-foreground);
          font-style: normal;
          left: 1.5rem;
          right: 1.5rem;
        }
        /* Match published guide typography inside the editor (True WYSIWYG) */
        .aspom-rich-editor .ql-editor h1 {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
        }
        .aspom-rich-editor .ql-editor h2 {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.25;
          letter-spacing: -0.015em;
          margin-top: 1.5rem;
          margin-bottom: 0.65rem;
          padding-bottom: 0.35rem;
          border-bottom: 1px solid var(--border);
        }
        .aspom-rich-editor .ql-editor h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.35;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .aspom-rich-editor .ql-editor h4 {
          font-size: 1.075rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1rem;
          margin-bottom: 0.4rem;
        }
        .aspom-rich-editor .ql-editor p {
          margin-bottom: 0.85rem;
        }
        .aspom-rich-editor .ql-editor ol,
        .aspom-rich-editor .ql-editor ul {
          margin-top: 0.35rem;
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }
        .aspom-rich-editor .ql-editor li {
          margin-bottom: 0.35rem;
          line-height: 1.65;
        }
        .aspom-rich-editor .ql-editor blockquote {
          border-left: 4px solid var(--primary);
          background-color: color-mix(in oklab, var(--primary) 8%, var(--muted));
          padding: 0.9rem 1.2rem;
          margin: 1.15rem 0;
          border-radius: 0 0.625rem 0.625rem 0;
          color: var(--foreground);
        }
        .aspom-rich-editor .ql-editor code {
          font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875em;
          background-color: var(--muted);
          color: var(--foreground);
          padding: 0.15rem 0.4rem;
          border-radius: 0.3rem;
          border: 1px solid var(--border);
        }
        .aspom-rich-editor .ql-editor .ql-code-block-container {
          font-family: var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          background-color: #0f172a;
          color: #f8fafc;
          padding: 0.85rem 1.1rem;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        /* Font size classes matching previewer */
        .aspom-rich-editor .ql-editor .ql-size-small {
          font-size: 0.85em;
        }
        .aspom-rich-editor .ql-editor .ql-size-large {
          font-size: 1.225em;
          line-height: 1.6;
        }
        .aspom-rich-editor .ql-editor .ql-size-huge {
          font-size: 1.65em;
          line-height: 1.35;
        }
        /* Dark-mode & theme compatibility for Quill toolbar controls */
        .aspom-rich-editor .ql-snow .ql-stroke {
          stroke: var(--foreground);
        }
        .aspom-rich-editor .ql-snow .ql-fill,
        .aspom-rich-editor .ql-snow .ql-stroke.ql-fill {
          fill: var(--foreground);
        }
        .aspom-rich-editor .ql-snow .ql-picker {
          color: var(--foreground);
        }
        .aspom-rich-editor .ql-snow .ql-picker-options {
          background-color: var(--popover);
          color: var(--popover-foreground);
          border-color: var(--border) !important;
          border-radius: 0.5rem;
          padding: 0.35rem;
          box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.15);
        }
        .aspom-rich-editor .ql-snow.ql-toolbar button:hover,
        .aspom-rich-editor .ql-snow .ql-toolbar button:hover,
        .aspom-rich-editor .ql-snow.ql-toolbar button.ql-active,
        .aspom-rich-editor .ql-snow .ql-toolbar button.ql-active {
          background-color: color-mix(in oklab, var(--primary) 14%, transparent);
          border-radius: 0.3rem;
        }
      `}</style>
    </div>
  );
}

