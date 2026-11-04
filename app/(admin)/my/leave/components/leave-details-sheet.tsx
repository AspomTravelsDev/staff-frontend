"use client";

import { useEffect, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Clock, ShieldAlert, FileText, CalendarDays, Paperclip, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { getLeaveComments, postLeaveComment, type LeaveComment } from "@/lib/api/leave";
import { toast } from "sonner";

export interface DetailedLeave {
  id: string;
  type: string;
  days: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  employeeName?: string;
  department?: string;
  attachmentUrl?: string;
  handoverNoteUrl?: string;
  rejectionReason?: string;
  approvedByName?: string;
  approvedAt?: string;
}

interface LeaveDetailsSheetProps {
  leave: DetailedLeave | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaveDetailsSheet({
  leave,
  open,
  onOpenChange,
}: LeaveDetailsSheetProps) {
  const [comments, setComments] = useState<LeaveComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const forHr = Boolean(leave?.employeeName);

  useEffect(() => {
    if (!open || !leave?.id) return;
    let active = true;
    setCommentsLoading(true);
    getLeaveComments(leave.id, forHr).then((items) => { if (active) setComments(items); })
      .catch((error) => { if (active) toast.error(error instanceof Error ? error.message : "Could not load comments"); })
      .finally(() => { if (active) setCommentsLoading(false); });
    return () => { active = false; };
  }, [open, leave?.id, forHr]);

  const sendComment = async () => {
    if (!leave || !commentText.trim()) return;
    setSending(true);
    try {
      const added = await postLeaveComment(leave.id, commentText.trim(), forHr);
      setComments((current) => [...current, added]);
      setCommentText("");
      toast.success("Comment sent. The other party was emailed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send comment");
    } finally {
      setSending(false);
    }
  };

  if (!leave) return null;

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/25 border-green-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/25 border-amber-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/25 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground hover:bg-muted/80 border-muted";
    }
  };

  const formatDateString = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "PPP");
    } catch {
      return dateStr;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto px-4 pt-6">
        <SheetHeader className="space-y-1 mb-6 border-b pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold">Leave Details</SheetTitle>
            <Badge variant="outline" className={getStatusBadgeColor(leave.status)}>
              {leave.status}
            </Badge>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            View full details of the leave application
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Employee Section (HR / Admin view) */}
          {leave.employeeName && (
            <div className="bg-muted/50 dark:bg-muted/20 border rounded-lg p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Employee Information
              </h3>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{leave.employeeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {leave.department || "General"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Leave Parameters */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Request Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Leave Type</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="size-4 text-blue-500" />
                  {leave.type}
                </p>
              </div>

              <div className="border rounded-lg p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Clock className="size-4 text-orange-500" />
                  {leave.days} {leave.days === 1 ? "Day" : "Days"}
                </p>
              </div>

              <div className="border rounded-lg p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="size-4 text-purple-500" />
                  {formatDateString(leave.startDate)}
                </p>
              </div>

              <div className="border rounded-lg p-3 space-y-1">
                <p className="text-xs text-muted-foreground">Resumption Date</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="size-4 text-green-500" />
                  {formatDateString(leave.endDate)}
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-3 space-y-1.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <FileText className="size-4 text-gray-500" />
                Employee Reason
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 p-2.5 rounded border border-dashed">
                {leave.reason || "No reason provided."}
              </p>
            </div>

            {/* Optional Attachments Section */}
            {(leave.handoverNoteUrl || leave.attachmentUrl) && (
              <div className="border rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="size-3.5" />
                  Attached Documents
                </p>
                <div className="space-y-2 pt-1">
                  {leave.handoverNoteUrl && (
                    <div className="flex items-center justify-between bg-muted/40 p-2 rounded text-xs border">
                      <span className="font-medium flex items-center gap-1.5">
                        <FileText className="size-3.5 text-blue-500" /> Handover Note
                      </span>
                      <Button variant="outline" size="sm" asChild className="h-7 text-xs gap-1">
                        <a href={leave.handoverNoteUrl} target="_blank" rel="noopener noreferrer">
                          View File <ExternalLink className="size-3" />
                        </a>
                      </Button>
                    </div>
                  )}
                  {leave.attachmentUrl && (
                    <div className="flex items-center justify-between bg-muted/40 p-2 rounded text-xs border">
                      <span className="font-medium flex items-center gap-1.5">
                        <Paperclip className="size-3.5 text-green-500" /> Supporting Evidence
                      </span>
                      <Button variant="outline" size="sm" asChild className="h-7 text-xs gap-1">
                        <a href={leave.attachmentUrl} target="_blank" rel="noopener noreferrer">
                          View File <ExternalLink className="size-3" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Rejection / Decision Box */}
          {leave.status.toLowerCase() === "rejected" && (
            <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-500 font-semibold text-sm">
                <ShieldAlert className="size-4" />
                <span>Rejection Details</span>
              </div>
              <div className="space-y-1 bg-white dark:bg-zinc-900 border border-red-500/10 p-3 rounded-md">
                <p className="text-xs text-muted-foreground">Reason for Rejection</p>
                <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
                  {leave.rejectionReason || "No details provided."}
                </p>
              </div>
              {leave.approvedByName && (
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2 border-red-500/10">
                  <span>Rejected By: <strong>{leave.approvedByName}</strong></span>
                  {leave.approvedAt && (
                    <span>{formatDateString(leave.approvedAt)}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Approval Details */}
          {leave.status.toLowerCase() === "approved" && leave.approvedByName && (
            <div className="border border-green-500/20 bg-green-500/5 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-semibold text-sm">
                <ShieldAlert className="size-4 text-green-500" />
                <span>Approval Details</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Approved By: <strong>{leave.approvedByName}</strong></span>
                {leave.approvedAt && (
                  <span>{formatDateString(leave.approvedAt)}</span>
                )}
              </div>
            </div>
          )}

          <section className="space-y-3 border-t pt-5" aria-label="Leave discussion">
            <div className="flex items-center gap-2"><MessageCircle className="size-4" /><h3 className="text-sm font-semibold">Discussion</h3></div>
            <p className="text-xs text-muted-foreground">Comments are shared with the staff member and HR, and emailed to the other party.</p>
            <div className="max-h-56 space-y-3 overflow-y-auto rounded-md border p-3">
              {commentsLoading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading comments…</div> : comments.length === 0 ? <p className="text-sm text-muted-foreground">No comments yet.</p> : comments.map((comment) => (
                <article key={comment.id} className="space-y-1 rounded-md bg-muted/40 p-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs"><span className="font-medium">{comment.userName}{comment.isMine ? " (you)" : ""}</span><time className="text-muted-foreground">{comment.createdAt ? format(new Date(comment.createdAt), "d MMM, HH:mm") : ""}</time></div>
                  <p className="whitespace-pre-wrap text-sm">{comment.comment}</p>
                </article>
              ))}
            </div>
            <Textarea aria-label="Write a leave comment" value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Write a comment…" maxLength={5000} />
            <Button className="w-full" onClick={sendComment} disabled={sending || !commentText.trim()}>{sending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}Send comment</Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
