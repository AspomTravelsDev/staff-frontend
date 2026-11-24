"use client";

import { useRef, useState } from "react";
import { Paperclip, Loader2, Download, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProxiedImageUrl } from "@/lib/utils";
import { formatReadableDate } from "@/lib/utils/readable-date";
import type { PayrollRun, PayrollSupportingDocument } from "@/lib/api/payroll";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "attendance", label: "Attendance Sheet", downloadLabel: "Download attendance" },
  { key: "sanctions", label: "Sanction Sheet", downloadLabel: "Download sanction" },
  { key: "todo_reports", label: "To-do & Reports Sheet", downloadLabel: "Download to-do & reports" },
] as const;

export function PayrollSupportingDocuments({ run, canUpload, busy = false, onUpdated }: {
  run: PayrollRun;
  canUpload: boolean;
  busy?: boolean;
  onUpdated: (run: PayrollRun) => void;
}) {
  const [uploading, setUploading] = useState<string | null>(null);
  const uploadingRef = useRef(false);
  const allowedCategories = run.uploadable_document_categories ?? (["draft", "hr_draft"].includes(run.status) && (run.can_upload_documents ?? canUpload) ? CATEGORIES.map(category => category.key) : []);
  const documents = run.supporting_documents ?? [];

  const upload = async (category: PayrollSupportingDocument["category"], file: File) => {
    if (!allowedCategories.includes(category) || uploadingRef.current || busy) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Each supporting document must be 10 MB or smaller."); return; }
    uploadingRef.current = true;
    setUploading(category);
    try {
      const form = new FormData();
      form.append("category", category);
      form.append("file", file, file.name);
      const response = await fetch(`/api/payroll/runs/${run.id}/attachments`, { method: "POST", body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const details = body.errors ? Object.values(body.errors).flat().join(" ") : null;
        throw new Error(details || body.message || "Could not upload this document. Please try again.");
      }
      onUpdated(body.data);
      toast.success("Supporting document uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload this document. Please try again.");
    } finally {
      uploadingRef.current = false;
      setUploading(null);
    }
  };

  return <section aria-labelledby="payroll-documents-heading" className="rounded-lg border bg-background">
    <details className="group/documents">
      <summary data-payroll-tour="documents" className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-lg p-4 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <Paperclip className="size-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="payroll-documents-heading" className="text-sm font-semibold">Supporting documents</h2>
          <p className="mt-1 text-xs text-muted-foreground">Click to view attached documents</p>
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground group-open/documents:rotate-180" aria-hidden="true" />
      </summary>
    <div className="grid gap-5 border-t p-4 md:grid-cols-3">
      {CATEGORIES.map(category => {
        const versions = documents.filter(document => document.category === category.key).slice().sort((a, b) => b.version - a.version);
        const latest = versions[0];
        const editable = allowedCategories.includes(category.key);
        return <div key={category.key} className="min-w-0 space-y-2">
          <h3 className="text-sm font-medium">{category.label}</h3>
          {latest ? <div className="space-y-2">
            <a href={getProxiedImageUrl(latest.download_url)} download={latest.name} className="inline-flex min-h-9 max-w-full items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Download className="size-4 shrink-0" aria-hidden="true" />
              <span>{category.downloadLabel}</span>
            </a>
            <p className="text-xs leading-5 text-muted-foreground">Version {latest.version} · {latest.uploaded_by.name}<br />{formatReadableDate(latest.uploaded_at)}</p>
          </div> : <p className="text-sm text-muted-foreground">Not uploaded yet</p>}
          {editable && <div className="space-y-1"><Label htmlFor={`payroll-document-${category.key}`} className="sr-only">{latest ? "Upload revised" : "Upload"} {category.label}</Label><Input id={`payroll-document-${category.key}`} type="file" accept=".xls,.xlsx,.csv,.pdf,.doc,.docx,.jpg,.jpeg,.png" className="h-10 cursor-pointer py-1.5 file:mr-3 file:rounded file:bg-muted file:px-2 file:py-1 file:text-foreground" title="Up to 10 MB. Excel, CSV, PDF, Word or image." disabled={!editable || busy || uploading !== null} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void upload(category.key, file); }} /><p role="status" className="flex items-center gap-1 text-xs text-muted-foreground">{uploading === category.key && <><Loader2 className="size-3 animate-spin" aria-hidden="true" />Uploading…</>}</p></div>}
          {versions.length > 1 && <details className="text-xs"><summary className="cursor-pointer text-muted-foreground">Earlier versions ({versions.length - 1})</summary><ul className="mt-2 space-y-2">{versions.slice(1).map(document => <li key={document.id}><a href={getProxiedImageUrl(document.download_url)} target="_blank" rel="noopener noreferrer" className="break-words text-primary underline underline-offset-4">Download version {document.version}</a><p className="mt-1 text-muted-foreground">{document.uploaded_by.name} · {formatReadableDate(document.uploaded_at)}</p></li>)}</ul></details>}
        </div>;
      })}
    </div>
    </details>
  </section>;
}
