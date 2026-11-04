"use client";

import { getProxiedImageUrl } from "@/lib/utils";
import { useEffect, useState } from "react";
import type { TaskTrackerComment, TaskTrackerItem } from "@/lib/types/task-tracker";
import { getTaskHistory, getTaskTrackerComments, getTaskUpdateReceipt, markTaskUpdatesViewed } from "@/lib/api/task-tracker";
import { useQueryClient } from "@tanstack/react-query";
import { formatReadableDate } from "@/lib/utils/readable-date";
import { canReadTaskReceipt, loadTaskActivity } from "@/lib/task-activity";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaskSubmissionDetails } from "./task-workflow-controls";
import { TaskHistoryDetails } from "./task-history-details";

interface HistoryEvent { id: number; type: string; details: Record<string, unknown>; created_at: string; user?: { name: string } | null }

function TaskActivity({ task }: { task: TaskTrackerItem }) {
  const hasSharedHistory = !!task.is_delegated || !!task.reassignments_count;
  const queryClient = useQueryClient();
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [comments, setComments] = useState<TaskTrackerComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [commentsError, setCommentsError] = useState("");
  const canReadReceipt = canReadTaskReceipt(task);
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true); setHistoryError(""); setCommentsError("");
      const receiptPromise = hasSharedHistory && canReadReceipt ? getTaskUpdateReceipt(task.id).catch(() => null) : Promise.resolve(null);
      const { historyResult, commentsResult } = await loadTaskActivity(() => getTaskHistory(task.id), () => hasSharedHistory ? getTaskTrackerComments(task.id) : Promise.resolve(null));
      if (!active) return;
      if (historyResult.status === "fulfilled" && historyResult.value.success) setHistory(historyResult.value.data.data);
      else setHistoryError(historyResult.status === "fulfilled" && !historyResult.value.success ? historyResult.value.error.error : "The history request failed. Please try again.");
      if (commentsResult.status === "fulfilled") {
        if (commentsResult.value?.success) setComments(commentsResult.value.data.data);
        else if (commentsResult.value && !commentsResult.value.success) setCommentsError(commentsResult.value.error.error);
      } else setCommentsError("The comments request failed. Please try again.");
      setLoading(false);
      const loaded = historyResult.status === "fulfilled" && historyResult.value.success && commentsResult.status === "fulfilled" && (!commentsResult.value || commentsResult.value.success);
      const receipt = await receiptPromise;
      if (!active) return;
      if (loaded && receipt?.success && receipt.data.latest_id) {
        const result = await markTaskUpdatesViewed(task.id, receipt.data.latest_id).catch(() => null);
        if (result?.success) void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    };
    void load();
    return () => { active = false; };
  }, [task.id, hasSharedHistory, canReadReceipt, queryClient, attempt]);

  return <section className="border-t pt-4">
    <Tabs defaultValue={hasSharedHistory ? "comments" : "history"}>
      <TabsList aria-label="Task activity">
        {hasSharedHistory && <TabsTrigger value="comments">Comments and updates</TabsTrigger>}
        <TabsTrigger value="history">Task history</TabsTrigger>
      </TabsList>
      {hasSharedHistory && <TabsContent value="comments" className="space-y-4 pt-3">
        {loading ? <p className="text-sm text-muted-foreground">Loading updates…</p> : commentsError ? <div role="alert" className="space-y-2"><p className="text-sm text-destructive">Could not load updates: {commentsError}</p><Button size="sm" variant="outline" onClick={() => setAttempt((value) => value + 1)}>Retry loading activity</Button></div> : comments.length === 0 ? <p className="text-sm text-muted-foreground">No comments or updates yet.</p> : comments.map(comment => <article key={comment.id} className="space-y-1 border-l-2 pl-3">
          <p className="text-sm font-medium">{comment.user?.name || "Staff member"}</p>
          <p className="text-xs text-muted-foreground">{formatReadableDate(comment.created_at)}</p>
          <p className="whitespace-pre-wrap break-words text-sm">{comment.body}</p>
        </article>)}
      </TabsContent>}
      <TabsContent value="history" className="space-y-4 pt-3">
        {loading ? <p className="text-sm text-muted-foreground">Loading history…</p> : historyError ? <div role="alert" className="space-y-2"><p className="text-sm text-destructive">Could not load history: {historyError}</p><Button size="sm" variant="outline" onClick={() => setAttempt((value) => value + 1)}>Retry loading activity</Button></div> : history.length === 0 ? <p className="text-sm text-muted-foreground">No recorded changes yet.</p> : history.map(event => <article key={event.id} className="space-y-1 border-l-2 pl-3">
          <p className="text-sm font-medium capitalize">{event.type.replaceAll("_", " ")}</p>
          <p className="text-xs text-muted-foreground">{event.user?.name || "Staff member"} · {formatReadableDate(event.created_at)}</p>
          <TaskHistoryDetails type={event.type} details={event.details} />
        </article>)}
      </TabsContent>
    </Tabs>
  </section>;
}

export function TaskDetailsSheet({ task, onClose }: { task: TaskTrackerItem | null; onClose: () => void }) {
  return <Sheet open={!!task} onOpenChange={open => { if (!open) onClose(); }}>
    <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
      {task && <>
        <SheetHeader className="border-b pr-10">
          <SheetTitle className="break-words text-xl">{task.title}</SheetTitle>
          <SheetDescription>{task.due_date ? `Deadline: ${formatReadableDate(task.due_date)}` : "No deadline set"}</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 p-4 pt-0">
          {task.description && <p className="whitespace-pre-wrap break-words text-sm">{task.description}</p>}
          {!!task.attachments?.length && <section className="space-y-2 text-sm"><h3 className="font-medium">Task attachments</h3>{task.attachments.map(file => <a key={file.id} href={getProxiedImageUrl(file.download_url)} target="_blank" rel="noopener noreferrer" className="block break-all text-primary underline underline-offset-4">{file.name}</a>)}</section>}
          <TaskSubmissionDetails task={task} compact />
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div><dt className="text-muted-foreground">Priority</dt><dd className="capitalize mt-1">{task.priority}</dd></div>
            <div><dt className="text-muted-foreground">Reminders</dt><dd className="mt-1">{[task.enable_email_reminder && "Email", task.enable_push_reminder && "Push"].filter(Boolean).join(" and ") || "Off"}</dd></div>
            {task.recurrence && <div><dt className="text-muted-foreground">Repeats</dt><dd className="capitalize mt-1">{task.recurrence}</dd></div>}
            {task.completed_at && <div className="col-span-2"><dt className="text-muted-foreground">{task.is_delegated ? "Completion approved" : "Completed"}</dt><dd className="mt-1">{formatReadableDate(task.completed_at)}</dd></div>}
          </dl>
          {task.extension_status && <section className="space-y-2 border-t pt-4 text-sm">
            <h3 className="font-medium">Extension {task.extension_status === "rejected" ? "declined" : task.extension_status}</h3>
            {task.extension_requested_due_date && <p className="text-xs text-muted-foreground">Requested deadline: {formatReadableDate(task.extension_requested_due_date)}</p>}
            {task.extension_reason && <p className="whitespace-pre-wrap break-words">{task.extension_reason}</p>}
            {task.extension_feedback && <p className="whitespace-pre-wrap break-words">{task.extension_feedback}</p>}
          </section>}
          <TaskActivity key={task.updated_at} task={task} />
        </div>
      </>}
    </SheetContent>
  </Sheet>;
}
