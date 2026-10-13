"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { runTaskWorkflow } from "@/lib/api/task-tracker";
import type { TaskTrackerItem } from "@/lib/types/task-tracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const progressOptions = ["Waiting review", "Blocked", "Waiting on input", "On hold"];

export function TaskStatusDialog({ task, open, onOpenChange, onUpdated }: {
  task: TaskTrackerItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (task: TaskTrackerItem) => void;
}) {
  const [status, setStatus] = useState(task.custom_status
    ? progressOptions.includes(task.custom_status) ? task.custom_status : "custom"
    : task.status === "pending" ? "pending" : "in_progress");
  const [customStatus, setCustomStatus] = useState(task.custom_status || "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (savingRef.current) return;
    const label = status === "custom" ? customStatus.trim() : progressOptions.includes(status) ? status : null;
    if (status === "custom" && !label) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const result = await runTaskWorkflow(task.id, {
        action: "update_status", status: status === "pending" ? "pending" : "in_progress", custom_status: label, note: note.trim(),
      });
      if (result.success) {
        onUpdated(result.data.data);
        toast.success("Task status updated");
        onOpenChange(false);
      } else toast.error(result.error.error || "Could not update the status. Please try again.");
    } catch { toast.error("Could not update the status. Please try again."); }
    finally { savingRef.current = false; setSaving(false); }
  };

  return <Dialog open={open} onOpenChange={next => { if (!saving) onOpenChange(next); }}>
    <DialogContent className="sm:max-w-md max-h-[85dvh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Update task status</DialogTitle>
        <DialogDescription className="break-words">{task.title}. Let others know where your work stands.</DialogDescription>
      </DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`status-${task.id}`}>Status</Label>
          <Select value={status} onValueChange={setStatus} disabled={saving}>
            <SelectTrigger id={`status-${task.id}`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              {progressOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
              <SelectItem value="custom">Custom status…</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {status === "custom" && <div className="space-y-2">
          <Label htmlFor={`custom-status-${task.id}`}>Custom status</Label>
          <Input id={`custom-status-${task.id}`} value={customStatus} onChange={event => setCustomStatus(event.target.value)} maxLength={32} required disabled={saving} placeholder="e.g., Waiting for client" />
          <p className="text-xs text-muted-foreground">Up to 32 characters. Custom statuses describe work in progress.</p>
        </div>}
        <div className="space-y-2">
          <Label htmlFor={`status-note-${task.id}`}>Progress note (optional)</Label>
          <Textarea id={`status-note-${task.id}`} value={note} onChange={event => setNote(event.target.value)} rows={3} maxLength={5000} disabled={saving} />
        </div>
        <p className="text-xs text-muted-foreground">The task stays active, and deadline reminders continue. {task.is_delegated ? "Use Submit for approval when your work is ready for the assigner to approve completion. " : "Mark the task complete when you have finished. "}Status changes are saved in task history.</p>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={saving || (status === "custom" && !customStatus.trim())}>{saving ? "Saving…" : "Update status"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
