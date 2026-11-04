"use client";

import { useState } from "react";
import { CalendarClock, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { approveTaskExtension, rejectTaskExtension } from "@/lib/api/task-tracker";
import type { TaskTrackerItem } from "@/lib/types/task-tracker";
import { formatReadableDate } from "@/lib/utils/readable-date";

interface ReviewExtensionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskTrackerItem;
  onSuccess: (updatedTask: TaskTrackerItem) => void;
}

export function ReviewExtensionDialog({ open, onOpenChange, task, onSuccess }: ReviewExtensionDialogProps) {
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);

  const review = async (nextDecision: "approved" | "rejected") => {
    if (!note.trim()) {
      toast.error("Add a note before recording your decision.");
      return;
    }

    setDecision(nextDecision);
    try {
      const result = nextDecision === "approved"
        ? await approveTaskExtension(task.id, { feedback: note.trim() })
        : await rejectTaskExtension(task.id, { feedback: note.trim() });

      if (!result.success) {
        toast.error(result.error?.error || `Could not ${nextDecision === "approved" ? "approve" : "reject"} extension`);
        return;
      }

      const updatedTask = result.data?.data;
      if (updatedTask) onSuccess(updatedTask);
      toast.success(nextDecision === "approved" ? "Extension approved" : "Extension rejected");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your decision");
    } finally {
      setDecision(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!decision) onOpenChange(nextOpen); }}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Review deadline extension</DialogTitle>
          <DialogDescription>
            Review the proposed deadline and reason for {task.user?.name || "the assignee"}, then approve or reject the request with a note.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="font-medium">{task.title}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Current deadline</p>
                <p className="mt-1 text-sm font-medium">{task.due_date ? formatReadableDate(task.due_date) : "No deadline set"}</p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="size-3.5" />Requested deadline</p>
                <p className="mt-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
                  {task.extension_requested_due_date ? formatReadableDate(task.extension_requested_due_date) : "No requested deadline provided"}
                </p>
              </div>
            </div>
            {task.extension_reason && (
              <div className="mt-3 border-t pt-3">
                <p className="text-xs text-muted-foreground">Reason from assignee</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{task.extension_reason}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`extension-review-note-${task.id}`}>Decision note</Label>
            <Textarea
              id={`extension-review-note-${task.id}`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Explain your decision or provide guidance to the assignee."
              maxLength={1000}
              rows={3}
              required
              disabled={!!decision}
            />
            <p className="text-xs text-muted-foreground">The note will be shared with the assignee.</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={!!decision}>Cancel</Button>
          <Button type="button" variant="destructive" onClick={() => void review("rejected")} disabled={!!decision}>
            {decision === "rejected" ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
            Reject
          </Button>
          <Button type="button" onClick={() => void review("approved")} disabled={!!decision}>
            {decision === "approved" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
