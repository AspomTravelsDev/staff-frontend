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
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LeaveRequest, approveLeaveRequest, rejectLeaveRequest } from "@/lib/api/leave";
import { LeaveDetailsSheet } from "../../../my/leave/components/leave-details-sheet";

interface LeaveTableProps {
  requests: LeaveRequest[];
}

export function LeaveTable({ requests }: LeaveTableProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      await approveLeaveRequest(id);
      toast.success("Leave request approved successfully.");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve request.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectId) return;
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }
    setLoadingId(rejectId);
    try {
      await rejectLeaveRequest(rejectId, rejectionReason);
      toast.success("Leave request rejected successfully.");
      setRejectOpen(false);
      setRejectionReason("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject request.");
    } finally {
      setLoadingId(null);
    }
  };

  const openRejectDialog = (id: string) => {
    setRejectId(id);
    setRejectionReason("");
    setRejectOpen(true);
  };

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
                       <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedLeave(req);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                       <DropdownMenuItem
                        className="text-green-600 cursor-pointer"
                        disabled={loadingId !== null || req.status !== "Pending"}
                        onClick={() => handleApprove(req.id)}
                      >
                        <Check className="mr-2 h-4 w-4" /> {loadingId === req.id ? "Processing..." : "Approve"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive cursor-pointer"
                        disabled={loadingId !== null || req.status !== "Pending"}
                        onClick={() => openRejectDialog(req.id)}
                      >
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

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave request. This will be visible to the employee.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Reason for Rejection</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Enter rejection details..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRejectOpen(false)} disabled={loadingId !== null}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={loadingId !== null}>
                {loadingId !== null && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reject Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
       </Dialog>

      <LeaveDetailsSheet
        leave={selectedLeave ? {
          id: selectedLeave.id,
          type: selectedLeave.type,
          days: selectedLeave.days,
          startDate: selectedLeave.startDate,
          endDate: selectedLeave.endDate,
          reason: selectedLeave.reason,
          status: selectedLeave.status,
          employeeName: selectedLeave.employeeName,
          department: selectedLeave.department,
          rejectionReason: selectedLeave.rejectionReason,
          approvedByName: selectedLeave.approvedByName,
          approvedAt: selectedLeave.approvedAt,
        } : null}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
