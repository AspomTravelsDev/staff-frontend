"use client";

import { useRef, useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getStandaloneEmail, getStandaloneEmailComposer, prepareStandaloneEmail, saveStandaloneEmail, sendStandaloneEmail } from "@/lib/api/standalone-recruitment-email";
import { emailFieldsComplete, visibleEmailFields } from "@/lib/recruitment/email-template";
import type { StandaloneEmailComposer, StandaloneEmailInput, StandaloneEmailRecord } from "@/lib/types/standalone-recruitment-email";

type Form = StandaloneEmailInput & { id: string; status: StandaloneEmailRecord["status"] };
const blank = (): Form => ({ id: crypto.randomUUID(), revision: 0, applicant_name: "", recipient: "", role_title: "", template: "call_screening_pass", fields: {}, subject: "", body: "", status: "draft" });
function formFrom(record: StandaloneEmailRecord): Form {
  return { id: record.id, revision: record.revision, applicant_name: record.applicant_name, recipient: record.recipient, role_title: record.role_title, template: record.template, fields: record.template_fields ?? {}, subject: record.subject, body: record.body, status: record.status };
}
const statuses = { draft: "Draft", failed: "Delivery failed", sending: "Delivery awaiting confirmation", sent: "Sent" };

export function StandaloneRecruitmentEmailDialog({ initialData, className }: { initialData?: StandaloneEmailComposer | null; className?: string }) {
  const [open, setOpen] = useState(false), [data, setData] = useState(initialData ?? null);
  const [form, setForm] = useState<Form>(blank);
  const [editing, setEditing] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [needsReload, setNeedsReload] = useState(false);
  const [messageSignature, setMessageSignature] = useState<string | null>(null);
  const running = useRef(false), saved = useRef(JSON.stringify(form));
  const template = data?.templates.find(item => item.key === form.template);
  const stage = template?.stage ?? "call_screening", outcome = template?.outcome ?? "pass";
  const locked = form.status === "sent" || form.status === "sending";
  const dirty = JSON.stringify(form) !== saved.current;
  const complete = !!template && !!form.applicant_name.trim() && !!form.role_title.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.recipient.trim()) && emailFieldsComplete(template.field_definitions, form.fields);
  const placeholders = /\{\{[^}]+\}\}|\[[^\]\r\n]+\]/.test(`${form.subject}\n${form.body}`);
  function apply(record: StandaloneEmailRecord) {
    const next = formFrom(record); setForm(next); saved.current = JSON.stringify(next); setEditing(!next.body.trim() && !next.subject.trim());
    setMessageSignature(record.signature_html ?? null);
    setNeedsReload(false);
    setData(previous => previous ? { ...previous, history: [record, ...previous.history.filter(item => item.id !== record.id)].slice(0, 20) } : previous);
  }
  async function launch() {
    setOpen(true); setError("");
    if (data || running.current) return;
    running.current = true; setBusy(true);
    try { setData(await getStandaloneEmailComposer()); }
    catch { setError("Email templates could not be loaded. Please retry."); }
    finally { running.current = false; setBusy(false); }
  }
  async function persist(action: "draft" | "prepare" | "send", closeAfter = false) {
    if (running.current || !data || locked || needsReload || (action !== "draft" && !complete)) return false;
    if (action === "send" && (editing || placeholders || !form.subject.trim() || !form.body.trim())) return false;
    running.current = true; setBusy(true); setError(""); setNotice("");
    const id = form.id;
    const input: StandaloneEmailInput = {
      revision: form.revision, applicant_name: form.applicant_name, recipient: form.recipient,
      role_title: form.role_title, template: form.template, fields: form.fields, subject: form.subject, body: form.body,
    };
    try {
      const result = await (action === "send" ? sendStandaloneEmail : action === "prepare" ? prepareStandaloneEmail : saveStandaloneEmail)(id, input);
      if (!result.success) {
        setError(result.error);
        if (result.code === "HTTP_409") setNeedsReload(true);
        if (action === "send" && !["HTTP_422", "HTTP_403", "HTTP_409"].includes(result.code)) {
          const record = await getStandaloneEmail(id);
          if (record.body === form.body && record.subject === form.subject && record.recipient === form.recipient) apply(record); else setNeedsReload(true);
        }
        return false;
      }
      apply(result.data);
      if (action === "prepare") { setEditing(false); setNotice("Email prepared. Edit the subject and message below before sending."); }
      else setNotice(action === "send" ? "Email sent successfully." : "Draft saved. You can reopen it from Recent emails.");
      if (closeAfter) setOpen(false);
      return true;
    } catch {
      if (action === "send") setNeedsReload(true);
      setError(action === "send" ? "Sending could not be confirmed. Load the saved message to check its status before retrying." : "Your email could not be saved. Please retry before closing.");
      return false;
    } finally { running.current = false; setBusy(false); }
  }
  function close() {
    if (running.current) return;
    if (needsReload && dirty) {
      if (window.confirm("Close without saving these edits? The saved message remains in Recent emails.")) setOpen(false);
    } else if (dirty && !locked) void persist("draft", true); else setOpen(false);
  }
  async function load(id: string, discard = false) {
    if (running.current) return;
    if (discard && dirty && !window.confirm("Load the saved message and discard these unsaved edits?")) return;
    if (!discard && dirty && !locked && !await persist("draft")) return;
    running.current = true; setBusy(true); setError(""); setNotice("");
    try { apply(await getStandaloneEmail(id)); }
    catch { setError("The saved message could not be loaded. Please retry."); }
    finally { running.current = false; setBusy(false); }
  }
  function newMessage() {
    if (running.current) return;
    const next = blank(); setForm(next); saved.current = JSON.stringify(next); setEditing(true); setError(""); setNotice(""); setNeedsReload(false); setMessageSignature(null);
  }
  function editDetails() {
    if (form.body && !window.confirm("Edit the applicant or template details? You will rebuild the message, replacing its current edits.")) return;
    setEditing(true); setForm(previous => ({ ...previous, subject: "", body: "" }));
  }
  return <>
    <Button variant="outline" className={className} onClick={() => void launch()}><Mail />Send recruitment email</Button>
    {open && <Dialog open onOpenChange={value => { if (!value) close(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl" onInteractOutside={event => { if (busy) event.preventDefault(); }}>
        <DialogHeader><DialogTitle>Send recruitment email</DialogTitle><DialogDescription>Enter an applicant’s details, choose the stage and result, then prepare and edit their email.</DialogDescription></DialogHeader>
        {!data && <Button variant="outline" disabled={busy} onClick={() => void launch()}>{busy ? "Loading templates…" : "Retry loading templates"}</Button>}
        {data && <form className="space-y-4" onSubmit={event => { event.preventDefault(); void persist(editing ? "prepare" : "send"); }}>
          <details open={editing} className="space-y-3">
            <summary className="cursor-pointer break-words text-sm font-medium">{editing ? "Applicant and template details" : `${form.applicant_name} · ${form.recipient}`}</summary>
            <div className="grid gap-4 sm:grid-cols-2">
            {([['applicant_name', 'Applicant name', 'text'], ['recipient', 'Email address', 'email'], ['role_title', 'Role applied for', 'text']] as const).map(([key, label, type]) => <div key={key} className="space-y-2"><Label htmlFor={`standalone-${key}`}>{label} *</Label><Input id={`standalone-${key}`} type={type} maxLength={255} required value={form[key]} disabled={busy || !editing || locked} onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))} /></div>)}
            <div className="space-y-2"><Label htmlFor="standalone-stage">Stage *</Label><select id="standalone-stage" required disabled={busy || !editing || locked} value={stage} onChange={event => setForm(previous => ({ ...previous, template: `${event.target.value}_${outcome}`, fields: {} }))} className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm">{data.templates.filter(item => item.outcome === "pass").map(item => <option key={item.stage} value={item.stage}>{item.stage_label}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="standalone-outcome">Result *</Label><select id="standalone-outcome" required disabled={busy || !editing || locked} value={outcome} onChange={event => setForm(previous => ({ ...previous, template: `${stage}_${event.target.value}`, fields: {} }))} className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"><option value="pass">Pass</option><option value="fail">Fail</option></select></div>
            {template && visibleEmailFields(template.field_definitions, form.fields).map(field => {
              const props = { id: `standalone-${field.key}`, required: field.required, disabled: busy || !editing || locked, value: String(form.fields[field.key] ?? ""), onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(previous => ({ ...previous, fields: { ...previous.fields, [field.key]: event.target.value } })) };
              return <div key={field.key} className={`space-y-2 ${["url", "textarea"].includes(field.type) ? "sm:col-span-2" : ""}`}><Label htmlFor={props.id}>{field.label} *</Label>{field.type === "textarea" ? <Textarea {...props} maxLength={2000} rows={3} /> : field.type === "select" ? <select {...props} className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"><option value="">Select an option</option>{Object.entries(field.options ?? {}).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : <Input {...props} type={field.type} maxLength={2000} min={field.type === "number" ? 1 : undefined} max={field.type === "number" ? 480 : undefined} step={field.type === "number" ? 1 : undefined} />}</div>;
            })}
            </div>
          </details>
          {!editing && <section className="space-y-4 border-t pt-4" aria-label="Edit email">
            <p className="break-words text-sm text-muted-foreground">{form.role_title} · {template?.stage_label} · {outcome === "pass" ? "Pass" : "Fail"}</p>
            <p className="text-sm">{locked ? statuses[form.status] : "Review and edit your message before sending."}</p>
            <div className="space-y-2"><Label htmlFor="standalone-subject">Subject *</Label><Input id="standalone-subject" required maxLength={255} value={form.subject} disabled={busy || locked} onChange={event => setForm(previous => ({ ...previous, subject: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="standalone-body">Message *</Label><Textarea id="standalone-body" required maxLength={20000} rows={14} value={form.body} disabled={busy || locked} onChange={event => setForm(previous => ({ ...previous, body: event.target.value }))} /></div>
            {placeholders && <p className="text-sm text-destructive">Replace all placeholders before sending.</p>}
            <details className="space-y-2"><summary className="cursor-pointer text-sm font-medium">Preview email and signature</summary><p className="text-sm font-semibold">{form.subject}</p><p className="whitespace-pre-wrap break-words text-sm">{form.body}</p><iframe title="Standalone email signature preview" sandbox="" referrerPolicy="no-referrer" srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:12px;background:white;overflow-wrap:anywhere}img{max-width:100%}</style></head><body>${messageSignature ?? data.signature_html}</body></html>`} className="h-[660px] w-full rounded-md border bg-white" /></details>
          </section>}
          <div className="space-y-1 text-xs text-muted-foreground"><p>CC: {data.cc ?? "None — HR is not copied outside production"}</p><p>Reply to: {data.reply_to}</p></div>
          <div className="flex flex-wrap gap-2">
            {!locked && <><Button type="submit" disabled={busy || needsReload || !complete || (!editing && (placeholders || !form.body.trim() || !form.subject.trim()))}>{busy ? "Working…" : editing ? "Prepare email" : "Send email"}</Button><Button type="button" variant="outline" disabled={busy || needsReload} onClick={() => void persist("draft")}>Save draft</Button>{!editing && <Button type="button" variant="outline" disabled={busy || needsReload} onClick={editDetails}>Edit details</Button>}</>}
            {locked && <Button type="button" variant="outline" disabled={busy} onClick={newMessage}>New email</Button>}
            {(needsReload || form.status === "sending") && <Button type="button" variant="outline" disabled={busy} onClick={() => void load(form.id, true)}>Load saved message</Button>}
            <Button type="button" variant="outline" disabled={busy} onClick={close}>{dirty && !locked && !needsReload ? "Save and close" : "Close"}</Button>
          </div>
        </form>}
        {notice && <p role="status" className="text-sm">{notice}</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {!!data?.history.length && <details className="space-y-2 border-t pt-4"><summary className="cursor-pointer text-sm font-medium">Recent emails</summary><ul className="divide-y">{data.history.map(item => <li key={item.id} className="py-2"><Button type="button" variant="link" className="h-auto max-w-full justify-start whitespace-normal p-0 text-left" disabled={busy} onClick={() => void load(item.id)}>{item.applicant_name || "Unnamed applicant"} · {item.role_title || "Role not entered"} · {statuses[item.status]}</Button><p className="break-all text-xs text-muted-foreground">{item.recipient || "Email not entered"} · {new Date(item.sent_at ?? item.updated_at).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })}</p></li>)}</ul></details>}
      </DialogContent>
    </Dialog>}
  </>;
}
