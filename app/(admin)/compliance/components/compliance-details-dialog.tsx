"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useComplianceQuery } from "@/lib/api/hooks/use-compliance";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { QueryEvidence } from "./query-evidence";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ComplianceIssue,
  addComplianceComment,
  resolveComplianceOccurrence,
  closeComplianceIssue,
  saveComplianceCorrection,
  completeComplianceCorrection,
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
import type { CorrectionPlan, ComplianceDecisionOptions } from "@/lib/types/compliance";
import { DecisionPolicyFields } from "./decision-policy-fields";
import { CorrectionPlanFields } from "./correction-plan-fields";
import { lagosDateKey } from "@/lib/utils/employee-headcount";
import { complianceOutcomeAmounts, defaultSuspensionDays, isSuspensionOutcome } from "@/lib/compliance-outcome";

import { useUser } from "@/providers/user-provider";

interface ComplianceDetailsDialogProps {
  issueId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
  mode?: "response" | "details" | "outcome";
  onChooseOutcome?: () => void;
}

export function ComplianceDetailsDialog(props: ComplianceDetailsDialogProps) {
  const query = useComplianceQuery(props.issueId, props.open);
  if (!props.open) return null;
  if (!query.data || !query.isFetchedAfterMount || query.isError) {
    const Surface = props.mode === "details" ? Sheet : Dialog;
    const Content = props.mode === "details" ? SheetContent : DialogContent;
    const Header = props.mode === "details" ? SheetHeader : DialogHeader;
    const Title = props.mode === "details" ? SheetTitle : DialogTitle;
    const Description = props.mode === "details" ? SheetDescription : DialogDescription;
    return <Surface open onOpenChange={props.onOpenChange}>
      <Content className={props.mode === "details" ? "w-full gap-0 p-0 sm:max-w-2xl" : "sm:max-w-xl"}>
        <Header className={props.mode === "details" ? "border-b px-6 py-5 pr-12" : "pr-6"}><Title>{props.mode === "outcome" ? "Choose outcome" : props.mode === "details" ? "Query details" : "Query responses"}</Title><Description>{query.isError ? "The query could not be loaded. Please try again." : "Loading the latest query details…"}</Description></Header>
        {query.isError ? <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>{query.isFetching ? "Retrying…" : "Try again"}</Button> : <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading query…</div>}
      </Content>

      
    </Surface>;
  }
  return <ComplianceQueryWorkspace key={props.issueId + (props.mode ?? "response")} {...props} issue={query.data} onReload={async () => { await query.refetch(); }} />;
}

function ComplianceQueryWorkspace({
  issueId,
  open,
  onOpenChange,
  isAdmin = false,
  mode = "response",
  onChooseOutcome,
  issue,
  onReload: fetchDetails,
}: ComplianceDetailsDialogProps & { issue: ComplianceIssue; onReload: () => Promise<void> }) {
  const router = useRouter();
  const Surface = mode === "details" ? Sheet : Dialog;
  const Content = mode === "details" ? SheetContent : DialogContent;
  const Header = mode === "details" ? SheetHeader : DialogHeader;
  const Title = mode === "details" ? SheetTitle : DialogTitle;
  const Description = mode === "details" ? SheetDescription : DialogDescription;
  const Footer = mode === "details" ? SheetFooter : DialogFooter;
  const { user: currentUser } = useUser();
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [evidence, setEvidence] = useState(issue.evidence || "");
  const [decisionNotes, setDecisionNotes] = useState(issue.decision_notes || "");
  const [outcome, setOutcome] = useState("");
  const [awardPoints, setAwardPoints] = useState(String(issue.points ?? 1));
  const [suspensionDays, setSuspensionDays] = useState("");
  const [resolving, setResolving] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [detailCloseReason, setDetailCloseReason] = useState(issue.decision_notes || "");
  const [closingQuery, setClosingQuery] = useState(false);
  const [correctionRequired, setCorrectionRequired] = useState(Boolean(issue.correction_due_date));
  const [correctionPlan, setCorrectionPlan] = useState<CorrectionPlan>({ correction_notes: issue.correction_notes || "", correction_due_date: issue.correction_due_date || "", correction_reminder_days: issue.correction_reminder_days ?? 2 });
  const [completionNotes, setCompletionNotes] = useState("");
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [decisionOptions, setDecisionOptions] = useState<ComplianceDecisionOptions>({ client_error_level: issue.client_error_level, prior_coaching_id: issue.prior_coaching_id, related_incident_id: issue.related_incident_id, separate_breach_reason: issue.separate_breach_reason || "" });
  const suspension = isSuspensionOutcome(outcome);
  const noAction = outcome === "Resolved (No Action)";
  const amounts = complianceOutcomeAmounts(outcome, Number(awardPoints), Number(suspensionDays));
  function chooseOutcome(next: string) {
    setOutcome(next);
    setSuspensionDays(defaultSuspensionDays(next));
  }

  const handleAddComment = async () => {
    if (!issueId || !comment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await addComplianceComment(issueId, comment);
      if (!res.success) {
        toast.error(res.error || "Failed to post comment");
        return;
      }
      setComment("");
      fetchDetails();
      toast.success("Comment added");
    } catch (error: unknown) {
      console.error("Failed to add comment", error);
      toast.error(error instanceof Error ? error.message : "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleResolve = async () => {
    if (!issueId || !outcome || resolving) return;
    if (correctionRequired && !validCorrection()) return;
    if (!decisionNotes.trim() || (outcome !== "Resolved (No Action)" && !evidence.trim())) {
      toast.error("Record the decision reason and verify supporting evidence before confirming.");
      return;
    }
    if (!noAction && !suspension && (!awardPoints.trim() || !Number.isFinite(Number(awardPoints)) || Number(awardPoints) < 0 || Number(awardPoints) > 20)) {
      toast.error("Enter an occurrence value between 0 and 20."); return;
    }
    if (suspension && (!suspensionDays.trim() || !Number.isFinite(amounts.deductionDays) || amounts.deductionDays <= 0)) {
      toast.error("Enter the suspension duration in working days."); return;
    }
    setResolving(true);
    try {
      const res = await resolveComplianceOccurrence(
        issueId,
        outcome,
        amounts.deductionDays,
        amounts.points,
        evidence,
        decisionNotes,
        correctionRequired ? correctionPlan : undefined,
        decisionOptions,
      );
      if (!res.success) {
        toast.error(res.error || "Failed to record query outcome");
        return;
      }
      toast.success(`Outcome recorded: ${outcome}`);
      router.refresh();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Unable to resolve query", error);
      toast.error(error instanceof Error ? error.message : "Failed to record query outcome");
    } finally {
      setResolving(false);
    }
  };

  function validCorrection() {
    if (!correctionPlan.correction_notes.trim() || !correctionPlan.correction_due_date || correctionPlan.correction_due_date < lagosDateKey(new Date()) || !Number.isInteger(correctionPlan.correction_reminder_days) || correctionPlan.correction_reminder_days < 0 || correctionPlan.correction_reminder_days > 30) {
      toast.error("Enter the correction required, a deadline of today or later, and a reminder between 0 and 30 days.");
      return false;
    }
    return true;
  }

  async function handleCorrection(complete: boolean) {
    if (!issueId || savingCorrection) return;
    if (complete ? !completionNotes.trim() : !validCorrection()) {
      if (complete) toast.error("Record how the correction was verified.");
      return;
    }
    setSavingCorrection(true);
    try {
      const result = complete ? await completeComplianceCorrection(issueId, completionNotes.trim()) : await saveComplianceCorrection(issueId, correctionPlan);
      if (!result.success) { toast.error(result.error || "Could not update correction"); return; }
      toast.success(complete ? "Correction verified and completed" : "Correction timeline saved");
      await fetchDetails();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update correction");
    } finally { setSavingCorrection(false); }
  }



  return (
    <Surface open={open} onOpenChange={onOpenChange}>
      <Content className={mode === "details" ? "w-full overflow-y-auto sm:max-w-2xl gap-0 p-0" : "sm:max-w-150 max-h-[90vh] overflow-y-auto"}>
        <Header>
          <div className="mb-2 flex flex-wrap items-center gap-2 pr-6">
            <Badge
              variant="outline"
              className={issue.status === "open" ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300" : "bg-muted/50"}
            >
              {issue.status === "open" ? "Awaiting review" : "Closed"}
            </Badge>
            <span className="ml-auto text-xs text-muted-foreground">
              {issue?.occurrence_date &&
                format(new Date(issue.occurrence_date), "PPP p")}
            </span>
          </div>
          <Title className="text-xl">
            {mode === "outcome" ? "Choose outcome" : mode === "details" ? "Query details" : "Responses"} · {issue?.user_name || issue?.user?.name}
          </Title>
          <Description>
            {issue?.type} · {issue?.user_department || issue?.user?.department || "Department not recorded"}
          </Description>
        </Header>

        <div className={mode === "details" ? "space-y-6 px-6 py-5" : "space-y-6 py-4"}>
          {mode === "outcome" ? <details className="space-y-3 border-b pb-4 text-sm"><summary className="cursor-pointer font-medium">Query and evidence</summary><p className="whitespace-pre-wrap break-words text-muted-foreground">{issue.description}</p><QueryEvidence issue={issue} /></details> : <><div className="space-y-2 border-b pb-4">
            <h4 className="font-semibold text-sm mb-2">Query Description</h4>
            <p className="text-sm whitespace-pre-wrap">{issue?.description}</p>
          </div>

          <QueryEvidence issue={issue} /></>}
          {mode === "details" && <dl className="grid grid-cols-2 gap-4 border-b pb-4 text-sm"><div><dt className="text-muted-foreground">Raised by</dt><dd>{issue.creator?.name || "Not recorded"}</dd></div><div><dt className="text-muted-foreground">Reported severity</dt><dd className="capitalize">{issue.severity}</dd></div><div><dt className="text-muted-foreground">Query reference</dt><dd className="break-all">{issue.id}</dd></div><div><dt className="text-muted-foreground">Status</dt><dd>{issue.status === "open" ? "Awaiting review" : "Outcome recorded"}</dd></div></dl>}
          {mode === "details" && issue?.decision_notes && <div className="space-y-1"><h4 className="font-semibold text-sm">Reviewer decision</h4><p className="text-sm whitespace-pre-wrap break-words">{issue.decision_notes}</p><p className="text-xs text-muted-foreground">{issue.verified_at ? `Verified ${format(new Date(issue.verified_at), "PPP p")}` : "No verification recorded"}</p></div>}
          {mode === "details" && issue?.correction_due_date && <section className="space-y-3 rounded-lg border p-4" aria-labelledby="correction-heading">
            <div className="flex flex-wrap items-center justify-between gap-2"><h4 id="correction-heading" className="text-sm font-semibold">Correction follow-up</h4><Badge variant={issue.correction_status === "overdue" ? "destructive" : "secondary"}>{issue.correction_status === "completed" ? "Completed" : issue.correction_status === "overdue" ? "Overdue" : issue.correction_status === "due_soon" ? "Due soon" : "Pending correction"}</Badge></div>
            <p className="whitespace-pre-wrap text-sm">{issue.correction_notes}</p>
            <p className="text-sm">Deadline: {format(new Date(`${issue.correction_due_date}T12:00:00`), "PPP")} · End of day, Lagos time</p>
            {issue.correction_completed_at && <div className="space-y-1"><p className="text-xs text-muted-foreground">Verified complete {format(new Date(issue.correction_completed_at), "PPP")}</p><p className="whitespace-pre-wrap text-sm">{issue.correction_completion_notes}</p></div>}
            {isAdmin && !issue.correction_completed_at && <div className="space-y-2 border-t pt-3"><Label htmlFor="correction-completion">Completion verification</Label><Textarea id="correction-completion" maxLength={5000} value={completionNotes} onChange={event => setCompletionNotes(event.target.value)} placeholder="Record the correction checked and supporting evidence." disabled={savingCorrection} /><Button onClick={() => void handleCorrection(true)} disabled={savingCorrection || !completionNotes.trim()}>Verify correction complete</Button></div>}
          </section>}
          {mode === "details" && isAdmin && issue?.status === "closed" && !issue.correction_completed_at && <details className="space-y-3 rounded-lg border p-4"><summary className="cursor-pointer text-sm font-medium">{issue.correction_due_date ? "Edit correction timeline" : "Set a correction timeline"}</summary><CorrectionPlanFields value={correctionPlan} onChange={setCorrectionPlan} disabled={savingCorrection} /><Button onClick={() => void handleCorrection(false)} disabled={savingCorrection}>Save correction timeline</Button></details>}
          {/* Outcome Info if Closed */}
          {mode === "details" && issue?.status === "closed" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300 mb-0.5">
                    Recorded outcome
                  </h4>
                  <p className="text-base font-semibold text-foreground">
                    {issue.outcome}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{issue.policy_version ? `Policy effective ${issue.policy_version}${issue.recorded_step ? ` · Recorded Step ${issue.recorded_step}` : ""}` : "Historical decision · original outcome retained"}</p>
                </div>
                {Number(issue.points) > 0 && (
                  <Badge variant="outline" className="border-blue-300 text-blue-800 dark:text-blue-200">
                    +{issue.points ?? 1.0} Occurrence{(issue.points ?? 1.0) === 1 ? "" : "s"}
                  </Badge>
                )}
              </div>

              {issue.outcome === "Resolved (No Action)" && (
                <p className="text-xs text-muted-foreground">
                  This query was resolved with no action taken. No occurrences were added to the confirmed total.
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
          {mode === "response" && <div className="space-y-4">
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

          }
          {/* Reply Section */}
          {mode === "response" && issue?.status === "open" && (
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

          {mode === "outcome" && isAdmin && issue.status === "open" && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="outcome">Select outcome</Label>
                <Select value={outcome} onValueChange={chooseOutcome}>
                  <SelectTrigger id="outcome"><SelectValue placeholder="Choose an outcome" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Resolved (No Action)">Close without occurrence</SelectItem>
                    <SelectItem value="Give Occurrence">Confirm occurrence</SelectItem>
                    <SelectItem value="Warning (No Deduction)">Warning</SelectItem>
                    {issue.policy_context?.steps.map(step => <SelectItem key={step.step} value={step.label}>{step.label}</SelectItem>)}
                    <SelectItem value="Termination">Termination</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {outcome && !noAction && <div className="space-y-1.5">
                {suspension ? <>
                  <Label htmlFor="suspension-days">Suspension (working days)</Label>
                  <Input id="suspension-days" className="max-w-36" type="number" min="0.5" step="0.5" value={suspensionDays} readOnly={outcome === "One-day Suspension" || outcome === "Three-day Suspension"} onChange={event => setSuspensionDays(event.target.value)} />
                  <p className="text-xs text-muted-foreground">{amounts.deductionDays || 0} payroll deduction day(s). No occurrences added.</p>
                </> : <>
                  <Label htmlFor="award-points">Occurrences</Label>
                  <Input id="award-points" className="max-w-36" type="number" min="0" max="20" step="0.5" value={awardPoints} onChange={event => setAwardPoints(event.target.value)} />
                  <p className="text-xs text-muted-foreground">Every 8 accumulated occurrences = 1 payroll deduction day.</p>
                </>}
              </div>}
              <DecisionPolicyFields issue={issue} points={outcome ? amounts.points : 0} outcome={outcome} value={decisionOptions} onChange={setDecisionOptions} onPointsChange={setAwardPoints} onUseOutcome={chooseOutcome} />
              <div className="space-y-1.5"><Label htmlFor="decision-notes">Decision reason</Label><Textarea id="decision-notes" rows={2} value={decisionNotes} onChange={event => setDecisionNotes(event.target.value)} maxLength={10000} placeholder="Briefly explain the finding." /></div>
              {!noAction && <div className="space-y-1.5"><Label htmlFor="review-evidence">Verified evidence</Label><Input id="review-evidence" value={evidence} onChange={event => setEvidence(event.target.value)} maxLength={10000} placeholder="Document or reference checked" /></div>}
              <div className="space-y-3 border-t pt-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" checked={correctionRequired} onChange={event => setCorrectionRequired(event.target.checked)} disabled={resolving} /><span>Set a correction deadline</span></label>
                {correctionRequired && <CorrectionPlanFields value={correctionPlan} onChange={setCorrectionPlan} disabled={resolving} />}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleResolve} disabled={resolving || !outcome}>{resolving ? "Recording…" : "Record outcome"}</Button>
              </div>
            </div>
          )}
        </div>
        <Footer className={mode === "details" ? "border-t px-6 py-4" : undefined}>
          {mode !== "outcome" && isAdmin && issue.status === "open" && onChooseOutcome && <Button variant="outline" onClick={onChooseOutcome}>Choose outcome</Button>}
          {mode !== "outcome" && isAdmin && (
            <Button
              variant="outline"
              className="text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              onClick={() => {
                setDetailCloseReason(issue.decision_notes || "");
                setCloseConfirmOpen(true);
              }}
            >
              <CheckCircle2 className="mr-1.5 size-4" />
              {issue.status === "closed" ? "Update Close Note" : "Close Query"}
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close Window
          </Button>
        </Footer>
      </Content>
      <AlertDialog open={closeConfirmOpen} onOpenChange={val => { if (!val && !closingQuery) setCloseConfirmOpen(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{issue.status === "closed" ? "Update query closure" : "Close compliance query"}</AlertDialogTitle>
            <AlertDialogDescription>
              {issue.status === "closed"
                ? `Update closure note and status for ${issue.user_name || issue.user?.name || "staff"}.`
                : `Mark query for ${issue.user_name || issue.user?.name || "staff"} as closed regardless of its current status.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="detail-close-note">Closure Reason / Decision Note</Label>
            <Textarea
              id="detail-close-note"
              className="w-full text-xs"
              rows={3}
              placeholder="Optional: Record closure reason (e.g. Reviewed with staff and resolved without occurrence, or corrective coaching completed)..."
              value={detailCloseReason}
              onChange={e => setDetailCloseReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closingQuery}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={closingQuery}
              onClick={async event => {
                event.preventDefault();
                setClosingQuery(true);
                try {
                  const result = await closeComplianceIssue(issue.id, detailCloseReason.trim() || undefined);
                  if (!result.success) {
                    toast.error(result.error || "Unable to close query");
                    return;
                  }
                  toast.success(issue.status === "closed" ? "Closure note updated" : "Query closed successfully");
                  setCloseConfirmOpen(false);
                  await fetchDetails();
                  router.refresh();
                } catch {
                  toast.error("Unable to close query");
                } finally {
                  setClosingQuery(false);
                }
              }}
            >
              {closingQuery ? "Closing…" : "Confirm Close"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Surface>
  );
}
