"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Loader2,
  Mail,
  SkipForward,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
  batchSkipRecruitmentEmails,
  getBatchRecruitmentEmailsPreview,
  sendRecruitmentEmail,
} from "@/lib/api/recruitment-email";
import { runRecruitmentBatch } from "@/lib/recruitment/cv-intake";
import {
  emailFieldsComplete,
  hasUnresolvedPlaceholders,
  previewRecruitmentEmail,
  visibleEmailFields,
} from "@/lib/recruitment/email-template";
import type {
  BatchPipelineEmailGroup,
  BatchPipelineEmailPreview,
} from "@/lib/types/recruitment-email";

type GroupDraftState = {
  fields: Record<string, string | number | null>;
  customMode: boolean;
  customSubject: string;
  customBody: string;
};

export function BatchPipelineEmailsDialog({
  roleId,
  roleTitle,
  candidateIds,
  onClose,
  onCompleted,
}: {
  roleId: string;
  roleTitle: string;
  candidateIds: string[];
  onClose: () => void;
  onCompleted: (updates: Record<string, "sent" | "skipped">) => void;
}) {
  const [data, setData] = useState<BatchPipelineEmailPreview | null>(null);
  const [activeGroupKey, setActiveGroupKey] = useState<string>("");
  const [groupStates, setGroupStates] = useState<Record<string, GroupDraftState>>({});
  const [excludedIds, setExcludedIds] = useState<Set<string>>(() => new Set());
  const [statuses, setStatuses] = useState<Record<string, "sending" | "sent" | "failed" | "skipped">>({});
  const [errorsByCandidate, setErrorsByCandidate] = useState<Record<string, string>>({});
  const [previewIdx, setPreviewIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [loadError, setLoadError] = useState("");
  const lock = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoadError("");
    getBatchRecruitmentEmailsPreview(roleId, candidateIds)
      .then((preview) => {
        if (cancelled) return;
        setData(preview);
        if (preview.groups.length > 0) {
          setActiveGroupKey(preview.groups[0].template);
          const initial: Record<string, GroupDraftState> = {};
          for (const g of preview.groups) {
            const firstSaved = g.candidates.find((c) => Object.keys(c.saved_fields || {}).length > 0);
            initial[g.template] = {
              fields: { ...(firstSaved?.saved_fields ?? {}) },
              customMode: false,
              customSubject: "",
              customBody: "",
            };
          }
          setGroupStates(initial);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Could not load pending emails.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [roleId, candidateIds]);

  const activeGroup: BatchPipelineEmailGroup | undefined = useMemo(
    () => data?.groups.find((g) => g.template === activeGroupKey) ?? data?.groups[0],
    [data, activeGroupKey],
  );

  const activeState: GroupDraftState = groupStates[activeGroup?.template ?? ""] ?? {
    fields: {},
    customMode: false,
    customSubject: "",
    customBody: "",
  };

  const activeCandidates = useMemo(
    () =>
      (activeGroup?.candidates ?? []).filter(
        (c) =>
          !excludedIds.has(c.candidate_id) &&
          statuses[c.candidate_id] !== "sent" &&
          statuses[c.candidate_id] !== "skipped",
      ),
    [activeGroup, excludedIds, statuses],
  );

  const sendableCandidates = useMemo(
    () => activeCandidates.filter((c) => c.valid_email),
    [activeCandidates],
  );

  const failedCandidates = useMemo(
    () =>
      (activeGroup?.candidates ?? []).filter(
        (c) => statuses[c.candidate_id] === "failed" && c.valid_email,
      ),
    [activeGroup, statuses],
  );

  const fieldsValid = useMemo(() => {
    if (!activeGroup) return false;
    return emailFieldsComplete(activeGroup.field_definitions, activeState.fields);
  }, [activeGroup, activeState.fields]);

  const customInvalid = useMemo(() => {
    if (!activeState.customMode) return false;
    return (
      !activeState.customSubject.trim() ||
      !activeState.customBody.trim() ||
      hasUnresolvedPlaceholders(`${activeState.customSubject}\n${activeState.customBody}`, true)
    );
  }, [activeState]);

  const previewList = activeGroup?.candidates ?? [];
  const safePreviewIdx = Math.min(previewIdx, Math.max(0, previewList.length - 1));
  const previewCandidate = previewList[safePreviewIdx];

  const previewContent = useMemo(() => {
    if (!activeGroup || !previewCandidate) return { subject: "", body: "" };
    if (activeState.customMode) {
      const replace = (text: string) =>
        text
          .replace(/\{\{applicant_name\}\}/g, previewCandidate.name)
          .replace(/\{\{role_title\}\}/g, roleTitle);
      return {
        subject: replace(activeState.customSubject),
        body: replace(activeState.customBody),
      };
    }
    return {
      subject: previewRecruitmentEmail(
        activeGroup.subject_template,
        activeGroup.field_definitions,
        activeState.fields,
        { applicantName: previewCandidate.name, roleTitle },
      ),
      body: previewRecruitmentEmail(
        activeGroup.body_template,
        activeGroup.field_definitions,
        activeState.fields,
        { applicantName: previewCandidate.name, roleTitle },
      ),
    };
  }, [activeGroup, activeState, previewCandidate, roleTitle]);

  function updateGroupState(templateKey: string, patch: Partial<GroupDraftState>) {
    setGroupStates((prev) => ({
      ...prev,
      [templateKey]: { ...(prev[templateKey] ?? activeState), ...patch },
    }));
  }

  function toggleCustomWording() {
    if (!activeGroup) return;
    if (activeState.customMode) {
      updateGroupState(activeGroup.template, {
        customMode: false,
        customSubject: "",
        customBody: "",
      });
      return;
    }
    const sampleBody = previewRecruitmentEmail(
      activeGroup.body_template,
      activeGroup.field_definitions,
      activeState.fields,
      { applicantName: "{{applicant_name}}", roleTitle },
    );
    updateGroupState(activeGroup.template, {
      customMode: true,
      customSubject: activeGroup.subject_template,
      customBody: sampleBody,
    });
  }

  async function sendGroup(onlyFailed = false) {
    if (!activeGroup || lock.current || !fieldsValid || customInvalid) return;
    const targets = onlyFailed ? failedCandidates : sendableCandidates;
    if (!targets.length) return;

    lock.current = true;
    setBusy(true);
    let done = 0;
    let failed = 0;
    const completedUpdates: Record<string, "sent" | "skipped"> = {};

    setProgress(`Sending 0 of ${targets.length} emails…`);
    try {
      await runRecruitmentBatch(
        targets,
        async (candidate) => {
          setStatuses((prev) => ({ ...prev, [candidate.candidate_id]: "sending" }));
          const res = await sendRecruitmentEmail(candidate.candidate_id, {
            event_id: candidate.event_id,
            revision: candidate.revision,
            draft_revision: candidate.draft_revision,
            fields: activeState.fields,
            ...(activeState.customMode
              ? {
                  custom_subject: activeState.customSubject.trim(),
                  custom_body: activeState.customBody.trim(),
                }
              : {}),
          });
          done++;
          if (res.success) {
            completedUpdates[candidate.candidate_id] = "sent";
            setStatuses((prev) => ({ ...prev, [candidate.candidate_id]: "sent" }));
          } else {
            failed++;
            setStatuses((prev) => ({ ...prev, [candidate.candidate_id]: "failed" }));
            setErrorsByCandidate((prev) => ({
              ...prev,
              [candidate.candidate_id]: res.error,
            }));
          }
          setProgress(`Sending ${done} of ${targets.length} emails${failed ? ` · ${failed} failed` : ""}…`);
        },
        3,
      );

      if (Object.keys(completedUpdates).length) {
        onCompleted(completedUpdates);
      }

      if (failed === 0) {
        toast.success(`Sent ${done} email${done === 1 ? "" : "s"} for ${activeGroup.label}.`);
      } else {
        toast.error(`${done - failed} sent, ${failed} failed. Review highlighted applicants and retry.`);
      }
    } finally {
      lock.current = false;
      setBusy(false);
      setProgress("");
    }
  }

  async function skipGroup() {
    if (!activeGroup || lock.current || !activeCandidates.length) return;
    lock.current = true;
    setBusy(true);
    try {
      const ids = activeCandidates.map((c) => c.candidate_id);
      const res = await batchSkipRecruitmentEmails(roleId, ids);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      const updates: Record<string, "sent" | "skipped"> = {};
      for (const id of res.data.skipped_ids) {
        updates[id] = "skipped";
      }
      setStatuses((prev) => ({ ...prev, ...updates }));
      onCompleted(updates);
      toast.success(
        `Skipped ${res.data.skipped_count} pending email${res.data.skipped_count === 1 ? "" : "s"}.`,
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent
        className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
        onInteractOutside={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Batch candidate emails · {roleTitle}
          </DialogTitle>
          <DialogDescription>
            Review shared details, preview personalized messages, and send or skip pending stage emails together.
          </DialogDescription>
        </DialogHeader>

        {!data && !loadError && (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Grouping candidates by pending email template…
          </div>
        )}

        {loadError && (
          <div className="space-y-3 p-6">
            <p role="alert" className="text-sm text-destructive">
              {loadError}
            </p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        )}

        {data && data.groups.length === 0 && (
          <div className="space-y-3 p-6 text-sm text-muted-foreground">
            <p>None of the selected candidates currently have an unsent pending email.</p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        )}

        {data && activeGroup && (
          <>
            {data.groups.length > 1 && (
              <div className="flex flex-wrap gap-2 border-b bg-muted/20 px-6 py-2.5">
                {data.groups.map((g) => (
                  <Button
                    key={g.template}
                    type="button"
                    size="sm"
                    variant={g.template === activeGroup.template ? "secondary" : "outline"}
                    onClick={() => {
                      setActiveGroupKey(g.template);
                      setPreviewIdx(0);
                    }}
                  >
                    {g.label} ({g.candidates.length})
                  </Button>
                ))}
              </div>
            )}

            <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[1.1fr_1fr]">
              {/* Left: Group details + recipients */}
              <div className="space-y-4">
                <section className="space-y-3 rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{activeGroup.label}</h3>
                    <Badge variant={activeGroup.outcome === "pass" ? "outline" : "secondary"}>
                      {activeGroup.candidates.length} applicant{activeGroup.candidates.length === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  {activeGroup.field_definitions.length === 0 ? (
                    <p className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
                      No extra fields required for this message. Review the preview and send directly.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {visibleEmailFields(activeGroup.field_definitions, activeState.fields).map(
                        (field) => {
                          const fieldId = `batch-${activeGroup.template}-${field.key}`;
                          const value = String(activeState.fields[field.key] ?? "");
                          const updateField = (next: string) =>
                            updateGroupState(activeGroup.template, {
                              fields: { ...activeState.fields, [field.key]: next },
                            });

                          return (
                            <div
                              key={field.key}
                              className={`space-y-1.5 ${
                                field.type === "textarea" || field.type === "url"
                                  ? "sm:col-span-2"
                                  : ""
                              }`}
                            >
                              <Label htmlFor={fieldId}>
                                {field.label}
                                {field.required ? " *" : ""}
                              </Label>
                              {field.type === "select" ? (
                                <select
                                  id={fieldId}
                                  disabled={busy}
                                  value={value}
                                  onChange={(e) => updateField(e.target.value)}
                                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                                >
                                  <option value="">Select an option</option>
                                  {Object.entries(field.options ?? {}).map(([k, lbl]) => (
                                    <option key={k} value={k}>
                                      {lbl}
                                    </option>
                                  ))}
                                </select>
                              ) : field.type === "textarea" ? (
                                <Textarea
                                  id={fieldId}
                                  rows={2}
                                  maxLength={2000}
                                  disabled={busy}
                                  value={value}
                                  onChange={(e) => updateField(e.target.value)}
                                />
                              ) : (
                                <Input
                                  id={fieldId}
                                  type={field.type}
                                  min={field.type === "number" ? 1 : undefined}
                                  max={field.type === "number" ? 480 : undefined}
                                  step={field.type === "number" ? 1 : undefined}
                                  maxLength={2000}
                                  disabled={busy}
                                  value={value}
                                  placeholder={field.type === "url" ? "https://…" : undefined}
                                  onChange={(e) => updateField(e.target.value)}
                                />
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}
                </section>

                <section className="space-y-2 rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Recipients ({activeCandidates.length} included)
                    </h4>
                    {data.skipped_no_pending > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        {data.skipped_no_pending} without pending email omitted
                      </span>
                    )}
                  </div>
                  <div className="max-h-60 divide-y overflow-y-auto pr-1">
                    {activeGroup.candidates.map((c, idx) => {
                      const st = statuses[c.candidate_id];
                      const excluded = excludedIds.has(c.candidate_id);
                      const done = st === "sent" || st === "skipped";
                      return (
                        <div
                          key={c.candidate_id}
                          onClick={() => setPreviewIdx(idx)}
                          className="flex cursor-pointer items-center justify-between gap-2 py-2 text-xs"
                        >
                          <label className="flex min-w-0 flex-1 items-center gap-2">
                            <input
                              type="checkbox"
                              disabled={busy || done}
                              checked={!excluded}
                              onChange={(e) =>
                                setExcludedIds((prev) => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.delete(c.candidate_id);
                                  else next.add(c.candidate_id);
                                  return next;
                                })
                              }
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{c.name}</p>
                              <p className="truncate text-muted-foreground">
                                {c.email || "No email address"}
                              </p>
                            </div>
                          </label>

                          <div className="shrink-0">
                            {!c.valid_email ? (
                              <Badge variant="destructive">Invalid/no email</Badge>
                            ) : st === "sent" ? (
                              <Badge variant="outline" className="gap-1 text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Sent
                              </Badge>
                            ) : st === "skipped" ? (
                              <Badge variant="secondary">Skipped</Badge>
                            ) : st === "sending" ? (
                              <Badge variant="secondary" className="gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Sending
                              </Badge>
                            ) : st === "failed" ? (
                              <Badge variant="destructive" title={errorsByCandidate[c.candidate_id]}>
                                <XCircle className="h-3 w-3" />
                                Failed
                              </Badge>
                            ) : (
                              <Badge variant="outline">Ready</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* Right: Live preview + optional customization */}
              <div className="space-y-3 rounded-lg border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <h4 className="text-sm font-semibold">Live preview</h4>
                  <Button
                    type="button"
                    size="sm"
                    variant={activeState.customMode ? "secondary" : "outline"}
                    disabled={busy}
                    onClick={toggleCustomWording}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    {activeState.customMode ? "Use template" : "Customize wording"}
                  </Button>
                </div>

                {previewCandidate && (
                  <div className="flex items-center justify-between rounded-md border bg-muted/20 px-2.5 py-1.5 text-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={safePreviewIdx <= 0}
                      onClick={() => setPreviewIdx((i) => Math.max(0, i - 1))}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="truncate font-medium">
                      {previewCandidate.name} ({safePreviewIdx + 1} of {previewList.length})
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={safePreviewIdx >= previewList.length - 1}
                      onClick={() =>
                        setPreviewIdx((i) => Math.min(previewList.length - 1, i + 1))
                      }
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>To: {previewCandidate?.email || "No candidate email"}</p>
                  <p>CC: {data.cc ?? "None — HR is not copied outside production"}</p>
                  <p className="font-medium text-foreground">Subject: {previewContent.subject}</p>
                </div>

                {activeState.customMode ? (
                  <div className="space-y-2 border-t pt-2">
                    <p className="text-[11px] text-muted-foreground">
                      Keep <code className="rounded bg-muted px-1">{"{{applicant_name}}"}</code> so every applicant gets their own greeting.
                    </p>
                    <Input
                      maxLength={255}
                      disabled={busy}
                      value={activeState.customSubject}
                      onChange={(e) =>
                        updateGroupState(activeGroup.template, { customSubject: e.target.value })
                      }
                    />
                    <Textarea
                      rows={9}
                      maxLength={20000}
                      disabled={busy}
                      value={activeState.customBody}
                      onChange={(e) =>
                        updateGroupState(activeGroup.template, { customBody: e.target.value })
                      }
                    />
                    {customInvalid && (
                      <p className="text-xs text-destructive" role="alert">
                        Replace all placeholders before sending.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto rounded-md border bg-background p-3.5 text-sm">
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {previewContent.body}
                    </p>
                  </div>
                )}

                {data.signature_html && (
                  <details className="border-t pt-2 text-xs">
                    <summary className="cursor-pointer font-medium text-muted-foreground">
                      Preview signature
                    </summary>
                    <iframe
                      title="Batch email signature preview"
                      sandbox=""
                      referrerPolicy="no-referrer"
                      srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:12px;background:#fff;overflow-wrap:anywhere}img{max-width:100%}</style></head><body>${data.signature_html}</body></html>`}
                      className="mt-2 h-44 w-full rounded-md border bg-white"
                    />
                  </details>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-background px-6 py-3">
              <div className="text-xs font-medium text-muted-foreground" role="status">
                {progress ||
                  `${sendableCandidates.length} ready to send`}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || !activeCandidates.length}
                  onClick={() => void skipGroup()}
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  Skip group ({activeCandidates.length})
                </Button>
                {failedCandidates.length > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy || !fieldsValid || customInvalid}
                    onClick={() => void sendGroup(true)}
                  >
                    Retry failed ({failedCandidates.length})
                  </Button>
                )}
                <Button
                  type="button"
                  disabled={busy || !sendableCandidates.length || !fieldsValid || customInvalid}
                  onClick={() => void sendGroup(false)}
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    `Send to ${sendableCandidates.length} candidate${sendableCandidates.length === 1 ? "" : "s"}`
                  )}
                </Button>
                <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
