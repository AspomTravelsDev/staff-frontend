"use client";

import { useState } from "react";
import type { ItIssue } from "@/lib/api/it-issues";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ItIssueDetailsSheet } from "@/app/(admin)/my/it-issue/components/it-issue-details-sheet";
import { ItIssueStatusSelect } from "./it-issue-status-select";

function getPriorityVariant(priority: string) {
  switch (priority) {
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

export function ItIssuesTable({ issues }: { issues: ItIssue[] }) {
  const [selected, setSelected] = useState<ItIssue | null>(null);

  if (issues.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        No IT issues have been reported yet.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Requester</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-right w-[150px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow
              key={issue.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelected(issue)}
            >
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {issue.submitted_by ? issue.submitted_by.name : "Unknown"}
                  </span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {issue.submitted_by?.role || ""}
                  </span>
                </div>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
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
              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                {formatDistanceToNow(new Date(issue.created_at), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell
                className="text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <ItIssueStatusSelect
                  id={issue.id}
                  currentStatus={issue.status}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ItIssueDetailsSheet
        issue={selected}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
