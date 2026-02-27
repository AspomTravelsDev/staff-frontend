"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RequestDetailsSheet } from "./request-details-sheet";

export function RequestStaffTable({ requests }: { requests: any[] }) {
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  if (!requests?.length) {
    return (
      <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
        No requests found.
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow
              key={request.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedRequest(request)}
            >
              <TableCell className="font-medium capitalize">
                {request.request_type}
              </TableCell>
              <TableCell>{request.department}</TableCell>
              <TableCell>{request.quantity}</TableCell>
              <TableCell
                className="max-w-[200px] truncate"
                title={request.reason}
              >
                {request.reason}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    request.status === "approved"
                      ? "default"
                      : request.status === "rejected"
                        ? "destructive"
                        : request.status === "interviewing" ||
                            request.status === "in review"
                          ? "default"
                          : "secondary"
                  }
                  className={
                    request.status === "interviewing"
                      ? "bg-blue-500 hover:bg-blue-600"
                      : request.status === "in review"
                        ? "bg-amber-500 hover:bg-amber-600"
                        : ""
                  }
                >
                  {request.status.charAt(0).toUpperCase() +
                    request.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(request.created_at), "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <RequestDetailsSheet
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) setSelectedRequest(null);
        }}
      />
    </div>
  );
}
