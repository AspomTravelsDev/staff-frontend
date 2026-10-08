"use client";

import { formatReadableDate } from "@/lib/utils/readable-date";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { getTaskHistory, runTaskWorkflow } from "@/lib/api/task-tracker";
import type { TaskTrackerItem } from "@/lib/types/task-tracker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Action = Parameters<typeof runTaskWorkflow>[1]["action"];
interface HistoryEvent { id: number; type: string; details: Record<string, unknown>; created_at: string; user?: { name: string } | null }
const labels: Record<Action, string> = { start: "Start work", submit: "Submit deliverable", accept: "Accept deliverable", request_changes: "Request changes", cancel: "Cancel task", reopen: "Reopen task" };
const dialogLabels: Record<Action, string> = { ...labels, submit: "Confirm work submission", accept: "Confirm task completion" };
const confirmLabels: Record<Action, string> = { ...labels, submit: "Confirm submission", accept: "Confirm completion" };
export const taskStatusLabels: Record<TaskTrackerItem["status"], string> = {
  pending: "Pending", in_progress: "In progress", submitted: "Awaiting review",
  changes_requested: "Changes requested", completed: "Completed", cancelled: "Cancelled",
};
export function isActiveTask(task: TaskTrackerItem) {
  return ["pending", "in_progress", "changes_requested"].includes(task.status);
}

export function TaskSubmissionDetails({ task, compact = false }: { task: TaskTrackerItem; compact?: boolean }) {
  const safeUrl = task.submission_url && /^https?:\/\//i.test(task.submission_url) ? task.submission_url : null;
  return <div className="space-y-2 text-xs">
    {task.is_delegated ? <dl className={`grid grid-cols-1 gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2 ${compact ? "" : "xl:grid-cols-4"}`}>
      <div className="min-w-0 space-y-1">
        <dt className="text-muted-foreground">Assigned by</dt>
        <dd className="font-medium break-words">{task.assigned_by?.name || "Staff member unavailable"}</dd>
        <dd className="text-muted-foreground break-words">Department: {task.assigned_by?.department || "Not specified"}</dd>
      </div>
      <div className="min-w-0 space-y-1">
        <dt className="text-muted-foreground">Assigned to</dt>
        <dd className="font-medium break-words">{task.user?.name || "Staff member unavailable"}</dd>
        <dd className="text-muted-foreground break-words">Department: {task.user?.department || "Not specified"}</dd>
      </div>
      <div className="space-y-1">
        <dt className="text-muted-foreground">Assigned on</dt>
        <dd className="font-medium"><time dateTime={task.created_at}>{formatReadableDate(task.created_at)}</time></dd>
      </div>
      <div className="space-y-1">
        <dt className="text-muted-foreground">Status</dt>
        <dd><Badge variant="outline">{task.status === "completed" ? "Accepted" : taskStatusLabels[task.status]}</Badge></dd>
      </div>
    </dl> : <Badge variant="outline">{taskStatusLabels[task.status]}</Badge>}
    {task.submitted_at && <div className="rounded-md border bg-muted/20 p-3 space-y-1">
      <p className="font-medium">Submitted {formatReadableDate(task.submitted_at)}</p>
      <p className="text-muted-foreground">{!task.submission_due_date || new Date(task.submitted_at) <= new Date(task.submission_due_date) ? "Submitted on time" : "Submitted past deadline"}</p>
      <p className="whitespace-pre-wrap break-words">{task.submission_note}</p>
      {safeUrl && <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline break-all">Open submitted work</a>}
    </div>}
    {task.review_feedback && <p className="whitespace-pre-wrap rounded-md border p-3"><strong>Reviewer feedback: </strong>{task.review_feedback}</p>}
    {task.original_due_date && (!task.due_date || new Date(task.original_due_date).getTime() !== new Date(task.due_date).getTime()) && <p className="text-muted-foreground">Original deadline: {formatReadableDate(task.original_due_date)}</p>}
  </div>;
}

export function TaskWorkflowControls({ task, onUpdated, compact = false, showHistory = true, renderControls }: { task: TaskTrackerItem; onUpdated: (task: TaskTrackerItem) => void; compact?: boolean; showHistory?: boolean; renderControls?: (controls: ReactNode) => ReactNode }) {
  const [action, setAction] = useState<Action | null>(null);
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  useEffect(() => {
    if (!historyOpen) return;
    let active = true;
    setLoadingHistory(true);
    setHistoryError(false);
    getTaskHistory(task.id).then(res => {
      if (!active) return;
      if (res.success) setHistory(res.data.data);
      else setHistoryError(true);
    }).catch(() => { if (active) setHistoryError(true); }).finally(() => { if (active) setLoadingHistory(false); });
    return () => { active = false; };
  }, [historyOpen, task.id]);
  const openAction = (next: Action) => { setNote(""); setUrl(""); setAction(next); };
  const startWork = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const res = await runTaskWorkflow(task.id, { action: "start" });
      if (res.success) { onUpdated(res.data.data); toast.success("Work started"); }
      else toast.error(res.error.error || "Could not start work");
    } catch { toast.error("Could not start work. Please try again."); }
    finally { savingRef.current = false; setSaving(false); }
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!action || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const res = await runTaskWorkflow(task.id, { action, note: note.trim(), url: url.trim() || null });
      if (res.success) { onUpdated(res.data.data); setAction(null); toast.success(res.data.message || "Task updated"); }
      else toast.error(res.error?.error || "Could not update task");
    } catch { toast.error("Could not update task. Please try again."); }
    finally { savingRef.current = false; setSaving(false); }
  };
  const controls = <>
    {task.can_submit && isActiveTask(task) && <>
      {task.status === "pending" && <Button size="sm" variant={renderControls ? "ghost" : compact ? "default" : "outline"} disabled={saving} onClick={startWork}>{saving ? "Starting…" : compact ? "Begin" : "Begin work"}</Button>}
      {(!compact || task.status !== "pending") && <Button size="sm" variant={renderControls ? "ghost" : "default"} onClick={() => openAction("submit")}>Submit work</Button>}
    </>}
    {!compact && task.can_review && task.status === "submitted" && <>
      <Button size="sm" variant={renderControls ? "ghost" : "default"} onClick={() => openAction("accept")}>Accept deliverable</Button>
      <Button size="sm" variant={renderControls ? "ghost" : "outline"} onClick={() => openAction("request_changes")}>Request changes</Button>
    </>}
    {!compact && task.is_delegated && task.can_manage && !["completed", "cancelled"].includes(task.status) && <Button size="sm" variant={renderControls ? "ghost" : "outline"} onClick={() => openAction("cancel")}>Cancel task</Button>}
    {!compact && task.is_delegated && task.can_manage && ["completed", "cancelled"].includes(task.status) && <Button size="sm" variant={renderControls ? "ghost" : "outline"} onClick={() => openAction("reopen")}>Reopen task</Button>}
    {!compact && showHistory && <Button size="sm" variant="ghost" onClick={() => setHistoryOpen(true)}>History</Button>}
  </>;
  return <div className="flex flex-wrap gap-2" data-tour="task-workflow" onClick={e => e.stopPropagation()}>
    {renderControls ? renderControls(controls) : controls}
    <Dialog open={action !== null} onOpenChange={open => { if (!open && !saving) setAction(null); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{action ? dialogLabels[action] : "Task action"}</DialogTitle><DialogDescription><strong className="break-words">{task.title}</strong>. {action === "submit" ? "Confirm that your work is ready for review. Add a completion note below. The task will be completed once your assigner accepts it." : action === "accept" ? `Accept ${task.user?.name ? `${task.user.name}'s submitted work` : "the submitted work"} and mark this task as completed? Timeliness uses the submission time, so review delays do not count against staff.` : action === "cancel" ? "Cancellation keeps the task and its history for accountability." : "This action will be recorded in the shared history."}</DialogDescription></DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="space-y-2"><Label htmlFor={`note-${task.id}`}>{action === "submit" ? "Completion note" : "Feedback / note"}{action === "submit" || action === "request_changes" ? " (required)" : " (optional)"}</Label>
            <Textarea id={`note-${task.id}`} value={note} onChange={e => setNote(e.target.value)} required={action === "submit" || action === "request_changes"} maxLength={5000} disabled={saving} /></div>
          {action === "submit" && <div className="space-y-2"><Label htmlFor={`url-${task.id}`}>Work link (optional)</Label><Input id={`url-${task.id}`} type="url" placeholder="https://…" value={url} onChange={e => setUrl(e.target.value)} pattern="https?://.*" maxLength={2000} disabled={saving} /></div>}
          <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={() => setAction(null)}>Back</Button><Button disabled={saving || ((action === "submit" || action === "request_changes") && !note.trim())}>{saving ? "Saving…" : action ? confirmLabels[action] : "Save"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Task history</DialogTitle><DialogDescription>{task.title}. Deadline changes, submissions and decisions are retained here. Older tasks start with the deadline available when history was introduced.</DialogDescription></DialogHeader>
        {loadingHistory ? <p>Loading history…</p> : historyError ? <p role="alert">Could not load history. Close and reopen to retry.</p> : history.length === 0 ? <p>No recorded changes yet.</p> : history.map(event => <article key={event.id} className="border-l-2 pl-3 space-y-1 text-sm">
          <p className="font-semibold capitalize">{event.type.replaceAll("_", " ")}</p>
          <p className="text-xs text-muted-foreground">{event.user?.name || "Staff member"} · {formatReadableDate(event.created_at)}</p>
          {Object.entries(event.details || {}).filter(([key, value]) => value != null && !["before", "after"].includes(key)).map(([key, value]) => <p key={key} className="whitespace-pre-wrap break-words text-xs"><strong className="capitalize">{key.replaceAll("_", " ")}: </strong>{Array.isArray(value) ? value.join(", ") : typeof value === "string" && /deadline/.test(key) && !Number.isNaN(Date.parse(value)) ? formatReadableDate(value) : String(value)}</p>)}
        </article>)}
      </DialogContent>
    </Dialog>
  </div>;
}
