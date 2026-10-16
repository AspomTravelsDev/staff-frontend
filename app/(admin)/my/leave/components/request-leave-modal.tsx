"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Paperclip, AlertCircle, FileText, X, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format, addBusinessDays } from "date-fns";
import { getRoleLabel } from "@/types/user-types";

interface RequestLeaveModalProps {
  userName: string;
  role: string | undefined;
}

const leaveTypes = [
  { value: "Annual", label: "Annual Leave", badge: "Confirmed staff only" },
  { value: "Casual", label: "Casual Leave", badge: "Independent of annual leave balance" },
  { value: "Emergency", label: "Emergency Leave", badge: "Urgent family matter" },
  { value: "Sick", label: "Sick Leave", badge: "Max 3 instances / 12 days" },
  { value: "Exam/Study", label: "Exam / Study Leave", badge: "Max 5 working days" },
  { value: "Bereavement", label: "Bereavement Leave", badge: "1-2 days" },
  { value: "Maternity", label: "Maternity Leave", badge: "12 weeks (min 12 mos tenure)" },
  { value: "Unpaid", label: "Unpaid Leave", badge: "Max 5 days / year" },
  { value: "Ante-Natal", label: "Ante-Natal Care", badge: "Pregnancy appointments" },
  { value: "Special", label: "Special Leave", badge: "Line Manager discretion" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png"];

export function validateLeaveFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return `File "${file.name}" is ${sizeMB}MB. Maximum allowed size is 10MB.`;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return `File "${file.name}" has an unsupported format (.${ext}). Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`;
  }
  return null;
}

export function RequestLeaveModal({ userName, role }: RequestLeaveModalProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(leaveTypes[0].value);
  const [days, setDays] = useState(1);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState("");
  const [handoverFile, setHandoverFile] = useState<File | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const endDate = useMemo(() => {
    if (!startDate || !days) return "";
    const end = addBusinessDays(startDate, days);
    return format(end, "yyyy-MM-dd");
  }, [startDate, days]);

  const selectedTypeObj = useMemo(() => {
    return leaveTypes.find((lt) => lt.value === type);
  }, [type]);

  const charCount = reason.length;

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function uploadDocumentFile(file: File, label: string): Promise<string> {
    const validationError = validateLeaveFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const formData = new FormData();
    formData.append("file", file, file.name);

    const res = await fetch("/api/leave/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.download_url) {
      throw new Error(data.error || `Failed to upload ${label}. Please try again.`);
    }

    return data.download_url;
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!startDate) {
      toast.error("Please pick a proposed start date.");
      return;
    }
    if (charCount > 1000) {
      toast.error("The reason must not exceed 1000 characters.");
      return;
    }

    setLoading(true);
    try {
      let handoverNoteUrl: string | undefined = undefined;
      let attachmentUrl: string | undefined = undefined;

      // Upload Handover Note if selected
      if (handoverFile) {
        handoverNoteUrl = await uploadDocumentFile(handoverFile, "handover note");
      }

      // Upload Supporting Evidence if selected
      if (evidenceFile) {
        attachmentUrl = await uploadDocumentFile(evidenceFile, "supporting document");
      }

      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          start_date: format(startDate, "yyyy-MM-dd"),
          days,
          reason,
          handover_note_url: handoverNoteUrl || null,
          attachment_url: attachmentUrl || null,
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resData.error || "Failed to submit leave request.");
      }

      toast.success("Leave request submitted successfully.");
      setOpen(false);
      // Reset form
      setDays(1);
      setStartDate(undefined);
      setReason("");
      setHandoverFile(null);
      setEvidenceFile(null);
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to submit leave request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          Request Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl p-6 md:p-8 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold">Request Leave</DialogTitle>
          <DialogDescription className="text-sm">
            Submit a leave application per company policy. Optional handover notes or medical reports can be attached.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* User Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Applicant Name</Label>
              <Input value={userName} readOnly className="bg-slate-50 dark:bg-slate-900 font-medium" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</Label>
              <Input value={getRoleLabel(role) || "-"} readOnly className="bg-slate-50 dark:bg-slate-900 font-medium" />
            </div>
          </div>

          {/* Leave Parameters Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">Type of Leave</Label>
              <Select value={type} onValueChange={setType} name="type" required>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((lt) => (
                    <SelectItem key={lt.value} value={lt.value}>
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="font-medium">{lt.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">Number of Working Days</Label>
              <Input
                type="number"
                min={1}
                max={type === "Maternity" ? 60 : (type === "Annual" ? 10 : 30)}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                name="days"
                required
                className="h-10"
              />
            </div>
          </div>

          {/* Policy Information Alert */}
          {selectedTypeObj && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-3 shadow-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
              <div className="leading-relaxed">
                <span className="font-bold">{selectedTypeObj.label}:</span> {selectedTypeObj.badge}
                {type === "Annual" && " • Minimum 4 weeks advance notice recommended. Handover note optional."}
                {type === "Sick" && " • Medical report attachment is optional but recommended."}
                {type === "Maternity" && " • Forfeits annual leave days for the current calendar year."}
              </div>
            </div>
          )}

          {/* Schedule Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">Proposed Start Date</Label>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Pick a start date"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">Resumption Date</Label>
              <Input value={endDate} readOnly required className="bg-slate-50 dark:bg-slate-900 font-medium h-10" />
            </div>
          </div>

          {/* Reason Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider">Reason / Details</Label>
              <span className={`text-[11px] ${charCount > 1000 ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                {charCount} / 1000 chars
              </span>
            </div>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide context for your leave request..."
              name="reason"
              required
              maxLength={1000}
              rows={4}
              className="resize-y text-xs"
            />
            {charCount > 1000 && (
              <p className="text-[11px] text-red-500 font-medium">
                Reason exceeds the maximum limit of 1000 characters. Please shorten your explanation.
              </p>
            )}
          </div>

          {/* Optional Attachments Section */}
          <div className="border-t pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5 text-primary" />
                Optional Attachments
              </h4>
              <span className="text-[11px] text-muted-foreground">PDF, DOC, DOCX, JPG, PNG (Max 10MB)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Handover Note Dropzone Button */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Handover Note</Label>
                <div className="relative border border-dashed rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const err = validateLeaveFile(file);
                        if (err) {
                          toast.error(err);
                          e.target.value = "";
                          return;
                        }
                        setHandoverFile(file);
                      } else {
                        setHandoverFile(null);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {handoverFile ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate text-xs">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="truncate font-medium">{handoverFile.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-red-500 relative z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHandoverFile(null);
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-0.5">
                      <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                      <span>Choose Handover Note...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Supporting Document Dropzone Button */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Supporting Document / Proof</Label>
                <div className="relative border border-dashed rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const err = validateLeaveFile(file);
                        if (err) {
                          toast.error(err);
                          e.target.value = "";
                          return;
                        }
                        setEvidenceFile(file);
                      } else {
                        setEvidenceFile(null);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {evidenceFile ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate text-xs">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="truncate font-medium">{evidenceFile.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-red-500 relative z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEvidenceFile(null);
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-0.5">
                      <Paperclip className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Choose Medical/Proof File...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t flex flex-row justify-end gap-3 sm:gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading} className="px-5">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit()}
              disabled={loading}
              className="px-6 font-semibold"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Leave Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
