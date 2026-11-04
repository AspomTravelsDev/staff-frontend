"use client";

import { useEffect, useState } from "react";
import type { TaskTrackerItem } from "@/lib/types/task-tracker";
import { formatReadableDate } from "@/lib/utils/readable-date";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { TaskDeadlineTimeline } from "@/app/(admin)/my/task-tracker/components/task-deadline-timeline";
import { TaskWorkflowControls, isActiveTask } from "@/app/(admin)/my/task-tracker/components/task-workflow-controls";
import { TaskDetailsSheet } from "@/app/(admin)/my/task-tracker/components/task-details-sheet";

function TaskActions({ task, onNudge, onComment, onUpdated }: { task: TaskTrackerItem; onNudge: (task: TaskTrackerItem) => void; onComment: (task: TaskTrackerItem) => void; onUpdated: (task: TaskTrackerItem) => void }) {
  const [open, setOpen] = useState(false);
  return <TaskWorkflowControls task={task} onUpdated={onUpdated} showHistory={false} renderControls={(controls) => <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild><Button size="sm" variant="outline" aria-label={`More actions for ${task.title}`}>Actions</Button></PopoverTrigger>
    <PopoverContent align="end" className="w-56" onCloseAutoFocus={(event) => event.preventDefault()} onClick={(event) => { if ((event.target as HTMLElement).closest("button")) setOpen(false); }}>
      <div className="flex flex-col gap-1 [&>button]:justify-start">
        {controls}
        {isActiveTask(task) && <Button size="sm" variant="ghost" onClick={() => onNudge(task)}>Send nudge</Button>}
        {task.can_comment && <Button size="sm" variant="ghost" onClick={() => onComment(task)}>Add comment / update</Button>}
        {!isActiveTask(task) && !task.can_manage && !task.can_reassign && !task.can_comment && <p className="text-sm text-muted-foreground">No actions available.</p>}
      </div>
    </PopoverContent>
  </Popover>} />;
}

export function DelegatedTasksTable({ tasks, allTasks, onNudge, onComment, onUpdated }: {
  tasks: TaskTrackerItem[]; allTasks: TaskTrackerItem[];
  onNudge: (task: TaskTrackerItem) => void; onComment: (task: TaskTrackerItem) => void; onUpdated: (task: TaskTrackerItem) => void;
}) {
  const [now, setNow] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    const initial = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, []);
  const selected = allTasks.find((task) => task.id === selectedId) || null;
  return <>
    <div id="tour-delegated-list" className="overflow-hidden rounded-lg border">
      <Table className="min-w-[1150px]">
        <TableHeader className="bg-muted/30"><TableRow><TableHead className="px-4">Title</TableHead><TableHead>Assigned by</TableHead><TableHead>Assigned to</TableHead><TableHead>Assigned on</TableHead><TableHead>Status</TableHead><TableHead>Deadline</TableHead><TableHead>Time bar</TableHead><TableHead className="px-4 text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>{!tasks.length ? <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No tasks match this view. Try changing or clearing your filters.</TableCell></TableRow> : tasks.map((task) => <TableRow
          key={task.id}
          tabIndex={0}
          aria-label={`Open details for ${task.title}`}
          className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          onClick={() => setSelectedId(task.id)}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setSelectedId(task.id);
            }
          }}
        >
          <TableCell className="max-w-[260px] whitespace-normal px-4"><span className="font-medium">{task.title}</span><p className={`mt-1 text-xs capitalize ${["urgent", "high"].includes(task.priority) ? "text-rose-700 dark:text-rose-400" : "text-muted-foreground"}`}>{task.priority} priority</p>{task.extension_status === "pending" && isActiveTask(task) && <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">Extension requested</p>}</TableCell>
          <TableCell className="max-w-44 whitespace-normal"><p>{task.assigned_by?.name || "Staff unavailable"}</p><p className="text-xs text-muted-foreground">{task.assigned_by?.department || "Department not specified"}</p></TableCell>
          <TableCell className="max-w-44 whitespace-normal"><p>{task.user?.name || "Staff unavailable"}</p><p className="text-xs text-muted-foreground">{task.user?.department || "Department not specified"}</p></TableCell>
          <TableCell className="max-w-36 whitespace-normal text-xs text-muted-foreground">{task.assigned_at ? formatReadableDate(task.assigned_at) : task.reassignments_count ? "See reassignment history" : formatReadableDate(task.created_at)}</TableCell>
          <TableCell><TaskStatusBadge task={task} /></TableCell>
          <TableCell className="min-w-36 whitespace-normal">{task.due_date ? <><p className="font-medium">{formatReadableDate(task.due_date)}</p><p className="mt-1 text-xs text-muted-foreground">{task.is_overdue && isActiveTask(task) ? "Overdue" : "Due date"}</p></> : <span className="text-muted-foreground">No deadline</span>}</TableCell>
          <TableCell className="min-w-40"><TaskDeadlineTimeline task={task} now={now} /></TableCell>
          <TableCell className="px-4" onClick={(event) => event.stopPropagation()}><div className="flex justify-end"><TaskActions task={task} onNudge={onNudge} onComment={onComment} onUpdated={onUpdated} /></div></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </div>
    <TaskDetailsSheet key={selectedId || "closed"} task={selected} onClose={() => setSelectedId(null)} />
  </>;
}
