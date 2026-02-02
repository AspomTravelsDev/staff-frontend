"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Check, X, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LeaveRequest } from "@/lib/api/leave";

interface LeaveTableProps {
  requests: LeaveRequest[];
}

export function LeaveTable({ requests }: LeaveTableProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Approved":
        return "default"; // green usually via className override/custom variant if configured
      case "Pending":
        return "secondary"; // or warning
      case "Rejected":
        return "destructive";
      case "Cancelled":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No leave requests found.
              </TableCell>
            </TableRow>
          ) : (
            requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{req.employeeName}</span>
                    <span className="text-xs text-muted-foreground">
                      {req.department}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{req.type}</TableCell>
                <TableCell className="text-sm">
                  {req.startDate}{" "}
                  <span className="text-muted-foreground">-&gt;</span>{" "}
                  {req.endDate}
                </TableCell>
                <TableCell>{req.days}</TableCell>
                <TableCell
                  className="max-w-[150px] truncate text-muted-foreground"
                  title={req.reason}
                >
                  {req.reason}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(req.status)}>
                    {req.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-green-600">
                        <Check className="mr-2 h-4 w-4" /> Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <X className="mr-2 h-4 w-4" /> Reject
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
