"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { TaskTrackerItem, TaskTrackerStats } from "@/lib/types/task-tracker";
import {
  updateTaskTrackerItem,
  deleteTaskTrackerItem,
} from "@/lib/api/task-tracker";
import { TasksTable } from "./tasks-table";
import { isActiveTask } from "./task-workflow-controls";
import { CreateTaskDialog } from "./create-task-dialog";
import { TaskTrackerTour, TaskTrackerTourButton } from "./task-tracker-tour";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/stats-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, RefreshCw, ListTodo, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface TaskTrackerClientProps {
  initialView?: "assigned_to_me" | "assigned_by_me";
  initialTasks: TaskTrackerItem[];
  initialStats: TaskTrackerStats;
  tasksByView?: Partial<Record<TaskView, TaskTrackerItem[]>>;
  statsByView?: Partial<Record<TaskView, TaskTrackerStats>>;
  attentionCounts: Partial<Record<TaskView, number>>;
}

type TaskView = "assigned_to_me" | "assigned_by_me";
const needsApproval = (task: TaskTrackerItem) => task.status === "submitted" || (isActiveTask(task) && task.extension_status === "pending");
const prominentTab = "h-7 min-h-0 px-3 py-1 text-xs font-medium text-foreground hover:bg-background/70 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground";

export function TaskTrackerClient({
  initialView = "assigned_to_me",
  initialTasks,
  initialStats,
  tasksByView,
  statsByView,
  attentionCounts,
}: TaskTrackerClientProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<TaskView>(initialView);
  const tasks = tasksByView?.[activeView] ?? initialTasks;
  const stats = statsByView?.[activeView] ?? initialStats;
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskTrackerItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const refreshTasks = () => {
    startTransition(() => router.refresh());
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const handleViewChange = (newView: TaskView) => {
    if (newView === activeView) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    if (tasksByView?.[newView] && statsByView?.[newView]) {
      setActiveView(newView);
      setActiveTab("pending");
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
      }
      return;
    }
    setActiveView(newView);
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }));
  };

  // Apply the requested status so repeated completion cannot reopen a task.
  const handleToggle = async (id: string, status: "pending" | "completed") => {
    const task = tasks.find(task => task.id === id);
    if (!task || task.is_delegated) return false;
    try {
      const res = await updateTaskTrackerItem(id, { status });
      if (res.success) {
        toast.success(res.data.message || "Task updated");
        refreshTasks();
        return true;
      } else {
        toast.error("Failed to update status");
        refreshTasks();
      }
    } catch {
      toast.error("Failed to update status");
      refreshTasks();
    }
    return false;
  };

  // Delete task
  const handleDelete = async (id: string) => {
    try {
      const res = await deleteTaskTrackerItem(id);
      if (res.success) {
        toast.success("Task deleted successfully");
        refreshTasks();
      } else {
        toast.error("Failed to delete task");
        refreshTasks();
      }
    } catch {
      toast.error("Failed to delete task");
      refreshTasks();
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
  const handleTaskUpdated = () => {
    refreshTasks();
  };

  // Filter tasks locally for immediate search responsiveness
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab filter
      if (activeTab === "pending" && !isActiveTask(task) && task.status !== "submitted") return false;
      if (activeTab === "submitted" && task.status !== "submitted") return false;
      if (activeTab === "cancelled" && task.status !== "cancelled") return false;
      if (activeTab === "completed" && task.status !== "completed") return false;
      if (activeTab === "not_started" && task.status !== "pending") return false;
      if (["in_progress", "changes_requested"].includes(activeTab) && task.status !== activeTab) return false;
      if (activeTab.startsWith("custom:") && (task.status !== "in_progress" || task.custom_status !== activeTab.slice(7))) return false;
      if (activeTab === "overdue" && (!task.is_overdue || task.status === "completed"))
        return false;
      if (activeTab === "due_soon") {
        if (!isActiveTask(task) || !task.due_date) return false;
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
        const matchesStatus = task.custom_status?.toLowerCase().includes(q) ?? false;
        const matchesColleague =
          (task.user && task.user.name.toLowerCase().includes(q)) ||
          (task.assigned_by && task.assigned_by.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesColleague && !matchesStatus) return false;
      }

      return true;
    }).sort((a, b) => Number(needsApproval(b)) - Number(needsApproval(a)));
  }, [tasks, activeTab, priorityFilter, searchQuery]);


  return <div className="flex flex-col gap-4 w-full">
    <TaskTrackerTour />
    <div id="tour-task-tracker-header" className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">Task Tracker</h1><p className="text-sm text-muted-foreground mt-1">Your deadlines in one place.</p></div>
      <div className="flex items-center gap-2">
        <TaskTrackerTourButton />
        <Button variant="ghost" size="sm" disabled={isPending} onClick={refreshTasks}><RefreshCw className="h-4 w-4" />Refresh</Button>
        <Button id="tour-add-task-btn" size="sm" onClick={handleOpenCreate}><Plus className="h-4 w-4" />Add task</Button>
      </div>
    </div>
    <div id="tour-view-switcher" className="space-y-2">
      <Tabs value={activeView} onValueChange={(value: string) => handleViewChange(value as "assigned_to_me" | "assigned_by_me")}>
        <TabsList aria-label="Choose whose tasks to view" className="grid w-full grid-cols-2 gap-1 border bg-muted/60 p-0.5 group-data-horizontal/tabs:h-auto sm:w-fit">
          {([{ value: "assigned_to_me", label: "My tasks" }, { value: "assigned_by_me", label: "Tasks I assigned" }] as const).map(({ value, label }) => <TabsTrigger key={value} value={value} disabled={isPending} className={prominentTab}>
            {label}
            {(attentionCounts[value] ?? 0) > 0 && <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold tabular-nums text-white ring-2 ring-background" aria-label={`${attentionCounts[value]} tasks need your attention`}>{attentionCounts[value]}</span>}
          </TabsTrigger>)}
        </TabsList>
      </Tabs>
      <p className="text-sm text-muted-foreground">{activeView === "assigned_to_me" ? "Your personal tasks and tasks others assigned to you." : "Tasks you assigned to colleagues. Track their progress and review their work."}</p>
    </div>
    <div id="tour-task-stats" className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={activeView === "assigned_to_me" ? "My tasks summary" : "Tasks I assigned summary"}>
      {[
        { title: "Active Tasks", value: tasks.filter(task => isActiveTask(task) || task.status === "submitted").length, filter: "pending", icon: ListTodo, color: "text-primary" },
        { title: "Due in 48 hours", value: stats.due_soon, filter: "due_soon", icon: Clock, color: "text-orange-600 dark:text-orange-400" },
        { title: "Overdue", value: stats.overdue, filter: "overdue", icon: AlertTriangle, color: "text-destructive" },
        { title: "Completed", value: stats.completed, filter: "completed", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
      ].map(stat => <button key={stat.filter} type="button" disabled={isPending} onClick={() => setActiveTab(stat.filter)} aria-pressed={activeTab === stat.filter} aria-label={`Show ${stat.title.toLowerCase()}${stat.title === "Active Tasks" ? "" : " tasks"} (${stat.value})`} className="rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
        <StatsCard title={stat.title} value={stat.value} icon={stat.icon} iconClassName={stat.color} className="h-full gap-2 shadow-none transition-colors hover:bg-muted/40" />
      </button>)}
    </div>
    <div id="tour-task-filters" className="flex flex-wrap items-center gap-3">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
        <TabsList aria-label="Task status" className="grid w-full grid-cols-3 gap-1 border bg-muted/60 p-0.5 group-data-horizontal/tabs:h-auto">
          <TabsTrigger value="pending" className={prominentTab}>Active ({tasks.filter(task => isActiveTask(task) || task.status === "submitted").length})</TabsTrigger>
          <TabsTrigger value="completed" className={prominentTab}>Completed ({stats.completed})</TabsTrigger>
          <TabsTrigger value="all" className={prominentTab}>All ({stats.total})</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="relative min-w-[180px] flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input aria-label="Search tasks" placeholder="Search tasks or colleague…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="h-9 pl-8" />
      </div>
      <Button variant={showFilters || priorityFilter !== "all" ? "secondary" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} aria-controls="task-extra-filters">Filters</Button>
    </div>
    {showFilters && <div id="task-extra-filters" className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
      <Select value={activeTab} onValueChange={setActiveTab}>
        <SelectTrigger className="w-[170px] h-9" aria-label="Task status or deadline"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">All active</SelectItem><SelectItem value="not_started">Pending</SelectItem><SelectItem value="in_progress">In progress</SelectItem><SelectItem value="changes_requested">Changes requested</SelectItem>
          {Array.from(new Set([...tasks.filter(task => task.status === "in_progress" && task.custom_status).map(task => task.custom_status!), ...(activeTab.startsWith("custom:") ? [activeTab.slice(7)] : [])])).sort().map(status => <SelectItem key={status} value={`custom:${status}`}>{status}</SelectItem>)}
          <SelectItem value="submitted">Awaiting approval</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="all">All tasks</SelectItem><SelectItem value="due_soon">Due in 48 hours</SelectItem><SelectItem value="overdue">Overdue</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
        <SelectTrigger className="w-[150px] h-9" aria-label="Priority"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="all">All priorities</SelectItem><SelectItem value="urgent">Urgent</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
      </Select>
      <Button variant="ghost" size="sm" onClick={() => { setActiveTab("pending"); setPriorityFilter("all"); setSearchQuery(""); }}>Reset</Button>
    </div>}
    <div id="tour-task-list" aria-busy={isPending}>
      {isPending ? <p className="py-8 text-center text-sm text-muted-foreground">Loading tasks…</p> : <TasksTable tasks={filteredTasks} allTasks={tasks} view={activeView} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} onUpdated={handleTaskUpdated} />}
    </div>
    <CreateTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} taskToEdit={taskToEdit} onSuccess={() => { void refreshTasks(); }} />
  </div>;
}
