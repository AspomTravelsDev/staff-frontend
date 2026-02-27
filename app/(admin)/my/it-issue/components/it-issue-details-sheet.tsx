"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { ItIssue } from "@/lib/api/it-issues";

function getPriorityVariant(priority: string) {
  switch (priority) {
    case "critical":
      return "destructive";
    case "high":
      return "default";
    default:
      return "outline";
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case "resolved":
    case "closed":
      return "outline";
    case "in_progress":
      return "default";
    default:
      return "secondary";
  }
}

export function ItIssueDetailsSheet({
  issue,
  open,
  onOpenChange,
  actions,
}: {
  issue: ItIssue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions?: React.ReactNode;
}) {
  if (!issue) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md px-6 py-4">
        <SheetHeader className="mb-6">
          <SheetTitle>IT Ticket Details</SheetTitle>
          <SheetDescription>{issue.subject}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Status
              </h4>
              <Badge
                variant={getStatusVariant(issue.status)}
                className="capitalize"
              >
                {issue.status.replace("_", " ")}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Priority
              </h4>
              <Badge
                variant={getPriorityVariant(issue.priority)}
                className="capitalize"
              >
                {issue.priority}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Category
              </h4>
              <p className="font-medium capitalize">{issue.category}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Date Submitted
              </h4>
              <p className="font-medium">
                {format(new Date(issue.created_at), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          {issue.submitted_by && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Submitted By
              </h4>
              <p className="font-medium">{issue.submitted_by.name}</p>
              <p className="text-sm text-muted-foreground capitalize">
                {issue.submitted_by.role}
              </p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">
              Description
            </h4>
            <div className="bg-muted/50 rounded-md p-3 text-sm min-h-[100px] whitespace-pre-wrap">
              {issue.description}
            </div>
          </div>

          {issue.resolution_note && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Resolution Note
              </h4>
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-md p-3 text-sm whitespace-pre-wrap">
                {issue.resolution_note}
              </div>
            </div>
          )}

          {actions && <div className="pt-2 border-t">{actions}</div>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
