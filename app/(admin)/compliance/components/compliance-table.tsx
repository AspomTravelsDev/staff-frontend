"use client";

import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
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
import type { ComplianceIssue, Severity } from "@/lib/api/compliance";

interface ComplianceTableProps {
  issues: ComplianceIssue[];
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

export function ComplianceTable({ issues }: ComplianceTableProps) {
  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 opacity-50 mb-4" />
        <p>No compliance issues found</p>
      </div>
    );
  }

  return (
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
            <TableRow key={issue.id}>
              <TableCell className="font-medium">{issue.user_name}</TableCell>
              <TableCell>{issue.user_department}</TableCell>
              <TableCell>{issue.type}</TableCell>
              <TableCell
                className="max-w-[300px] truncate"
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
                <Badge
                  variant={
                    issue.status === "open" ? "destructive" : "secondary"
                  }
                >
                  {issue.status}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(issue.date), { addSuffix: true })}
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
                    <DropdownMenuItem>View details</DropdownMenuItem>
                    <DropdownMenuItem>Mark as resolved</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
