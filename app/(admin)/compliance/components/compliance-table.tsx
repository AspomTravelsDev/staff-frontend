"use client";

import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { ComplianceIssue, Severity, deleteComplianceIssue } from "@/lib/api/compliance";
import { ComplianceDetailsDialog } from "./compliance-details-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ComplianceTableProps {
  issues: ComplianceIssue[];
  isAdmin?: boolean;
}

const severityConfig: Record<
  Severity,
  { label: string; color: string; icon: React.ElementType }
> = {
  critical: {
    label: "Critical",
    color: "bg-red-100 text-red-700",
    icon: AlertCircle,
  },
  high: {
    label: "High",
    color: "bg-orange-100 text-orange-700",
    icon: AlertTriangle,
  },
  medium: {
    label: "Medium",
    color: "bg-yellow-100 text-yellow-700",
    icon: AlertTriangle,
  },
  low: { label: "Low", color: "bg-blue-100 text-blue-700", icon: Info },
};

export function ComplianceTable({ issues, isAdmin = false }: ComplianceTableProps) {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 opacity-50 mb-4" />
        <p>No compliance issues found</p>
      </div>
    );
  }

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Time</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {issues.map((issue) => {
          const severity = severityConfig[issue.severity];
          const SeverityIcon = severity.icon;

          return (
            <TableRow 
              key={issue.id}
              className={issue.has_new_replies ? "bg-primary/5 dark:bg-primary/10" : ""}
            >
              <TableCell className={`flex items-center gap-2 ${issue.has_new_replies ? "font-black" : "font-medium"}`}>
                {issue.user_name}
                {issue.has_new_replies && (
                  <Badge
                    variant="default"
                    className="uppercase text-[9px] px-1.5 py-0 h-4 tracking-wider bg-primary text-primary-foreground"
                  >
                    New
                  </Badge>
                )}
              </TableCell>
              <TableCell className={issue.has_new_replies ? "font-bold" : ""}>
                {issue.user_department}
              </TableCell>
              <TableCell className={issue.has_new_replies ? "font-bold" : ""}>
                <div>
                  <p className="leading-tight">{issue.type}</p>
                  {issue.points !== undefined && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {issue.points} {issue.points === 1 ? "occurrence" : "occurrences"}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell
                className={`max-w-[200px] truncate ${issue.has_new_replies ? "font-bold" : ""}`}
                title={issue.description}
              >
                {issue.description}
              </TableCell>
              <TableCell>
                <div
                  className={`flex items-center gap-2 px-2 py-1 rounded-full w-fit text-xs font-medium ${severity.color}`}
                >
                  <SeverityIcon className="h-3 w-3" />
                  {severity.label}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5 items-start">
                  <Badge
                    variant={
                      issue.status === "open"
                        ? "destructive"
                        : issue.outcome === "Resolved (No Action)"
                        ? "secondary"
                        : "default"
                    }
                    className="text-[11px]"
                  >
                    {issue.status === "open"
                      ? "Open Query"
                      : issue.outcome || "Closed"}
                  </Badge>
                  {issue.status === "closed" &&
                    issue.outcome !== "Resolved (No Action)" && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        +{issue.points ?? 1.0} {(issue.points ?? 1.0) === 1 ? "occurrence" : "occurrences"}
                      </span>
                    )}
                </div>
              </TableCell>
              <TableCell className={`whitespace-nowrap text-sm ${issue.has_new_replies ? "text-primary font-bold" : "text-muted-foreground"}`}>
                {issue.occurrence_date && formatDistanceToNow(new Date(issue.occurrence_date), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                        setSelectedIssueId(issue.id);
                        setDetailsOpen(true);
                    }}>View details</DropdownMenuItem>
                    {isAdmin && issue.status === "open" && (
                         <DropdownMenuItem onClick={() => {
                            setSelectedIssueId(issue.id);
                            setDetailsOpen(true);
                        }}>Add Response/Outcome</DropdownMenuItem>
                    )}
                    {isAdmin && issue.status === "open" && !issue.latest_comment && (
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          setSelectedIssueId(issue.id);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Occurrence
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>

    <ComplianceDetailsDialog 
        issueId={selectedIssueId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        isAdmin={isAdmin}
    />

    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this compliance occurrence. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
            onClick={async (e) => {
              e.preventDefault();
              if (!selectedIssueId) return;
              setIsDeleting(true);
              try {
                await deleteComplianceIssue(selectedIssueId);
                toast.success("Occurrence deleted successfully");
                setDeleteOpen(false);
                router.refresh();
              } catch (error) {
                toast.error("Failed to delete occurrence");
              } finally {
                setIsDeleting(false);
              }
            }}
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
