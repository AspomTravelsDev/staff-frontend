"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDailyTaskBackfill, saveDailyTaskBackfill } from "@/lib/api/tasks";
import { formatLagosDateForInput } from "@/lib/utils/attendance";
import type { TaskItem } from "@/types/task-types";

export function BackfillReportDialog({
  users,
  initialUserId,
  initialDate,
}: {
  users: { id: string; name: string; staff_id: string }[];
  initialUserId?: string;
  initialDate?: string;
}) {
  const router = useRouter();
  const yesterday = formatLagosDateForInput(new Date(Date.now() - 86400000));
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState(initialUserId ?? "");
  const [date, setDate] = useState(
    initialDate && initialDate <= yesterday ? initialDate : yesterday,
  );
  const [loaded, setLoaded] = useState(false);
  const [locked, setLocked] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const inFlight = useRef(false);

  function changeOpen(next: boolean) {
    if (
      busy ||
      (!next && dirty && !window.confirm("Close without saving these tasks?"))
    )
      return;
    setOpen(next);
    if (!next) {
      setLoaded(false);
      setDirty(false);
      setError("");
    }
  }
  async function load() {
    if (inFlight.current || !userId || !date) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await getDailyTaskBackfill(userId, date);
      setVersion(result.version);
      setTasks(
        result.data?.tasks.length
          ? result.data.tasks
          : [{ text: "", completed: false, completed_at: null }],
      );
      setLocked(Boolean(result.data?.report_submitted));
      setLoaded(true);
      setDirty(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load the record.",
      );
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  async function save(submit: boolean) {
    if (inFlight.current || locked) return;
    if (!tasks.length || tasks.some((t) => !t.text.trim())) {
      setError("Enter a description for each task.");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await saveDailyTaskBackfill({
        user_id: userId,
        date,
        version,
        tasks,
        submit,
      });
      setVersion(result.version);
      setTasks(result.data.tasks);
      setDirty(false);
      setLocked(result.data.report_submitted);
      toast.success(submit ? "Report submitted." : "Draft saved.");
      router.refresh();
      if (submit) {
        setOpen(false);
        setLoaded(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save the record.",
      );
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Backfill report</Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Backfill tasks & report</DialogTitle>
          <DialogDescription>
            Choose an employee and a previous work date.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!loaded ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void load();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="backfill-employee">Employee</Label>
              <Select value={userId} onValueChange={setUserId} disabled={busy}>
                <SelectTrigger id="backfill-employee">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} · {u.staff_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="backfill-date">Work date</Label>
              <Input
                id="backfill-date"
                type="date"
                value={date}
                max={yesterday}
                required
                disabled={busy}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy || !userId}>
                {busy ? "Loading…" : "Load record"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void save(true);
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b pb-2">
              <p className="text-sm font-medium">
                {users.find((u) => u.id === userId)?.name} · {date}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => {
                  if (
                    !dirty ||
                    window.confirm(
                      "Discard these edits and choose another record?",
                    )
                  ) {
                    setLoaded(false);
                    setDirty(false);
                    setError("");
                  }
                }}
              >
                Change
              </Button>
            </div>
            {locked && (
              <p className="text-sm text-muted-foreground">
                This report has already been submitted and cannot be changed.
              </p>
            )}
            <div className="space-y-3">
              {tasks.map((task, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Checkbox
                    className="mt-2"
                    aria-label={`Task ${i + 1} completed`}
                    checked={task.completed}
                    disabled={busy || locked}
                    onCheckedChange={(v) => {
                      setTasks(
                        tasks.map((t, j) =>
                          j === i
                            ? {
                                ...t,
                                completed: v === true,
                                completed_at: null,
                              }
                            : t,
                        ),
                      );
                      setDirty(true);
                    }}
                  />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`backfill-task-${i}`}>Task {i + 1}</Label>
                    <Textarea
                      id={`backfill-task-${i}`}
                      rows={2}
                      maxLength={5000}
                      value={task.text}
                      required
                      disabled={busy || locked}
                      onChange={(e) => {
                        setTasks(
                          tasks.map((t, j) =>
                            j === i ? { ...t, text: e.target.value } : t,
                          ),
                        );
                        setDirty(true);
                      }}
                    />
                  </div>
                  {!locked && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-5 shrink-0"
                      disabled={busy || tasks.length === 1}
                      aria-label={`Remove task ${i + 1}`}
                      onClick={() => {
                        setTasks(tasks.filter((_, j) => j !== i));
                        setDirty(true);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {!locked && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy || tasks.length >= 100}
                  onClick={() => {
                    setTasks([
                      ...tasks,
                      { text: "", completed: false, completed_at: null },
                    ]);
                    setDirty(true);
                  }}
                >
                  <Plus className="size-4" />
                  Add task
                </Button>
                <p className="text-xs text-muted-foreground">
                  Submitting locks this report. You can save a draft to continue
                  later.
                </p>
              </>
            )}
            <DialogFooter>
              {locked ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => changeOpen(false)}
                >
                  Close
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void save(false)}
                  >
                    Save draft
                  </Button>
                  <Button type="submit" disabled={busy}>
                    {busy ? "Saving…" : "Submit report"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
