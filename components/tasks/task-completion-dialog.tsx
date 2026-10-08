"use client";

import { useRef, useState, type MouseEvent } from "react";
import type { TaskTrackerItem } from "@/lib/types/task-tracker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Props {
  task: TaskTrackerItem | null;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}

export function TaskCompletionDialog({ task, onClose, onConfirm }: Props) {
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const confirmCompletion = async () => {
    if (!task || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      if (await onConfirm()) onClose();
    } catch {
      toast.error("Could not complete the task. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <AlertDialog open={!!task} onOpenChange={(open: boolean) => { if (!open && !savingRef.current) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark task as complete?</AlertDialogTitle>
          <AlertDialogDescription>
            Mark <strong className="break-words">{task?.title}</strong> as completed?
            {task?.recurrence
              ? " The next occurrence will be scheduled automatically."
              : " You can reopen this task later if you need to make changes."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={saving} onClick={(event: MouseEvent<HTMLButtonElement>) => { event.preventDefault(); void confirmCompletion(); }}>
            {saving ? "Completing…" : "Confirm completion"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
