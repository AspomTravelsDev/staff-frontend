"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  createTaskTrackerItem,
  updateTaskTrackerItem,
  getTaskTrackerColleagues,
} from "@/lib/api/task-tracker";
import type { TaskTrackerItem, TaskPriority, Colleague } from "@/lib/types/task-tracker";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  Loader2,
  Calendar,
  User,
  Users,
  Search,
  Sparkles,
  Zap,
  Clock,
} from "lucide-react";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit?: TaskTrackerItem | null;
  onSuccess: (task: TaskTrackerItem) => void;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  taskToEdit,
  onSuccess,
}: CreateTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [loadingColleagues, setLoadingColleagues] = useState(false);
  const [assigneeId, setAssigneeId] = useState<string>("self");
  const [colleagueSearch, setColleagueSearch] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [remindBeforeHours, setRemindBeforeHours] = useState<number>(24);
  const [enableEmail, setEnableEmail] = useState(true);
  const [enablePush, setEnablePush] = useState(true);

  // Fetch colleagues on open
  useEffect(() => {
    if (open) {
      setLoadingColleagues(true);
      getTaskTrackerColleagues()
        .then((res) => {
          if (res.success && res.data?.data) {
            setColleagues(res.data.data);
          }
        })
        .catch(() => {
          // silently handle
        })
        .finally(() => setLoadingColleagues(false));
    }
  }, [open]);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || "");
      setDescription(taskToEdit.description || "");
      if (taskToEdit.due_date) {
        const d = new Date(taskToEdit.due_date);
        setDueDate(isNaN(d.getTime()) ? "" : format(d, "yyyy-MM-dd'T'HH:mm"));
      } else {
        setDueDate("");
      }
      setPriority(taskToEdit.priority || "medium");
      setRemindBeforeHours(taskToEdit.remind_before_hours ?? 24);
      setEnableEmail(taskToEdit.enable_email_reminder ?? true);
      setEnablePush(taskToEdit.enable_push_reminder ?? true);
      setAssigneeId(taskToEdit.user_id || "self");
    } else {
      setTitle("");
      setDescription("");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      setDueDate(format(tomorrow, "yyyy-MM-dd'T'HH:mm"));
      setPriority("medium");
      setRemindBeforeHours(24);
      setEnableEmail(true);
      setEnablePush(true);
      setAssigneeId("self");
      setColleagueSearch("");
    }
  }, [taskToEdit, open]);

  const filteredColleagues = useMemo(() => {
    if (!colleagueSearch.trim()) return colleagues;
    const q = colleagueSearch.toLowerCase();
    return colleagues.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.department && c.department.toLowerCase().includes(q)) ||
        c.email.toLowerCase().includes(q)
    );
  }, [colleagues, colleagueSearch]);

  const selectedColleague = useMemo(() => {
    if (assigneeId === "self") return null;
    return colleagues.find((c) => c.id === assigneeId) || null;
  }, [colleagues, assigneeId]);

  const milestoneSchedule = useMemo(() => {
    if (!dueDate) return [];
    const dueTime = new Date(dueDate).getTime();
    if (isNaN(dueTime)) return [];

    const now = Date.now();
    const totalRemainingMinutes = Math.max(0, Math.round((dueTime - now) / 60000));

    const milestones = [
      { key: "1_week", label: "1 Week Before", minutes: 10080, icon: "📅" },
      { key: "24_hours", label: "24 Hours Before", minutes: 1440, icon: "⏰" },
      { key: "1_hour", label: "1 Hour Before", minutes: 60, icon: "🔔" },
      { key: "30_mins", label: "30 Minutes Before", minutes: 30, icon: "🚨" },
      { key: "10_mins", label: "10 Minutes Before", minutes: 10, icon: "🚨" },
      { key: "5_mins", label: "5 Minutes Before", minutes: 5, icon: "🚨" },
      { key: "due_now", label: "At Deadline", minutes: 0, icon: "🎯" },
    ];

    return milestones.map((m) => {
      const isInherited = totalRemainingMinutes >= m.minutes;
      const triggerDate = new Date(dueTime - m.minutes * 60000);
      return {
        ...m,
        isInherited,
        triggerDate,
        formattedTime: format(triggerDate, "MMM d, h:mm a"),
      };
    });
  }, [dueDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a task title.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        priority,
        remind_before_hours: Number(remindBeforeHours),
        enable_email_reminder: enableEmail,
        enable_push_reminder: enablePush,
        assigned_to_user_id: assigneeId !== "self" ? assigneeId : null,
      };

      if (taskToEdit) {
        const res = await updateTaskTrackerItem(taskToEdit.id, payload);
        if (res.success) {
          toast.success("Task updated successfully");
          onSuccess(res.data.data);
          onOpenChange(false);
        } else {
          toast.error(res.error.error || "Failed to update task");
        }
      } else {
        const res = await createTaskTrackerItem(payload);
        if (res.success) {
          if (selectedColleague) {
            toast.success(`Task assigned to ${selectedColleague.name} with instant alerts!`);
          } else {
            toast.success("Task created with reminder alerts");
          }
          onSuccess(res.data.data);
          onOpenChange(false);
        } else {
          toast.error(res.error.error || "Failed to create task");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              {taskToEdit ? "Edit Task & Deadline" : "Add Task & Deadline"}
            </DialogTitle>
            <DialogDescription>
              Assign a deliverable to yourself or delegate to any colleague with custom deadlines and automated reminders.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Assignee Selection */}
            <div className="grid gap-2">
              <Label htmlFor="task-assignee" className="text-sm font-semibold flex items-center justify-between">
                <span>Assign Deliverable To</span>
                <span className="text-xs text-muted-foreground font-normal">Company-wide assignment</span>
              </Label>

              <Select
                value={assigneeId}
                onValueChange={(val) => setAssigneeId(val)}
                disabled={!!taskToEdit} // prevent reassigning existing task ID
              >
                <SelectTrigger id="task-assignee" className="w-full bg-background h-11">
                  <SelectValue placeholder="Select assignee">
                    {assigneeId === "self" ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium">Myself (Personal Task)</span>
                      </div>
                    ) : selectedColleague ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={selectedColleague.image_url || undefined} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {selectedColleague.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{selectedColleague.name}</span>
                        {selectedColleague.department && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 text-muted-foreground">
                            {selectedColleague.department}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      "Select Assignee"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {/* Search box inside dropdown */}
                  <div className="p-2 border-b sticky top-0 bg-popover z-10">
                    <div className="relative">
                      <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Search colleague or department..."
                        value={colleagueSearch}
                        onChange={(e) => setColleagueSearch(e.target.value)}
                        className="pl-8 h-8 text-xs"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  <SelectItem value="self">
                    <div className="flex items-center gap-2 py-0.5">
                      <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="font-medium leading-none">Myself</p>
                        <p className="text-[11px] text-muted-foreground">Personal deliverable</p>
                      </div>
                    </div>
                  </SelectItem>

                  {loadingColleagues ? (
                    <div className="p-4 text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading colleagues...
                    </div>
                  ) : filteredColleagues.length === 0 ? (
                    <div className="p-4 text-xs text-center text-muted-foreground">
                      No matching colleagues found
                    </div>
                  ) : (
                    filteredColleagues.map((colleague) => (
                      <SelectItem key={colleague.id} value={colleague.id}>
                        <div className="flex items-center gap-2 py-0.5">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={colleague.image_url || undefined} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {colleague.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <p className="font-medium text-xs leading-tight text-foreground">{colleague.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {colleague.department || colleague.email}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* Informative banner when delegating */}
              {selectedColleague && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200">
                  <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">{selectedColleague.name}</span> will receive an instant Web Push notification and email alert with this deadline, plus automated reminders before it is due.
                  </div>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="task-title" className="text-sm font-semibold">
                Task Title <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="task-title"
                placeholder="e.g., Upload client's visa documentation to cloud drive"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="focus-visible:ring-emerald-500"
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="task-description" className="text-sm font-medium">
                Notes & Description <span className="text-xs text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="task-description"
                placeholder="Add extra context, drive links, requirements, or checklist instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Due Date & Priority Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="task-due-date" className="text-sm font-medium">
                  Deadline Date & Time
                </Label>
                <Input
                  id="task-due-date"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="task-priority" className="text-sm font-medium">
                  Priority
                </Label>
                <Select
                  value={priority}
                  onValueChange={(val: TaskPriority) => setPriority(val)}
                >
                  <SelectTrigger id="task-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dynamic Smart Reminders Schedule */}
            <div className="rounded-xl border border-border/80 bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">Dynamic Milestone Reminders</span>
                    <p className="text-[11px] text-muted-foreground">
                      Automated alerts inherit intervals smaller than the remaining time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Milestone Timeline preview */}
              {milestoneSchedule.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <div className="grid grid-cols-1 gap-1.5">
                    {milestoneSchedule.map((m) => (
                      <div
                        key={m.key}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border transition-all",
                          m.isInherited
                            ? "bg-background border-border/80 text-foreground shadow-2xs"
                            : "bg-muted/30 border-transparent text-muted-foreground/60"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{m.icon}</span>
                          <span className={cn("font-medium", !m.isInherited && "line-through opacity-70")}>
                            {m.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {m.isInherited ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-mono px-1.5 py-0"
                            >
                              {m.formattedTime}
                            </Badge>
                          ) : (
                            <span className="text-[10px] italic text-muted-foreground/60">
                              Skipped (remaining time &lt; {m.label.toLowerCase()})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                    <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                    Overdue alerts are also dispatched automatically if the task remains incomplete.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-1">
                  Set a deadline date and time above to view active reminder milestones.
                </p>
              )}

              {/* Notification channels */}
              <div className="pt-2 border-t border-border/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-3.5 w-3.5 text-blue-500" />
                    <Label htmlFor="push-toggle" className="text-xs font-medium cursor-pointer">
                      Web Push Notification
                    </Label>
                  </div>
                  <Switch
                    id="push-toggle"
                    checked={enablePush}
                    onCheckedChange={setEnablePush}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-indigo-500" />
                    <Label htmlFor="email-toggle" className="text-xs font-medium cursor-pointer">
                      Email Notification
                    </Label>
                  </div>
                  <Switch
                    id="email-toggle"
                    checked={enableEmail}
                    onCheckedChange={setEnableEmail}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {taskToEdit
                ? "Save Changes"
                : selectedColleague
                ? `Assign to ${selectedColleague.name.split(" ")[0]}`
                : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
