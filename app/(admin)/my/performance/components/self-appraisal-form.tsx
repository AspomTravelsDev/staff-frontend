"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Clock3, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { getAppraisalById } from "@/lib/api/performance-appraisal";
import { useSaveSelfAppraisal } from "@/lib/api/hooks/use-performance-appraisal";
import {
  appraisalRatingScale,
  appraisalStatusLabel,
  formatAppraisalTime,
  selfAssessmentValues,
} from "@/lib/performance-self-assessment";
import {
  formatPerformanceDate,
  formatPerformancePeriodLabel,
} from "@/lib/performance-review";
import type {
  AppraisalAnswer,
  PerformanceAppraisal,
  Rating,
} from "@/lib/types/performance-appraisal";
import { AssessmentReadOnly } from "@/components/performance/assessment-read-only";
import { AppraisalPdfButton } from "@/components/performance/appraisal-pdf-button";
import { PerformancePageHeader } from "@/components/performance/performance-page-header";
import { PerformanceTour, PerformanceTourButton } from "@/components/performance/performance-tour";
import { WhatsAppChatInput } from "@/components/chat/whatsapp-chat-input";

const appraisalScaleLabels = [
  "Unsatisfactory · <50%",
  "Requires improvement · 50–69%",
  "Satisfactory · 70–80%",
  "Exceeded expectations · 81–90%",
  "Exceptional · >90%",
];

export function SelfAppraisalForm({
  initialAppraisal,
}: {
  initialAppraisal: PerformanceAppraisal;
}) {
  const router = useRouter();
  const [appraisal, setAppraisal] = useState(initialAppraisal);
  const [values, setValues] = useState(() =>
    selfAssessmentValues(initialAppraisal),
  );
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<"submit" | "discard" | null>(null);
  const save = useSaveSelfAppraisal();

  const dirty =
    JSON.stringify(values) !== JSON.stringify(selfAssessmentValues(appraisal));
  const isStructured = appraisal.type === "appraisal";
  const answered = values.answers.filter(
    (answer) => answer.rating !== null,
  ).length;
  const total = appraisal.criteria.length;
  const currentTotal = values.answers.reduce(
    (sum, answer) => sum + (answer.rating ?? 0),
    0,
  );
  const currentAverage = answered ? currentTotal / answered : null;

  const acceptSaved = useCallback((saved: PerformanceAppraisal) => {
    setAppraisal(saved);
    setValues(selfAssessmentValues(saved));
    setError("");
  }, []);

  const reload = useMutation({
    mutationFn: () => getAppraisalById(appraisal.id),
    onSuccess: acceptSaved,
    onError: (failure) =>
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to reload your saved appraisal.",
      ),
  });
  const pending = save.isPending || reload.isPending;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function updateRating(index: number, rawValue: string) {
    const numericValue = rawValue === "" ? null : Number(rawValue);
    setValues((previous) => ({
      ...previous,
      answers: previous.answers.map((answer, answerIndex) =>
        answerIndex === index
          ? ({
              ...answer,
              rating:
                numericValue !== null &&
                Number.isInteger(numericValue) &&
                numericValue >= 1 &&
                numericValue <= 5
                  ? (numericValue as Rating)
                  : null,
            } as AppraisalAnswer)
          : answer,
      ),
    }));
    setError("");
  }

  function updateAnswerComment(index: number, comment: string) {
    setValues((previous) => ({
      ...previous,
      answers: previous.answers.map((answer, answerIndex) =>
        answerIndex === index ? { ...answer, comment } : answer,
      ),
    }));
    setError("");
  }

  function updateSectionComment(
    key: "job_achievements" | "initiatives_achieved",
    value: string,
  ) {
    setValues((previous) => ({
      ...previous,
      section_comments: { ...previous.section_comments, [key]: value },
    }));
    setError("");
  }

  function focusNextRating(
    event: ReactKeyboardEvent<HTMLInputElement>,
    index: number,
  ) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement>("[data-self-rating]"),
    );
    inputs[index + 1]?.focus();
  }

  const persist = useCallback(
    async (submit: boolean) => {
      if (pending) return;
      setError("");
      try {
        const saved = await save.mutateAsync({
          id: appraisal.id,
          data: values,
          submit,
        });
        acceptSaved(saved);
        toast.success(submit ? "Self-assessment submitted" : "Draft saved");
      } catch (failure) {
        setError(
          failure instanceof Error
            ? failure.message
            : "Unable to save. Please try again.",
        );
      }
    },
    [acceptSaved, appraisal.id, pending, save, values],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!values.answers.length) {
      setError(
        `No ${isStructured ? "Appraisal" : "KPI"} criteria are available. Contact HR before submitting.`,
      );
      return;
    }
    const missingIndex = values.answers.findIndex(
      (answer) => answer.rating === null,
    );
    if (missingIndex !== -1) {
      setError(
        `Rate every ${isStructured ? "criterion" : "KPI"} from 1 to 5 before submitting. You can save an incomplete draft.`,
      );
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>("[data-self-rating]"),
      );
      inputs[missingIndex]?.focus();
      inputs[missingIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (
      isStructured &&
      (!values.section_comments?.job_achievements?.trim() ||
        !values.section_comments?.initiatives_achieved?.trim())
    ) {
      setError("Complete both comment fields before submitting.");
      return;
    }
    setDialog("submit");
  }

  const reviewChain = (
    isStructured
      ? [
          appraisal.reviewer_route === "direct_mp"
            ? null
            : appraisal.reviewer_route === "compliance"
              ? (appraisal.compliance_reviewer_name ?? appraisal.reviewer_name)
              : appraisal.reviewer_name,
          appraisal.mp_reviewer_name,
        ]
      : [
          appraisal.reviewer_name,
          appraisal.hr_reviewer_name,
          appraisal.compliance_reviewer_name,
          appraisal.mp_reviewer_name,
        ]
  )
    .filter((name): name is string => !!name)
    .join(" → ");

  return (
    <div className="space-y-5 pb-10">
      <PerformanceTour tourId="self-appraisal" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          className="-ml-3"
          disabled={pending}
          onClick={() =>
            dirty ? setDialog("discard") : router.push("/my/performance")
          }
        >
          <ArrowLeft className="mr-2 size-4" />
          My Performance
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {appraisal.status === "completed" && (
            <AppraisalPdfButton data={appraisal} label="Download Branded PDF" />
          )}
          <PerformanceTourButton tourId="self-appraisal" />
          <Badge variant="outline">
            {formatPerformancePeriodLabel(appraisal.type, appraisal.month)}
          </Badge>
          <Badge variant="secondary">{appraisalStatusLabel(appraisal)}</Badge>
        </div>
      </div>

      <div id="tour-self-header">
        <PerformancePageHeader
        eyebrow={`${isStructured ? "Appraisal" : "Monthly KPI appraisal"} · ${formatPerformancePeriodLabel(appraisal.type, appraisal.month)}`}
        title="Your self-assessment"
        description={`${appraisal.department}${appraisal.is_supervisor ? " · Supervisor" : ""} · Due ${formatPerformanceDate(appraisal.submission_deadline)}`}
        icon={ClipboardCheck}
        meta={
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />
            {dirty ? (
              <span className="font-medium text-foreground">
                Unsaved changes
              </span>
            ) : appraisal.self_status === "draft" ? (
              `Saved ${formatAppraisalTime(appraisal.self_updated_at)}`
            ) : (
              "Draft saves when you click Save draft"
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {isStructured ? "Appraisal" : "Monthly KPI"}
            </Badge>
            <Badge variant="secondary">{appraisalStatusLabel(appraisal)}</Badge>
          </div>
        }
      />
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <p>{error}</p>
          {save.isError && (
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => reload.mutate()}
            >
              Reload saved version
            </Button>
          )}
        </div>
      )}

      {appraisal.final_score !== null && (
        <Card size="sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <p className="font-medium">
              {isStructured
                ? `Final total ${appraisal.total_score ?? "—"} / ${appraisal.total_max_score ?? "—"}`
                : "Final score"}
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {Number(appraisal.final_score).toFixed(2)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                / 5
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {!appraisal.can_edit_self ? (
        <div id="tour-self-readonly">
          <AssessmentReadOnly
            appraisal={appraisal}
            assessment={appraisal.self_assessment}
            assessments={[
              ...(appraisal.self_assessment ? [appraisal.self_assessment] : []),
              ...appraisal.submitted_feedback,
            ]}
            title="Your self-assessment"
          />
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-6">
          <fieldset disabled={pending} className="min-w-0 space-y-5">
            <div id="tour-self-scale" className="sticky top-2 z-10 rounded-lg border border-primary/20 bg-card/95 p-3 shadow-sm backdrop-blur">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Rating scale
                </p>
                {appraisalRatingScale.map((item, index) => (
                  <div
                    key={item.value}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {item.value}
                    </span>
                    <span>
                      {isStructured ? appraisalScaleLabels[index] : item.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Enter a whole number from 1 to 5. Press Enter in a rating field
                to move to the next {isStructured ? "criterion" : "KPI"}.
              </p>
            </div>

            <div id="tour-self-table" className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-64">
                      {isStructured ? "Key result area / indicator" : "KPI"}
                    </TableHead>
                    <TableHead className="w-36 min-w-36">Your rating</TableHead>
                    {!isStructured && (
                      <TableHead className="min-w-64">
                        Comment (optional)
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appraisal.criteria.map((criterion, index) => {
                    const answer = values.answers[index];
                    return (
                      <TableRow key={criterion.id}>
                        <TableCell className="max-w-xl align-top whitespace-normal">
                          {criterion.key_result_area && (
                            <span className="mb-1 block text-xs font-normal text-muted-foreground">
                              {criterion.key_result_area}
                            </span>
                          )}
                          <div className="font-medium">{criterion.name}</div>
                          {!isStructured && (
                            <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                              {criterion.description && (
                                <p>{criterion.description}</p>
                              )}
                              <p>
                                <span className="font-medium text-foreground">
                                  Target:
                                </span>{" "}
                                {criterion.expectation}
                              </p>
                              {criterion.measurement_method && (
                                <p>
                                  <span className="font-medium text-foreground">
                                    Measured by:
                                  </span>{" "}
                                  {criterion.measurement_method}
                                </p>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            data-self-rating
                            disabled={pending}
                            className="h-11 w-20 border-2 border-primary/40 bg-primary/5 px-3 text-center text-lg font-semibold tabular-nums shadow-sm focus-visible:border-primary focus-visible:bg-background"
                            type="number"
                            min={1}
                            max={5}
                            step={1}
                            inputMode="numeric"
                            aria-label={`Your rating for ${criterion.name}`}
                            value={answer?.rating?.toString() ?? ""}
                            onKeyDown={(event) => focusNextRating(event, index)}
                            onChange={(event) =>
                              updateRating(index, event.target.value)
                            }
                          />
                        </TableCell>
                        {!isStructured && (
                          <TableCell className="align-top">
                            <Textarea
                              rows={2}
                              maxLength={3000}
                              value={answer?.comment ?? ""}
                              onChange={(event) =>
                                updateAnswerComment(index, event.target.value)
                              }
                              placeholder="Add context for your rating."
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-primary/5 px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Your current total
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {currentTotal} / {total * 5}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  Your current average
                </p>
                <p className="text-lg font-semibold tabular-nums">
                  {currentAverage === null ? "—" : currentAverage.toFixed(2)} /
                  5{" "}
                  <span className="text-xs font-normal">
                    ({answered}/{total} rated)
                  </span>
                </p>
              </div>
            </div>

            {isStructured ? (
              <div id="tour-self-comments" className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="job-achievements">
                    Job achievements (required)
                  </Label>
                  <WhatsAppChatInput
                    id="job-achievements"
                    aria-label="Job achievements"
                    multiline
                    showToolbar
                    disabled={pending}
                    maxLength={5000}
                    value={values.section_comments?.job_achievements ?? ""}
                    onChange={(next) =>
                      updateSectionComment("job_achievements", next)
                    }
                    placeholder="Summarize your achievements during this appraisal period. Type - or 1. for lists..."
                    className="min-h-28 max-h-72 rounded-none border-0 bg-transparent focus:border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initiatives-achieved">
                    Initiatives achieved (required)
                  </Label>
                  <WhatsAppChatInput
                    id="initiatives-achieved"
                    aria-label="Initiatives achieved"
                    multiline
                    showToolbar
                    disabled={pending}
                    maxLength={5000}
                    value={values.section_comments?.initiatives_achieved ?? ""}
                    onChange={(next) =>
                      updateSectionComment("initiatives_achieved", next)
                    }
                    placeholder="Describe initiatives you completed or advanced. Type - or 1. for lists..."
                    className="min-h-28 max-h-72 rounded-none border-0 bg-transparent focus:border-0"
                  />
                </div>
              </div>
            ) : (
              <div id="tour-self-comments" className="space-y-2">
                <Label htmlFor="self-overall-comment">
                  Overall reflection{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="self-overall-comment"
                  maxLength={5000}
                  value={values.comment ?? ""}
                  onChange={(event) => {
                    setValues((previous) => ({
                      ...previous,
                      comment: event.target.value,
                    }));
                    setError("");
                  }}
                  placeholder="Progress, challenges or support needed."
                />
              </div>
            )}

            <div id="tour-self-actions" className="space-y-3 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {appraisal.employee_name} · {appraisal.employee_staff_id} ·
                Drafts are private until you submit. Review chain:{" "}
                {reviewChain || "Assigned reviewers"}.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || !dirty}
                  onClick={() => void persist(false)}
                >
                  <Save className="mr-2 size-4" />
                  Save draft
                </Button>
                <Button type="submit" disabled={pending}>
                  <Send className="mr-2 size-4" />
                  Submit assessment
                </Button>
              </div>
            </div>
          </fieldset>
        </form>
      )}

      {pending && (
        <p role="status" className="text-center text-sm text-muted-foreground">
          {reload.isPending
            ? "Reloading saved version…"
            : save.variables?.submit
              ? "Submitting your self-assessment…"
              : "Saving your draft…"}
        </p>
      )}

      {appraisal.submitted_feedback.map((assessment) => (
        <AssessmentReadOnly
          key={assessment.id}
          appraisal={appraisal}
          assessment={assessment}
          title={
            assessment.stage === "mp"
              ? isStructured
                ? "Management review"
                : "MP review"
              : assessment.stage === "hr"
                ? "HR review"
                : assessment.stage === "compliance"
                  ? "Compliance review"
                  : assessment.stage === "supervisor"
                    ? "Supervisor review"
                    : "Reviewer assessment"
          }
        />
      ))}

      <AlertDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialog === "submit"
                ? "Submit your self-assessment?"
                : "Leave without saving?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialog === "submit"
                ? "Your ratings and comments will be saved and sent to the assigned review stage. You cannot edit them after submission."
                : "Your unsaved changes will be lost. Your last saved draft will remain available."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (dialog === "submit") void persist(true);
                else router.push("/my/performance");
                setDialog(null);
              }}
            >
              {dialog === "submit"
                ? "Submit assessment"
                : "Leave without saving"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
