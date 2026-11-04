"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getRecruitmentEmails, saveRecruitmentEmailDraft, sendRecruitmentEmail, skipRecruitmentEmail } from "@/lib/api/recruitment-email";
import { emailFieldsComplete, previewRecruitmentEmail, visibleEmailFields } from "@/lib/recruitment/email-template";
import type { RecruitmentEmailInput, RecruitmentEmailRecord, RecruitmentEmails } from "@/lib/types/recruitment-email";

export function CandidateEmailsDialog({ candidateId, name, onClose, onChanged }: {
  candidateId: string; name: string; onClose: () => void; onChanged?: (status: RecruitmentEmailRecord["status"]) => void;
}) {
  const [data, setData] = useState<RecruitmentEmails | null>(null);
  const [fields, setFields] = useState<RecruitmentEmailInput["fields"]>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [needsReload, setNeedsReload] = useState(false);
  const inFlight = useRef(false);
  const changed = useRef(onChanged); changed.current = onChanged;
  useEffect(() => {
    let cancelled = false;
    getRecruitmentEmails(candidateId).then(result => {
      if (cancelled) return;
      setData(result); setFields(result.draft?.fields ?? {});
    }).catch(() => { if (!cancelled) setError("Emails could not be loaded. Close and reopen to retry."); });
    return () => { cancelled = true; };
  }, [candidateId]);
  const draft = data?.draft;
  const dirty = !!draft && JSON.stringify(fields) !== JSON.stringify(draft.fields);
  const complete = !!draft && emailFieldsComplete(draft.field_definitions, fields);
  const body = draft ? previewRecruitmentEmail(draft.body_template, draft.field_definitions, fields) : "";

  async function perform(action: "save" | "send" | "skip", closeAfter = false) {
    if (!data?.draft || inFlight.current || needsReload || (action === "send" && (!complete || !data.recipient))) return;
    inFlight.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const input = { event_id: data.draft.event_id, revision: data.revision, draft_revision: data.draft.draft_revision, fields };
      const result = await (action === "send" ? sendRecruitmentEmail : action === "skip" ? skipRecruitmentEmail : saveRecruitmentEmailDraft)(candidateId, input);
      if (!result.success) {
        setError(result.error);
        // Delivery failures are saved with a new revision; read it before retrying.
        if (action === "send") {
          const fresh = await getRecruitmentEmails(candidateId);
          setData(fresh);
          const saved = fresh.history.find(email => email.event_id === input.event_id);
          if (fresh.draft && fresh.draft.draft_revision !== input.draft_revision) {
            if (saved?.status === "failed" && Object.entries(input.fields).every(([key, value]) => String(saved.template_fields[key] ?? "") === String(value ?? ""))) setFields(fresh.draft.fields);
            else setNeedsReload(true);
          }
          changed.current?.(saved?.status ?? "draft");
        }
        if (result.code === "409" || result.code === "HTTP_409") setNeedsReload(true);
        return;
      }
      const record = result.data;
      setData({ ...data, draft: action === "save" ? { ...data.draft, id: record.id, fields: record.template_fields, draft_revision: record.draft_revision } : null,
        history: [record, ...data.history.filter(email => email.id !== record.id)] });
      if (action === "save") setFields(record.template_fields);
      changed.current?.(record.status);
      setNotice(action === "send" ? "Email sent successfully." : action === "skip" ? "Email skipped. You can continue the recruitment process." : "Draft saved. You can return to it from Review email.");
      if (closeAfter) onClose();
    } catch {
      if (action === "send") setNeedsReload(true);
      setError(action === "send" ? "Sending could not be confirmed. Close and reopen to check the status before retrying." : "Your changes could not be saved. Please retry before closing.");
    } finally { inFlight.current = false; setBusy(false); }
  }
  function close() {
    if (inFlight.current) return;
    if (needsReload) {
      if (!dirty || window.confirm("Close without saving these edits? The saved email remains available from Candidate emails.")) onClose();
      return;
    }
    if (dirty) void perform("save", true); else onClose();
  }
  async function reload() {
    if (inFlight.current || (dirty && !window.confirm("Load the saved email and discard these unsaved edits?"))) return;
    inFlight.current = true; setBusy(true);
    try { const fresh = await getRecruitmentEmails(candidateId); setData(fresh); setFields(fresh.draft?.fields ?? {}); setNeedsReload(false); setError(""); }
    catch { setError("Emails could not be reloaded. Please retry."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <Dialog open onOpenChange={open => { if (!open) close(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl" onInteractOutside={event => { if (busy) event.preventDefault(); }}>
      <DialogHeader>
        <DialogTitle>Candidate emails · {name}</DialogTitle>
        <DialogDescription>Complete the details, then send or skip this email. Closing saves your edits and keeps the email pending.</DialogDescription>
      </DialogHeader>
      {!data && !error && <p role="status">Loading emails…</p>}
      {notice && <p role="status" className="text-sm">{notice}</p>}
      {data && <div className="space-y-4">
        <div className="space-y-1 break-all text-sm">
          <p>To: {data.recipient || "No candidate email address"}</p>
          <p>CC: {data.cc ?? "None — HR is not copied outside production"}</p>
          <p>Reply to: {data.reply_to}</p>
        </div>
        {draft ? <form onSubmit={event => { event.preventDefault(); void perform("send"); }} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleEmailFields(draft.field_definitions, fields).map(field => {
              const id = `email-${field.key}`;
              const props = { id, required: field.required, disabled: busy, value: String(fields[field.key] ?? ""), onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setFields(previous => ({ ...previous, [field.key]: event.target.value })) };
              return <div key={field.key} className={`space-y-2 ${field.type === "textarea" || field.type === "url" ? "sm:col-span-2" : ""}`}>
                <Label htmlFor={id}>{field.label}{field.required ? " *" : ""}</Label>
                {field.type === "select" ? <select {...props} className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"><option value="">Select an option</option>{Object.entries(field.options ?? {}).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                  : field.type === "textarea" ? <Textarea {...props} rows={3} maxLength={2000} />
                    : <Input {...props} type={field.type} min={field.type === "number" ? 1 : undefined} max={field.type === "number" ? 480 : undefined} step={field.type === "number" ? 1 : undefined} maxLength={2000} placeholder={field.type === "url" ? "https://…" : undefined} />}
              </div>;
            })}
          </div>
          {!!draft.field_definitions.length && <p className="text-xs text-muted-foreground">All displayed fields are required to send. Drafts can be saved before they are complete.</p>}
          <section aria-label="Email preview" className="space-y-3 rounded-md border p-4 text-sm">
            <h3 className="font-semibold">{draft.subject}</h3>
            <p className="whitespace-pre-wrap break-words">{body}</p>
          </section>
          {data.signature_html && <details aria-label="Email signature preview" className="space-y-2 border-t pt-4">
            <summary className="cursor-pointer text-sm font-medium">Preview signature</summary>
            <iframe title="Email signature preview" srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;padding:12px;background:#fff;overflow-wrap:anywhere}img{max-width:100%}</style></head><body>${data.signature_html}</body></html>`} sandbox="" referrerPolicy="no-referrer" className="h-[660px] w-full rounded-md border bg-white" />
          </details>}
          {!data.recipient && <p role="alert" className="text-sm text-destructive">Add a candidate email address before sending. You can still save or skip this email.</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || needsReload || !data.recipient || !complete}>Send email</Button>
            <Button type="button" variant="outline" disabled={busy || needsReload} onClick={() => void perform("save")}>Save draft</Button>
            <Button type="button" variant="outline" disabled={busy || needsReload} onClick={() => void perform("skip")}>Skip email</Button>
          </div>
        </form> : <p className="text-sm text-muted-foreground">No email is awaiting review. Messages become available after a matching recruitment decision.</p>}
        <section aria-label="Email history" className="space-y-2 border-t pt-4">
          <h3 className="text-sm font-semibold">Email history</h3>
          {!data.history.length && <p className="text-sm text-muted-foreground">No candidate emails recorded yet.</p>}
          {data.history.map(email => <details key={email.id} className="border-b py-2 text-sm">
            <summary className="cursor-pointer break-words">{email.subject} · {{ draft: "Draft", skipped: "Skipped", sent: "Sent", failed: "Delivery failed", sending: "Sending — confirmation pending" }[email.status]}</summary>
            <div className="mt-2 space-y-2">
              <p className="break-all">To: {email.recipient || "No email address"}</p>
              <p className="text-muted-foreground">{email.sender.name} · {new Date(email.sent_at ?? email.skipped_at ?? email.updated_at).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })}</p>
              <p className="whitespace-pre-wrap break-words">{email.body}</p>
            </div>
          </details>)}
        </section>
      </div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => void reload()}>Reload emails</Button><Button variant="outline" disabled={busy} onClick={close}>{dirty && !needsReload ? "Save and close" : "Close"}</Button></div>
    </DialogContent>
  </Dialog>;
}
