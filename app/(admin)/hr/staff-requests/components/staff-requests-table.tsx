"use client"
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
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";
import { StaffRequestActions } from "./staff-request-actions";
import { RequestDetailsSheet } from "../../../my/request-staff/components/request-details-sheet";
import { CreateRoleDialog } from "../../recruitment/components/create-role-dialog";

export function StaffRequestsTable({ requests }: { requests: any[] }) {
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  if (!requests?.length) {
    return (
      <div className="text-center py-12 border rounded-lg bg-card text-muted-foreground">
        No staff requests found.
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Staff Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Comment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow
              key={request.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedRequest(request)}
            >
              <TableCell className="font-medium whitespace-nowrap">
                {request.requester?.name || "Unknown Staff"}
              </TableCell>
              <TableCell className="capitalize whitespace-nowrap">
                {request.request_type}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {request.department}
              </TableCell>
              <TableCell>{request.quantity}</TableCell>
              <TableCell
                className="max-w-50 truncate"
                title={request.reason}
              >
                {request.reason}
              </TableCell>
              <TableCell
                className="max-w-50 truncate"
                title={request.comment || "N/A"}
              >
                {request.comment || "-"}
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
              <TableCell className="whitespace-nowrap">
                {format(new Date(request.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell
                className="text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-end gap-2">
                  <CreateRoleDialog
                    hrRequests={requests}
                    preselectedRequestId={request.id}
                    trigger={
                      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 hover:border-primary">
                        <Briefcase className="h-3.5 w-3.5 text-primary" />
                        Recruit
                      </Button>
                    }
                  />
                  <StaffRequestActions
                    id={request.id}
                    currentStatus={request.status}
                  />
                </div>
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
