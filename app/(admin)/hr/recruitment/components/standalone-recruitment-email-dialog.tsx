"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  Clock,
  Copy,
  Edit3,
  History,
  Link2,
  Loader2,
  Mail,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  batchSendStandaloneEmails,
  getStandaloneEmail,
  getStandaloneEmailComposer,
  getStandaloneEmailBatchStatus,
  saveStandaloneEmail,
  sendStandaloneEmail,
} from "@/lib/api/standalone-recruitment-email";
import {
  emailFieldsComplete,
  hasUnresolvedPlaceholders,
  isValidEmail,
  parseRecipientPaste,
  previewStandaloneRecruitmentEmail,
  visibleEmailFields,
} from "@/lib/recruitment/email-template";
import type {
  StandaloneComposerRole,
  StandaloneEmailComposer,
  StandaloneEmailHistory,
  StandaloneEmailInput,
  StandaloneEmailRecord,
} from "@/lib/types/standalone-recruitment-email";

type RecipientRow = {
  id: string;
  revision: number;
  applicant_name: string;
  recipient: string;
  interview_date_override: string;
  interview_time_override: string;
  meeting_link_override: string;
  status: "idle" | "draft" | "sending" | "sent" | "failed";
  error?: string;
};

type CampaignState = {
  role_title: string;
  template: string;
  fields: Record<string, string | number | null>;
  customMode: boolean;
  customSubject: string;
  customBody: string;
};

const MAX_RECIPIENTS = 50;
const PER_APPLICANT_INVITE_KEYS = new Set(["interview_date", "interview_time", "meeting_link"]);

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value.trim()).protocol === "https:";
  } catch {
    return false;
  }
};

const addMinutesToTime = (timeStr: string, addMinutes: number) => {
  const [hh, mm] = (/^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr) ? timeStr : "09:00")
    .split(":")
    .map(Number);
  const total = (hh * 60 + mm + addMinutes) % (24 * 60);
  const nextH = Math.floor(total / 60);
  const nextM = total % 60;
  return `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`;
};

const newRecipient = (
  partial?: Partial<
    Pick<
      RecipientRow,
      | "applicant_name"
      | "recipient"
      | "interview_date_override"
      | "interview_time_override"
      | "meeting_link_override"
    >
  >,
): RecipientRow => ({
  id: crypto.randomUUID(),
  revision: 0,
  applicant_name: partial?.applicant_name ?? "",
  recipient: partial?.recipient ?? "",
  interview_date_override: partial?.interview_date_override ?? "",
  interview_time_override: partial?.interview_time_override ?? "",
  meeting_link_override: partial?.meeting_link_override ?? "",
  status: "idle",
});

const blankCampaign = (): CampaignState => ({
  role_title: "",
  template: "call_screening_pass",
  fields: {},
  customMode: false,
  customSubject: "",
  customBody: "",
});

const statusMeta: Record<
  StandaloneEmailRecord["status"],
  { label: string; variant: "outline" | "secondary" | "destructive" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  sending: { label: "Sending", variant: "secondary" },
  sent: { label: "Sent", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
};

export function StandaloneRecruitmentEmailDialog({
  initialData,
  className,
}: {
  initialData?: StandaloneEmailComposer | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<StandaloneEmailComposer | null>(initialData ?? null);
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");
  const [campaign, setCampaign] = useState<CampaignState>(blankCampaign);
  const [recipients, setRecipients] = useState<RecipientRow[]>(() => [newRecipient()]);
  const [previewIndex, setPreviewIndex] = useState(0);

  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [showRoleImport, setShowRoleImport] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [importStageFilter, setImportStageFilter] = useState("all");

  const [historyFilter, setHistoryFilter] = useState<"all" | "sent" | "draft" | "failed">("all");
  const [historySearch, setHistorySearch] = useState("");
  const [expandedHistory, setExpandedHistory] = useState<Record<string, StandaloneEmailRecord>>({});

  const [busy, setBusy] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [messageSignature, setMessageSignature] = useState<string | null>(null);

  const running = useRef(false);
  const savedFingerprint = useRef(
    JSON.stringify({ campaign: blankCampaign(), recipients: [] as RecipientRow[] }),
  );

  const template = data?.templates.find((item) => item.key === campaign.template);
  const stage = template?.stage ?? "call_screening";
  const outcome = template?.outcome ?? "pass";
  const isInterviewInvite = campaign.template === "call_screening_pass";
  const isVirtualInvite =
    isInterviewInvite && String(campaign.fields.interview_format ?? "") === "virtual";
  const queuedEmailKey = (data?.history ?? [])
    .filter((item) => item.status === "sending")
    .map((item) => item.id)
    .join(",");

  useEffect(() => {
    if (!open || !queuedEmailKey) return;
    let cancelled = false;
    const ids = queuedEmailKey.split(",");
    const refreshStatuses = async () => {
      try {
        const records = await getStandaloneEmailBatchStatus(ids);
        if (cancelled || !records.length) return;
        const byId = new Map(records.map((record) => [record.id, record]));
        setData((previous) => previous && ({
          ...previous,
          history: previous.history.map((item) => byId.get(item.id) ?? item),
        }));
        setRecipients((previous) => previous.map((row) => {
          const record = byId.get(row.id);
          if (!record || (record.status !== "sent" && record.status !== "failed")) return row;
          return {
            ...row,
            revision: record.revision,
            status: record.status,
            error: record.status === "failed" ? "Email delivery failed. Retry this recipient." : undefined,
          };
        }));
      } catch {
        // Keep queued messages visible; the next interval retries the status check.
      }
    };

    void refreshStatuses();
    const interval = window.setInterval(() => void refreshStatuses(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [open, queuedEmailKey]);

  const validRecipients = useMemo(
    () =>
      recipients.filter(
        (row) => row.applicant_name.trim().length > 0 && isValidEmail(row.recipient),
      ),
    [recipients],
  );

  const unsentRecipients = useMemo(
    () => recipients.filter((row) => row.status !== "sent" && row.status !== "sending"),
    [recipients],
  );

  const failedRecipients = useMemo(
    () => recipients.filter((row) => row.status === "failed"),
    [recipients],
  );

  const sentRecipientsCount = useMemo(
    () => recipients.filter((row) => row.status === "sent").length,
    [recipients],
  );

  const allSent = recipients.length > 0 && sentRecipientsCount === recipients.length;
  const deliveryPending = recipients.some((row) => row.status === "sending");

  const duplicateEmails = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of recipients) {
      const email = row.recipient.trim().toLowerCase();
      if (!email) continue;
      counts.set(email, (counts.get(email) ?? 0) + 1);
    }
    return new Set(
      Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([email]) => email),
    );
  }, [recipients]);

  const safePreviewIndex = Math.min(previewIndex, Math.max(0, recipients.length - 1));
  const previewRow = recipients[safePreviewIndex] ?? recipients[0] ?? newRecipient();

  const mergedFieldsForRow = (row: RecipientRow) => {
    const next = { ...campaign.fields };
    if (isInterviewInvite) {
      if (row.interview_date_override.trim()) {
        next.interview_date = row.interview_date_override.trim();
      }
      if (row.interview_time_override.trim()) {
        next.interview_time = row.interview_time_override.trim();
      }
      if (isVirtualInvite && row.meeting_link_override.trim()) {
        next.meeting_link = row.meeting_link_override.trim();
      }
    }
    return next;
  };

  const needsDefaultField = (key: string) => {
    if (!isInterviewInvite || !PER_APPLICANT_INVITE_KEYS.has(key)) return true;
    return unsentRecipients.some((r) => !String(mergedFieldsForRow(r)[key] ?? "").trim());
  };

  const renderedPreview = useMemo(() => {
    if (!template) return { subject: "", body: "" };
    const fields = mergedFieldsForRow(previewRow);
    if (campaign.customMode) {
      const applicant = previewRow.applicant_name.trim() || "[Applicant name]";
      const roleTitle = campaign.role_title.trim() || "[Role applied for]";
      const replace = (text: string) =>
        text
          .replace(/\{\{applicant_name\}\}/g, applicant)
          .replace(/\{\{role_title\}\}/g, roleTitle);
      return {
        subject: replace(campaign.customSubject),
        body: replace(campaign.customBody),
      };
    }
    return previewStandaloneRecruitmentEmail(
      template.subject_template,
      template.body_template,
      template.field_definitions,
      fields,
      {
        applicantName: previewRow.applicant_name,
        roleTitle: campaign.role_title,
        templateKey: template.key,
      },
    );
  }, [template, campaign, previewRow]);

  const allRowsComplete = useMemo(() => {
    if (!template || unsentRecipients.length === 0) return false;
    return unsentRecipients.every(
      (row) =>
        row.applicant_name.trim().length > 0 &&
        isValidEmail(row.recipient) &&
        emailFieldsComplete(template.field_definitions, mergedFieldsForRow(row)),
    );
  }, [template, unsentRecipients, campaign.fields, isInterviewInvite, isVirtualInvite]);

  const customPlaceholdersInvalid = useMemo(() => {
    if (!campaign.customMode) return false;
    return (
      !campaign.customSubject.trim() ||
      !campaign.customBody.trim() ||
      hasUnresolvedPlaceholders(
        `${campaign.customSubject}\n${campaign.customBody}`,
        recipients.length > 1,
      )
    );
  }, [campaign.customMode, campaign.customSubject, campaign.customBody, recipients.length]);

  const canSend =
    !!template &&
    campaign.role_title.trim().length > 0 &&
    allRowsComplete &&
    !customPlaceholdersInvalid &&
    unsentRecipients.length > 0;

  const isSingleDraftEditable = recipients.length === 1 && !["sent", "sending"].includes(recipients[0].status);
  const currentFingerprint = JSON.stringify({ campaign, recipients });
  const hasUnsavedContent =
    currentFingerprint !== savedFingerprint.current &&
    (!!campaign.role_title.trim() ||
      !!campaign.customSubject.trim() ||
      !!campaign.customBody.trim() ||
      Object.values(campaign.fields).some((v) => String(v ?? "").trim() !== "") ||
      recipients.some(
        (r) =>
          !!r.applicant_name.trim() ||
          !!r.recipient.trim() ||
          !!r.interview_date_override.trim() ||
          !!r.interview_time_override.trim() ||
          !!r.meeting_link_override.trim(),
      ));

  const roles: StandaloneComposerRole[] = data?.roles ?? [];
  const activeRoleImport = roles.find((r) => r.id === selectedRoleId) ?? roles[0];

  const importableCandidates = useMemo(() => {
    if (!activeRoleImport) return [];
    const existingEmails = new Set(
      recipients.map((r) => r.recipient.trim().toLowerCase()).filter(Boolean),
    );
    return activeRoleImport.candidates.filter((c) => {
      if (importStageFilter !== "all" && c.pipeline_stage !== importStageFilter) return false;
      if (!isValidEmail(c.email)) return false;
      if (existingEmails.has(c.email.trim().toLowerCase())) return false;
      return recipients.length < MAX_RECIPIENTS;
    });
  }, [activeRoleImport, importStageFilter, recipients]);

  const parsedPaste = useMemo(() => parseRecipientPaste(pasteText), [pasteText]);

  const filteredHistory = useMemo(() => {
    const items = data?.history ?? [];
    const query = historySearch.trim().toLowerCase();
    return items.filter((item) => {
      if (historyFilter !== "all" && item.status !== historyFilter) return false;
      if (!query) return true;
      return (
        item.applicant_name.toLowerCase().includes(query) ||
        item.recipient.toLowerCase().includes(query) ||
        item.role_title.toLowerCase().includes(query) ||
        item.subject.toLowerCase().includes(query)
      );
    });
  }, [data?.history, historyFilter, historySearch]);

  function prependHistory(records: StandaloneEmailRecord[]) {
    if (!records.length) return;
    setData((previous) => {
      if (!previous) return previous;
      const seen = new Set(records.map((r) => r.id));
      const merged = [
        ...records,
        ...previous.history.filter((item) => !seen.has(item.id)),
      ].slice(0, 50);
      return { ...previous, history: merged };
    });
  }

  async function launch() {
    setOpen(true);
    setError("");
    if (data || running.current) return;
    running.current = true;
    setBusy(true);
    try {
      const loaded = await getStandaloneEmailComposer();
      setData(loaded);
      if (loaded.roles?.length && !selectedRoleId) {
        setSelectedRoleId(loaded.roles[0].id);
      }
    } catch {
      setError("Email templates could not be loaded. Please retry.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  function updateRow(id: string, patch: Partial<RecipientRow>) {
    setRecipients((previous) =>
      previous.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function staggerInterviewTimes() {
    if (!isInterviewInvite) return;
    const baseTime =
      String(campaign.fields.interview_time ?? "").trim() ||
      recipients.find((r) => r.interview_time_override.trim())?.interview_time_override.trim() ||
      "09:00";
    let slot = 0;
    setRecipients((prev) =>
      prev.map((row) => {
        if (row.status === "sent" || row.status === "sending") return row;
        const time = addMinutesToTime(baseTime, slot * 30);
        slot++;
        return { ...row, interview_time_override: time };
      }),
    );
    setNotice(`Assigned staggered 30-minute interview slots starting at ${baseTime}.`);
  }

  function appendRecipients(
    newRows: {
      applicant_name: string;
      recipient: string;
      interview_date_override?: string;
      interview_time_override?: string;
      meeting_link_override?: string;
    }[],
  ) {
    if (!newRows.length) return;
    setRecipients((previous) => {
      const existing = new Set(
        previous.map((r) => r.recipient.trim().toLowerCase()).filter(Boolean),
      );
      const nonEmpty = previous.filter(
        (r) =>
          r.applicant_name.trim() ||
          r.recipient.trim() ||
          r.interview_date_override.trim() ||
          r.interview_time_override.trim() ||
          r.meeting_link_override.trim() ||
          r.status !== "idle",
      );
      const added: RecipientRow[] = [];
      for (const item of newRows) {
        const key = item.recipient.trim().toLowerCase();
        if (existing.has(key)) continue;
        if (nonEmpty.length + added.length >= MAX_RECIPIENTS) break;
        existing.add(key);
        added.push(newRecipient(item));
      }
      const next = [...nonEmpty, ...added];
      return next.length ? next : [newRecipient()];
    });
  }

  function handlePasteImport() {
    if (!parsedPaste.length) return;
    appendRecipients(
      parsedPaste.map((p) => ({
        applicant_name: p.name,
        recipient: p.email,
        interview_date_override: p.interview_date ?? "",
        interview_time_override: p.interview_time ?? "",
        meeting_link_override: p.meeting_link ?? "",
      })),
    );
    setNotice(
      `Added ${parsedPaste.length} recipient${parsedPaste.length === 1 ? "" : "s"} from pasted list.`,
    );
    setPasteText("");
    setShowPasteBox(false);
  }

  function handleRoleImport() {
    if (!activeRoleImport || !importableCandidates.length) return;
    appendRecipients(
      importableCandidates.map((c) => ({
        applicant_name: c.name,
        recipient: c.email,
      })),
    );
    if (!campaign.role_title.trim()) {
      setCampaign((prev) => ({ ...prev, role_title: activeRoleImport.title }));
    }
    setNotice(
      `Imported ${importableCandidates.length} applicant${importableCandidates.length === 1 ? "" : "s"} from ${activeRoleImport.title}.`,
    );
    setShowRoleImport(false);
  }

  function toggleCustomMode() {
    if (!template) return;
    if (campaign.customMode) {
      setCampaign((prev) => ({
        ...prev,
        customMode: false,
        customSubject: "",
        customBody: "",
      }));
      return;
    }
    const isMulti = recipients.length > 1;
    const sample = previewStandaloneRecruitmentEmail(
      template.subject_template,
      template.body_template,
      template.field_definitions,
      mergedFieldsForRow(previewRow),
      {
        applicantName: isMulti ? "{{applicant_name}}" : previewRow.applicant_name,
        roleTitle: campaign.role_title || "{{role_title}}",
        templateKey: template.key,
      },
    );
    setCampaign((prev) => ({
      ...prev,
      customMode: true,
      customSubject: sample.subject,
      customBody: sample.body,
    }));
  }

  async function saveSingleDraft(closeAfter = false) {
    if (running.current || !data || !isSingleDraftEditable) return false;
    const row = recipients[0];
    if (row.status === "sent" || row.status === "sending") return false;

    running.current = true;
    setBusy(true);
    setError("");
    setNotice("");

    const merged = mergedFieldsForRow(row);
    const rendered =
      template &&
      previewStandaloneRecruitmentEmail(
        template.subject_template,
        template.body_template,
        template.field_definitions,
        merged,
        {
          applicantName: row.applicant_name,
          roleTitle: campaign.role_title,
          templateKey: template.key,
        },
      );

    const input: StandaloneEmailInput = {
      revision: row.revision,
      applicant_name: row.applicant_name,
      recipient: row.recipient,
      role_title: campaign.role_title,
      template: campaign.template,
      fields: merged,
      subject: campaign.customMode ? campaign.customSubject : rendered?.subject ?? "",
      body: campaign.customMode ? campaign.customBody : rendered?.body ?? "",
    };

    try {
      const result = await saveStandaloneEmail(row.id, input);
      if (!result.success) {
        setError(result.error);
        return false;
      }
      const nextRow: RecipientRow = {
        ...row,
        revision: result.data.revision,
        status: result.data.status,
      };
      setRecipients([nextRow]);
      savedFingerprint.current = JSON.stringify({ campaign, recipients: [nextRow] });
      prependHistory([result.data]);
      setNotice("Draft saved. You can resume it anytime from History & Drafts.");
      if (closeAfter) setOpen(false);
      return true;
    } catch {
      setError("Your draft could not be saved. Please retry before closing.");
      return false;
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  function overridesForRow(row: RecipientRow) {
    if (!isInterviewInvite) return undefined;
    const overrides: Record<string, string> = {};
    if (row.interview_date_override.trim()) {
      overrides.interview_date = row.interview_date_override.trim();
    }
    if (row.interview_time_override.trim()) {
      overrides.interview_time = row.interview_time_override.trim();
    }
    if (isVirtualInvite && row.meeting_link_override.trim()) {
      overrides.meeting_link = row.meeting_link_override.trim();
    }
    return Object.keys(overrides).length > 0 ? overrides : undefined;
  }

  async function handleSend(onlyFailed = false) {
    if (running.current || !data || !template || !allRowsComplete || customPlaceholdersInvalid) return;
    const targets = onlyFailed
      ? recipients.filter((r) => r.status === "failed")
      : recipients.filter((r) => r.status !== "sent" && r.status !== "sending");

    if (!targets.length || !campaign.role_title.trim()) return;

    running.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    setProgressText(
      targets.length > 1
        ? `Sending 0 of ${targets.length} emails…`
        : "Sending email…",
    );

    try {
      if (recipients.length === 1 && !onlyFailed) {
        const row = targets[0];
        const merged = mergedFieldsForRow(row);
        const rendered = previewStandaloneRecruitmentEmail(
          template.subject_template,
          template.body_template,
          template.field_definitions,
          merged,
          {
            applicantName: row.applicant_name,
            roleTitle: campaign.role_title,
            templateKey: template.key,
          },
        );
        const input: StandaloneEmailInput = {
          revision: row.revision,
          applicant_name: row.applicant_name.trim(),
          recipient: row.recipient.trim(),
          role_title: campaign.role_title.trim(),
          template: campaign.template,
          fields: merged,
          subject: (campaign.customMode ? campaign.customSubject : rendered.subject).trim(),
          body: (campaign.customMode ? campaign.customBody : rendered.body).trim(),
        };
        const result = await sendStandaloneEmail(row.id, input);
        if (!result.success) {
          setError(result.error);
          if (!["HTTP_422", "HTTP_403", "HTTP_409"].includes(result.code)) {
            try {
              const latest = await getStandaloneEmail(row.id);
              updateRow(row.id, {
                revision: latest.revision,
                status: latest.status,
                error: result.error,
              });
              prependHistory([latest]);
            } catch {
              updateRow(row.id, { status: "failed", error: result.error });
            }
          }
          return;
        }
        const finalRecord = result.data;
        if (finalRecord.status === "sending") {
          prependHistory([finalRecord]);
          setRecipients([{ ...row, status: "sending" }]);
          setNotice(`Email queued for delivery to ${row.applicant_name}.`);
          return;
        }
        const nextRow: RecipientRow = {
          ...row,
          revision: finalRecord.revision,
          status: finalRecord.status === "sent" ? "sent" : "failed",
          error: finalRecord.status === "failed" ? "Email delivery failed. Retry from this message." : undefined,
        };
        setRecipients([nextRow]);
        savedFingerprint.current = JSON.stringify({ campaign, recipients: [nextRow] });
        prependHistory([finalRecord]);
        if (finalRecord.status === "sent") setNotice(`Email sent to ${row.applicant_name}.`);
        else setError("Email delivery failed. Retry the message from History & Drafts.");
        return;
      }

      const targetIds = new Set(targets.map((row) => row.id));
      setRecipients((prev) => prev.map((row) => targetIds.has(row.id)
        ? { ...row, status: "sending", error: undefined }
        : row));

      const result = await batchSendStandaloneEmails({
        role_title: campaign.role_title.trim(),
        template: campaign.template,
        fields: campaign.fields,
        custom_subject: campaign.customMode ? campaign.customSubject.trim() : null,
        custom_body: campaign.customMode ? campaign.customBody.trim() : null,
        recipients: targets.map((row) => ({
          id: row.id,
          applicant_name: row.applicant_name.trim(),
          recipient: row.recipient.trim(),
          revision: row.revision,
          field_overrides: overridesForRow(row),
        })),
      });

      if (!result.success) {
        setRecipients((prev) => prev.map((row) => targetIds.has(row.id)
          ? { ...row, status: "failed", error: result.error }
          : row));
        setError(result.error);
        return;
      }

      const queuedIds = result.data.results
        .filter((item) => item.status === "sending")
        .map((item) => item.id);
      const failedResults = new Map(
        result.data.results.filter((item) => item.status === "failed").map((item) => [item.id, item]),
      );
      const finalRecords: StandaloneEmailRecord[] = result.data.results
        .flatMap((item) => item.status !== "sending" && item.record ? [item.record] : []);
      const queuedRecords = result.data.results
        .flatMap((item) => item.status === "sending" && item.record ? [item.record] : []);
      if (queuedRecords.length) prependHistory(queuedRecords);

      const finalById = new Map(finalRecords.map((record) => [record.id, record]));
      setRecipients((prev) => prev.map((row) => {
        const record = finalById.get(row.id);
        const failed = failedResults.get(row.id);
        if (!record) return failed
          ? { ...row, status: "failed", error: failed.error ?? "Could not queue this email." }
          : row;
        return {
          ...row,
          revision: record.revision,
          status: record.status === "sent" ? "sent" : record.status === "failed" ? "failed" : "sending",
          error: record.status === "failed" ? "Email delivery failed. Retry this recipient." : undefined,
        };
      }));

      if (finalRecords.length) prependHistory(finalRecords);
      const totalSent = finalRecords.filter((record) => record.status === "sent").length;
      const totalFailed = failedResults.size + finalRecords.filter(
        (record) => queuedIds.includes(record.id) && record.status === "failed",
      ).length;
      if (totalFailed === 0) {
        setNotice(queuedIds.length
          ? `Queued ${queuedIds.length} email${queuedIds.length === 1 ? "" : "s"} for delivery.`
          : `Sent ${totalSent} email${totalSent === 1 ? "" : "s"} successfully.`);
      } else {
        setError(
          `${queuedIds.length} queued, ${totalFailed} failed to queue. Fix or click "Retry failed" below.`,
        );
      }
    } catch {
      setError("Sending could not be completed. Check History & Drafts before retrying.");
    } finally {
      running.current = false;
      setBusy(false);
      setProgressText("");
    }
  }

  function resetComposer(keepCampaignDetails = false) {
    if (running.current) return;
    const nextCampaign = keepCampaignDetails
      ? { ...campaign, customMode: false, customSubject: "", customBody: "" }
      : blankCampaign();
    const nextRecipients = [newRecipient()];
    setCampaign(nextCampaign);
    setRecipients(nextRecipients);
    setPreviewIndex(0);
    setShowPasteBox(false);
    setShowRoleImport(false);
    setError("");
    setNotice(
      keepCampaignDetails ? "Ready for your next applicants with the same role & defaults." : "",
    );
    setMessageSignature(null);
    savedFingerprint.current = JSON.stringify({
      campaign: nextCampaign,
      recipients: [],
    });
  }

  function reuseFromHistory(item: StandaloneEmailHistory) {
    if (running.current) return;
    const nextCampaign: CampaignState = {
      role_title: item.role_title,
      template: item.template,
      fields: { ...(item.template_fields ?? {}) },
      customMode: false,
      customSubject: "",
      customBody: "",
    };
    setCampaign(nextCampaign);
    setRecipients([newRecipient()]);
    setPreviewIndex(0);
    setActiveTab("compose");
    setError("");
    setNotice(
      `Loaded template details from ${item.applicant_name || item.role_title}. Add recipients below.`,
    );
  }

  async function resumeDraftOrFailed(item: StandaloneEmailHistory) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const full = await getStandaloneEmail(item.id);
      const nextCampaign: CampaignState = {
        role_title: full.role_title,
        template: full.template,
        fields: { ...(full.template_fields ?? {}) },
        customMode: !!(full.subject || full.body),
        customSubject: full.subject,
        customBody: full.body,
      };
      const nextRow: RecipientRow = {
        id: full.id,
        revision: full.revision,
        applicant_name: full.applicant_name,
        recipient: full.recipient,
        interview_date_override: "",
        interview_time_override: "",
        meeting_link_override: "",
        status: full.status,
      };
      setCampaign(nextCampaign);
      setRecipients([nextRow]);
      setMessageSignature(full.signature_html ?? null);
      savedFingerprint.current = JSON.stringify({
        campaign: nextCampaign,
        recipients: [nextRow],
      });
      setActiveTab("compose");
    } catch {
      setError("The saved message could not be loaded. Please retry.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  async function inspectHistoryBody(item: StandaloneEmailHistory) {
    if (expandedHistory[item.id] || item.body) return;
    try {
      const full = await getStandaloneEmail(item.id);
      setExpandedHistory((prev) => ({ ...prev, [item.id]: full }));
    } catch {
      // Ignore silent inspect failure
    }
  }

  function closeDialog() {
    if (running.current) return;
    if (hasUnsavedContent && isSingleDraftEditable && !allSent) {
      void saveSingleDraft(true);
      return;
    }
    const unsavedRecipients = recipients.some((row) => row.status !== "sent" && row.status !== "sending");
    if (hasUnsavedContent && recipients.length > 1 && unsavedRecipients) {
      if (!window.confirm("Close with unsent recipients in your batch?")) return;
    }
    setOpen(false);
  }

  const sharedFieldLabel = (fieldKey: string, fallback: string) => {
    if (!isInterviewInvite) return fallback;
    if (fieldKey === "interview_date") return "Default interview date";
    if (fieldKey === "interview_time") return "Default interview time";
    if (fieldKey === "meeting_link") return "Default meeting link";
    return fallback;
  };

  return (
    <>
      <Button variant="outline" className={className} onClick={() => void launch()}>
        <Mail />
        Send recruitment email
      </Button>

      {open && (
        <Dialog open onOpenChange={(value) => { if (!value) closeDialog(); }}>
          <DialogContent
            className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
            onInteractOutside={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle>Send recruitment email</DialogTitle>
              <DialogDescription>
                Schedule interview invites with shared defaults or per-applicant dates, times, and virtual links — or send stage updates in batch.
              </DialogDescription>
            </DialogHeader>

            {!data ? (
              <div className="p-6">
                <Button variant="outline" disabled={busy} onClick={() => void launch()}>
                  {busy ? "Loading templates…" : "Retry loading templates"}
                </Button>
                {error && (
                  <p role="alert" className="mt-3 text-sm text-destructive">
                    {error}
                  </p>
                )}
              </div>
            ) : (
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "compose" | "history")}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="border-b bg-muted/20 px-6 py-2">
                  <TabsList className="grid w-full max-w-sm grid-cols-2">
                    <TabsTrigger value="compose" className="gap-1.5">
                      <Send className="h-3.5 w-3.5" />
                      Compose
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-1.5">
                      <History className="h-3.5 w-3.5" />
                      History &amp; Drafts ({data.history.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent
                  value="compose"
                  className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
                >
                  <form
                    className="flex min-h-0 flex-1 flex-col overflow-hidden"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleSend(false);
                    }}
                  >
                    <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[1.2fr_1fr]">
                      {/* Left column: Defaults + Recipients with per-applicant interview controls */}
                      <div className="space-y-5">
                        <section className="space-y-3 rounded-lg border bg-card p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold">
                                1. {isInterviewInvite ? "Interview defaults" : "Role & template"}
                              </h3>
                              {isInterviewInvite && (
                                <p className="text-[11px] text-muted-foreground">
                                  Set shared defaults here, or leave blank to enter date, time, or link per applicant below.
                                </p>
                              )}
                            </div>
                            {!!roles.length && (
                              <Select
                                disabled={busy || allSent || deliveryPending}
                                onValueChange={(roleId) => {
                                  const picked = roles.find((r) => r.id === roleId);
                                  if (!picked) return;
                                  setSelectedRoleId(picked.id);
                                  setCampaign((prev) => ({
                                    ...prev,
                                    role_title: picked.title,
                                  }));
                                }}
                              >
                                <SelectTrigger className="h-8 w-52 text-xs">
                                  <SelectValue placeholder="Fill from active role…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((r) => (
                                    <SelectItem key={r.id} value={r.id}>
                                      {r.title} ({r.candidates.length})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label htmlFor="standalone-role_title">Role applied for *</Label>
                              <Input
                                id="standalone-role_title"
                                required
                                maxLength={255}
                                placeholder="e.g. Travel Consultant"
                                disabled={busy || allSent || deliveryPending}
                                value={campaign.role_title}
                                onChange={(e) =>
                                  setCampaign((prev) => ({
                                    ...prev,
                                    role_title: e.target.value,
                                  }))
                                }
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="standalone-stage">Stage *</Label>
                              <Select
                                disabled={busy || allSent || deliveryPending}
                                value={stage}
                                onValueChange={(value) =>
                                  setCampaign((prev) => ({
                                    ...prev,
                                    template: `${value}_${outcome}`,
                                    fields: {},
                                    customMode: false,
                                    customSubject: "",
                                    customBody: "",
                                  }))
                                }
                              >
                                <SelectTrigger id="standalone-stage" className="w-full">
                                  <SelectValue placeholder="Choose stage" />
                                </SelectTrigger>
                                <SelectContent className="max-h-72">
                                  {data.templates
                                    .filter((item) => item.outcome === "pass")
                                    .map((item) => (
                                      <SelectItem key={item.stage} value={item.stage}>
                                        {item.stage_label}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label htmlFor="standalone-outcome">Result *</Label>
                              <Select
                                disabled={busy || allSent || deliveryPending}
                                value={outcome}
                                onValueChange={(value) =>
                                  setCampaign((prev) => ({
                                    ...prev,
                                    template: `${stage}_${value}`,
                                    fields: {},
                                    customMode: false,
                                    customSubject: "",
                                    customBody: "",
                                  }))
                                }
                              >
                                <SelectTrigger id="standalone-outcome" className="w-full">
                                  <SelectValue placeholder="Choose result" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pass">Pass / Invite</SelectItem>
                                  <SelectItem value="fail">Fail / Rejection</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {template &&
                              visibleEmailFields(template.field_definitions, campaign.fields).map(
                                (field) => {
                                  const fieldId = `standalone-${field.key}`;
                                  const value = String(campaign.fields[field.key] ?? "");
                                  const isFieldRequired = needsDefaultField(field.key) && field.required;
                                  const labelText = sharedFieldLabel(field.key, field.label);
                                  const onFieldChange = (nextVal: string) =>
                                    setCampaign((prev) => ({
                                      ...prev,
                                      fields: { ...prev.fields, [field.key]: nextVal },
                                    }));

                                  return (
                                    <div
                                      key={field.key}
                                      className={`space-y-1.5 ${
                                        ["url", "textarea"].includes(field.type)
                                          ? "sm:col-span-2"
                                          : ""
                                      }`}
                                    >
                                      <Label htmlFor={fieldId}>
                                        {labelText}
                                        {isFieldRequired ? " *" : ""}
                                      </Label>
                                      {field.type === "textarea" ? (
                                        <Textarea
                                          id={fieldId}
                                          required={isFieldRequired}
                                          disabled={busy || allSent || deliveryPending}
                                          value={value}
                                          maxLength={2000}
                                          rows={2}
                                          onChange={(e) => onFieldChange(e.target.value)}
                                        />
                                      ) : field.type === "select" ? (
                                        <Select
                                          disabled={busy || allSent || deliveryPending}
                                          value={value || undefined}
                                          onValueChange={(val) =>
                                            setCampaign((prev) => ({
                                              ...prev,
                                              fields: {
                                                ...prev.fields,
                                                [field.key]: val,
                                                ...(field.key === "interview_format"
                                                  ? { meeting_link: "", address: "" }
                                                  : {}),
                                              },
                                            }))
                                          }
                                        >
                                          <SelectTrigger id={fieldId} className="w-full">
                                            <SelectValue placeholder="Select an option" />
                                          </SelectTrigger>
                                          <SelectContent className="max-h-72">
                                            {Object.entries(field.options ?? {}).map(
                                              ([optVal, optLabel]) => (
                                                <SelectItem key={optVal} value={optVal}>
                                                  {optLabel}
                                                </SelectItem>
                                              ),
                                            )}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <Input
                                          id={fieldId}
                                          type={field.type}
                                          required={isFieldRequired}
                                          disabled={busy || allSent || deliveryPending}
                                          value={value}
                                          maxLength={2000}
                                          min={field.type === "number" ? 1 : undefined}
                                          max={field.type === "number" ? 480 : undefined}
                                          step={field.type === "number" ? 1 : undefined}
                                          placeholder={
                                            field.key === "meeting_link" && isVirtualInvite
                                              ? "https://… (optional if set per applicant below)"
                                              : field.type === "url"
                                                ? "https://…"
                                                : undefined
                                          }
                                          onChange={(e) => onFieldChange(e.target.value)}
                                        />
                                      )}
                                    </div>
                                  );
                                },
                              )}
                          </div>
                        </section>

                        {/* Recipients Card */}
                        <section className="space-y-3 rounded-lg border bg-card p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold">
                                2. {isInterviewInvite ? "Applicants & schedule" : "Recipients"}
                              </h3>
                              <Badge variant="secondary" className="tabular-nums">
                                {recipients.length}/{MAX_RECIPIENTS}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {isInterviewInvite && recipients.length > 1 && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={busy || allSent || deliveryPending}
                                  onClick={staggerInterviewTimes}
                                  title="Fill staggered 30-minute interview slots"
                                >
                                  <Clock className="h-3.5 w-3.5" />
                                  Stagger +30m
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={busy || recipients.length >= MAX_RECIPIENTS}
                                onClick={() => {
                                  setRecipients((prev) => [...prev, newRecipient()]);
                                  setPreviewIndex(recipients.length);
                                }}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add applicant
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={showPasteBox ? "secondary" : "outline"}
                                disabled={busy || recipients.length >= MAX_RECIPIENTS}
                                onClick={() => {
                                  setShowPasteBox((v) => !v);
                                  setShowRoleImport(false);
                                }}
                              >
                                <ClipboardPaste className="h-3.5 w-3.5" />
                                Paste list
                              </Button>
                              {!!roles.length && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={showRoleImport ? "secondary" : "outline"}
                                  disabled={busy || recipients.length >= MAX_RECIPIENTS}
                                  onClick={() => {
                                    setShowRoleImport((v) => !v);
                                    setShowPasteBox(false);
                                  }}
                                >
                                  <Users className="h-3.5 w-3.5" />
                                  From role
                                </Button>
                              )}
                            </div>
                          </div>

                          {showPasteBox && (
                            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                              <Label htmlFor="standalone-paste-box" className="text-xs">
                                Paste names &amp; emails (optional columns: YYYY-MM-DD date, HH:MM time, https:// link)
                              </Label>
                              <Textarea
                                id="standalone-paste-box"
                                rows={4}
                                value={pasteText}
                                onChange={(e) => setPasteText(e.target.value)}
                                placeholder={"Ada Obi, ada@example.com, 2026-12-05, 10:00, https://meet.google.com/abc\nTunde Bakare\ttunde@example.com"}
                              />
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {parsedPaste.length} valid unique email{parsedPaste.length === 1 ? "" : "s"} detected
                                </span>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setShowPasteBox(false);
                                      setPasteText("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={!parsedPaste.length}
                                    onClick={handlePasteImport}
                                  >
                                    Add {parsedPaste.length || ""} recipient{parsedPaste.length === 1 ? "" : "s"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {showRoleImport && activeRoleImport && (
                            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                              <div className="grid gap-2 sm:grid-cols-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Role</Label>
                                  <Select
                                    value={activeRoleImport.id}
                                    onValueChange={setSelectedRoleId}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {roles.map((r) => (
                                        <SelectItem key={r.id} value={r.id}>
                                          {r.title} ({r.candidates.length})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Stage filter</Label>
                                  <Select
                                    value={importStageFilter}
                                    onValueChange={setImportStageFilter}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All stages</SelectItem>
                                      <SelectItem value="cv_screening">CV screening</SelectItem>
                                      <SelectItem value="call_screening">Call screening</SelectItem>
                                      <SelectItem value="oral_interview">Oral interview</SelectItem>
                                      <SelectItem value="written_exam">Written exam</SelectItem>
                                      <SelectItem value="practical">Practical</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-2 pt-1">
                                <span className="text-xs text-muted-foreground">
                                  {importableCandidates.length} new applicant
                                  {importableCandidates.length === 1 ? "" : "s"} ready to add
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={!importableCandidates.length}
                                  onClick={handleRoleImport}
                                >
                                  Import {importableCandidates.length}
                                </Button>
                              </div>
                            </div>
                          )}

                          {recipients.length === 1 ? (
                            <div className="space-y-3">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                  <Label htmlFor="standalone-applicant_name">Applicant name *</Label>
                                  <Input
                                    id="standalone-applicant_name"
                                    required
                                    maxLength={255}
                                    placeholder="Full name"
                                    disabled={busy || deliveryPending || recipients[0].status === "sent"}
                                    value={recipients[0].applicant_name}
                                    onChange={(e) =>
                                      updateRow(recipients[0].id, {
                                        applicant_name: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="standalone-recipient">Email address *</Label>
                                  <Input
                                    id="standalone-recipient"
                                    type="email"
                                    required
                                    maxLength={255}
                                    placeholder="applicant@example.com"
                                    disabled={busy || deliveryPending || recipients[0].status === "sent"}
                                    value={recipients[0].recipient}
                                    onChange={(e) =>
                                      updateRow(recipients[0].id, {
                                        recipient: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>

                              {isInterviewInvite && (
                                <div className="grid gap-2.5 rounded-md border bg-muted/20 p-3 sm:grid-cols-2">
                                  <div className="space-y-1">
                                    <Label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      Applicant date override
                                    </Label>
                                    <Input
                                      aria-label="Applicant 1 interview date"
                                      type="date"
                                      className="h-8 text-xs"
                                      disabled={busy || deliveryPending || recipients[0].status === "sent"}
                                      value={recipients[0].interview_date_override}
                                      onChange={(e) =>
                                        updateRow(recipients[0].id, {
                                          interview_date_override: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      Applicant time override
                                    </Label>
                                    <Input
                                      aria-label="Applicant 1 interview time"
                                      type="time"
                                      className="h-8 text-xs"
                                      disabled={busy || deliveryPending || recipients[0].status === "sent"}
                                      value={recipients[0].interview_time_override}
                                      onChange={(e) =>
                                        updateRow(recipients[0].id, {
                                          interview_time_override: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                  {isVirtualInvite && (
                                    <div className="space-y-1 sm:col-span-2">
                                      <Label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                        <Link2 className="h-3 w-3" />
                                        Virtual interview link {campaign.fields.meeting_link ? "(override)" : "*"}
                                      </Label>
                                      <Input
                                        aria-label="Applicant 1 meeting link"
                                        type="url"
                                        className="h-8 text-xs"
                                        disabled={busy || deliveryPending || recipients[0].status === "sent"}
                                        placeholder={
                                          campaign.fields.meeting_link
                                            ? "Using default link — paste custom https:// link to override"
                                            : "https://meet.google.com/…"
                                        }
                                        value={recipients[0].meeting_link_override}
                                        onChange={(e) =>
                                          updateRow(recipients[0].id, {
                                            meeting_link_override: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="max-h-96 space-y-2.5 overflow-y-auto pr-1">
                              {recipients.map((row, idx) => {
                                const emailTrimmed = row.recipient.trim();
                                const badEmail = emailTrimmed.length > 0 && !isValidEmail(emailTrimmed);
                                const isDup =
                                  emailTrimmed.length > 0 &&
                                  duplicateEmails.has(emailTrimmed.toLowerCase());
                                const rowLocked = row.status === "sent" || row.status === "sending";
                                const effectiveDate =
                                  row.interview_date_override.trim() ||
                                  String(campaign.fields.interview_date ?? "").trim();
                                const effectiveTime =
                                  row.interview_time_override.trim() ||
                                  String(campaign.fields.interview_time ?? "").trim();
                                const effectiveLink =
                                  row.meeting_link_override.trim() ||
                                  String(campaign.fields.meeting_link ?? "").trim();
                                const badLink =
                                  row.meeting_link_override.trim().length > 0 &&
                                  !isHttpsUrl(row.meeting_link_override);
                                const missingSchedule =
                                  isInterviewInvite &&
                                  (!effectiveDate ||
                                    !effectiveTime ||
                                    (isVirtualInvite && !isHttpsUrl(effectiveLink)));

                                return (
                                  <div
                                    key={row.id}
                                    onClick={() => setPreviewIndex(idx)}
                                    className={`space-y-2 rounded-md border p-2.5 text-xs transition-colors ${
                                      idx === safePreviewIndex
                                        ? "border-primary/50 bg-primary/[0.03]"
                                        : "bg-background"
                                    }`}
                                  >
                                    <div className="grid items-center gap-2 sm:grid-cols-[24px_1fr_1.2fr_auto]">
                                      <span className="text-center font-medium tabular-nums text-muted-foreground">
                                        {idx + 1}
                                      </span>
                                      <Input
                                        aria-label={`Applicant name row ${idx + 1}`}
                                        placeholder="Name *"
                                        className="h-8 text-xs"
                                        disabled={busy || rowLocked}
                                        value={row.applicant_name}
                                        onChange={(e) =>
                                          updateRow(row.id, { applicant_name: e.target.value })
                                        }
                                      />
                                      <div className="space-y-0.5">
                                        <Input
                                          aria-label={`Email row ${idx + 1}`}
                                          type="email"
                                          placeholder="email@example.com *"
                                          className={`h-8 text-xs ${badEmail || isDup ? "border-destructive" : ""}`}
                                          disabled={busy || rowLocked}
                                          value={row.recipient}
                                          onChange={(e) =>
                                            updateRow(row.id, { recipient: e.target.value })
                                          }
                                          onKeyDown={(e) => {
                                            if (
                                              e.key === "Enter" &&
                                              idx === recipients.length - 1 &&
                                              recipients.length < MAX_RECIPIENTS
                                            ) {
                                              e.preventDefault();
                                              setRecipients((prev) => [...prev, newRecipient()]);
                                              setPreviewIndex(recipients.length);
                                            }
                                          }}
                                        />
                                        {badEmail && (
                                          <p className="text-[10px] text-destructive">Invalid email</p>
                                        )}
                                        {!badEmail && isDup && (
                                          <p className="text-[10px] text-amber-600">Duplicate email</p>
                                        )}
                                      </div>
                                      <div className="flex items-center justify-end gap-1">
                                        {row.status === "sent" && (
                                          <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-700">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Sent
                                          </Badge>
                                        )}
                                        {row.status === "sending" && (
                                          <Badge variant="secondary" className="gap-1">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Sending
                                          </Badge>
                                        )}
                                        {row.status === "failed" && (
                                          <Badge variant="destructive" className="gap-1" title={row.error}>
                                            <XCircle className="h-3 w-3" />
                                            Failed
                                          </Badge>
                                        )}
                                        {row.status === "idle" && missingSchedule && (
                                          <Badge variant="secondary" className="text-[10px] text-amber-700">
                                            Needs {isVirtualInvite && !isHttpsUrl(effectiveLink) ? "link/time" : "date/time"}
                                          </Badge>
                                        )}
                                        {!rowLocked && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                            aria-label={`Remove row ${idx + 1}`}
                                            disabled={busy}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setRecipients((prev) =>
                                                prev.length <= 1
                                                  ? [newRecipient()]
                                                  : prev.filter((item) => item.id !== row.id),
                                              );
                                            }}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>

                                    {isInterviewInvite && (
                                      <div className="grid gap-2 border-t pt-2 pl-7 sm:grid-cols-2">
                                        <div className="space-y-0.5">
                                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                              <Calendar className="h-2.5 w-2.5" />
                                              Date
                                            </span>
                                            {!row.interview_date_override && campaign.fields.interview_date && (
                                              <span>Default: {String(campaign.fields.interview_date)}</span>
                                            )}
                                          </div>
                                          <Input
                                            aria-label={`Applicant ${idx + 1} interview date`}
                                            type="date"
                                            className="h-7 text-xs"
                                            disabled={busy || rowLocked}
                                            value={row.interview_date_override}
                                            onChange={(e) =>
                                              updateRow(row.id, {
                                                interview_date_override: e.target.value,
                                              })
                                            }
                                          />
                                        </div>

                                        <div className="space-y-0.5">
                                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                              <Clock className="h-2.5 w-2.5" />
                                              Time
                                            </span>
                                            {!row.interview_time_override && campaign.fields.interview_time && (
                                              <span>Default: {String(campaign.fields.interview_time)}</span>
                                            )}
                                          </div>
                                          <Input
                                            aria-label={`Applicant ${idx + 1} interview time`}
                                            type="time"
                                            className="h-7 text-xs"
                                            disabled={busy || rowLocked}
                                            value={row.interview_time_override}
                                            onChange={(e) =>
                                              updateRow(row.id, {
                                                interview_time_override: e.target.value,
                                              })
                                            }
                                          />
                                        </div>

                                        {isVirtualInvite && (
                                          <div className="space-y-0.5 sm:col-span-2">
                                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                              <span className="flex items-center gap-1">
                                                <Link2 className="h-2.5 w-2.5" />
                                                Virtual interview link
                                              </span>
                                              {!row.meeting_link_override && campaign.fields.meeting_link && (
                                                <span>Using default link</span>
                                              )}
                                            </div>
                                            <Input
                                              aria-label={`Applicant ${idx + 1} meeting link`}
                                              type="url"
                                              className={`h-7 text-xs ${badLink ? "border-destructive" : ""}`}
                                              disabled={busy || rowLocked}
                                              placeholder={
                                                campaign.fields.meeting_link
                                                  ? "Uses default link — or paste custom https://…"
                                                  : "https://meet.google.com/… *"
                                              }
                                              value={row.meeting_link_override}
                                              onChange={(e) =>
                                                updateRow(row.id, {
                                                  meeting_link_override: e.target.value,
                                                })
                                              }
                                            />
                                            {badLink && (
                                              <p className="text-[10px] text-destructive">
                                                Must start with https://
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </section>
                      </div>

                      {/* Right column: Instant Live Preview & optional wording customization */}
                      <div className="space-y-4">
                        <Card className="overflow-hidden">
                          <CardHeader className="border-b bg-muted/20 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <CardTitle className="text-sm">Live email preview</CardTitle>
                                <CardDescription className="text-xs">
                                  Shows exact date, time, and link each applicant receives.
                                </CardDescription>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant={campaign.customMode ? "secondary" : "outline"}
                                disabled={busy || allSent || deliveryPending || !template}
                                onClick={toggleCustomMode}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                {campaign.customMode ? "Use template" : "Customize wording"}
                              </Button>
                            </div>

                            {recipients.length > 1 && (
                              <div className="mt-2 flex items-center justify-between rounded-md border bg-background px-2.5 py-1.5 text-xs">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  disabled={safePreviewIndex <= 0}
                                  onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <span className="truncate font-medium">
                                  Previewing: {previewRow.applicant_name || "Unnamed"} ({safePreviewIndex + 1} of {recipients.length})
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  disabled={safePreviewIndex >= recipients.length - 1}
                                  onClick={() =>
                                    setPreviewIndex((i) => Math.min(recipients.length - 1, i + 1))
                                  }
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </CardHeader>

                          <CardContent className="space-y-3 p-4">
                            <dl className="grid gap-1.5 text-xs sm:grid-cols-[4.5rem_1fr]">
                              <dt className="text-muted-foreground">To</dt>
                              <dd className="break-all font-medium">
                                {previewRow.recipient || "Enter applicant email"}
                              </dd>
                              <dt className="text-muted-foreground">CC</dt>
                              <dd className="break-all">{data.cc ?? "None"}</dd>
                              <dt className="text-muted-foreground">Reply to</dt>
                              <dd className="break-all">{data.reply_to}</dd>
                              {!campaign.customMode && (
                                <>
                                  <dt className="text-muted-foreground">Subject</dt>
                                  <dd className="font-semibold break-words">
                                    {renderedPreview.subject}
                                  </dd>
                                </>
                              )}
                            </dl>

                            {campaign.customMode ? (
                              <div className="space-y-3 border-t pt-3">
                                {recipients.length > 1 && (
                                  <p className="text-[11px] text-muted-foreground">
                                    Keep <code className="rounded bg-muted px-1">{"{{applicant_name}}"}</code> or{" "}
                                    <code className="rounded bg-muted px-1">{"{{role_title}}"}</code> to personalize each email.
                                  </p>
                                )}
                                <div className="space-y-1.5">
                                  <Label htmlFor="standalone-subject">Subject *</Label>
                                  <Input
                                    id="standalone-subject"
                                    required
                                    maxLength={255}
                                    disabled={busy || allSent || deliveryPending}
                                    value={campaign.customSubject}
                                    onChange={(e) =>
                                      setCampaign((prev) => ({
                                        ...prev,
                                        customSubject: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="standalone-body">Message *</Label>
                                  <Textarea
                                    id="standalone-body"
                                    required
                                    maxLength={20000}
                                    rows={11}
                                    disabled={busy || allSent || deliveryPending}
                                    value={campaign.customBody}
                                    onChange={(e) =>
                                      setCampaign((prev) => ({
                                        ...prev,
                                        customBody: e.target.value,
                                      }))
                                    }
                                  />
                                </div>
                                {customPlaceholdersInvalid && (
                                  <p className="text-xs text-destructive" role="alert">
                                    Replace all placeholders before sending.
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="max-h-72 overflow-y-auto rounded-md border bg-background p-3.5 text-sm">
                                <p className="whitespace-pre-wrap break-words leading-relaxed">
                                  {renderedPreview.body}
                                </p>
                              </div>
                            )}

                            <details className="border-t pt-2.5 text-xs">
                              <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                                Preview email signature
                              </summary>
                              <iframe
                                title="Email signature preview"
                                sandbox=""
                                referrerPolicy="no-referrer"
                                srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:12px;background:white;overflow-wrap:anywhere;font:13px Arial,sans-serif}img{max-width:100%}</style></head><body>${messageSignature ?? data.signature_html}</body></html>`}
                                className="mt-2 h-48 w-full rounded-md border bg-white"
                              />
                            </details>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Sticky Footer */}
                    <div className="flex flex-col gap-2 border-t bg-background px-6 py-3">
                      {(progressText || notice || error) && (
                        <div className="space-y-1">
                          {progressText && (
                            <p role="status" className="text-xs font-medium text-muted-foreground">
                              {progressText}
                            </p>
                          )}
                          {notice && (
                            <p role="status" className="text-xs font-medium text-emerald-700">
                              {notice}
                            </p>
                          )}
                          {error && (
                            <p role="alert" className="text-xs font-medium text-destructive">
                              {error}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {isSingleDraftEditable && (
                            <Button
                              type="button"
                              variant="outline"
                              disabled={busy}
                              onClick={() => void saveSingleDraft(false)}
                            >
                              Save draft
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                              disabled={busy || deliveryPending}
                            onClick={() => resetComposer(false)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset all
                          </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {failedRecipients.length > 0 && (
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={busy || deliveryPending}
                              onClick={() => void handleSend(true)}
                            >
                              Retry failed ({failedRecipients.length})
                            </Button>
                          )}

                          {allSent ? (
                            <Button
                              type="button"
                              variant="outline"
                              disabled={busy}
                              onClick={() => resetComposer(true)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Send another for this role
                            </Button>
                          ) : (
                            <Button type="submit" disabled={busy || !canSend}>
                              {busy ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Sending…
                                </>
                              ) : validRecipients.length > 1 || recipients.length > 1 ? (
                                `Send to ${unsentRecipients.length} applicants`
                              ) : (
                                "Send email"
                              )}
                            </Button>
                          )}

                          <Button type="button" variant="outline" disabled={busy} onClick={closeDialog}>
                            {hasUnsavedContent && isSingleDraftEditable && !allSent
                              ? "Save and close"
                              : "Close"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent
                  value="history"
                  className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden p-6"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="relative min-w-0 flex-1 sm:max-w-xs">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search applicant, role, or email…"
                        className="h-9 pl-9 text-sm"
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(["all", "sent", "draft", "failed"] as const).map((statusKey) => (
                        <Button
                          key={statusKey}
                          type="button"
                          size="sm"
                          variant={historyFilter === statusKey ? "secondary" : "outline"}
                          onClick={() => setHistoryFilter(statusKey)}
                        >
                          {statusKey === "all"
                            ? "All"
                            : statusKey === "sent"
                              ? "Sent"
                              : statusKey === "draft"
                                ? "Drafts"
                                : "Failed"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                    {!filteredHistory.length ? (
                      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                        {data.history.length
                          ? "No emails match your filter."
                          : "Sent recruitment emails and drafts will appear here."}
                      </div>
                    ) : (
                      filteredHistory.map((item) => {
                        const meta = statusMeta[item.status];
                        const fullRecord = expandedHistory[item.id];
                        const bodyText = fullRecord?.body ?? item.body;
                        const editable = item.status === "draft" || item.status === "failed";
                        return (
                          <div key={item.id} className="rounded-lg border bg-card p-3 text-sm">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold">
                                    {item.applicant_name || "Unnamed applicant"}
                                  </span>
                                  <Badge variant={meta.variant}>{meta.label}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {item.role_title || "No role"}
                                  </span>
                                </div>
                                <p className="break-all text-xs text-muted-foreground">
                                  {item.recipient || "No email"} ·{" "}
                                  {new Date(item.sent_at ?? item.updated_at).toLocaleString(
                                    "en-GB",
                                    { timeZone: "Africa/Lagos" },
                                  )}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={busy}
                                  onClick={() => reuseFromHistory(item)}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  Reuse template
                                </Button>
                                {editable && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => void resumeDraftOrFailed(item)}
                                  >
                                    {item.status === "failed" ? "Retry" : "Resume draft"}
                                  </Button>
                                )}
                              </div>
                            </div>

                            <details
                              className="mt-2 border-t pt-2 text-xs"
                              onToggle={(e) => {
                                if ((e.target as HTMLDetailsElement).open) {
                                  void inspectHistoryBody(item);
                                }
                              }}
                            >
                              <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
                                {item.subject || "View message"}
                              </summary>
                              <p className="mt-2 whitespace-pre-wrap break-words rounded bg-muted/30 p-2.5 text-xs">
                                {bodyText || "Loading message…"}
                              </p>
                            </details>
                          </div>
                        );
                      })
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
