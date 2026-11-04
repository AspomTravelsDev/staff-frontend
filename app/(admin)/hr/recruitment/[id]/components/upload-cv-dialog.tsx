"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, Loader2 } from "lucide-react";
import { uploadCandidateCv } from "@/lib/api/recruitment";
import { CV_UPLOAD_LIMIT, cvFileError, runRecruitmentBatch } from "@/lib/recruitment/cv-intake";

type Intake = { id: string; file: File; name: string; email: string; phone: string; status: "ready" | "uploading" | "uploaded" | "failed" | "duplicate"; error: string; allowDuplicate?: boolean };
export function UploadCvDialog({ roleId, roleTitle, trigger, disabled = false, screeningOnUpload = false }: { roleId: string; roleTitle: string; trigger?: React.ReactNode; disabled?: boolean; screeningOnUpload?: boolean }) {
  const router = useRouter(), picker = useRef<HTMLInputElement>(null), running = useRef(false);
  const [open, setOpen] = useState(false), [rows, setRows] = useState<Intake[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState("");
  function add(files: FileList | null) {
    if (!files || running.current || disabled) return;
    if (rows.length + files.length > CV_UPLOAD_LIMIT) { setError(`Choose up to ${CV_UPLOAD_LIMIT} CVs per session. Remove files before adding more.`); return; }
    setError("");
    setRows(previous => [...previous, ...Array.from(files).map(file => ({ id: crypto.randomUUID(), file, name: file.name.replace(/\.[^.]+$/, ""), email: "", phone: "", status: "ready" as const, error: cvFileError(file) }))]);
    if (picker.current) picker.current.value = "";
  }
  function update(id: string, values: Partial<Intake>) { setRows(previous => previous.map(row => row.id === id ? { ...row, ...values } : row)); }
  async function upload(items: Intake[]) {
    if (running.current || disabled || !items.length) return;
    running.current = true; setBusy(true); setError("");
    try {
      await runRecruitmentBatch(items, async row => {
        update(row.id, { status: "uploading", error: "" });
        try {
          const body = new FormData(); body.append("cv_file", row.file); body.append("upload_id", row.id);
          if (row.name.trim()) body.append("name", row.name.trim());
          if (row.email.trim()) body.append("email", row.email.trim());
          if (row.phone.trim()) body.append("phone", row.phone.trim());
          if (row.allowDuplicate) body.append("allow_duplicate", "1");
          const result = await uploadCandidateCv(roleId, body);
          update(row.id, result.success ? { status: "uploaded", error: "" } : { status: result.errorCode === "CV_DUPLICATE" ? "duplicate" : "failed", error: result.error ?? "Upload failed. Please retry." });
        } catch { update(row.id, { status: "failed", error: "Upload could not be confirmed. Retry to check and finish this upload." }); }
      });
      router.refresh();
    } finally { running.current = false; setBusy(false); }
  }
  const pending = rows.filter(row => ["ready", "failed"].includes(row.status) && !cvFileError(row.file));
  const completed = rows.filter(row => row.status === "uploaded").length;
  function close(next: boolean) {
    if (running.current) return;
    setOpen(next);
    // Retain unuploaded files if HR closes and returns to the dialog.
    if (!next && rows.length && completed === rows.length) setRows([]);
  }
  return <Dialog open={open} onOpenChange={close}>
    <DialogTrigger asChild disabled={disabled}>{trigger ?? <Button disabled={disabled}><UploadCloud />Upload CVs</Button>}</DialogTrigger>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl" onInteractOutside={event => { if (busy) event.preventDefault(); }}>
      <DialogHeader>
        <DialogTitle>Upload CVs</DialogTitle>
        <DialogDescription>Add up to 20 candidates for {roleTitle}. Each CV creates one applicant. {screeningOnUpload ? "This role uses the earlier recruitment flow and runs AI screening during upload." : "Run Analyze selected from the applicant list when ready."}</DialogDescription>
      </DialogHeader>
      <form onSubmit={event => { event.preventDefault(); void upload(pending); }} className="space-y-4">
        <input ref={picker} type="file" multiple accept=".pdf,.docx,.doc,.txt" className="hidden" disabled={busy} onChange={event => add(event.target.files)} />
        <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); add(event.dataTransfer.files); }}>
          <Button type="button" variant="outline" className="h-auto w-full whitespace-normal border-dashed p-4" disabled={busy || rows.length >= CV_UPLOAD_LIMIT} onClick={() => picker.current?.click()}><UploadCloud />Choose or drop CVs · PDF, Word or TXT · 15 MB each</Button>
        </div>
        {!!rows.length && <p role="status" aria-live="polite" className="text-sm">{completed} of {rows.length} uploaded{busy ? " · Uploading…" : ""}</p>}
        <div className="space-y-4">
          {rows.map((row, index) => <section key={row.id} aria-label={`CV ${index + 1}: ${row.file.name}`} className="space-y-3 border-b pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="break-words text-sm font-medium">{row.file.name}</p><p className="text-xs text-muted-foreground">{(row.file.size / 1024 / 1024).toFixed(2)} MB · {{ ready: "Ready", uploading: "Uploading…", uploaded: "Uploaded", failed: "Upload failed", duplicate: "Possible duplicate" }[row.status]}</p></div>
              {row.status !== "uploaded" && <Button type="button" variant="ghost" disabled={busy} aria-label={`Remove ${row.file.name}`} onClick={() => setRows(previous => previous.filter(item => item.id !== row.id))}>Remove</Button>}
            </div>
            {row.status !== "uploaded" && <div className="grid gap-3 sm:grid-cols-3">
              {([['name', 'Candidate name'], ['email', 'Email (optional)'], ['phone', 'Phone (optional)']] as const).map(([field, label]) => <div key={field} className="space-y-1.5"><Label htmlFor={`${row.id}-${field}`}>{label}</Label><Input id={`${row.id}-${field}`} type={field === "email" ? "email" : "text"} value={row[field]} maxLength={field === "phone" ? 50 : 255} disabled={busy} onChange={event => update(row.id, { [field]: event.target.value, ...(row.status === "duplicate" ? { status: "ready", allowDuplicate: false, error: "" } : {}) })} /></div>)}
            </div>}
            {row.error && <p role="alert" className="break-words text-sm text-destructive">{row.error}</p>}
            {row.status === "duplicate" && <Button type="button" variant="outline" disabled={busy} onClick={() => void upload([{ ...row, allowDuplicate: true }])}>Upload anyway</Button>}
          </section>)}
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={() => close(false)}>{completed ? "Done" : "Close"}</Button>
          <Button type="submit" disabled={busy || disabled || !pending.length}>{busy ? <><Loader2 className="animate-spin" />Uploading…</> : `Upload ${pending.length || ""} CV${pending.length === 1 ? "" : "s"}`}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
