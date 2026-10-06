"use client";

import { formatReadableDate } from "@/lib/utils/readable-date";

import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { requestTaskExtension } from "@/lib/api/task-tracker";
import type { TaskTrackerItem } from "@/lib/types/task-tracker";

interface RequestExtensionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskTrackerItem;
  onSuccess: (updatedTask: TaskTrackerItem) => void;
}

export function RequestExtensionDialog({
  open,
  onOpenChange,
  task,
  onSuccess,
}: RequestExtensionDialogProps) {
  const [loading, setLoading] = useState(false);

  // Default proposed deadline: tomorrow or 2 days after current due date
  const defaultNextDate = () => {
    const base = new Date(Math.max(task.due_date ? new Date(task.due_date).getTime() : 0, Date.now()));
    base.setDate(base.getDate() + 2);
    base.setHours(17, 0, 0, 0);
    return format(base, "yyyy-MM-dd'T'HH:mm");
  };

  const [proposedDate, setProposedDate] = useState<string>(defaultNextDate);
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proposedDate) {
      toast.error("Please pick a proposed new deadline.");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for the extension request.");
      return;
    }

    const proposed = new Date(proposedDate);
    if (Number.isNaN(proposed.getTime()) || proposed <= new Date()) {
      toast.error("Choose a deadline in the future.");
      return;
    }
    const proposedIso = proposed.toISOString();
    if (task.due_date && new Date(proposedIso) <= new Date(task.due_date)) {
      toast.error("Proposed deadline must be later than the current deadline.");
      return;
    }

    setLoading(true);
    try {
      const res = await requestTaskExtension(task.id, {
        requested_due_date: proposedIso,
        reason: reason.trim(),
      });

      if (res.success) {
        toast.success("Deadline extension requested! Your assigner has been alerted.");
        if (res.data?.data) {
          onSuccess(res.data.data);
        }
        onOpenChange(false);
      } else {
        toast.error(res.error?.error || "Failed to request deadline extension");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Request Deadline Extension
            </DialogTitle>
            <DialogDescription>
              Submit a proposed extension for this delegated deliverable. Your assigner will receive an instant notification to review and approve.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Task summary */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/80 text-xs space-y-1">
              <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                Task Deliverable
              </span>
              <p className="font-semibold text-foreground text-sm line-clamp-1">{task.title}</p>
              {task.due_date && (
                <div className="flex items-center gap-1.5 text-muted-foreground pt-1">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  <span>Current Deadline: <strong className="text-foreground">{formatReadableDate(task.due_date)}</strong></span>
                </div>
              )}
            </div>

            {/* Proposed Deadline */}
            <div className="space-y-1.5">
              <Label htmlFor="proposed-date" className="text-xs font-semibold">
                Proposed New Deadline <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="proposed-date"
                type="datetime-local"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                required
                className="font-mono text-xs focus-visible:ring-amber-500"
              />
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label htmlFor="extension-reason" className="text-xs font-semibold">
                Reason & Justification <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="extension-reason"
                placeholder="Explain why extra time is needed (e.g., waiting for embassy clearance documents, client delayed response...)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
                className="text-xs resize-none focus-visible:ring-amber-500"
              />
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {task.assigned_by ? (
                  <><strong>{task.assigned_by.name}</strong> will be prompted to approve or decline this request.</>
                ) : (
                  <>Your assigner will be prompted to review this request.</>
                )}
              </span>
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
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
