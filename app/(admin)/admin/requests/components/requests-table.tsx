"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { getRoleLabel, User } from "@/types/user-types";
import {
  MoreHorizontal,
  Box,
  Wrench,
  Monitor,
  Key,
  HelpCircle,
  FileQuestion,
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
import type { RequestItem } from "@/lib/api/requests";
import { RequestDetailsSheet } from "./request-details-sheet";
import { RequestStatusSelect } from "./request-status-select";

interface RequestsTableProps {
  requests: RequestItem[];
}

const roleColors: Record<string, string> = {
  super: "bg-red-500",
  admin: "bg-purple-500",
  it: "bg-blue-500",
  account: "bg-green-500",
  visa: "bg-orange-500",
  hr: "bg-pink-500",
  "social-media": "bg-cyan-500",
  compliance: "bg-yellow-500",
  "birth-services": "bg-teal-500",
} as Record<User["role"], string>;

const categoryIcons: Record<string, React.ElementType> = {
  Toiletries: Box,
  Repairs: Wrench,
  Gadget: Monitor,
  Access: Key,
  Other: HelpCircle,
};

function getStatusVariant(status: RequestItem["status"]) {
  switch (status) {
    case "completed":
    case "approved":
      return "default"; // green/primary
    case "rejected":
      return "destructive";
    case "in_progress":
    case "cancelled":
      return "secondary";
    case "pending":
    default:
      return "outline";
  }
}

export function RequestsTable({ requests }: RequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(
    null,
  );

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileQuestion className="h-12 w-12 opacity-50 mb-4" />
        <p>No requests found</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Requester</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const CategoryIcon = categoryIcons[request.category] || HelpCircle;

            return (
              <TableRow
                key={request.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedRequest(request)}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {request.requester_name}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${roleColors[request.requester_role as User["role"]] || "bg-gray-400"}`}
                      />
                      <span className="text-xs text-muted-foreground capitalize">
                        {request.requester_role
                          ? getRoleLabel(request.requester_role as User["role"])
                          : "User"}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-muted">
                      <CategoryIcon className="h-4 w-4 text-foreground/70" />
                    </div>
                    <span className="font-medium text-sm">
                      {request.category}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col max-w-[300px]">
                    <span className="font-medium text-sm truncate">
                      {request.reason}
                    </span>
                    <span
                      className="text-xs text-muted-foreground truncate"
                      title={request.details}
                    >
                      {request.details}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant={getStatusVariant(request.status)}>
                    {request.status.replace("_", " ")}
                  </Badge>
                </TableCell>

                <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(request.request_date), {
                    addSuffix: true,
                  })}
                </TableCell>

                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <RequestStatusSelect
                    id={request.id}
                    currentStatus={request.status}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <RequestDetailsSheet
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) setSelectedRequest(null);
        }}
      />
    </>
  );
}
