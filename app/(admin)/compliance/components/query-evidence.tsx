import { Paperclip } from "lucide-react";
import type { ComplianceIssue } from "@/lib/types/compliance";

export function QueryEvidence({ issue }: { issue: ComplianceIssue }) {
  if (!issue.evidence && !issue.evidence_documents?.length) return null;
  return <section className="space-y-2" aria-label="Evidence and references">
    <h3 className="text-sm font-semibold">Evidence / reference</h3>
    {issue.evidence && <p className="whitespace-pre-wrap break-words text-sm">{issue.evidence}</p>}
    {!!issue.evidence_documents?.length && <ul className="divide-y rounded-md border">
      {issue.evidence_documents.map(document => <li key={document.id}>
        <a className="flex items-start gap-2 p-3 text-sm underline underline-offset-4 hover:bg-muted/50" href={`/api/proxy/image/api/files/download/${encodeURIComponent(document.id)}`} target="_blank" rel="noopener noreferrer">
          <Paperclip className="mt-0.5 size-4 shrink-0" /><span className="min-w-0 break-words">{document.original_name}<span className="ml-2 text-xs text-muted-foreground">{Math.max(1, Math.round(document.file_size / 1024))} KB</span></span>
        </a>
      </li>)}
    </ul>}
  </section>;
}
