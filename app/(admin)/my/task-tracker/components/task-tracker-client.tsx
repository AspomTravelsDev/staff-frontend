"use client";

import { useState, useTransition, useMemo } from "react";
import type { TaskTrackerItem, TaskTrackerStats, TaskPriority } from "@/lib/types/task-tracker";
import {
  getTaskTrackerItems,
  toggleTaskTrackerItem,
  deleteTaskTrackerItem,
} from "@/lib/api/task-tracker";
import { TaskCard } from "./task-card";
import { CreateTaskDialog } from "./create-task-dialog";
import { TaskTrackerTour, TaskTrackerTourButton } from "./task-tracker-tour";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  CalendarCheck2,
  XCircle,
  FilterX,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface TaskTrackerClientProps {
  initialTasks: TaskTrackerItem[];
  initialStats: TaskTrackerStats;
}

export function TaskTrackerClient({
  initialTasks,
  initialStats,
}: TaskTrackerClientProps) {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<"assigned_to_me" | "assigned_by_me">("assigned_to_me");
  const [tasks, setTasks] = useState<TaskTrackerItem[]>(initialTasks);
  const [stats, setStats] = useState<TaskTrackerStats>(initialStats);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskTrackerItem | null>(null);
  const [isPending, startTransition] = useTransition();

  // Re-fetch tasks whenever filters change on server or locally
  const refreshTasks = async (overrideView?: "assigned_to_me" | "assigned_by_me") => {
    const viewToUse = overrideView ?? activeView;
    try {
      const res = await getTaskTrackerItems({ view: viewToUse });
      if (res.success) {
        setTasks(res.data.data);
        setStats(res.data.stats);
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    } catch {
      // silently handle or fallback
    }
  };

  const handleViewChange = (newView: "assigned_to_me" | "assigned_by_me") => {
    setActiveView(newView);
    setActiveTab("all");
    startTransition(async () => {
      await refreshTasks(newView);
    });
  };

  // Quick toggle status
  const handleToggle = async (id: string) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === "completed" ? "pending" : "completed";
          return {
            ...t,
            status: nextStatus,
            completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
          };
        }
        return t;
      })
    );

    try {
      const res = await toggleTaskTrackerItem(id);
      if (res.success) {
        toast.success(res.data.message || "Task updated");
        await refreshTasks();
      } else {
        toast.error("Failed to update status");
        await refreshTasks();
      }
    } catch {
      toast.error("Failed to update status");
      await refreshTasks();
    }
  };

  // Delete task
  const handleDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await deleteTaskTrackerItem(id);
      if (res.success) {
        toast.success("Task deleted successfully");
        await refreshTasks();
      } else {
        toast.error("Failed to delete task");
        await refreshTasks();
      }
    } catch {
      toast.error("Failed to delete task");
      await refreshTasks();
    }
  };

  // Open Edit Dialog
  const handleEdit = (task: TaskTrackerItem) => {
    setTaskToEdit(task);
    setDialogOpen(true);
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    setTaskToEdit(null);
    setDialogOpen(true);
  };

  // Handle task updated directly (e.g. from extension request / approval / decline)
  const handleTaskUpdated = (updatedTask: TaskTrackerItem) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    refreshTasks();
  };

  // Filter tasks locally for immediate search responsiveness
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab filter
      if (activeTab === "pending" && task.status === "completed") return false;
      if (activeTab === "completed" && task.status !== "completed") return false;
      if (activeTab === "overdue" && (!task.is_overdue || task.status === "completed"))
        return false;
      if (activeTab === "due_soon") {
        if (task.status === "completed" || !task.due_date) return false;
        const due = new Date(task.due_date);
        const now = new Date();
        const fortyEightHours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        if (due < now || due > fortyEightHours) return false;
      }

      // Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q) ?? false;
        const matchesColleague =
          (task.user && task.user.name.toLowerCase().includes(q)) ||
          (task.assigned_by && task.assigned_by.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesColleague) return false;
      }

      return true;
    });
  }, [tasks, activeTab, priorityFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Tour guides */}
      <TaskTrackerTour />

      {/* Header */}
      <div
        id="tour-task-tracker-header"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="h-7 w-7 text-emerald-600" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Task Tracker & Deadlines
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {activeView === "assigned_by_me"
              ? "Deliverables you delegated to colleagues across the company. Track progress and completion in real time."
              : "Personal deliverables with automated web push & email deadline reminders."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TaskTrackerTourButton />
          <Button
            id="tour-add-task-btn"
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Top View Switcher: Assigned to Me vs Assigned by Me */}
      <div className="flex items-center gap-2 border-b pb-3">
        <button
          type="button"
          onClick={() => handleViewChange("assigned_to_me")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer",
            activeView === "assigned_to_me"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <User className="h-4 w-4" />
          <span>My Deliverables</span>
          {stats.assigned_to_me_count !== undefined && (
            <Badge
              variant={activeView === "assigned_to_me" ? "secondary" : "outline"}
              className={cn(
                "ml-1 text-xs px-1.5 py-0 h-4 font-bold",
                activeView === "assigned_to_me" ? "bg-white/25 text-white border-transparent" : ""
              )}
            >
              {stats.assigned_to_me_count}
            </Badge>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleViewChange("assigned_by_me")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer",
            activeView === "assigned_by_me"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Users className="h-4 w-4" />
          <span>Delegated to Colleagues</span>
          {stats.assigned_by_me_count !== undefined && (
            <Badge
              variant={activeView === "assigned_by_me" ? "secondary" : "outline"}
              className={cn(
                "ml-1 text-xs px-1.5 py-0 h-4 font-bold",
                activeView === "assigned_by_me" ? "bg-white/25 text-white border-transparent" : ""
              )}
            >
              {stats.assigned_by_me_count}
            </Badge>
          )}
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div
        id="tour-task-stats"
        className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
      >
        {/* Active Pending */}
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={cn(
            "flex flex-col p-4 rounded-xl border text-left transition-all hover:border-slate-400 bg-card cursor-pointer",
            activeTab === "pending" && "ring-2 ring-emerald-500 border-emerald-500"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Tasks
            </span>
            <ListTodo className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-foreground">
            {stats.pending}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5">Tasks in progress</span>
        </button>

        {/* Due Soon (48h) */}
        <button
          type="button"
          onClick={() => setActiveTab("due_soon")}
          className={cn(
            "flex flex-col p-4 rounded-xl border text-left transition-all hover:border-amber-400 bg-card cursor-pointer",
            activeTab === "due_soon" && "ring-2 ring-amber-500 border-amber-500",
            stats.due_soon > 0 && "bg-amber-50/40 dark:bg-amber-950/20"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Due in 48h
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-400">
            {stats.due_soon}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5">Approaching deadline</span>
        </button>

        {/* Overdue */}
        <button
          type="button"
          onClick={() => setActiveTab("overdue")}
          className={cn(
            "flex flex-col p-4 rounded-xl border text-left transition-all hover:border-rose-400 bg-card cursor-pointer",
            activeTab === "overdue" && "ring-2 ring-rose-500 border-rose-500",
            stats.overdue > 0 && "bg-rose-50/40 dark:bg-rose-950/20"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Overdue
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-rose-700 dark:text-rose-400">
            {stats.overdue}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5">Action needed</span>
        </button>

        {/* Completed */}
        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={cn(
            "flex flex-col p-4 rounded-xl border text-left transition-all hover:border-slate-400 bg-card cursor-pointer",
            activeTab === "completed" && "ring-2 ring-emerald-500 border-emerald-500"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Completed
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-foreground">
            {stats.completed}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5">Finished deliverables</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div
        id="tour-task-filters"
        className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl border"
      >
        {/* Tab filters */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full md:w-auto"
        >
          <TabsList className="grid grid-cols-5 w-full md:w-auto h-9">
            <TabsTrigger value="all" className="text-xs">
              All ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">
              Pending ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="due_soon" className="text-xs">
              Due Soon
            </TabsTrigger>
            <TabsTrigger value="overdue" className="text-xs">
              Overdue
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              Completed
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Priority filters */}
        <div className="flex items-center gap-2">
          {/* Priority dropdown */}
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs bg-background">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent Only</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>

          {/* Search box */}
          <div className="relative flex-1 md:w-56">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-3 text-muted-foreground" />
            <Input
              placeholder={activeView === "assigned_by_me" ? "Search tasks or colleague..." : "Search deliverables..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-7 h-9 text-xs bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div id="tour-task-list" className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              view={activeView}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTaskUpdated={handleTaskUpdated}
            />
          ))
        ) : (
          <div className="text-center py-16 px-4 rounded-xl border border-dashed bg-muted/10 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              {searchQuery || priorityFilter !== "all" || activeTab !== "all" ? (
                <FilterX className="h-6 w-6" />
              ) : activeView === "assigned_by_me" ? (
                <Users className="h-6 w-6" />
              ) : (
                <CalendarCheck2 className="h-6 w-6" />
              )}
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {searchQuery || priorityFilter !== "all" || activeTab !== "all"
                  ? "No tasks match your filters"
                  : activeView === "assigned_by_me"
                  ? "No delegated tasks yet"
                  : "No personal deliverables recorded yet"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                {searchQuery || priorityFilter !== "all" || activeTab !== "all"
                  ? "Try resetting your search query or selecting another status tab."
                  : activeView === "assigned_by_me"
                  ? "You haven't delegated any tasks to colleagues yet. Click 'Add Task' to assign deliverables with deadlines."
                  : "Keep on top of your deliverables. Add a task with a deadline to receive timely push and email alerts."}
              </p>
            </div>
            {searchQuery || priorityFilter !== "all" || activeTab !== "all" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setPriorityFilter("all");
                  setActiveTab("all");
                }}
                className="text-xs cursor-pointer"
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                onClick={handleOpenCreate}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                {activeView === "assigned_by_me" ? "Assign Task to Colleague" : "Add Your First Task"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        taskToEdit={taskToEdit}
        onSuccess={() => {
          refreshTasks();
        }}
      />
    </div>
  );
}
