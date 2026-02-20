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

interface TaskListProps {
  initialData: DailyTaskRecord[];
}

export function TaskList({ initialData }: TaskListProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: records, isLoading } = useMyDailyTasks({
    date: today,
    initialData,
  });
  const updateTasks = useUpdateDailyTasks();
  const submitReport = useSubmitDailyReport();

  const [localTasks, setLocalTasks] = useState<TaskItemType[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  const handleAddTask = () => {
    setLocalTasks([
      ...localTasks,
      { text: "", completed: false, completed_at: null },
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

  const handleSave = async () => {
    // Filter out empty tasks before saving
    const validTasks = localTasks.filter((t) => t.text.trim() !== "");

    if (validTasks.length === 0) {
      toast.error("Cannot save empty list");
      return;
    }

    try {
      await updateTasks.mutateAsync({ tasks: validTasks });
      setHasUnsavedChanges(false);
      toast.success("Saved successfully");
    } catch (error: any) {
      toast.error("Failed to save tasks");
    }
  };

  const handleSubmitReport = async () => {
    try {
      await submitReport.mutateAsync();
      toast.success("Report submitted successfully");
    } catch (error: any) {
      toast.error("Failed to submit report");
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
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Today's Tasks ({format(new Date(), "MMM dd, yyyy")})
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your daily activities and submit report at end of day.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSubmitted && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
            >
              Report Submitted{" "}
              {record?.report_submitted_at
                ? format(new Date(record.report_submitted_at), "HH:mm")
                : ""}
            </Badge>
          )}

          {!isLocked && (
            <>
              {hasUnsavedChanges && (
                <Badge
                  variant="outline"
                  className="text-yellow-600 border-yellow-200 bg-yellow-50"
                >
                  Unsaved Changes
                </Badge>
              )}
              <Button
                onClick={handleSave}
                disabled={updateTasks.isPending}
                variant={hasUnsavedChanges ? "default" : "secondary"}
              >
                {updateTasks.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <TaskStats
        total={localTasks.length}
        completed={completedCount}
        ongoing={ongoingCount}
      />

      <div className="space-y-3 group">
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
            variant="outline"
            className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={handleAddTask}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Task
          </Button>
        )}
      </div>

      {!isLocked && localTasks.length > 0 && (
        <div className="flex justify-end pt-4 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
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
    </div>
  );
}
