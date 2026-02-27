"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { ItIssue } from "@/lib/api/it-issues";
import { deleteItIssueAction } from "../actions";
import { ItIssueDetailsSheet } from "./it-issue-details-sheet";
import { StatsCard } from "@/components/stats-card";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Eye,
  Trash2,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ─── helpers ──────────────────────────────────────────────────────────────────

function getPriorityVariant(p: string) {
  switch (p) {
    case "critical":
      return "destructive";
    case "high":
      return "default";
    case "medium":
      return "secondary";
    default:
      return "outline";
  }
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-yellow-50 text-yellow-700 border-yellow-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-muted text-muted-foreground border-border",
};

// ─── main ─────────────────────────────────────────────────────────────────────

export function MyIssuesContent({ issues }: { issues: ItIssue[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [selected, setSelected] = useState<ItIssue | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toDelete, setToDelete] = useState<ItIssue | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // stats
  const stats = useMemo(
    () => ({
      open: issues.filter((i) => i.status === "open").length,
      in_progress: issues.filter((i) => i.status === "in_progress").length,
      resolved: issues.filter((i) => i.status === "resolved").length,
      closed: issues.filter((i) => i.status === "closed").length,
    }),
    [issues],
  );

  // filtered list
  const filtered = useMemo(
    () =>
      issues.filter((i) => {
        const matchStatus = statusFilter === "all" || i.status === statusFilter;
        const matchSearch =
          !search ||
          i.subject.toLowerCase().includes(search.toLowerCase()) ||
          i.category.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
      }),
    [issues, search, statusFilter],
  );

  const hasFilters = search || statusFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setStatus("all");
  };

  const handleView = (issue: ItIssue) => {
    setSelected(issue);
    setSheetOpen(true);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteItIssueAction(toDelete.id);
      if (result.success) {
        toast.success("Ticket deleted");
        setToDelete(null);
      } else {
        toast.error("Failed to delete ticket");
      }
    } catch (error) {
      toast.error("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Open"
          icon={Ticket}
          value={stats.open}
          description="Awaiting response"
          variant="default"
        />
        <StatsCard
          title="In Progress"
          icon={Clock}
          value={stats.in_progress}
          description="Being worked on"
          variant="default"
        />
        <StatsCard
          title="Resolved"
          icon={CheckCircle2}
          value={stats.resolved}
          description="Issue fixed"
          variant="default"
        />
        <StatsCard
          title="Closed"
          icon={XCircle}
          value={stats.closed}
          description="No further action"
          variant="default"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subject or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}

        <p className="text-sm text-muted-foreground ml-auto">
          {filtered.length} of {issues.length} tickets
        </p>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  {issues.length === 0
                    ? "No tickets yet. Submit your first issue using the form above."
                    : "No tickets match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((issue) => (
                <TableRow key={issue.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {issue.subject}
                  </TableCell>
                  <TableCell className="capitalize">{issue.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getPriorityVariant(issue.priority)}
                      className="capitalize"
                    >
                      {issue.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize border ${STATUS_STYLES[issue.status] ?? ""}`}
                    >
                      {issue.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(issue.created_at), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleView(issue)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        {issue.status === "closed" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setToDelete(issue)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Sheet */}
      <ItIssueDetailsSheet
        issue={selected}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelected(null);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              ticket &quot;{toDelete?.subject}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
