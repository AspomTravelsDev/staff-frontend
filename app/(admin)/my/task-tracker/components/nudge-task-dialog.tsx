"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { nudgeTaskAssignee } from "@/lib/api/task-tracker";
import type { TaskTrackerItem } from "@/lib/types/task-tracker";
import { formatReadableDate } from "@/lib/utils/readable-date";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function NudgeTaskDialog({ task, open, onOpenChange }: {
  task: TaskTrackerItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    try {
      const result = await nudgeTaskAssignee(task.id, { message: message.trim() || undefined });
      if (result.success) {
        if (result.data.email_sent) toast.success(result.data.message);
        else toast.warning(result.data.message);
        onOpenChange(false);
      } else toast.error(result.error.error || "Could not send the nudge. Please try again.");
    } catch { toast.error("Could not send the nudge. Please try again."); }
    finally { sendingRef.current = false; setSending(false); }
  };

  return <Dialog open={open} onOpenChange={next => { if (!sending) onOpenChange(next); }}>
    <DialogContent className="sm:max-w-md max-h-[85dvh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Send nudge</DialogTitle>
        <DialogDescription>Send {task.user?.name || "the assigned staff member"} a reminder by email and portal notification.</DialogDescription>
      </DialogHeader>
      <form onSubmit={send} className="space-y-4">
        <div className="space-y-1 rounded-lg border bg-muted/30 p-3">
          <p className="font-medium break-words">{task.title}</p>
          <p className="text-sm text-muted-foreground">{task.due_date ? `Deadline: ${formatReadableDate(task.due_date)}` : "No deadline set"}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`nudge-message-${task.id}`}>Message (optional)</Label>
          <Textarea id={`nudge-message-${task.id}`} value={message} onChange={event => setMessage(event.target.value)} maxLength={500} rows={3} disabled={sending} placeholder="Please share an update on your progress." />
          <p className="text-xs text-muted-foreground">Leave blank to send a standard reminder with your name and the task deadline.</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={sending} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={sending}>{sending ? "Sending…" : "Send nudge"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
