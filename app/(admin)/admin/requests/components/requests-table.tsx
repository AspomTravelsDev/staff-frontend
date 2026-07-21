"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { getRoleLabel, User } from "@/types/user-types";
import { useSort } from "@/lib/hooks/use-sort";
import {
  MoreHorizontal,
  Box,
  Wrench,
  Monitor,
  Key,
  HelpCircle,
  FileQuestion,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
  mp: "bg-red-500",
  md: "bg-red-500",
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

  const sortOptions = useMemo(
    () => ({
      dateFields: ["request_date"] as (keyof RequestItem)[],
    }),
    [],
  );

  const {
    sortedData: sorted,
    sortConfig,
    handleSort,
  } = useSort(requests, sortOptions);

  const SortIcon = ({ columnKey }: { columnKey: keyof RequestItem }) => {
    if (sortConfig?.key !== columnKey) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }

    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

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
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("requester_name")}
            >
              <div className="flex items-center">
                Requester
                <SortIcon columnKey="requester_name" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("category")}
            >
              <div className="flex items-center">
                Type
                <SortIcon columnKey="category" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("reason")}
            >
              <div className="flex items-center">
                Details
                <SortIcon columnKey="reason" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("status")}
            >
              <div className="flex items-center">
                Status
                <SortIcon columnKey="status" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:text-foreground transition-colors group"
              onClick={() => handleSort("request_date")}
            >
              <div className="flex items-center">
                Date
                <SortIcon columnKey="request_date" />
              </div>
            </TableHead>
            <TableHead className="text-right w-40">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((request) => {
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
                  <div className="flex flex-col max-w-75">
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
