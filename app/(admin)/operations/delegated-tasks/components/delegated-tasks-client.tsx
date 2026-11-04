"use client";

import { formatReadableDate } from "@/lib/utils/readable-date";

import { useState, useTransition, useMemo, type ReactNode } from "react";
import type {
  TaskTrackerItem,
  CompanyDelegatedTaskStats,
} from "@/lib/types/task-tracker";
import {
  getCompanyDelegatedTasks,
  nudgeTaskAssignee,
} from "@/lib/api/task-tracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ListTodo,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarClock,
  Bell,
  FilterX,
  RotateCw,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { CreateTaskDialog } from "@/app/(admin)/my/task-tracker/components/create-task-dialog";
import { TaskCommentsDialog } from "@/app/(admin)/my/task-tracker/components/task-comments-dialog";
import { isActiveTask } from "@/app/(admin)/my/task-tracker/components/task-workflow-controls";
import { DelegatedTasksTable } from "./delegated-tasks-table";
import { DelegatedTasksTour, DelegatedTasksTourButton } from "./delegated-tasks-tour";
import { StatsCard } from "@/components/stats-card";

interface DelegatedTasksClientProps {
  initialTasks: TaskTrackerItem[];
  initialStats: CompanyDelegatedTaskStats;
  initialFilters?: {
    status?: string;
    priority?: string;
    department?: string;
    search?: string;
  };
}

function FilterStatCard({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color: "emerald" | "red" | "sky" | "amber";
  onClick: () => void;
  children: ReactNode;
}) {
  const colorClass = {
    emerald: "focus-visible:ring-emerald-500 ring-emerald-500",
    red: "focus-visible:ring-red-500 ring-red-500",
    sky: "focus-visible:ring-sky-500 ring-sky-500",
    amber: "focus-visible:ring-amber-500 ring-amber-500",
  }[color];

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={cn("cursor-pointer rounded-xl transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2", colorClass, active && "ring-2")}
    >
      {children}
    </div>
  );
}

export function DelegatedTasksClient({
  initialTasks,
  initialStats,
  initialFilters,
}: DelegatedTasksClientProps) {
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState<TaskTrackerItem[]>(initialTasks);
  const [stats, setStats] = useState<CompanyDelegatedTaskStats>(initialStats);
  const [searchQuery, setSearchQuery] = useState(initialFilters?.search || "");
  const [statusFilter, setStatusFilter] = useState<string>(initialFilters?.status || "pending");
  const [departmentFilter, setDepartmentFilter] = useState<string>(initialFilters?.department || "all");
  const [assignerFilter, setAssignerFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState<string>(initialFilters?.priority || "all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [isPending, startTransition] = useTransition();
  const [quickAssignOpen, setQuickAssignOpen] = useState(false);
  const [commentsTask, setCommentsTask] = useState<TaskTrackerItem | null>(null);

  // Nudge Modal State
  const [nudgeModalOpen, setNudgeModalOpen] = useState(false);
  const [taskToNudge, setTaskToNudge] = useState<TaskTrackerItem | null>(null);
  const [customNudgeMessage, setCustomNudgeMessage] = useState("");
  const [isNudging, setIsNudging] = useState(false);

  // Re-fetch tasks from server
  const refreshTasks = async () => {
    try {
      const res = await getCompanyDelegatedTasks();

      if (res.success) {
        setTasks(res.data.data);
        setStats(res.data.stats);
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        return true;
      }
      toast.error("Could not load deliverables. Please try again.");
    } catch {
      toast.error("Failed to refresh tasks");
    }
    return false;
  };

  const handleRefresh = () => {
    startTransition(async () => {
      if (await refreshTasks()) toast.success("Tasks refreshed");
    });
  };

  // Collect distinct departments from tasks
  const availableDepartments = useMemo(() => {
    const deptSet = new Set<string>();
    tasks.forEach((t) => {
      if (t.user?.department) deptSet.add(t.user.department);
      if (t.assigned_by?.department) deptSet.add(t.assigned_by.department);
    });
    return Array.from(deptSet).sort();
  }, [tasks]);

  // Client-side filter AND strict sort: Overdue -> Pending (closest deadline) -> Completed lower
  const filteredAndSortedTasks = useMemo(() => {
    const list = tasks.filter((task) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = (task.description || "").toLowerCase().includes(query);
        const matchesAssignee = (task.user?.name || "").toLowerCase().includes(query);
        const matchesAssigner = (task.assigned_by?.name || "").toLowerCase().includes(query);
        const matchesStatus = (task.custom_status || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesAssignee && !matchesAssigner && !matchesStatus) {
          return false;
        }
      }

      if (assignerFilter !== "all" && task.assigned_by_user_id !== assignerFilter) return false;
      if (assigneeFilter !== "all" && task.user_id !== assigneeFilter) return false;

      // Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      // Department filter
      if (departmentFilter !== "all") {
        const assigneeDept = task.user?.department;
        if (assigneeDept !== departmentFilter) {
          return false;
        }
      }

      // Status filter
      if (statusFilter === "completed") {
        return task.status === "completed";
      }
      if (statusFilter === "pending") {
        return isActiveTask(task);
      }
      if (["submitted", "cancelled", "changes_requested", "in_progress"].includes(statusFilter)) return task.status === statusFilter;
      if (statusFilter === "overdue") {
        return task.status !== "completed" && task.is_overdue;
      }
      if (statusFilter === "pending_extensions") {
        return isActiveTask(task) && task.extension_status === "pending";
      }
      if (statusFilter === "due_soon") {
        if (!isActiveTask(task) || !task.due_date) return false;
        const due = new Date(task.due_date);
        const now = new Date();
        const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        return due >= now && due <= in48h;
      }

      return true;
    });

    // Default Sorting: Overdue first -> Pending (closest deadline first) -> Completed lower
    return list.sort((a, b) => {
      const rank = (task: TaskTrackerItem) => isActiveTask(task) ? 0 : task.status === "submitted" ? 1 : task.status === "completed" ? 2 : 3;
      const rankDifference = rank(a) - rank(b);
      if (rankDifference) return rankDifference;
      const aCompleted = a.status === "completed";
      const bCompleted = b.status === "completed";

      // 1. Completed tasks placed at the bottom
      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1;
      }

      // If both completed, order by completion date recent first
      if (aCompleted && bCompleted) {
        const aDate = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const bDate = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        return bDate - aDate;
      }

      // 2. Overdue tasks first
      const aOverdue = a.is_overdue;
      const bOverdue = b.is_overdue;
      if (aOverdue !== bOverdue) {
        return aOverdue ? -1 : 1;
      }

      // Closest due date first (null deadlines at the end of active tasks).
      if (a.due_date && b.due_date) {
        const deadlineDifference = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        if (deadlineDifference) return deadlineDifference;
      }
      if (!!a.due_date !== !!b.due_date) return a.due_date ? -1 : 1;

      const priorityRank = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDifference = priorityRank[a.priority] - priorityRank[b.priority];
      if (priorityDifference) return priorityDifference;

      // 5. Fallback: recent created_at first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tasks, searchQuery, priorityFilter, departmentFilter, statusFilter, assignerFilter, assigneeFilter]);

  // Pagination logic
  const totalItems = filteredAndSortedTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const paginatedTasks = filteredAndSortedTasks.slice(startIndex, startIndex + pageSize);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "pending" ||
    departmentFilter !== "all" ||
    priorityFilter !== "all" || assignerFilter !== "all" || assigneeFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("pending");
    setDepartmentFilter("all");
    setPriorityFilter("all");
    setAssignerFilter("all");
    setAssigneeFilter("all");
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  // Open Nudge Dialog
  const handleOpenNudge = (task: TaskTrackerItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTaskToNudge(task);
    setCustomNudgeMessage("");
    setNudgeModalOpen(true);
  };

  // Submit Nudge
  const handleSendNudge = async () => {
    if (!taskToNudge) return;
    setIsNudging(true);
    try {
      const res = await nudgeTaskAssignee(taskToNudge.id, {
        message: customNudgeMessage.trim() || undefined,
      });

      if (res.success) {
        if (res.data.email_sent) toast.success(res.data.message);
        else toast.warning(res.data.message);
        setNudgeModalOpen(false);
      } else {
        toast.error(res.error?.error || "Failed to send nudge notification");
      }
    } catch {
      toast.error("Failed to send nudge notification");
    } finally {
      setIsNudging(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <DelegatedTasksTour />
      {/* Header */}
      <div id="tour-delegated-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
              <ListTodo className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Company Delegated Deliverables
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Oversight of cross-delegated tasks, deadlines, overdue assignments, and extensions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <DelegatedTasksTourButton />
          <Button
            id="tour-delegated-assign"
            size="sm"
            onClick={() => setQuickAssignOpen(true)}
            className="h-8 gap-1.5 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
          >
            <Send className="h-3.5 w-3.5" /> Quick Assign
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="gap-1.5 text-xs font-medium h-8"
          >
            <RotateCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div id="tour-delegated-stats" className="grid gap-4 md:grid-cols-5">
        <FilterStatCard active={statusFilter === "pending"} color="sky" onClick={() => handleStatusFilterChange("pending")}>
          <StatsCard title="Active Tasks" icon={Clock} value={stats.pending} description="Open work, including overdue" iconClassName="text-sky-500" className="h-full" />
        </FilterStatCard>
        <FilterStatCard active={statusFilter === "all"} color="emerald" onClick={() => handleStatusFilterChange("all")}>
          <StatsCard title="Total Delegated" icon={ListTodo} value={stats.total} description="All delegated tasks" iconClassName="text-emerald-600" className="h-full" />
        </FilterStatCard>
        <FilterStatCard active={statusFilter === "overdue"} color="red" onClick={() => handleStatusFilterChange("overdue")}>
          <StatsCard title="Overdue" icon={AlertTriangle} value={stats.overdue} description="Past deadline" iconClassName="text-red-500" className="h-full" />
        </FilterStatCard>
        <FilterStatCard active={statusFilter === "due_soon"} color="amber" onClick={() => handleStatusFilterChange("due_soon")}>
          <StatsCard title="Due Soon" icon={CalendarClock} value={stats.due_soon} description="Due within 48 hours" iconClassName="text-amber-500" className="h-full" />
        </FilterStatCard>
        <FilterStatCard active={statusFilter === "submitted"} color="sky" onClick={() => handleStatusFilterChange("submitted")}>
          <StatsCard title="Awaiting Approval" icon={CheckCircle2} value={stats.submitted ?? 0} description="Submitted to assigners" className="h-full" />
        </FilterStatCard>
      </div>

      {/* Filter & Search Toolbar */}
      <div id="tour-delegated-filters" className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 p-2.5 bg-muted/40 rounded-xl border">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by title, description, assignee, or assigner..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8.5 h-8 text-xs sm:text-sm bg-background"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Select */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs min-w-[130px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="pending">Pending / Active</SelectItem>
              <SelectItem value="due_soon">Due Soon (48h)</SelectItem>
              <SelectItem value="pending_extensions">Extension Requested</SelectItem>
              <SelectItem value="submitted">Awaiting Approval</SelectItem>
              <SelectItem value="changes_requested">Changes Requested</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed (Lower)</SelectItem>
            </SelectContent>
          </Select>

          {/* Department Select */}
          <Select
            value={departmentFilter}
            onValueChange={(val) => {
              setDepartmentFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs min-w-[135px] bg-background">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {availableDepartments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Select */}
          <Select
            value={priorityFilter}
            onValueChange={(val) => {
              setPriorityFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs min-w-[115px] bg-background">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={assignerFilter} onValueChange={(value) => { setAssignerFilter(value); setCurrentPage(1); }}><SelectTrigger className="h-8 min-w-[150px] text-xs" aria-label="Filter by assigner"><SelectValue placeholder="Assigned by" /></SelectTrigger><SelectContent><SelectItem value="all">All assigners</SelectItem>{Array.from(new Map(tasks.filter((task) => task.assigned_by).map((task) => [task.assigned_by!.id, task.assigned_by!])).values()).sort((a, b) => a.name.localeCompare(b.name)).map((person) => <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>)}</SelectContent></Select>
          <Select value={assigneeFilter} onValueChange={(value) => { setAssigneeFilter(value); setCurrentPage(1); }}><SelectTrigger className="h-8 min-w-[150px] text-xs" aria-label="Filter by assignee"><SelectValue placeholder="Assigned to" /></SelectTrigger><SelectContent><SelectItem value="all">All assignees</SelectItem>{Array.from(new Map(tasks.filter((task) => task.user).map((task) => [task.user!.id, task.user!])).values()).sort((a, b) => a.name.localeCompare(b.name)).map((person) => <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>)}</SelectContent></Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <FilterX className="h-3.5 w-3.5" />
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Task List Header with Count & Sort Indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-foreground">{totalItems > 0 ? startIndex + 1 : 0}</strong>–
            <strong className="text-foreground">{Math.min(startIndex + pageSize, totalItems)}</strong> of{" "}
            <strong className="text-foreground">{totalItems}</strong> deliverables
          </span>
          <span className="hidden sm:inline-block text-muted-foreground/60">•</span>
          <span className="hidden sm:inline-block">
            Sorted by: <strong className="text-foreground font-medium">Overdue ➔ Pending ➔ Completed</strong>
          </span>
        </div>

        {/* Page size selector */}
        <div className="flex items-center gap-1.5">
          <span>Per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-7 w-[65px] text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DelegatedTasksTable tasks={paginatedTasks} allTasks={tasks} onNudge={handleOpenNudge} onComment={setCommentsTask} onUpdated={updated => { setTasks(current => current.map(task => task.id === updated.id ? { ...task, ...updated } : task)); void refreshTasks(); }} />

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 border-t pt-3 text-xs">
          <span className="text-muted-foreground">
            Page <strong className="text-foreground">{currentPageSafe}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPageSafe <= 1}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </Button>

            {/* Page number indicators */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPageSafe) <= 1)
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && page - prev > 1;

                  return (
                    <div key={page} className="flex items-center">
                      {showEllipsis && <span className="px-1 text-muted-foreground">...</span>}
                      <Button
                        variant={page === currentPageSafe ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "h-8 w-8 p-0 text-xs",
                          page === currentPageSafe ? "bg-emerald-600 text-white font-bold" : ""
                        )}
                      >
                        {page}
                      </Button>
                    </div>
                  );
                })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPageSafe >= totalPages}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Nudge Confirmation & Message Modal */}
      {commentsTask && (
        <TaskCommentsDialog
          task={commentsTask}
          open
          onOpenChange={(open) => !open && setCommentsTask(null)}
        />
      )}

      <CreateTaskDialog
        open={quickAssignOpen}
        onOpenChange={setQuickAssignOpen}
        requireColleague
        onSuccess={() => {
          void refreshTasks();
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }}
      />

      <Dialog open={nudgeModalOpen} onOpenChange={open => { if (!isNudging) setNudgeModalOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-600" />
              <span>Nudge Assignee</span>
            </DialogTitle>
            <DialogDescription>
              Send the assigned staff member a reminder by email and portal notification.
            </DialogDescription>
          </DialogHeader>

          {taskToNudge && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/60 border text-xs space-y-1">
                <div className="font-semibold text-foreground text-sm">
                  {taskToNudge.title}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Assignee: <strong>{taskToNudge.user?.name}</strong></span>
                  {taskToNudge.due_date && (
                    <span>
                      • Due: {formatReadableDate(taskToNudge.due_date)}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="operations-nudge-message" className="text-xs font-semibold text-foreground">
                  Custom Follow-up Note (Optional)
                </label>
                <Textarea
                  id="operations-nudge-message"
                  maxLength={500}
                  disabled={isNudging}
                  placeholder="e.g., Please provide an update on this deliverable before the management review..."
                  value={customNudgeMessage}
                  onChange={(e) => setCustomNudgeMessage(e.target.value)}
                  rows={3}
                  className="text-xs sm:text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Leave blank to send a standard reminder with your name and the task deadline.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNudgeModalOpen(false)}
              disabled={isNudging}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSendNudge}
              disabled={isNudging}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold"
            >
              {isNudging ? (
                <>
                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Sending Nudge...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Nudge</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
