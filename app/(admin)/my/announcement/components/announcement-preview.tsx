"use client";

import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function AnnouncementPreview({ open, onOpenChange, title, content, type, status }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  type: string;
  status?: string;
}) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  // Draft HTML stays inside an isolated, script-free document, including before review.
  const document = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: http: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><style>
    :root{color-scheme:${dark ? "dark" : "light"}}body{margin:0;padding:24px;color:${dark ? "#f1f5f9" : "#172033"};font:16px/1.75 system-ui,sans-serif;overflow-wrap:anywhere}p{margin:0 0 1em}h1,h2,h3{line-height:1.3}img{max-width:100%;height:auto}a{color:${dark ? "#93c5fd" : "#1d4ed8"}}blockquote{margin:1em 0;padding-left:1em;border-left:2px solid #94a3b8}pre{white-space:pre-wrap;overflow-wrap:anywhere}table{max-width:100%;border-collapse:collapse}td,th{border:1px solid #94a3b8;padding:8px}.ql-align-center{text-align:center}.ql-align-right{text-align:right}.ql-align-justify{text-align:justify}.ql-indent-1{padding-left:3em}
    </style></head><body>${content || "<p>No content yet.</p>"}</body></html>`;
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className="w-full gap-0 sm:max-w-3xl">
      <SheetHeader className="shrink-0 border-b pr-12">
        <SheetTitle className="break-words">{title.trim() || "Untitled announcement"}</SheetTitle>
        <SheetDescription>{type === "newsletter" ? "Newsletter" : "Announcement"} preview{status ? ` · ${status === "pending" ? "Pending review" : status === "approved" ? "Approved" : "Rejected"}` : " · Not submitted"}</SheetDescription>
      </SheetHeader>
      <iframe title="Announcement content preview" sandbox="" srcDoc={document} className="min-h-0 w-full flex-1 border-0 bg-background" />
    </SheetContent>
  </Sheet>;
}
