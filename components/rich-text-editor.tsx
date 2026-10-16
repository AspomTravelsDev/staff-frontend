"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full rounded-md border bg-muted animate-pulse" />
  ),
});

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link", "blockquote"],
  ["clean"],
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
    <div className={cn(className, stickyToolbar && "rich-text-editor--sticky")}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={{ toolbar: TOOLBAR_OPTIONS }}
        style={{ minHeight: "200px" }}
      />
      <style>{`
        .ql-container {
          font-family: inherit;
          font-size: 0.875rem;
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          border-color: hsl(var(--border));
          min-height: 160px;
        }
        .ql-toolbar {
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          border-color: hsl(var(--border));
          background-color: hsl(var(--muted));
        }
        .ql-editor {
          min-height: 160px;
        }
        .rich-text-editor--sticky .ql-toolbar {
          position: sticky;
          top: 0;
          z-index: 20;
          background-color: var(--background);
          border-color: var(--border);
        }
        .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }
      `}</style>
    </div>
  );
}
