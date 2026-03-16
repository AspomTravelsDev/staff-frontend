"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ComplianceIssue,
  ComplianceComment,
  addComplianceComment,
  getComplianceDetails,
  resolveComplianceOccurrence,
} from "@/lib/api/compliance";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { useUser } from "@/providers/user-provider";

interface ComplianceDetailsDialogProps {
  issueId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
}

export function ComplianceDetailsDialog({
  issueId,
  open,
  onOpenChange,
  isAdmin = false,
}: ComplianceDetailsDialogProps) {
  const { user: currentUser } = useUser();
  const [issue, setIssue] = useState<ComplianceIssue | null>(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [deductionDays, setDeductionDays] = useState("0");
  const [resolving, setResolving] = useState(false);
  const isInsubordinationIssue = (issue?.type || "")
    .toLowerCase()
    .includes("insubordination");

  useEffect(() => {
    if (open && issueId) {
      fetchDetails();
    }
  }, [open, issueId]);

  const fetchDetails = async () => {
    if (!issueId) return;
    setLoading(true);
    try {
      const data = await getComplianceDetails(issueId);
      setIssue(data);
    } catch (error) {
      console.error("Failed to fetch compliance details", error);
      toast.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!issueId || !comment.trim()) return;
    setSubmittingComment(true);
    try {
      await addComplianceComment(issueId, comment);
      setComment("");
      fetchDetails();
      toast.success("Comment added");
    } catch (error) {
      console.error("Failed to add comment", error);
      toast.error("Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleResolve = async () => {
    if (!issueId || !outcome) return;
    setResolving(true);
    try {
      await resolveComplianceOccurrence(
        issueId,
        outcome,
        parseFloat(deductionDays) || 0,
      );
      toast.success(`Occurrence closed with outcome: ${outcome}`);
      fetchDetails();
    } catch (error) {
      console.error("Failed to resolve occurrence", error);
      toast.error("Failed to close occurrence");
    } finally {
      setResolving(false);
    }
  };

  if (!issue && loading) return null;

  const allowedOutcomes = isInsubordinationIssue
    ? ["Resolved (No Action)", "Suspension", "Termination"]
    : [
        "Resolved (No Action)",
        "Warning (No Deduction)",
        "Suspension",
        "Termination",
      ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge
              variant={issue?.status === "open" ? "destructive" : "secondary"}
            >
              {issue?.status?.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {issue?.occurrence_date &&
                format(new Date(issue.occurrence_date), "PPP p")}
            </span>
          </div>
          <DialogTitle className="text-xl">
            {issue?.type}: {issue?.user_name || issue?.user?.name}
          </DialogTitle>
          <DialogDescription>
            {issue?.user_department || issue?.user?.department} Department
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Description */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Query Description</h4>
            <p className="text-sm whitespace-pre-wrap">{issue?.description}</p>
          </div>

          {/* Outcome Info if Closed */}
          {issue?.status === "closed" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 space-y-2">
              <div>
                <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-1">
                  Final Outcome
                </h4>
                <p className="text-sm font-medium">{issue.outcome}</p>
              </div>
              {issue &&
                issue.deduction_days !== undefined &&
                issue.deduction_days > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-red-700 dark:text-red-300 mb-1">
                      Salary Deduction
                    </h4>
                    <p className="text-sm font-medium">
                      {issue.deduction_days} days
                    </p>
                  </div>
                )}
            </div>
          )}

          {/* Comments Thread */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Communication Thread</h4>
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {issue?.comments?.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No comments yet.
                </p>
              ) : (
                issue?.comments?.map((c) => {
                  const isMine = c.user_id === currentUser?.id;
                  return (
                    <div
                      key={c.id}
                      className={`flex gap-3 ${isMine ? "flex-row-reverse" : ""}`}
                    >
                      {!isMine && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={c.user?.image_url} />
                          <AvatarFallback>
                            {c.user?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`flex flex-col gap-1 max-w-[80%] ${isMine ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-2">
                          {!isMine && (
                            <span className="text-[10px] font-semibold">
                              {c.user?.name}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(c.created_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <div
                          className={`p-3 rounded-2xl text-sm ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                              : "bg-muted rounded-tl-none"
                          }`}
                        >
                          {c.comment}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Reply Section */}
          {issue?.status === "open" && (
            <div className="space-y-3">
              <Textarea
                placeholder="Type your response or message here..."
                value={comment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setComment(e.target.value)
                }
                className="min-h-[80px]"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={submittingComment || !comment.trim()}
                >
                  {submittingComment ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </div>
          )}

          {/* Admin Actions */}
          {isAdmin && issue?.status === "open" && (
            <div className="pt-4 border-t space-y-4">
              <h4 className="font-semibold text-sm text-destructive">
                Resolve & Close
              </h4>
              {isInsubordinationIssue ? (
                <p className="text-xs text-amber-700">
                  Insubordination case: allowed outcomes are No Action,
                  Suspension, or Termination.
                </p>
              ) : null}
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="outcome">Final Outcome</Label>
                  <Select value={outcome} onValueChange={setOutcome}>
                    <SelectTrigger id="outcome">
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Resolved (No Action)">
                        Resolve with no Action
                      </SelectItem>
                      {allowedOutcomes.includes("Warning (No Deduction)") ? (
                        <SelectItem value="Warning (No Deduction)">
                          Warning (no deduction)
                        </SelectItem>
                      ) : null}
                      <SelectItem value="Suspension">Suspension</SelectItem>
                      <SelectItem value="Termination">Termination</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {outcome === "Suspension" && (
                  <div className="w-[120px] space-y-2">
                    <Label htmlFor="deduction">Deduction (Days)</Label>
                    <Input
                      id="deduction"
                      type="number"
                      min="0"
                      step="0.5"
                      value={deductionDays}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setDeductionDays(e.target.value)
                      }
                      placeholder="Days"
                    />
                  </div>
                )}
                <Button
                  variant="destructive"
                  onClick={handleResolve}
                  disabled={resolving || !outcome}
                >
                  {resolving ? "Closing..." : "Resolve Occurrence"}
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close Window
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
