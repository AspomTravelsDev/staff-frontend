"use client";

import { formatReadableDate } from "@/lib/utils/readable-date";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";
import type { TaskTrackerComment, TaskTrackerItem } from "@/lib/types/task-tracker";
import { addTaskTrackerComment, getTaskTrackerComments, getTaskUpdateReceipt, markTaskUpdatesViewed } from "@/lib/api/task-tracker";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function TaskCommentsDialog({
  task,
  open,
  onOpenChange,
}: {
  task: TaskTrackerItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [comments, setComments] = useState<TaskTrackerComment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setComments([]);
      try {
        const receipt = await getTaskUpdateReceipt(task.id, "comment").catch(() => null);
        const response = await getTaskTrackerComments(task.id);
        if (!active) return;
        if (response.success) {
          setComments(response.data.data);
          if (receipt?.success && receipt.data.latest_id) {
            const marked = await markTaskUpdatesViewed(task.id, receipt.data.latest_id, "comment").catch(() => null);
            if (marked?.success) void queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }
        }
        else toast.error(response.error?.error || "Failed to load task comments.");
      } catch { if (active) toast.error("Failed to load task comments."); }
      finally { if (active) setLoading(false); }
    }, 0);
    return () => { active = false; clearTimeout(timer); };
  }, [open, task.id, queryClient]);

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      const response = await addTaskTrackerComment(task.id, trimmed);
      if (response.success) {
        setComments((current) => [...current, response.data.data]);
        setBody("");
      } else toast.error(response.error?.error || "Failed to add comment.");
    } catch { toast.error("Failed to add comment."); }
    finally { setSending(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Task discussion</DialogTitle>
          <DialogDescription className="line-clamp-2">{task.title}. Comments are shared with the assignee and the person who assigned this task.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-md border bg-muted/20 p-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No comments yet. Ask a question or share an update.</p>
          ) : comments.map((comment) => (
            <article key={comment.id} className="flex items-start gap-2.5">
              <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                <AvatarImage src={comment.user?.image_url || undefined} />
                <AvatarFallback className="text-[10px]">{comment.user?.name?.slice(0, 2).toUpperCase() || "?"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2">
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="text-xs font-semibold">{comment.user?.name || "Staff member"}</span>
                  <time className="text-[10px] text-muted-foreground">{formatReadableDate(comment.created_at)}</time>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">{comment.body}</p>
              </div>
            </article>
          ))}
        </div>

        <form onSubmit={submitComment} className="space-y-2 border-t pt-3">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Share an update or ask for more information…"
            maxLength={4000}
            rows={3}
            disabled={sending || loading}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={sending || loading || !body.trim()}>
              <Send className="mr-2 h-3.5 w-3.5" /> {sending ? "Sending…" : "Send comment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
