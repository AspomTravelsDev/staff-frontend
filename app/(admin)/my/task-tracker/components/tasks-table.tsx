"use client";

import { useEffect, useState, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { TaskTrackerItem } from "@/lib/types/task-tracker";
import { formatReadableDate } from "@/lib/utils/readable-date";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { isActiveTask, taskStatusLabels } from "./task-workflow-controls";
import { TaskRowActions } from "./task-row-actions";
import { TaskDetailsSheet } from "./task-details-sheet";
import { TaskCommentsDialog } from "./task-comments-dialog";

interface Props {
  tasks: TaskTrackerItem[];
  allTasks: TaskTrackerItem[];
  view: "assigned_to_me" | "assigned_by_me";
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (task: TaskTrackerItem) => void;
  onUpdated: (task: TaskTrackerItem) => void;
}

export function TasksTable({ tasks, allTasks, view, onToggle, onDelete, onEdit, onUpdated }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkedTaskId = searchParams.get("task");
  const [selectedId, setSelectedId] = useState<string | null>(linkedTaskId);
  useEffect(() => { startTransition(() => setSelectedId(linkedTaskId)); }, [linkedTaskId]);
  const [commentsTask, setCommentsTask] = useState<TaskTrackerItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const selected = allTasks.find(t => t.id === selectedId) ?? null;
  const toggle = async (id: string) => { setBusyId(id); try { await onToggle(id); } finally { setBusyId(null); } };
  const remove = async (task: TaskTrackerItem) => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    setBusyId(task.id);
    try { await onDelete(task.id); } finally { setBusyId(null); }
  };
  return <>
    <div className="rounded-lg border overflow-hidden">
      <Table className="min-w-[850px]">
        <TableHeader className="bg-muted/30"><TableRow>
          <TableHead className="px-4">Task</TableHead>
          <TableHead>{view === "assigned_by_me" ? "Assigned to" : "Assigned by"}</TableHead>
          <TableHead>Assigned</TableHead><TableHead>Deadline</TableHead><TableHead>Status</TableHead><TableHead className="px-4 text-right">Actions</TableHead>
        </TableRow></TableHeader>
        <TableBody>{tasks.length === 0 ? <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No tasks in this view. Choose another status or add a task.</TableCell></TableRow> : tasks.map(task => {
          const colleague = view === "assigned_by_me" ? task.user : task.assigned_by;
          return <TableRow key={task.id}>
            <TableCell className="px-4 max-w-[260px]">
              <button type="button" onClick={() => setSelectedId(task.id)} className="text-left font-medium hover:underline break-words" aria-label={`Open details for ${task.title}`}>{task.title}</button>
              {["urgent", "high"].includes(task.priority) && <p className="mt-1 text-xs text-rose-600 capitalize">{task.priority} priority</p>}
              {task.extension_status === "pending" && isActiveTask(task) && <p className="mt-1 text-xs text-amber-700">Extension pending</p>}
            </TableCell>
            <TableCell className="max-w-[180px] whitespace-normal">
              {task.is_delegated ? <><p>{colleague?.name || "Staff unavailable"}</p><p className="text-xs text-muted-foreground">{colleague?.department || "Department not specified"}</p></> : <span className="text-muted-foreground">Personal</span>}
            </TableCell>
            <TableCell className="text-xs max-w-[150px] whitespace-normal text-muted-foreground">{formatReadableDate(task.created_at, { includeTime: false })}</TableCell>
            <TableCell className="text-xs max-w-[200px] whitespace-normal">
              {task.is_overdue && <p className="font-medium text-rose-600">Overdue</p>}
              <span>{task.due_date ? formatReadableDate(task.due_date) : "No deadline"}</span>
            </TableCell>
            <TableCell><Badge variant="outline" className="font-normal whitespace-nowrap">{task.is_delegated && task.status === "completed" ? "Accepted" : taskStatusLabels[task.status]}</Badge></TableCell>
            <TableCell className="px-4">
              <div className="flex items-center justify-end gap-1.5">
                <TaskRowActions task={task} busy={busyId === task.id} onDetails={() => setSelectedId(task.id)} onComment={() => setCommentsTask(task)} onEdit={() => onEdit(task)} onToggle={() => { void toggle(task.id); }} onDelete={() => { void remove(task); }} onUpdated={onUpdated} />
              </div>
            </TableCell>
          </TableRow>;
        })}</TableBody>
      </Table>
    </div>
    <TaskDetailsSheet key={selectedId ?? "closed"} task={selected} onClose={() => { setSelectedId(null); if (linkedTaskId) { const params = new URLSearchParams(searchParams); params.delete("task"); router.replace(`/my/task-tracker?${params}`, { scroll: false }); } }} />
    {commentsTask && <TaskCommentsDialog task={commentsTask} open onOpenChange={open => { if (!open) setCommentsTask(null); }} />}
  </>;
}
