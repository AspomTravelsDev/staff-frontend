"use client";

import React, { useEffect, useState } from "react";
import {
  getLatePermissionReviewQueue,
  reviewLatePermissionRequest,
  LatePermissionRequestItem,
} from "@/lib/api/clock-in";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Clock, CheckCircle2, XCircle, Filter, Calendar, User, Search, RefreshCw } from "lucide-react";

export default function HrLateRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<LatePermissionRequestItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LatePermissionRequestItem | null>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected">("approved");
  const [reviewerNote, setReviewerNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const filterStatus = statusFilter === "all" ? undefined : statusFilter;
      const res = await getLatePermissionReviewQueue({ status: filterStatus });
      if (res.success && res.data.data?.data) {
        setRequests(res.data.data.data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      toast.error("Failed to load late permission requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  const openReviewModal = (req: LatePermissionRequestItem, action: "approved" | "rejected") => {
    setSelectedRequest(req);
    setActionType(action);
    setReviewerNote("");
    setReviewModalOpen(true);
  };

  const handleConfirmReview = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);

    try {
      const res = await reviewLatePermissionRequest(selectedRequest.id, {
        status: actionType,
        reviewer_note: reviewerNote.trim() || undefined,
      });

      if (res.success) {
        toast.success(`Request ${actionType === "approved" ? "approved" : "rejected"} successfully!`);
        setReviewModalOpen(false);
        fetchQueue();
      } else {
        toast.error(res.error?.error || "Failed to submit review");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process review");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const name = r.user?.name || "";
    const email = r.user?.email || "";
    const reason = r.reason || "";
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query) || reason.toLowerCase().includes(query);
  });

  return (
    <div className="w-full space-y-6 p-4 pt-0">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="size-6 text-indigo-600 dark:text-indigo-400" />
            Late Permission Requests Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve staff requests to be late. Approved requests assign "Late (Permitted)" status and bypass compliance warnings.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchQueue}
          disabled={loading}
          className="gap-1.5 text-xs w-fit"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Queue
        </Button>
      </div>

      {/* FILTER CONTROLS */}
      <Card className="shadow-2xs">
        <CardContent className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border w-fit">
            {(["pending", "approved", "rejected", "all"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md capitalize transition-all ${
                  statusFilter === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Search staff, email, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* REQUESTS TABLE */}
      <Card className="shadow-2xs border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Target Date</TableHead>
                <TableHead>Expected Time</TableHead>
                <TableHead className="max-w-[250px]">Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                    Loading requests...
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                    No late permission requests found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => {
                  return (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground">
                            {req.user?.name || `User #${req.user_id}`}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {req.user?.email || ""}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {req.request_date}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {req.expected_arrival_time}
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <p className="text-xs text-muted-foreground line-clamp-2" title={req.reason}>
                          {req.reason}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold px-2 py-0.5 border ${
                            req.status === "approved"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                              : req.status === "rejected"
                              ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                          }`}
                        >
                          {req.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {req.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => openReviewModal(req, "approved")}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 px-2.5"
                            >
                              <CheckCircle2 className="size-3.5" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openReviewModal(req, "rejected")}
                              className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/40 gap-1 px-2.5"
                            >
                              <XCircle className="size-3.5" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            {req.reviewer?.name ? `Reviewed by ${req.reviewer.name}` : "Reviewed"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* REVIEW CONFIRMATION MODAL */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {actionType === "approved" ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : (
                <XCircle className="size-5 text-red-600" />
              )}
              {actionType === "approved" ? "Approve" : "Reject"} Late Permission
            </DialogTitle>
            <DialogDescription className="text-xs">
              {actionType === "approved"
                ? `Confirm approving late permission for ${selectedRequest?.user?.name || "staff"} on ${selectedRequest?.request_date}.`
                : `Reject late permission request for ${selectedRequest?.user?.name || "staff"}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="p-2.5 rounded-lg bg-muted border space-y-1 text-xs">
              <div><strong>Expected Arrival:</strong> {selectedRequest?.expected_arrival_time}</div>
              <div><strong>Reason:</strong> {selectedRequest?.reason}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Reviewer Note (Optional)</label>
              <Textarea
                rows={2}
                placeholder="Add an optional comment for the staff member..."
                value={reviewerNote}
                onChange={(e) => setReviewerNote(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReviewModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={actionLoading}
              onClick={handleConfirmReview}
              size="sm"
              className={`text-xs gap-1.5 ${
                actionType === "approved"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {actionLoading ? "Processing..." : `Confirm ${actionType === "approved" ? "Approval" : "Rejection"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
