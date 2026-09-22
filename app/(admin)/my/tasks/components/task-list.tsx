"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  useMyDailyTasks,
  useUpdateDailyTasks,
  useSubmitDailyReport,
} from "@/lib/api/hooks/use-tasks";
import { TaskItem as TaskItemType } from "@/types/task-types";
import { TaskItem } from "./task-item";
import { TaskStats } from "./task-stats";
import { Button } from "@/components/ui/button";
import { Plus, Save, Send, AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { DailyTaskRecord } from "@/types/task-types";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useWeeklyFeedbackLockStatus } from "@/lib/api/hooks/use-weekly-feedback";

import { useCallback } from "react";
import { debounce } from "lodash";

import { CopyTasksButton } from "@/components/tasks/copy-tasks-button";
import type { User } from "@/types/user-types";

interface TaskListProps {
  initialData: DailyTaskRecord[];
  user?: User | null;
}

export function TaskList({ initialData, user }: TaskListProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: records, isLoading } = useMyDailyTasks({
    date: today,
    initialData,
  });
  const updateTasks = useUpdateDailyTasks();
  const submitReport = useSubmitDailyReport();
  const { data: weeklyFeedbackLockStatus } = useWeeklyFeedbackLockStatus();

  const [localTasks, setLocalTasks] = useState<TaskItemType[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);

  // Load tasks when data is fetched
  useEffect(() => {
    if (records && records.length > 0) {
      setLocalTasks(records[0].tasks);
    } else {
      // Initialize with one empty task if no record exists
      setLocalTasks([]);
    }
    setHasUnsavedChanges(false);
  }, [records]);

  const record = records?.[0];
  const isSubmitted = record?.report_submitted ?? false;
  const isLocked = isSubmitted;
  const isQuestionnaireLocked = weeklyFeedbackLockStatus?.is_locked ?? false;
  const questionnaireReason =
    weeklyFeedbackLockStatus?.reason ||
    "Complete the weekly anonymous questionnaire before submitting daily report.";

  // Manual save function
  const handleSave = async () => {
    const validTasks = localTasks.filter((t) => t.text.trim() !== "");
    if (validTasks.length === 0) {
      toast.error("Cannot save empty list");
      return;
    }

    try {
      await updateTasks.mutateAsync({ tasks: validTasks });
      setHasUnsavedChanges(false);
      toast.success("Saved successfully");
    } catch (error: unknown) {
      console.error("Failed to save tasks:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save tasks");
    }
  };

  // Debounced save function for autosave
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce(async (tasks: TaskItemType[]) => {
      const validTasks = tasks.filter((t) => t.text.trim() !== "");
      if (validTasks.length === 0) return;

      setIsAutosaving(true);
      try {
        await updateTasks.mutateAsync({ tasks: validTasks });
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Autosave failed:", error);
      } finally {
        setIsAutosaving(false);
      }
    }, 6000),
    [updateTasks],
  );

  // Trigger autosave when tasks change
  useEffect(() => {
    if (hasUnsavedChanges && !isLocked && localTasks.length > 0) {
      debouncedSave(localTasks);
    }
    // Cleanup debounce on unmount
    return () => debouncedSave.cancel();
  }, [localTasks, hasUnsavedChanges, isLocked, debouncedSave]);

  const handleAddTask = () => {
    setLocalTasks([
      ...localTasks,
      {
        text: "",
        completed: false,
        completed_at: null,
        created_at: new Date().toISOString(),
      },
    ]);
    setHasUnsavedChanges(true);
  };

  const handleUpdateTask = (index: number, updates: Partial<TaskItemType>) => {
    const newTasks = [...localTasks];
    newTasks[index] = { ...newTasks[index], ...updates };
    setLocalTasks(newTasks);
    setHasUnsavedChanges(true);
  };

  const handleRemoveTask = (index: number) => {
    const newTasks = localTasks.filter((_, i) => i !== index);
    setLocalTasks(newTasks);
    setHasUnsavedChanges(true);
  };

  const handleSubmitReport = async () => {
    try {
      if (isQuestionnaireLocked) {
        toast.error(questionnaireReason);
        return;
      }

      // If there are unsaved changes, save them first
      if (hasUnsavedChanges) {
        const validTasks = localTasks.filter((t) => t.text.trim() !== "");
        if (validTasks.length > 0) {
          await updateTasks.mutateAsync({ tasks: validTasks });
          setHasUnsavedChanges(false);
        }
      }

      await submitReport.mutateAsync();
      toast.success("Report submitted successfully");
    } catch (error: unknown) {
      console.error("Failed to submit report:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit report");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const completedCount = localTasks.filter((t) => t.completed).length;
  const ongoingCount = localTasks.filter((t) => !t.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-xl">
            <Plus className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Today&apos;s Tasks
            </h2>
            <p className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
              {format(new Date(), "PPPP")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {record?.first_saved_at && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200"
            >
              📥 First saved {format(new Date(record.first_saved_at), "HH:mm")}
            </Badge>
          )}

          {isSubmitted && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
            >
              ✅ Submitted{" "}
              {record?.report_submitted_at
                ? format(new Date(record.report_submitted_at), "HH:mm")
                : ""}
            </Badge>
          )}

          {localTasks.length > 0 && (
            <CopyTasksButton
              tasks={localTasks}
              date={today}
              userName={user?.name}
              staffId={user?.staff_id}
              department={user?.department}
              isSubmitted={isSubmitted}
            />
          )}
        </div>
      </div>

      <div id="tour-tasks-stats">
        <TaskStats
          total={localTasks.length}
          completed={completedCount}
          ongoing={ongoingCount}
        />
      </div>

      {isQuestionnaireLocked ? (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            Questionnaire required before report submission
          </AlertTitle>
          <AlertDescription>
            {questionnaireReason}{" "}
            <Link href="/my/weekly-feedback" className="underline">
              Complete it here
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}

      <div id="tour-tasks-container" className="space-y-3 group">
        {localTasks.map((task, index) => (
          <TaskItem
            key={index}
            index={index}
            task={task}
            onUpdate={handleUpdateTask}
            onRemove={handleRemoveTask}
            disabled={isLocked}
          />
        ))}

        {!isLocked && (
          <Button
            id="tour-add-task"
            variant="outline"
            className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={handleAddTask}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
        )}
      </div>

      {!isLocked && localTasks.length > 0 && (
        <div id="tour-save-actions" className="flex flex-col items-stretch gap-3 pt-4 border-t sm:flex-row sm:items-center sm:justify-end">
          {isAutosaving ? (
            <Badge
              variant="outline"
              className="text-blue-600 border-blue-200 bg-blue-50 animate-pulse"
            >
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Saving...
            </Badge>
          ) : hasUnsavedChanges ? (
            <Badge
              variant="outline"
              className="text-yellow-600 border-yellow-200 bg-yellow-50"
            >
              Unsaved Changes
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-green-600 border-green-200 bg-green-50"
            >
              All changes saved
            </Badge>
          )}
          <CopyTasksButton
            tasks={localTasks}
            date={today}
            userName={user?.name}
            staffId={user?.staff_id}
            department={user?.department}
            isSubmitted={isSubmitted}
            className="min-h-11 sm:min-h-8"
          />
          <Button
            onClick={handleSave}
            disabled={updateTasks.isPending}
            variant={hasUnsavedChanges ? "default" : "secondary"}
            className="min-h-11 sm:min-h-8"
          >
            {updateTasks.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                id="tour-submit-report"
                className="min-h-11 bg-green-600 hover:bg-green-700 sm:min-h-8"
                disabled={isQuestionnaireLocked}
              >
                <Send className="h-4 w-4 mr-2" /> Submit Daily Report
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit End-of-Day Report?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will lock your tasks for today. You will not be able to
                  edit them or add new tasks after submission.
                  <br />
                  <br />
                  <strong>Summary:</strong>
                  <ul className="mt-2 list-disc list-inside">
                    <li>Total Tasks: {localTasks.length}</li>
                    <li>Completed: {completedCount}</li>
                    <li>Ongoing: {ongoingCount}</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSubmitReport}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Confirm Submit
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {isLocked && localTasks.length > 0 && (
        <div className="flex flex-col items-stretch gap-3 pt-4 border-t sm:flex-row sm:items-center sm:justify-end">
          <CopyTasksButton
            tasks={localTasks}
            date={today}
            userName={user?.name}
            staffId={user?.staff_id}
            department={user?.department}
            isSubmitted={isSubmitted}
            className="min-h-11 sm:min-h-8"
          />
        </div>
      )}
    </div>
  );
}
