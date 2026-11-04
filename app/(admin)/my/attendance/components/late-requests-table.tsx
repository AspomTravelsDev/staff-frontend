"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  cancelLatePermissionRequest,
  LatePermissionRequestItem,
} from "@/lib/api/clock-in";
import { formatLagosDate } from "@/lib/utils/attendance";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Ban,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { LateRequestDetailsSheet } from "@/components/late-request-details-sheet";

interface LateRequestsTableProps {
  requests: LatePermissionRequestItem[];
}

export function LateRequestsTable({ requests }: LateRequestsTableProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [items, setItems] = useState<LatePermissionRequestItem[]>(requests);
  const [requestToCancel, setRequestToCancel] = useState<LatePermissionRequestItem | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedDetailRequest, setSelectedDetailRequest] = useState<LatePermissionRequestItem | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  useEffect(() => {
    setItems(requests);
  }, [requests]);

  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center bg-card/50">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="rounded-full bg-muted p-3">
            <CalendarClock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold">No Late Requests</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            You haven&apos;t submitted any attendance requests yet. Use &ldquo;Request attendance permission&rdquo; to request a half day or late arrival.
          </p>
        </div>
      </div>
    );
  }

  const totalRecords = items.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedRequests = items.slice(startIndex, startIndex + pageSize);

  const handlePageSizeChange = (val: string) => {
    setPageSize(Number(val));
    setCurrentPage(1);
  };

  const handleConfirmCancel = async () => {
    if (!requestToCancel) return;
    setIsCancelling(true);

    try {
      const res = await cancelLatePermissionRequest(requestToCancel.id);
      if (res.success) {
        toast.success("Late permission request cancelled successfully");
        // Optimistically update status in local list
        setItems((prev) =>
          prev.map((item) =>
            item.id === requestToCancel.id
              ? { ...item, status: "cancelled" }
              : item
          )
        );
        setRequestToCancel(null);
        router.refresh();
      } else {
        toast.error(res.error?.error || "Failed to cancel request");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred while cancelling");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request Date</TableHead>
              <TableHead>Expected Arrival</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reviewer Notes</TableHead>
              <TableHead>Submitted On</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRequests.map((request) => {
              return (
                <TableRow
                  key={request.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    setSelectedDetailRequest(request);
                    setDetailSheetOpen(true);
                  }}
                >
                  <TableCell className="font-medium whitespace-nowrap">
                    {formatLagosDate(request.request_date)}
                  </TableCell>
                  
                  <TableCell className="whitespace-nowrap font-mono text-sm">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{request.request_type === "half_day" || request.request_type === "early_departure" ? `Half day${request.expected_clock_out_time ? ` · ${request.expected_clock_out_time}` : ""}` : `Late arrival${request.expected_arrival_time ? ` · ${request.expected_arrival_time}` : ""}`}</span>
                    </div>
                  </TableCell>

                  <TableCell className="max-w-[250px]">
                    <p className="text-sm text-foreground line-clamp-2" title={request.reason}>
                      {request.reason}
                    </p>
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    {request.status === "pending" && (
                      <Badge
                        variant="outline"
                        className="border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-semibold gap-1"
                      >
                        <Clock className="h-3 w-3 animate-pulse text-amber-600 dark:text-amber-400" />
                        Pending Review
                      </Badge>
                    )}
                    {request.status === "approved" && (
                      <Badge
                        variant="outline"
                        className="border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-semibold gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        Approved
                      </Badge>
                    )}
                    {request.status === "rejected" && (
                      <Badge
                        variant="outline"
                        className="border-red-300 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 font-semibold gap-1"
                      >
                        <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                        Rejected
                      </Badge>
                    )}
                    {request.status === "cancelled" && (
                      <Badge
                        variant="outline"
                        className="border-slate-300 bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700 font-semibold gap-1"
                      >
                        <Ban className="h-3 w-3 text-slate-500" />
                        Cancelled
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="max-w-[220px]">
                    {request.reviewer_note ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground italic line-clamp-2" title={request.reviewer_note}>
                          &ldquo;{request.reviewer_note}&rdquo;
                        </span>
                        {request.reviewer?.name && (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            — {request.reviewer.name}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground opacity-60">—</span>
                    )}
                  </TableCell>

                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatLagosDate(request.created_at)}
                  </TableCell>

                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDetailRequest(request);
                          setDetailSheetOpen(true);
                        }}
                        className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                        title="View full details in slide-over sheet"
                      >
                        <Eye className="size-3.5" />
                        <span className="hidden sm:inline">Details</span>
                      </Button>
                      {request.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRequestToCancel(request);
                          }}
                          className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900 gap-1 px-2.5"
                          title="Cancel this pending request if you arrived early or no longer need it"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-foreground">{startIndex + 1}</strong> to{" "}
            <strong className="text-foreground">
              {Math.min(startIndex + pageSize, totalRecords)}
            </strong>{" "}
            of <strong className="text-foreground">{totalRecords}</strong> requests
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>Rows per page:</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous Page</span>
            </Button>
            <span className="px-2 font-medium text-foreground">
              Page {validPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next Page</span>
            </Button>
          </div>
        </div>
      </div>

      {/* CANCEL CONFIRMATION ALERT DIALOG */}
      <AlertDialog
        open={!!requestToCancel}
        onOpenChange={(open) => {
          if (!open && !isCancelling) setRequestToCancel(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-600" />
              Cancel attendance request?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              Are you sure you want to cancel your attendance request for{" "}
              <strong className="text-foreground">
                {requestToCancel ? formatLagosDate(requestToCancel.request_date) : ""}
              </strong>
              ?
              <br />
              <br />
              This will withdraw your request. Cancel if you no longer need this attendance permission. HR will not need to review this request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling} className="text-xs">
              Keep Request
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmCancel();
              }}
              disabled={isCancelling}
              className="text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              {isCancelling ? "Cancelling..." : "Yes, Cancel Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* FULL DETAILS SLIDE-OVER SHEET */}
      <LateRequestDetailsSheet
        request={selectedDetailRequest}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        isHrReview={false}
      />
    </div>
  );
}
