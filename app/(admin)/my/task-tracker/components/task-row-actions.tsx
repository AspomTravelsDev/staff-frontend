"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TaskTrackerItem } from "@/lib/types/task-tracker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TaskWorkflowControls, isActiveTask } from "./task-workflow-controls";
import { RequestExtensionDialog } from "./request-extension-dialog";
import { ReviewExtensionDialog } from "./review-extension-dialog";
import { NudgeTaskDialog } from "./nudge-task-dialog";

interface Props {
  task: TaskTrackerItem;
  busy: boolean;
  onDetails: () => void;
  onComment: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onUpdated: (task: TaskTrackerItem) => void;
}

export function TaskRowActions({ task, busy, onDetails, onComment, onEdit, onToggle, onDelete, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [extensionReviewOpen, setExtensionReviewOpen] = useState(false);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const active = isActiveTask(task);
  return <>
    <TaskWorkflowControls task={task} onUpdated={onUpdated} showHistory={false} renderControls={controls => <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><Button size="sm" variant="outline" disabled={busy} aria-label={`Actions for ${task.title}`}>Actions<ChevronDown className="h-3.5 w-3.5" /></Button></PopoverTrigger>
      <PopoverContent align="end" className="w-56 gap-1" onClick={event => { if ((event.target as HTMLElement).closest("button")) setOpen(false); }} onCloseAutoFocus={event => event.preventDefault()}>
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Task actions</p>
        <div className="flex flex-col gap-1 [&>button]:w-full [&>button]:justify-start [&>button]:shadow-none">
          <Button size="sm" variant="ghost" onClick={onDetails}>View details and history</Button>
          {controls}
          {!task.is_delegated && task.status !== "cancelled" && <Button size="sm" variant="ghost" disabled={busy} onClick={onToggle}>{task.status === "completed" ? "Reopen task" : "Mark complete"}</Button>}
          {task.is_delegated && <Button size="sm" variant="ghost" onClick={onComment}>Add comment / update</Button>}
          {!task.is_delegated && task.can_manage && active && task.due_date && <Button size="sm" variant="ghost" onClick={() => setRequestOpen(true)}>Extend deadline</Button>}
          {task.can_submit && active && task.extension_status !== "pending" && <Button size="sm" variant="ghost" onClick={() => setRequestOpen(true)}>Request extension</Button>}
          {task.can_review && active && <Button size="sm" variant="ghost" onClick={() => setNudgeOpen(true)}>Send nudge</Button>}
          {task.can_review && active && task.extension_status === "pending" && <Button size="sm" variant="ghost" onClick={() => setExtensionReviewOpen(true)}>Review extension</Button>}
          {task.can_manage && (!task.is_delegated || active) && <Button size="sm" variant="ghost" onClick={onEdit}>Edit task</Button>}
          {!task.is_delegated && task.can_manage && !task.reassignments_count && <Button size="sm" variant="ghost" disabled={busy} onClick={onDelete} className="text-destructive">Delete task</Button>}
        </div>
      </PopoverContent>
    </Popover>} />
    {requestOpen && <RequestExtensionDialog task={task} open onOpenChange={setRequestOpen} onSuccess={onUpdated} />}
    {extensionReviewOpen && <ReviewExtensionDialog task={task} open onOpenChange={setExtensionReviewOpen} onSuccess={onUpdated} />}
    {nudgeOpen && <NudgeTaskDialog task={task} open onOpenChange={setNudgeOpen} />}
  </>;
}
