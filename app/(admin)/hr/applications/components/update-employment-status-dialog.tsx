"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { EmploymentOutcome } from "@/lib/types/hr";
import { updateApplicationEmploymentStatusAction } from "../actions";
import { CUSTOM_OUTCOME_MAX_LENGTH, employmentOutcomeLabels, employmentOutcomeLabel, isStandardEmploymentOutcome } from "@/lib/employment-outcomes";

export function EmploymentOutcomeBadge({ status }: { status?: EmploymentOutcome | null }) {
  if (!status) return <span className="text-xs text-muted-foreground">Not set</span>;
  const colors: Record<EmploymentOutcome, string> = {
    active: "border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300",
    rejected: "border-slate-300 bg-slate-500/10 text-slate-700 dark:border-slate-700 dark:text-slate-300",
    discontinued: "border-red-300 bg-red-500/10 text-red-700 dark:border-red-800 dark:text-red-300",
    not_resumed: "border-amber-300 bg-amber-500/10 text-amber-800 dark:border-amber-800 dark:text-amber-300",
    resignation: "border-slate-300 bg-slate-500/10 text-slate-700 dark:border-slate-700 dark:text-slate-300",
    termination: "border-red-300 bg-red-500/10 text-red-700 dark:border-red-800 dark:text-red-300",
    absconded: "border-amber-300 bg-amber-500/10 text-amber-800 dark:border-amber-800 dark:text-amber-300",
  };
  return <span className={`inline-flex max-w-52 break-words rounded-full border px-2.5 py-0.5 text-xs font-medium ${isStandardEmploymentOutcome(status) ? colors[status] : colors.rejected}`}>{employmentOutcomeLabel(status)}</span>;
}

export function UpdateEmploymentStatusDialog(props: Parameters<typeof EmploymentStatusDialogContent>[0]) {
  return <Dialog open={props.open} onOpenChange={props.onOpenChange}>
    {props.open && <EmploymentStatusDialogContent key={`${props.applicationId}:${props.initialStatus ?? ""}:${props.initialNote ?? ""}`} {...props} />}
  </Dialog>;
}

function EmploymentStatusDialogContent({
  applicationId,
  initialStatus,
  initialNote,
  onOpenChange,
}: {
  applicationId: string;
  initialStatus?: EmploymentOutcome | null;
  initialNote?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const initialChoice = initialStatus ? isStandardEmploymentOutcome(initialStatus) ? initialStatus : "custom" : "unset";
  const [status, setStatus] = useState<string>(initialChoice);
  const [customStatus, setCustomStatus] = useState(initialStatus && !isStandardEmploymentOutcome(initialStatus) ? initialStatus : "");
  const [note, setNote] = useState(initialNote || "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const save = () => {
    if (status === "custom" && !customStatus.trim()) return;
    startTransition(async () => {
      try {
        await updateApplicationEmploymentStatusAction(applicationId, {
          employment_status: status === "unset" ? null : status === "custom" ? customStatus.trim() : status,
          employment_status_note: note.trim() || undefined,
        });
        toast.success("Staff outcome updated.");
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update the staff outcome.");
      }
    });
  };

  return (
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update staff outcome</DialogTitle>
          <DialogDescription>This is separate from onboarding progress. Changing it will not deactivate the staff portal account.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor={`employment-outcome-${applicationId}`}>Staff outcome</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id={`employment-outcome-${applicationId}`}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Not set</SelectItem>
                {Object.entries(employmentOutcomeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                <SelectItem value="custom">Custom status…</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {status === "custom" && <div className="space-y-2">
            <Label htmlFor={`employment-custom-${applicationId}`}>Custom status</Label>
            <Input id={`employment-custom-${applicationId}`} value={customStatus} onChange={event => setCustomStatus(event.target.value)} maxLength={CUSTOM_OUTCOME_MAX_LENGTH} placeholder="Enter a short status" aria-describedby={`employment-custom-help-${applicationId}`} />
            <p id={`employment-custom-help-${applicationId}`} className="text-xs text-muted-foreground">Up to {CUSTOM_OUTCOME_MAX_LENGTH} characters.</p>
          </div>}
          <div className="space-y-2">
            <Label htmlFor={`employment-outcome-note-${applicationId}`}>Note <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Textarea id={`employment-outcome-note-${applicationId}`} value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={1000} placeholder="Add context for this outcome" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={save} disabled={isPending || (status === "custom" && !customStatus.trim())}>{isPending ? "Saving…" : "Save outcome"}</Button>
        </DialogFooter>
      </DialogContent>
  );
}

export function EmploymentOutcomeActionButton({ application }: { application: {
  id: string;
  employment_status?: EmploymentOutcome | null;
  employment_status_note?: string | null;
} }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {application.employment_status ? "Change staff outcome" : "Set staff outcome"}
      </Button>
      <UpdateEmploymentStatusDialog
        applicationId={application.id}
        initialStatus={application.employment_status}
        initialNote={application.employment_status_note}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
