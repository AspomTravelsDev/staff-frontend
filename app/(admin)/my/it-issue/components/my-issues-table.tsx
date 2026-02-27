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
import { ItIssueDetailsSheet } from "./it-issue-details-sheet";

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

export function MyIssuesTable({ issues }: { issues: ItIssue[] }) {
  const [selected, setSelected] = useState<ItIssue | null>(null);

  if (issues.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        No tickets yet. Submit your first issue above.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow
              key={issue.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelected(issue)}
            >
              <TableCell className="font-medium">{issue.subject}</TableCell>
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
                  variant={getStatusVariant(issue.status)}
                  className="capitalize"
                >
                  {issue.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                {formatDistanceToNow(new Date(issue.created_at), {
                  addSuffix: true,
                })}
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
