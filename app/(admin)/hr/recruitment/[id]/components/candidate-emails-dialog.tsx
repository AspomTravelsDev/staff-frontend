"use client";

import { useEffect, useRef, useState } from "react";
import { Edit3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getRecruitmentEmails,
  saveRecruitmentEmailDraft,
  sendRecruitmentEmail,
  skipRecruitmentEmail,
} from "@/lib/api/recruitment-email";
import {
  emailFieldsComplete,
  hasUnresolvedPlaceholders,
  previewRecruitmentEmail,
  visibleEmailFields,
} from "@/lib/recruitment/email-template";
import type {
  RecruitmentEmailInput,
  RecruitmentEmailRecord,
  RecruitmentEmails,
} from "@/lib/types/recruitment-email";

const FIELD_MEMORY_PREFIX = "recruitment_email_fields_v1:";

function readRememberedFields(template: string): RecruitmentEmailInput["fields"] | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    const raw = sessionStorage.getItem(`${FIELD_MEMORY_PREFIX}${template}`);
    return raw ? (JSON.parse(raw) as RecruitmentEmailInput["fields"]) : null;
  } catch {
    return null;
  }
}

function rememberFields(template: string, fields: RecruitmentEmailInput["fields"]) {
  try {
    if (typeof sessionStorage === "undefined") return;
    const cleaned = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== null && String(v).trim() !== ""),
    );
    if (Object.keys(cleaned).length) {
      sessionStorage.setItem(`${FIELD_MEMORY_PREFIX}${template}`, JSON.stringify(cleaned));
    }
  } catch {
    // Ignore storage unavailability
  }
}

export function CandidateEmailsDialog({
  candidateId,
  name,
  onClose,
  onChanged,
}: {
  candidateId: string;
  name: string;
  onClose: () => void;
  onChanged?: (status: RecruitmentEmailRecord["status"]) => void;
}) {
  const [data, setData] = useState<RecruitmentEmails | null>(null);
  const [fields, setFields] = useState<RecruitmentEmailInput["fields"]>({});
  const [prefilledFromLast, setPrefilledFromLast] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [needsReload, setNeedsReload] = useState(false);
  const inFlight = useRef(false);
  const changed = useRef(onChanged);
  changed.current = onChanged;

  useEffect(() => {
    let cancelled = false;
    getRecruitmentEmails(candidateId)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        const saved = result.draft?.fields ?? {};
        const hasSaved = Object.values(saved).some((v) => v !== null && String(v).trim() !== "");
        if (!hasSaved && result.draft?.template && result.draft.field_definitions.length > 0) {
          const remembered = readRememberedFields(result.draft.template);
          if (remembered) {
            setFields(remembered);
            setPrefilledFromLast(true);
            return;
          }
        }
        setFields(saved);
        setPrefilledFromLast(false);
      })
      .catch(() => {
        if (!cancelled) setError("Emails could not be loaded. Close and reopen to retry.");
      });
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  const draft = data?.draft;
  const dirty =
    !!draft &&
    !prefilledFromLast &&
    JSON.stringify(fields) !== JSON.stringify(draft.fields);
  const complete = !!draft && emailFieldsComplete(draft.field_definitions, fields);
  const renderedBody = draft
    ? previewRecruitmentEmail(draft.body_template, draft.field_definitions, fields)
    : "";
  const customInvalid =
    customMode &&
    (!customSubject.trim() ||
      !customBody.trim() ||
      hasUnresolvedPlaceholders(`${customSubject}\n${customBody}`));

  function toggleCustomMode() {
    if (!draft) return;
    if (customMode) {
      setCustomMode(false);
      setCustomSubject("");
      setCustomBody("");
      return;
    }
    setCustomSubject(draft.subject);
    setCustomBody(renderedBody);
    setCustomMode(true);
  }

  async function perform(action: "save" | "send" | "skip", closeAfter = false) {
    if (
      !data?.draft ||
      inFlight.current ||
      needsReload ||
      (action === "send" && (!complete || !data.recipient || customInvalid))
    ) {
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const input: RecruitmentEmailInput = {
        event_id: data.draft.event_id,
        revision: data.revision,
        draft_revision: data.draft.draft_revision,
        fields,
        ...(customMode && action === "send"
          ? { custom_subject: customSubject.trim(), custom_body: customBody.trim() }
          : {}),
      };
      const result = await (
        action === "send"
          ? sendRecruitmentEmail
          : action === "skip"
            ? skipRecruitmentEmail
            : saveRecruitmentEmailDraft
      )(candidateId, input);

      if (!result.success) {
        setError(result.error);
        if (action === "send") {
          const fresh = await getRecruitmentEmails(candidateId);
          setData(fresh);
          const saved = fresh.history.find((email) => email.event_id === input.event_id);
          if (fresh.draft && fresh.draft.draft_revision !== input.draft_revision) {
            if (
              saved?.status === "failed" &&
              Object.entries(input.fields).every(
                ([key, value]) => String(saved.template_fields[key] ?? "") === String(value ?? ""),
              )
            ) {
              setFields(fresh.draft.fields);
            } else {
              setNeedsReload(true);
            }
          }
          changed.current?.(saved?.status ?? "draft");
        }
        if (result.code === "409" || result.code === "HTTP_409") setNeedsReload(true);
        return;
      }

      if (action === "send" && data.draft.template) {
        rememberFields(data.draft.template, fields);
      }

      const record = result.data;
      setData({
        ...data,
        draft:
          action === "save"
            ? {
                ...data.draft,
                id: record.id,
                fields: record.template_fields,
                draft_revision: record.draft_revision,
              }
            : null,
        history: [record, ...data.history.filter((email) => email.id !== record.id)],
      });
      if (action === "save") {
        setFields(record.template_fields);
        setPrefilledFromLast(false);
      }
      changed.current?.(record.status);
      setNotice(
        action === "send"
          ? "Email sent successfully."
          : action === "skip"
            ? "Email skipped. You can continue the recruitment process."
            : "Draft saved. You can return to it from Review email.",
      );
      if (closeAfter) onClose();
    } catch {
      if (action === "send") setNeedsReload(true);
      setError(
        action === "send"
          ? "Sending could not be confirmed. Reload to check the status before retrying."
          : "Your changes could not be saved. Please retry before closing.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function close() {
    if (inFlight.current) return;
    if (needsReload) {
      if (
        !dirty ||
        window.confirm("Close without saving these edits? The saved email remains available from Candidate emails.")
      ) {
        onClose();
      }
      return;
    }
    if (dirty) void perform("save", true);
    else onClose();
  }

  async function reload() {
    if (
      inFlight.current ||
      (dirty && !window.confirm("Load the saved email and discard these unsaved edits?"))
    ) {
      return;
    }
    inFlight.current = true;
    setBusy(true);
    try {
      const fresh = await getRecruitmentEmails(candidateId);
      setData(fresh);
      setFields(fresh.draft?.fields ?? {});
      setPrefilledFromLast(false);
      setNeedsReload(false);
      setError("");
    } catch {
      setError("Emails could not be reloaded. Please retry.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl"
        onInteractOutside={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Candidate emails · {name}</DialogTitle>
          <DialogDescription>
            Complete the details, review the live preview, and send or skip this email.
          </DialogDescription>
        </DialogHeader>

        {!data && !error && <p role="status">Loading emails…</p>}
        {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}

        {data && (
          <div className="space-y-4">
            <div className="space-y-1 rounded-md border bg-muted/20 p-3 break-all text-sm">
              <p>To: {data.recipient || "No candidate email address"}</p>
              <p>CC: {data.cc ?? "None — HR is not copied outside production"}</p>
              <p>Reply to: {data.reply_to}</p>
            </div>

            {draft ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void perform("send");
                }}
                className="space-y-4"
              >
                {prefilledFromLast && (
                  <div className="flex items-center justify-between gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Prefilled with your last details for this stage.
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        setFields({});
                        setPrefilledFromLast(false);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  {visibleEmailFields(draft.field_definitions, fields).map((field) => {
                    const id = `email-${field.key}`;
                    const props = {
                      id,
                      required: field.required,
                      disabled: busy,
                      value: String(fields[field.key] ?? ""),
                      onChange: (
                        event: React.ChangeEvent<
                          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
                        >,
                      ) => {
                        setPrefilledFromLast(false);
                        setFields((previous) => ({
                          ...previous,
                          [field.key]: event.target.value,
                        }));
                      },
                    };
                    return (
                      <div
                        key={field.key}
                        className={`space-y-2 ${field.type === "textarea" || field.type === "url" ? "sm:col-span-2" : ""}`}
                      >
                        <Label htmlFor={id}>
                          {field.label}
                          {field.required ? " *" : ""}
                        </Label>
                        {field.type === "select" ? (
                          <select
                            {...props}
                            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                          >
                            <option value="">Select an option</option>
                            {Object.entries(field.options ?? {}).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "textarea" ? (
                          <Textarea {...props} rows={3} maxLength={2000} />
                        ) : (
                          <Input
                            {...props}
                            type={field.type}
                            min={field.type === "number" ? 1 : undefined}
                            max={field.type === "number" ? 480 : undefined}
                            step={field.type === "number" ? 1 : undefined}
                            maxLength={2000}
                            placeholder={field.type === "url" ? "https://…" : undefined}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {!!draft.field_definitions.length && (
                  <p className="text-xs text-muted-foreground">
                    All displayed fields are required to send. Drafts can be saved before they are complete.
                  </p>
                )}

                <section aria-label="Email preview" className="space-y-3 rounded-md border p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                    <h3 className="font-semibold">
                      {customMode ? customSubject || "Custom subject" : draft.subject}
                    </h3>
                    <Button
                      type="button"
                      size="sm"
                      variant={customMode ? "secondary" : "outline"}
                      disabled={busy}
                      onClick={toggleCustomMode}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      {customMode ? "Use template" : "Customize wording"}
                    </Button>
                  </div>

                  {customMode ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="candidate-custom-subject">Subject *</Label>
                        <Input
                          id="candidate-custom-subject"
                          required
                          maxLength={255}
                          disabled={busy}
                          value={customSubject}
                          onChange={(e) => setCustomSubject(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="candidate-custom-body">Message *</Label>
                        <Textarea
                          id="candidate-custom-body"
                          required
                          rows={9}
                          maxLength={20000}
                          disabled={busy}
                          value={customBody}
                          onChange={(e) => setCustomBody(e.target.value)}
                        />
                      </div>
                      {customInvalid && (
                        <p className="text-xs text-destructive" role="alert">
                          Replace all placeholders before sending.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{renderedBody}</p>
                  )}
                </section>

                {data.signature_html && (
                  <details aria-label="Email signature preview" className="space-y-2 border-t pt-3">
                    <summary className="cursor-pointer text-sm font-medium">Preview signature</summary>
                    <iframe
                      title="Email signature preview"
                      srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:12px;background:#fff;overflow-wrap:anywhere}img{max-width:100%}</style></head><body>${data.signature_html}</body></html>`}
                      sandbox=""
                      referrerPolicy="no-referrer"
                      className="h-48 w-full rounded-md border bg-white"
                    />
                  </details>
                )}

                {!data.recipient && (
                  <p role="alert" className="text-sm text-destructive">
                    Add a candidate email address before sending. You can still save or skip this email.
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    disabled={busy || needsReload || !data.recipient || !complete || customInvalid}
                  >
                    Send email
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || needsReload}
                    onClick={() => void perform("save")}
                  >
                    Save draft
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || needsReload}
                    onClick={() => void perform("skip")}
                  >
                    Skip email
                  </Button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                No email is awaiting review. Messages become available after a matching recruitment decision.
              </p>
            )}

            <section aria-label="Email history" className="space-y-2 border-t pt-4">
              <h3 className="text-sm font-semibold">Email history</h3>
              {!data.history.length && (
                <p className="text-sm text-muted-foreground">No candidate emails recorded yet.</p>
              )}
              {data.history.map((email) => (
                <details key={email.id} className="border-b py-2 text-sm">
                  <summary className="cursor-pointer break-words">
                    {email.subject} ·{" "}
                    {
                      {
                        draft: "Draft",
                        skipped: "Skipped",
                        sent: "Sent",
                        failed: "Delivery failed",
                        sending: "Sending — confirmation pending",
                      }[email.status]
                    }
                  </summary>
                  <div className="mt-2 space-y-2">
                    <p className="break-all">To: {email.recipient || "No email address"}</p>
                    <p className="text-muted-foreground">
                      {email.sender.name} ·{" "}
                      {new Date(email.sent_at ?? email.skipped_at ?? email.updated_at).toLocaleString(
                        "en-GB",
                        { timeZone: "Africa/Lagos" },
                      )}
                    </p>
                    <p className="whitespace-pre-wrap break-words">{email.body}</p>
                  </div>
                </details>
              ))}
            </section>
          </div>
        )}

        {error && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
            {needsReload && (
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void reload()}>
                Reload emails
              </Button>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={busy} onClick={close}>
            {dirty && !needsReload ? "Save and close" : "Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
