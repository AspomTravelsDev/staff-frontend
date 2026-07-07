"use client";

import { useState } from "react";
import type { LeaveEntry } from "../queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeaveDetailsSheet } from "./leave-details-sheet";

interface LeaveTableProps {
  entries: LeaveEntry[];
}

export function LeaveTable({ entries }: LeaveTableProps) {
  const [selectedLeave, setSelectedLeave] = useState<LeaveEntry | null>(null);
  const [open, setOpen] = useState(false);

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead className="hidden md:table-cell">Reason</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No leave requests found.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setSelectedLeave(entry);
                    setOpen(true);
                  }}
                >
                  <TableCell className="font-medium">{entry.type}</TableCell>
                  <TableCell>{entry.days}</TableCell>
                  <TableCell>{entry.startDate}</TableCell>
                  <TableCell>{entry.endDate}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                    {entry.reason}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(entry.status)}`}>
                      {entry.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <LeaveDetailsSheet
        leave={selectedLeave}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
