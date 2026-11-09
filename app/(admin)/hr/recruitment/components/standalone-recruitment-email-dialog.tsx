"use client";

import { useRef, useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [emailView, setEmailView] = useState<"preview" | "edit">("preview");
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
    setEmailView("preview");
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
      if (action === "prepare") { setEditing(false); setEmailView("preview"); setNotice("Email prepared. Review the preview or edit the message before sending."); }
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
    const next = blank(); setForm(next); saved.current = JSON.stringify(next); setEditing(true); setEmailView("preview"); setError(""); setNotice(""); setNeedsReload(false); setMessageSignature(null);
  }
  function editDetails() {
    if (form.body && !window.confirm("Edit the applicant or template details? You will rebuild the message, replacing its current edits.")) return;
    setEditing(true); setEmailView("edit"); setForm(previous => ({ ...previous, subject: "", body: "" }));
  }
  return <>
    <Button variant="outline" className={className} onClick={() => void launch()}><Mail />Send recruitment email</Button>
    {open && <Dialog open onOpenChange={value => { if (!value) close(); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl" onInteractOutside={event => { if (busy) event.preventDefault(); }}>
        <DialogHeader><DialogTitle>Send recruitment email</DialogTitle><DialogDescription>Enter an applicant’s details, prepare the message, then review and edit it before sending.</DialogDescription></DialogHeader>
        {!data && <Button variant="outline" disabled={busy} onClick={() => void launch()}>{busy ? "Loading templates…" : "Retry loading templates"}</Button>}
        {data && <form className="space-y-4" onSubmit={event => { event.preventDefault(); void persist(editing ? "prepare" : "send"); }}>
          <details open={editing} className="space-y-3">
            <summary className="cursor-pointer break-words text-sm font-medium">{editing ? "Applicant and template details" : `${form.applicant_name} · ${form.recipient}`}</summary>
            <div className="grid gap-4 sm:grid-cols-2">
            {([['applicant_name', 'Applicant name', 'text'], ['recipient', 'Email address', 'email'], ['role_title', 'Role applied for', 'text']] as const).map(([key, label, type]) => <div key={key} className="space-y-2"><Label htmlFor={`standalone-${key}`}>{label} *</Label><Input id={`standalone-${key}`} type={type} maxLength={255} required value={form[key]} disabled={busy || !editing || locked} onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))} /></div>)}
            <div className="space-y-2"><Label htmlFor="standalone-stage">Stage *</Label><Select disabled={busy || !editing || locked} value={stage} onValueChange={value => setForm(previous => ({ ...previous, template: `${value}_${outcome}`, fields: {} }))}><SelectTrigger id="standalone-stage" className="w-full"><SelectValue placeholder="Choose stage" /></SelectTrigger><SelectContent className="max-h-72">{data.templates.filter(item => item.outcome === "pass").map(item => <SelectItem key={item.stage} value={item.stage}>{item.stage_label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="standalone-outcome">Result *</Label><Select disabled={busy || !editing || locked} value={outcome} onValueChange={value => setForm(previous => ({ ...previous, template: `${stage}_${value}`, fields: {} }))}><SelectTrigger id="standalone-outcome" className="w-full"><SelectValue placeholder="Choose result" /></SelectTrigger><SelectContent><SelectItem value="pass">Pass</SelectItem><SelectItem value="fail">Fail</SelectItem></SelectContent></Select></div>
            {template && visibleEmailFields(template.field_definitions, form.fields).map(field => {
              const props = { id: `standalone-${field.key}`, required: field.required, disabled: busy || !editing || locked, value: String(form.fields[field.key] ?? ""), onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm(previous => ({ ...previous, fields: { ...previous.fields, [field.key]: event.target.value } })) };
              return <div key={field.key} className={`space-y-2 ${["url", "textarea"].includes(field.type) ? "sm:col-span-2" : ""}`}><Label htmlFor={props.id}>{field.label} *</Label>{field.type === "textarea" ? <Textarea {...props} maxLength={2000} rows={3} /> : field.type === "select" ? <Select disabled={props.disabled} value={String(form.fields[field.key] ?? "") || undefined} onValueChange={value => setForm(previous => ({ ...previous, fields: { ...previous.fields, [field.key]: value, ...(field.key === "interview_format" ? { meeting_link: "", address: "" } : {}) } }))}><SelectTrigger id={props.id} className="w-full"><SelectValue placeholder="Select an option" /></SelectTrigger><SelectContent className="max-h-72">{Object.entries(field.options ?? {}).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select> : <Input {...props} type={field.type} maxLength={2000} min={field.type === "number" ? 1 : undefined} max={field.type === "number" ? 480 : undefined} step={field.type === "number" ? 1 : undefined} />}</div>;
            })}
            </div>
          </details>
          {!editing && <section className="space-y-4 border-t pt-4" aria-label="Email draft">
            <p className="break-words text-sm text-muted-foreground">{form.role_title} · {template?.stage_label} · {outcome === "pass" ? "Pass" : "Fail"}</p>
            <p className="text-sm">{locked ? statuses[form.status] : "Review the preview or edit the message before sending."}</p>
            <Tabs value={emailView} onValueChange={value => setEmailView(value as "preview" | "edit")}>
              <TabsList aria-label="Email preview and editing" className="grid w-full grid-cols-2 sm:w-80">
                <TabsTrigger value="preview">Preview email</TabsTrigger>
                <TabsTrigger value="edit" disabled={locked}>Edit message</TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="mt-3">
                <Card aria-label="Email preview" className="overflow-hidden">
                  <CardHeader className="border-b py-4">
                    <CardTitle className="text-base">Email preview</CardTitle>
                    <CardDescription>Review the message and signature the applicant will receive.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4">
                    <dl className="grid gap-3 text-sm sm:grid-cols-[5rem_1fr]">
                      <dt className="text-muted-foreground">To</dt><dd className="break-all">{form.recipient || "Not entered"}</dd>
                      <dt className="text-muted-foreground">CC</dt><dd className="break-all">{data.cc ?? "None"}</dd>
                      <dt className="text-muted-foreground">Reply to</dt><dd className="break-all">{data.reply_to}</dd>
                      <dt className="text-muted-foreground">Subject</dt><dd className="break-words font-medium">{form.subject || "Not entered"}</dd>
                    </dl>
                    <div className="max-h-96 overflow-y-auto rounded-md border bg-background p-4">
                      <p className="whitespace-pre-wrap break-words text-sm">{form.body || "Your message will appear here after you prepare the email."}</p>
                      <iframe title="Email signature preview" sandbox="" referrerPolicy="no-referrer" srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:12px;background:white;overflow-wrap:anywhere;font:14px Arial,sans-serif}img{max-width:100%}</style></head><body>${messageSignature ?? data.signature_html}</body></html>`} className="mt-2 h-64 w-full rounded-md border bg-white" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="edit" className="mt-3 space-y-4">
                <div className="space-y-2"><Label htmlFor="standalone-subject">Subject *</Label><Input id="standalone-subject" required maxLength={255} value={form.subject} disabled={busy || locked} onChange={event => setForm(previous => ({ ...previous, subject: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="standalone-body">Message *</Label><Textarea id="standalone-body" required maxLength={20000} rows={14} value={form.body} disabled={busy || locked} onChange={event => setForm(previous => ({ ...previous, body: event.target.value }))} /></div>
                {placeholders && <p className="text-sm text-destructive">Replace all placeholders before sending.</p>}
              </TabsContent>
            </Tabs>
          </section>}
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
