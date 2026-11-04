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
import { StatsCard } from "@/components/stats-card";
import { AlertTriangle, CheckCircle, Clock, Inbox } from "lucide-react";
import type { ItIssueStats } from "@/lib/api/it-issues";
import { Card } from "@/components/ui/card";

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

export function ItIssuesTable({ issues, stats }: { issues: ItIssue[]; stats: ItIssueStats }) {
  const [selected, setSelected] = useState<ItIssue | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "open" | "in_progress" | "resolved" | "critical">("all");
  const filteredIssues = activeFilter === "critical"
    ? issues.filter((issue) => issue.priority === "critical")
    : activeFilter === "all" ? issues : issues.filter((issue) => issue.status === activeFilter);

  return (
    <>
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <StatsCard title="Open Tickets" icon={Inbox} value={stats.open} description="Awaiting action" onClick={() => setActiveFilter(activeFilter === "open" ? "all" : "open")} active={activeFilter === "open"} iconClassName="text-orange-500" />
        <StatsCard title="In Progress" icon={Clock} value={stats.in_progress} description="Currently being worked on" onClick={() => setActiveFilter(activeFilter === "in_progress" ? "all" : "in_progress")} active={activeFilter === "in_progress"} iconClassName="text-blue-500" />
        <StatsCard title="Resolved" icon={CheckCircle} value={stats.resolved} description="Closed successfully" onClick={() => setActiveFilter(activeFilter === "resolved" ? "all" : "resolved")} active={activeFilter === "resolved"} iconClassName="text-green-500" />
        <StatsCard title="Critical Issues" icon={AlertTriangle} value={stats.critical} description="High priority tickets" onClick={() => setActiveFilter(activeFilter === "critical" ? "all" : "critical")} active={activeFilter === "critical"} iconClassName="text-destructive" />
      </div>
      <Card className="overflow-x-auto p-4">
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
          {filteredIssues.map((issue) => (
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
          {filteredIssues.length === 0 && <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">{issues.length === 0 ? "No IT issues have been reported yet." : "No tickets match this card."}</TableCell></TableRow>}
        </TableBody>
      </Table>
      </Card>

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
