"use client";

import { formatReadableDate } from "@/lib/utils/readable-date";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { rejectTaskExtension } from "@/lib/api/task-tracker";
import type { TaskTrackerItem } from "@/lib/types/task-tracker";

interface DeclineExtensionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskTrackerItem;
  onSuccess: (updatedTask: TaskTrackerItem) => void;
}

export function DeclineExtensionDialog({
  open,
  onOpenChange,
  task,
  onSuccess,
}: DeclineExtensionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await rejectTaskExtension(task.id, {
        feedback: feedback.trim() || undefined,
      });

      if (res.success) {
        toast.info("Extension request declined. Assignee has been notified.");
        if (res.data?.data) {
          onSuccess(res.data.data);
        }
        onOpenChange(false);
      } else {
        toast.error(res.error?.error || "Failed to decline extension request");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
              <XCircle className="h-5 w-5" />
              Decline Deadline Extension
            </DialogTitle>
            <DialogDescription>
              Provide feedback or instructions to {task.user?.name || "the assignee"} explaining why the extension cannot be granted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3">
            {/* Context details */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assignee:</span>
                <span className="font-semibold text-foreground">{task.user?.name}</span>
              </div>
              {task.extension_requested_due_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proposed Deadline:</span>
                  <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                    {formatReadableDate(task.extension_requested_due_date)}
                  </span>
                </div>
              )}
              {task.extension_reason && (
                <div className="pt-1 border-t border-border/60">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Their Reason:</span>
                  <p className="italic text-foreground/80 mt-0.5">&ldquo;{task.extension_reason}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Feedback textarea */}
            <div className="space-y-1.5">
              <Label htmlFor="decline-feedback" className="text-xs font-semibold">
                Feedback / Guidance Note <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="decline-feedback"
                placeholder="e.g. This filing deadline is strict with immigration authorities. Please prioritize this deliverable today..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="text-xs resize-none focus-visible:ring-rose-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="destructive"
              className="gap-1.5"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Decline Extension
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
