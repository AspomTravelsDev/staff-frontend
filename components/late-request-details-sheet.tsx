"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Clock,
  Calendar,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import {
  LatePermissionRequestItem,
  reviewLatePermissionRequest,
} from "@/lib/api/clock-in";
import { toProxiedImageUrl } from "@/lib/utils/image-url";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface LateRequestDetailsSheetProps {
  request: LatePermissionRequestItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewSuccess?: () => void;
  isHrReview?: boolean;
}

export function LateRequestDetailsSheet({
  request,
  open,
  onOpenChange,
  onReviewSuccess,
  isHrReview = true,
}: LateRequestDetailsSheetProps) {
  const [currentRequest, setCurrentRequest] = useState<LatePermissionRequestItem | null>(request);
  const [reviewerNote, setReviewerNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [isChangingDecision, setIsChangingDecision] = useState(false);

  useEffect(() => {
    setCurrentRequest(request);
    setReviewerNote(request?.reviewer_note || "");
    setIsChangingDecision(false);
  }, [request]);

  if (!currentRequest) return null;

  const formatDateSafely = (dateStr?: string, fmt = "EEEE, MMMM d, yyyy") => {
    if (!dateStr) return "N/A";
    try {
      return format(parseISO(dateStr), fmt);
    } catch {
      return dateStr;
    }
  };

  const handleReview = async (action: "approved" | "rejected") => {
    setActionLoading(true);
    try {
      const res = await reviewLatePermissionRequest(currentRequest.id, {
        status: action,
        reviewer_note: reviewerNote.trim() || undefined,
      });

      if (res.success) {
        toast.success(
          `Attendance request ${action === "approved" ? "approved" : "rejected"} successfully!`
        );
        if (res.data?.data) {
          setCurrentRequest(res.data.data);
        } else {
          setCurrentRequest({
            ...currentRequest,
            status: action,
            reviewer_note: reviewerNote.trim() || null,
            reviewed_at: new Date().toISOString(),
          });
        }
        setIsChangingDecision(false);
        if (onReviewSuccess) {
          onReviewSuccess();
        }
      } else {
        toast.error(res.error?.error || "Failed to process review");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to process review");
    } finally {
      setActionLoading(false);
    }
  };

  const status = currentRequest.status;
  const isPending = status === "pending";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const isCancelled = status === "cancelled";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col overflow-y-auto bg-background">
        {/* TOP STATUS COLOR ACCENT */}
        <div
          className={`h-2.5 w-full shrink-0 ${
            isApproved
              ? "bg-emerald-500"
              : isRejected
              ? "bg-red-500"
              : isCancelled
              ? "bg-slate-400"
              : "bg-amber-500"
          }`}
        />

        <div className="p-6 space-y-6 flex-1">
          {/* HEADER */}
          <SheetHeader className="p-0 space-y-2 border-b pb-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
                REQUEST #LPR-{currentRequest.id}
              </span>
              <Badge
                variant="outline"
                className={`text-xs font-bold px-2.5 py-0.5 border capitalize ${
                  isApproved
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                    : isRejected
                    ? "bg-red-500/15 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800"
                    : isCancelled
                    ? "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 animate-pulse"
                }`}
              >
                {isApproved && <CheckCircle2 className="size-3 mr-1 inline" />}
                {isRejected && <XCircle className="size-3 mr-1 inline" />}
                {isPending && <Clock className="size-3 mr-1 inline" />}
                {status}
              </Badge>
            </div>
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              Late Permission Request
            </SheetTitle>
            <SheetDescription className="text-xs">
              Submitted on {formatDateSafely(currentRequest.created_at, "MMM d, yyyy 'at' h:mm a")}
            </SheetDescription>
          </SheetHeader>

          {/* STAFF PROFILE CARD */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User className="size-3.5 text-primary" />
              Staff Member Details
            </div>
            <div className="flex items-start gap-3.5">
              <Avatar className="size-12 border ring-2 ring-primary/10 shrink-0">
                <AvatarImage
                  src={toProxiedImageUrl(currentRequest.user?.image_url)}
                  alt={currentRequest.user?.name || "Staff"}
                />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {getInitials(currentRequest.user?.name || "U")}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {currentRequest.user?.name || `Staff #${currentRequest.user_id}`}
                  </h3>
                  {currentRequest.user?.staff_id && (
                    <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-4">
                      {currentRequest.user.staff_id}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {currentRequest.user?.email && (
                    <a
                      href={`mailto:${currentRequest.user.email}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Mail className="size-3 text-muted-foreground" />
                      <span>{currentRequest.user.email}</span>
                    </a>
                  )}
                  {currentRequest.user?.phone && (
                    <a
                      href={`tel:${currentRequest.user.phone}`}
                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Phone className="size-3" />
                      <span>{currentRequest.user.phone}</span>
                    </a>
                  )}
                </div>

                {(currentRequest.user?.department || currentRequest.user?.role) && (
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                    {currentRequest.user?.department && (
                      <span className="inline-flex items-center gap-1 bg-background border px-2 py-0.5 rounded-md font-medium">
                        <Building2 className="size-3 text-muted-foreground" />
                        {currentRequest.user.department}
                      </span>
                    )}
                    {currentRequest.user?.role && (
                      <span className="inline-flex items-center gap-1 bg-background border px-2 py-0.5 rounded-md capitalize font-medium">
                        <Briefcase className="size-3 text-muted-foreground" />
                        {currentRequest.user.role.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TIMING & SCHEDULE GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border bg-card p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-indigo-500" />
                Target Date
              </span>
              <p className="text-sm font-bold text-foreground">
                {formatDateSafely(currentRequest.request_date, "EEEE, MMMM d, yyyy")}
              </p>
              <span className="text-[11px] font-mono text-muted-foreground">
                {currentRequest.request_date}
              </span>
            </div>

            <div className="rounded-xl border bg-card p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-amber-500" />
                Request time
              </span>
              <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                {currentRequest.request_type === "half_day" || currentRequest.request_type === "early_departure" ? `Half day · ${currentRequest.expected_clock_out_time || "time not specified"}` : `Late arrival · ${currentRequest.expected_arrival_time || "time not specified"}`}
              </p>
              <span className="text-[10px] text-muted-foreground">
                Notice sent in advance to HR
              </span>
            </div>
          </div>

          {/* REASON FOR LATENESS */}
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                Reason for Late Arrival
              </span>
              <span className="text-[10px] text-muted-foreground">Full statement</span>
            </div>
            <div className="p-3.5 rounded-lg bg-muted/40 border border-muted text-xs leading-relaxed text-foreground whitespace-pre-wrap">
              {currentRequest.reason || "No reason provided."}
            </div>
          </div>

          {/* LINKED CLOCK-IN RECORD (IF ANY) */}
          <div className="rounded-xl border bg-card p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" />
                Attendance & Clock-In Status
              </span>
              {currentRequest.clock_in ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-300 text-[10px]">
                  Record Linked
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Pending Check-In
                </Badge>
              )}
            </div>

            {currentRequest.clock_in ? (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Clocked In</span>
                    <span className="font-semibold">
                      {formatDateSafely(currentRequest.clock_in.clock_in_at, "h:mm a")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Clocked Out</span>
                    <span className="font-semibold">
                      {currentRequest.clock_in.clock_out_at
                        ? formatDateSafely(currentRequest.clock_in.clock_out_at, "h:mm a")
                        : "Active / In-progress"}
                    </span>
                  </div>
                  {currentRequest.clock_in.office_name && (
                    <div className="col-span-2 pt-1 border-t text-[11px] flex items-center gap-1 text-muted-foreground">
                      <MapPin className="size-3 text-primary" />
                      <span>{currentRequest.clock_in.office_name}</span>
                    </div>
                  )}
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] flex items-center gap-2">
                  <ShieldCheck className="size-4 shrink-0" />
                  <span>
                    Clock-in record is linked with <strong>Late (Permitted)</strong> status. Compliance penalty bypassed.
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border">
                Staff member has not clocked in for this target date yet. If approved, the attendance penalty will be automatically waived upon clock-in.
              </p>
            )}
          </div>

          {/* AUDIT INFO: REVIEW DETAILS */}
          {!isPending && (
            <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" />
                Review Decision Details
              </span>

              <div className="text-xs space-y-1.5">
                {currentRequest.reviewer && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Reviewed by:</span>
                    <span className="font-semibold text-foreground">
                      {currentRequest.reviewer.name} ({currentRequest.reviewer.email})
                    </span>
                  </div>
                )}
                {currentRequest.reviewed_at && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Reviewed at:</span>
                    <span className="font-mono">
                      {formatDateSafely(currentRequest.reviewed_at, "MMM d, yyyy • h:mm a")}
                    </span>
                  </div>
                )}
                {currentRequest.reviewer_note && (
                  <div className="pt-2 border-t mt-2">
                    <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Reviewer Note:
                    </span>
                    <p className="p-2.5 rounded-lg bg-background border text-xs text-foreground italic">
                      &ldquo;{currentRequest.reviewer_note}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* HR REVIEW ACTIONS */}
          {isHrReview && !isCancelled && (
            <div className="rounded-xl border p-4 space-y-3 bg-card shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-indigo-600 dark:text-indigo-400" />
                  {isPending ? "Review & Decision" : "Update Decision"}
                </span>
                {!isPending && !isChangingDecision && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChangingDecision(true)}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                  >
                    <RotateCcw className="size-3" />
                    Change Decision
                  </Button>
                )}
              </div>

              {(isPending || isChangingDecision) && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      Reviewer Note (Optional for staff notice)
                    </label>
                    <Textarea
                      rows={2}
                      placeholder="Add an optional comment or explanation for the staff member..."
                      value={reviewerNote}
                      onChange={(e) => setReviewerNote(e.target.value)}
                      className="text-xs resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {isChangingDecision && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => setIsChangingDecision(false)}
                        className="text-xs h-8"
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      disabled={actionLoading}
                      onClick={() => handleReview("rejected")}
                      className="text-xs h-8 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/40 gap-1"
                    >
                      <XCircle className="size-3.5" />
                      {actionLoading ? "Processing..." : "Reject Request"}
                    </Button>
                    <Button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReview("approved")}
                      className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    >
                      <CheckCircle2 className="size-3.5" />
                      {actionLoading ? "Processing..." : "Approve Request"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
