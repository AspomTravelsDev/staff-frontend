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
  const [awardPoints, setAwardPoints] = useState("1.0");
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
      if (data.points !== undefined) {
        setAwardPoints(String(data.points));
      }
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
      const finalPoints = outcome === "Resolved (No Action)" ? 0 : parseFloat(awardPoints) || 1.0;
      await resolveComplianceOccurrence(
        issueId,
        outcome,
        parseFloat(deductionDays) || 0,
        finalPoints,
      );
      toast.success(`Disciplinary action recorded: ${outcome}`);
      fetchDetails();
    } catch (error) {
      console.error("Failed to resolve occurrence", error);
      toast.error("Failed to record disciplinary action");
    } finally {
      setResolving(false);
    }
  };

  if (!issue && loading) return null;

  const allowedOutcomes = isInsubordinationIssue
    ? [
        "Resolved (No Action)",
        "Give Occurrence",
        "Suspension",
        "Termination",
      ]
    : [
        "Resolved (No Action)",
        "Give Occurrence",
        "Verbal Warning",
        "Written Warning",
        "Final Written Warning",
        "Suspension",
        "Termination",
        "Warning (No Deduction)",
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
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-0.5">
                    Disciplinary Action & Outcome
                  </h4>
                  <p className="text-base font-semibold text-foreground">
                    {issue.outcome}
                  </p>
                </div>
                {issue.outcome !== "Resolved (No Action)" && (
                  <Badge variant="outline" className="border-blue-300 text-blue-800 dark:text-blue-200">
                    +{issue.points ?? 1.0} Occurrence{(issue.points ?? 1.0) === 1 ? "" : "s"}
                  </Badge>
                )}
              </div>

              {issue.outcome === "Resolved (No Action)" && (
                <p className="text-xs text-muted-foreground">
                  This query was resolved with no action taken. No occurrences were added to the Sanction Ladder.
                </p>
              )}

              {issue &&
                issue.deduction_days !== undefined &&
                issue.deduction_days > 0 && (
                  <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800/60">
                    <h4 className="font-semibold text-xs text-red-700 dark:text-red-300 mb-0.5">
                      Salary Deduction
                    </h4>
                    <p className="text-sm font-medium">
                      {issue.deduction_days} days deduction
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
              <div>
                <h4 className="font-semibold text-sm text-foreground">
                  Disciplinary Action & Resolution
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirming a disciplinary action awards occurrences onto the staff member&apos;s Sanction Grid.
                </p>
              </div>

              {isInsubordinationIssue && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                  <p className="font-semibold">Insubordination Case</p>
                  <p className="mt-0.5">
                    Under company policy, verified insubordination jumps directly to Step 4 (Suspension).
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="outcome" className="text-xs font-semibold">
                    Select Disciplinary Action
                  </Label>
                  <Select value={outcome} onValueChange={setOutcome}>
                    <SelectTrigger id="outcome">
                      <SelectValue placeholder="Choose action or outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Give Occurrence" className="font-semibold text-primary">
                        Give Occurrence (Disciplinary Action)
                      </SelectItem>
                      <SelectItem value="Resolved (No Action)">
                        Resolve with No Action (Dismiss Query)
                      </SelectItem>
                      {allowedOutcomes.includes("Verbal Warning") && (
                        <SelectItem value="Verbal Warning">
                          Step 1: Verbal Warning
                        </SelectItem>
                      )}
                      {allowedOutcomes.includes("Written Warning") && (
                        <SelectItem value="Written Warning">
                          Step 2: Written Warning
                        </SelectItem>
                      )}
                      {allowedOutcomes.includes("Final Written Warning") && (
                        <SelectItem value="Final Written Warning">
                          Step 3: Final Written Warning
                        </SelectItem>
                      )}
                      <SelectItem value="Suspension">
                        Step 4: Suspension
                      </SelectItem>
                      <SelectItem value="Termination">
                        Step 7: Termination
                      </SelectItem>
                      {allowedOutcomes.includes("Warning (No Deduction)") && (
                        <SelectItem value="Warning (No Deduction)">
                          Warning (no deduction)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {outcome && outcome !== "Resolved (No Action)" && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <Label htmlFor="award-points" className="text-xs">
                        Occurrences
                      </Label>
                      <Input
                        id="award-points"
                        type="number"
                        min="0.5"
                        max="20"
                        step="0.5"
                        value={awardPoints}
                        onChange={(e) => setAwardPoints(e.target.value)}
                        placeholder="1.0"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Standard: 1.0 (or 0.5 for Tardies / Reports)
                      </p>
                    </div>

                    {outcome === "Suspension" && (
                      <div className="space-y-1">
                        <Label htmlFor="deduction" className="text-xs">
                          Salary Deduction (Days)
                        </Label>
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
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    variant={outcome === "Resolved (No Action)" ? "outline" : "destructive"}
                    onClick={handleResolve}
                    disabled={resolving || !outcome}
                  >
                    {resolving
                      ? "Recording..."
                      : outcome === "Resolved (No Action)"
                      ? "Dismiss & Resolve Query"
                      : "Confirm Disciplinary Action"}
                  </Button>
                </div>
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
