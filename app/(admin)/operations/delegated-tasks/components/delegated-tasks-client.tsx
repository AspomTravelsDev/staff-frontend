"use client";

import { formatReadableDate } from "@/lib/utils/readable-date";

import { useState, useTransition, useMemo, type ReactNode } from "react";
import type {
  TaskTrackerItem,
  CompanyDelegatedTaskStats,
  TaskPriority,
} from "@/lib/types/task-tracker";
import {
  getCompanyDelegatedTasks,
  nudgeTaskAssignee,
} from "@/lib/api/task-tracker";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ListTodo,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Bell,
  Sparkles,
  FilterX,
  RotateCw,
  Send,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Rows,
  LayoutGrid,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { CreateTaskDialog } from "@/app/(admin)/my/task-tracker/components/create-task-dialog";
import { TaskCommentsDialog } from "@/app/(admin)/my/task-tracker/components/task-comments-dialog";
import { TaskWorkflowControls, TaskSubmissionDetails, isActiveTask } from "@/app/(admin)/my/task-tracker/components/task-workflow-controls";
import { getTaskStatusLabel } from "@/lib/utils/task-status";
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

const PRIORITY_STYLES: Record<TaskPriority, { label: string; badgeClass: string; dotClass: string }> = {
  urgent: {
    label: "Urgent",
    badgeClass: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800",
    dotClass: "bg-red-500",
  },
  high: {
    label: "High",
    badgeClass: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800",
    dotClass: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  low: {
    label: "Low",
    badgeClass: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-800",
    dotClass: "bg-slate-400",
  },
};

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
  const [statusFilter, setStatusFilter] = useState<string>(initialFilters?.status || "all");
  const [departmentFilter, setDepartmentFilter] = useState<string>(initialFilters?.department || "all");
  const [priorityFilter, setPriorityFilter] = useState<string>(initialFilters?.priority || "all");
  const [viewDensity, setViewDensity] = useState<"compact" | "comfortable">("compact");
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});
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

      // 3. Pending extension requests next
      const aExt = a.extension_status === "pending";
      const bExt = b.extension_status === "pending";
      if (aExt !== bExt) {
        return aExt ? -1 : 1;
      }

      // 4. Closest due date first (null deadlines at the end of active tasks)
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;

      // 5. Fallback: recent created_at first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [tasks, searchQuery, priorityFilter, departmentFilter, statusFilter]);

  // Pagination logic
  const totalItems = filteredAndSortedTasks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const paginatedTasks = filteredAndSortedTasks.slice(startIndex, startIndex + pageSize);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    departmentFilter !== "all" ||
    priorityFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setPriorityFilter("all");
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  // Toggle individual card expansion
  const toggleExpand = (id: string) => {
    setExpandedTaskIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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
          {/* Density Switcher */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border text-xs">
            <button
              type="button"
              onClick={() => setViewDensity("compact")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
                viewDensity === "compact"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Compact View (fits more on screen)"
            >
              <Rows className="h-3.5 w-3.5" />
              <span>Compact</span>
            </button>
            <button
              type="button"
              onClick={() => setViewDensity("comfortable")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
                viewDensity === "comfortable"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Comfortable View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Detailed</span>
            </button>
          </div>

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
        <FilterStatCard active={statusFilter === "all"} color="emerald" onClick={() => handleStatusFilterChange("all")}>
          <StatsCard title="Total Delegated" icon={ListTodo} value={stats.total} description="All delegated tasks" iconClassName="text-emerald-600" className="h-full" />
        </FilterStatCard>
        <FilterStatCard active={statusFilter === "overdue"} color="red" onClick={() => handleStatusFilterChange("overdue")}>
          <StatsCard title="Overdue" icon={AlertTriangle} value={stats.overdue} description="Past deadline" iconClassName="text-red-500" className="h-full" />
        </FilterStatCard>
        <FilterStatCard active={statusFilter === "pending"} color="sky" onClick={() => handleStatusFilterChange("pending")}>
          <StatsCard title="Active" icon={Clock} value={stats.pending} description="Open work, including overdue" iconClassName="text-sky-500" className="h-full" />
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

      {/* Task List */}
      <div id="tour-delegated-list" className="space-y-2">
        {paginatedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed bg-muted/20">
            <div className="p-3 rounded-full bg-muted mb-3">
              <ListTodo className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-base text-foreground">No delegated deliverables found</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1">
              {hasActiveFilters
                ? "No tasks match your current filters. Try changing or clearing your search criteria."
                : "No cross-delegated deliverables are currently recorded in the portal."}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="mt-4 text-xs"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          paginatedTasks.map((task) => {
            const isCompleted = task.status === "completed";
            const isOverdue = task.is_overdue;
            const priorityInfo = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
            const hasPendingExtension = isActiveTask(task) && task.extension_status === "pending";
            const isExpanded = viewDensity === "comfortable" || !!expandedTaskIds[task.id];

            return (
              <div
                key={task.id}
                onClick={() => viewDensity === "compact" && toggleExpand(task.id)}
                className={cn(
                  "rounded-lg border bg-card transition-all hover:border-muted-foreground/30 shadow-2xs overflow-hidden cursor-pointer select-none",
                  isOverdue && !isCompleted && "border-red-300 dark:border-red-900/60 bg-red-50/15 dark:bg-red-950/10",
                  hasPendingExtension && "border-purple-300 dark:border-purple-900/60 bg-purple-50/15 dark:bg-purple-950/10",
                  isCompleted && "opacity-75 bg-muted/20 hover:opacity-100"
                )}
              >
                {/* Main Compact Row */}
                <div className="flex flex-col items-stretch gap-2.5 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:py-2.5">
                  {/* Left: Indicator + Priority + Title */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Status Icon */}
                    <div className="shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : isOverdue ? (
                        <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />
                      ) : hasPendingExtension ? (
                        <Sparkles className="h-4 w-4 text-purple-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-sky-500" />
                      )}
                    </div>

                    {/* Priority Dot/Badge */}
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-semibold px-1.5 py-0 h-4.5 shrink-0 hidden sm:inline-flex", priorityInfo.badgeClass)}
                    >
                      {priorityInfo.label}
                    </Badge>

                    {/* Title */}
                    <div className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block font-medium text-xs sm:text-sm text-foreground truncate",
                        isCompleted && "line-through text-muted-foreground font-normal"
                      )}
                      title={task.title}
                    >
                      {task.title}
                    </span>
                    <p className="mt-0.5 text-[10px] text-muted-foreground break-words">
                      Assigned <time dateTime={task.created_at} title={formatReadableDate(task.created_at)}>{formatReadableDate(task.created_at, { includeTime: false })}</time>
                      {" · "}Department: {task.user?.department || "Not specified"}
                    </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] max-w-[180px] whitespace-normal break-words">{getTaskStatusLabel(task)}</Badge>

                    {/* Extension Badge on Row */}
                    {hasPendingExtension && (
                      <Badge className="bg-purple-600 text-white text-[9px] px-1.5 py-0 h-4 font-bold shrink-0">
                        Ext Req
                      </Badge>
                    )}
                  </div>

                  {/* Center: Assigner ➔ Assignee Flow */}
                  <div className="hidden md:flex items-center gap-1.5 text-xs shrink-0 bg-muted/50 px-2 py-0.5 rounded-md border text-muted-foreground">
                    <span className="font-medium text-foreground truncate max-w-[110px]" title={task.assigned_by?.name || "Assigner"}>
                      {task.assigned_by?.name || "Assigner"}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 truncate max-w-[110px]" title={task.user?.name || "Assignee"}>
                      {task.user?.name || "Assignee"}
                    </span>
                    {task.user?.department && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({task.user.department})
                      </span>
                    )}
                  </div>

                  {/* Right: Deadline Badge + Nudge + Expand Chevron */}
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    {/* Due Date Indicator */}
                    {task.due_date ? (
                      <div
                        className={cn(
                          "flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border shrink-0",
                          isOverdue && !isCompleted
                            ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900 font-bold"
                            : isCompleted
                            ? "bg-muted text-muted-foreground border-transparent"
                            : "bg-muted/60 text-foreground border-muted"
                        )}
                        title={formatReadableDate(task.due_date)}
                      >
                        <Calendar className="h-3 w-3" />
                        <span>
                          {isOverdue && !isCompleted
                            ? `Overdue · ${formatReadableDate(task.due_date)}`
                            : formatReadableDate(task.due_date)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic hidden sm:inline-block">No due date</span>
                    )}

                    {/* Nudge Button */}
                    {task.can_comment && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          setCommentsTask(task);
                        }}
                        className="h-7 gap-1 px-2 text-[11px] shrink-0"
                        title="Open task discussion"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span className="hidden sm:inline">Comments</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!isActiveTask(task)}
                      onClick={(e) => handleOpenNudge(task, e)}
                      className={cn(
                        "h-7 px-2 text-[11px] font-semibold gap-1 transition-all shrink-0",
                        isOverdue
                          ? "border-red-300 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                          : "text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      )}
                      title="Send email and portal reminder to assignee"
                    >
                      <Bell className="h-3 w-3" />
                      <span className="hidden sm:inline">Nudge</span>
                    </Button>

                    {/* Expand/Collapse Chevron (in Compact mode) */}
                    {viewDensity === "compact" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(task.id);
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                        title={isExpanded ? "Collapse" : "Expand Details"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t bg-muted/15 space-y-2.5 text-xs text-muted-foreground animate-in fade-in-50 duration-150">
                    <TaskSubmissionDetails task={task} />
                    <TaskWorkflowControls task={task} onUpdated={updated => { setTasks(current => current.map(t => t.id === updated.id ? updated : t)); void refreshTasks(); }} />
                    {/* Full Description if present */}
                    {task.description ? (
                      <div className="space-y-1">
                        <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                          Description:
                        </span>
                        <p className="text-foreground whitespace-pre-line leading-relaxed bg-background p-2.5 rounded-md border text-xs">
                          {task.description}
                        </p>
                      </div>
                    ) : (
                      <div className="italic text-[11px] text-muted-foreground">No description provided.</div>
                    )}

                    {/* Extension Request Banner if pending */}
                    {hasPendingExtension && (
                      <div className="p-2.5 rounded-md bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-xs text-purple-900 dark:text-purple-200 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                          <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Deadline Extension Requested by Assignee</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-purple-800 dark:text-purple-300">
                          {task.extension_requested_due_date && (
                            <span>
                              Requested Date:{" "}
                              <strong>{formatReadableDate(task.extension_requested_due_date)}</strong>
                            </span>
                          )}
                          {task.extension_reason && (
                            <span>
                              Reason: <em>&ldquo;{task.extension_reason}&rdquo;</em>
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Detailed Delegation Cards & Timestamps */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                      {/* Avatars & Departments */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Assigner */}
                        <div className="flex items-center gap-1.5 bg-background px-2 py-1 rounded border text-foreground">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">From:</span>
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={task.assigned_by?.image_url || undefined} />
                            <AvatarFallback className="text-[9px]">
                              {task.assigned_by?.name ? task.assigned_by.name[0] : "A"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-xs">{task.assigned_by?.name || "Assigner"}</span>
                          {task.assigned_by?.department && (
                            <span className="text-[10px] text-muted-foreground">({task.assigned_by.department})</span>
                          )}
                        </div>

                        <ArrowRight className="h-3 w-3 text-muted-foreground" />

                        {/* Assignee */}
                        <div className="flex items-center gap-1.5 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-1 rounded border border-emerald-200/60 dark:border-emerald-800/40 text-foreground">
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-semibold">To:</span>
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={task.user?.image_url || undefined} />
                            <AvatarFallback className="text-[9px]">
                              {task.user?.name ? task.user.name[0] : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-xs">{task.user?.name || "Assignee"}</span>
                          {task.user?.department && (
                            <span className="text-[10px] text-muted-foreground">({task.user.department})</span>
                          )}
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="flex items-center gap-3 text-[11px] self-end sm:self-auto">
                        {task.completed_at && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ Completed {formatReadableDate(task.completed_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

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
