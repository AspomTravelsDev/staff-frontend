"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock3,
  Save,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { formatPerformanceDate, formatPerformanceMonth } from "@/lib/performance-review";
import type {
  AppraisalAnswer,
  PerformanceAppraisal,
  Rating,
} from "@/lib/types/performance-appraisal";
import { AssessmentReadOnly } from "@/components/performance/assessment-read-only";
import { PerformancePageHeader } from "@/components/performance/performance-page-header";

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
  const [step, setStep] = useState(0);
  const save = useSaveSelfAppraisal();
  const dirty =
    JSON.stringify(values) !== JSON.stringify(selfAssessmentValues(appraisal));
  const answered = values.answers.filter(
    (answer) => answer.rating !== null,
  ).length;
  const currentTotal = values.answers.reduce(
    (sum, answer) => sum + (answer.rating ?? 0),
    0,
  );
  const currentAverage = answered ? currentTotal / answered : null;
  const total = appraisal.criteria.length;
  const isReviewStep = step === total;
  const currentCriterion = !isReviewStep ? appraisal.criteria[step] : null;
  const currentAnswer = !isReviewStep ? values.answers[step] : null;
  const activeCriterionRef = useRef<HTMLButtonElement | null>(null);

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

  useEffect(() => {
    if (!isReviewStep) {
      activeCriterionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [isReviewStep, step]);

  function updateAnswer(
    index: number,
    key: "rating" | "comment",
    value: Rating | string | null,
  ) {
    setValues((previous) => ({
      ...previous,
      answers: previous.answers.map((answer, answerIndex) =>
        answerIndex === index
          ? ({ ...answer, [key]: value } as AppraisalAnswer)
          : answer,
      ),
    }));
    setError("");
  }

  const persist = useCallback(async (submit: boolean) => {
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
  }, [acceptSaved, appraisal.id, pending, save, values]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;

      if (isTyping) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (dirty && !pending) void persist(false);
        return;
      }

      if (event.key >= "1" && event.key <= "5" && currentAnswer && !pending) {
        event.preventDefault();
        updateAnswer(step, "rating", Number(event.key) as Rating);
        return;
      }

      if (event.key === "ArrowLeft" && step > 0) {
        event.preventDefault();
        setStep((value) => Math.max(0, value - 1));
      } else if (event.key === "ArrowRight" && step < total) {
        event.preventDefault();
        setStep((value) => Math.min(total, value + 1));
      }
    }

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [currentAnswer, dirty, pending, persist, step, total]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const missing = values.answers.findIndex(
      (answer) => answer.rating === null,
    );
    if (missing !== -1) {
      setStep(missing);
      setError(
        `Choose a rating for every ${appraisal.type === "appraisal" ? "criterion" : "KPI"} before submitting. You can save an incomplete draft.`,
      );
      return;
    }
    if (!values.answers.length) {
      setError(
        `No ${appraisal.type === "appraisal" ? "Appraisal" : "KPI"} criteria are available. Contact HR before submitting.`,
      );
      return;
    }
    if (
      appraisal.type === "appraisal" &&
      (!values.section_comments?.job_achievements?.trim() ||
        !values.section_comments?.initiatives_achieved?.trim())
    ) {
      setStep(total);
      setError("Complete both comment fields before submitting.");
      return;
    }
    setDialog("submit");
  }

  const percentage = total ? Math.round((answered / total) * 100) : 0;
  const appraisalScaleLabels = [
    "Unsatisfactory · <50%",
    "Requires improvement · 50–69%",
    "Satisfactory · 70–80%",
    "Exceeded expectations · 81–90%",
    "Exceptional · >90%",
  ];
  const reviewChain = (
    appraisal.type === "appraisal"
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

  return (
    <div className="space-y-5 pb-10">
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
        <div className="flex items-center gap-2">
          <Badge variant="outline">{formatPerformanceMonth(appraisal.month)}</Badge>
          <Badge variant="secondary">{appraisalStatusLabel(appraisal)}</Badge>
        </div>
      </div>
      <PerformancePageHeader
        eyebrow={`${appraisal.type === "appraisal" ? "Appraisal" : "Monthly KPI appraisal"} · ${formatPerformanceMonth(appraisal.month)}`}
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
              "Draft saves as you go"
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {appraisal.type === "appraisal" ? "Appraisal" : "Monthly KPI"}
            </Badge>
            <Badge variant="secondary">{appraisalStatusLabel(appraisal)}</Badge>
          </div>
        }
      />
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
              {appraisal.type === "appraisal"
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
        <>
          <AssessmentReadOnly
            appraisal={appraisal}
            assessment={appraisal.self_assessment}
            assessments={[
              ...(appraisal.self_assessment ? [appraisal.self_assessment] : []),
              ...appraisal.submitted_feedback,
            ]}
            title="Your self-assessment"
          />
        </>
      ) : (
        <>
          <section
            className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)]"
            aria-label="Self-assessment progress"
          >
            <Card className="h-fit">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Your progress</CardTitle>
                <CardDescription>
                  {answered} of {total} ratings complete
                </CardDescription>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label="Assessment completion"
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={answered}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent className="max-h-[36vh] space-y-1 overflow-auto p-2 lg:max-h-[calc(100vh-22rem)]">
                {appraisal.criteria.map((criterion, index) => {
                  const done = values.answers[index]?.rating !== null;
                  return (
                    <button
                      type="button"
                      key={criterion.id}
                      ref={step === index ? activeCriterionRef : undefined}
                      onClick={() => setStep(index)}
                      aria-current={step === index ? "step" : undefined}
                      aria-label={`${appraisal.type === "appraisal" ? "Criterion" : "KPI"} ${index + 1}: ${criterion.name}${done ? ", rated" : ", not rated"}`}
                      className={`flex w-full items-start gap-2.5 rounded-md px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${step === index ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                    >
                      <span className="mt-0.5 shrink-0">
                        {done ? (
                          <CheckCircle2 className="size-4 text-primary" />
                        ) : (
                          <Circle className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs text-muted-foreground">
                          {criterion.key_result_area ??
                            `${appraisal.type === "appraisal" ? "Criterion" : "KPI"} ${index + 1}`}
                        </span>
                        <span className="line-clamp-2 font-medium">
                          {criterion.name}
                        </span>
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setStep(total)}
                  aria-current={isReviewStep ? "step" : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium ${isReviewStep ? "bg-primary/10" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  <Check className="size-4" />
                  Review & submit
                </button>
              </CardContent>
            </Card>
            <Card className="min-w-0">
              {!isReviewStep && currentCriterion && currentAnswer ? (
                <>
                  <CardHeader className="border-b bg-muted/20">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="outline">
                        {appraisal.type === "appraisal"
                          ? currentCriterion.key_result_area
                          : `KPI ${step + 1} of ${total}`}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {percentage}% rated
                      </span>
                    </div>
                    <CardTitle className="pt-2 text-xl leading-snug">
                      {currentCriterion.name}
                    </CardTitle>
                    {appraisal.type !== "appraisal" && (
                      <CardDescription className="text-sm leading-relaxed">
                        {currentCriterion.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6 pt-0">
                    {appraisal.type !== "appraisal" && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-muted/40 p-3">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Target
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                            {currentCriterion.expectation}
                          </p>
                        </div>
                        {currentCriterion.measurement_method && (
                          <div className="rounded-lg bg-muted/40 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Measured by
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                              {currentCriterion.measurement_method}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {appraisal.type === "appraisal" && (
                      <p className="text-xs text-muted-foreground">
                        Use whole-number ratings only; fractions are not
                        accepted.
                      </p>
                    )}
                    <fieldset className="space-y-3" disabled={pending}>
                      <legend className="text-sm font-semibold">
                        How would you rate your performance?
                      </legend>
                      <RadioGroup
                        value={currentAnswer.rating?.toString() ?? ""}
                        onValueChange={(value) =>
                          updateAnswer(step, "rating", Number(value) as Rating)
                        }
                        className="grid gap-2 sm:grid-cols-5"
                      >
                        {appraisalRatingScale.map((item) => {
                          const label =
                            appraisal.type === "appraisal"
                              ? appraisalScaleLabels[item.value - 1]
                              : item.label;
                          const scoringGuide =
                            appraisal.type !== "appraisal"
                              ? currentCriterion.scoring_guide?.[item.value]?.trim()
                              : null;
                          return (
                            <Label
                              key={item.value}
                              htmlFor={`rating-${currentCriterion.id}-${item.value}`}
                              className={`flex cursor-pointer flex-col items-start gap-1 rounded-lg border p-3 transition-colors hover:bg-muted/60 ${currentAnswer.rating === item.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"}`}
                            >
                              <span className="flex w-full items-center justify-between">
                                <span className="text-xl font-semibold tabular-nums">
                                  {item.value}
                                </span>
                                <RadioGroupItem
                                  id={`rating-${currentCriterion.id}-${item.value}`}
                                  value={String(item.value)}
                                  aria-label={`${item.value} · ${label}`}
                                />
                              </span>
                              <span className="text-xs font-medium">
                                {label}
                              </span>
                              {scoringGuide && (
                                <span className="text-xs font-normal leading-relaxed text-muted-foreground">
                                  {scoringGuide}
                                </span>
                              )}
                            </Label>
                          );
                        })}
                      </RadioGroup>
                    </fieldset>
                    <div className="max-w-2xl space-y-2">
                      {currentAnswer.rating !== null && (
                        <>
                          <Label htmlFor={`comment-${currentCriterion.id}`}>
                            Comment{" "}
                            <span className="font-normal text-muted-foreground">
                              (optional)
                            </span>
                          </Label>
                          <Textarea
                            id={`comment-${currentCriterion.id}`}
                            maxLength={3000}
                            value={currentAnswer.comment ?? ""}
                            onChange={(event) =>
                              updateAnswer(step, "comment", event.target.value)
                            }
                            placeholder="Add context for your rating."
                          />
                        </>
                      )}
                    </div>
                  </CardContent>
                </>
              ) : (
                <>
                  <CardHeader className="border-b bg-muted/20">
                    <Badge variant="outline" className="w-fit">
                      Final step
                    </Badge>
                    <CardTitle className="pt-2 text-xl">
                      Review your answers
                    </CardTitle>
                    <CardDescription>
                      Check each{" "}
                      {appraisal.type === "appraisal" ? "rating" : "KPI rating"}{" "}
                      before you submit. You can go back to make changes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {appraisal.criteria.map((criterion, index) => (
                      <button
                        type="button"
                        key={criterion.id}
                        onClick={() => setStep(index)}
                        className="flex w-full items-center justify-between gap-4 rounded-lg border px-3 py-3 text-left transition-colors hover:bg-muted/50"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {criterion.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {values.answers[index]?.rating === null
                                ? "Rating needed"
                                : "Rating saved"}
                            </span>
                          </span>
                        </span>
                        <Badge
                          variant={
                            values.answers[index]?.rating === null
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {values.answers[index]?.rating === null
                            ? "—"
                            : `${values.answers[index].rating} / 5`}
                        </Badge>
                      </button>
                    ))}
                    {appraisal.type === "appraisal" && (
                      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-primary/5 px-4 py-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Current total
                          </p>
                          <p className="text-lg font-semibold tabular-nums">
                            {currentTotal} / {total * 5}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Current average
                          </p>
                          <p className="text-lg font-semibold tabular-nums">
                            {currentAverage === null
                              ? "—"
                              : currentAverage.toFixed(2)}{" "}
                            / 5{" "}
                            <span className="text-xs font-normal">
                              ({answered}/{total} rated)
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                    {appraisal.type === "appraisal" ? (
                      <div className="grid gap-4 pt-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="job-achievements">
                            Job achievements
                          </Label>
                          <Textarea
                            id="job-achievements"
                            required
                            maxLength={5000}
                            value={
                              values.section_comments?.job_achievements ?? ""
                            }
                            onChange={(event) =>
                              updateSectionComment(
                                "job_achievements",
                                event.target.value,
                              )
                            }
                            placeholder="Summarize your achievements during this appraisal period."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="initiatives-achieved">
                            Initiatives achieved
                          </Label>
                          <Textarea
                            id="initiatives-achieved"
                            required
                            maxLength={5000}
                            value={
                              values.section_comments?.initiatives_achieved ??
                              ""
                            }
                            onChange={(event) =>
                              updateSectionComment(
                                "initiatives_achieved",
                                event.target.value,
                              )
                            }
                            placeholder="Describe initiatives you completed or advanced."
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-3">
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
                    <p className="pt-2 text-xs text-muted-foreground">
                      Review chain: {reviewChain}
                    </p>
                  </CardContent>
                </>
              )}
              <CardFooter className="flex flex-wrap justify-between gap-2 border-t bg-muted/10">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending || step === 0}
                    onClick={() => setStep((value) => Math.max(0, value - 1))}
                  >
                    <ArrowLeft className="mr-1 size-4" />
                    Back
                  </Button>
                  {!isReviewStep && (
                    <Button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        setStep((value) => Math.min(total, value + 1))
                      }
                    >
                      Next criterion
                      <ArrowRight className="ml-1 size-4" />
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={pending || !dirty}
                    onClick={() => void persist(false)}
                  >
                    <Save className="mr-2 size-4" />
                    Save draft
                  </Button>
                  {isReviewStep && (
                    <Button
                      type="button"
                      onClick={() => {
                        const missing = values.answers.findIndex(
                          (answer) => answer.rating === null,
                        );
                        if (missing !== -1) {
                          setStep(missing);
                          setError(
                            `Choose a rating for every ${appraisal.type === "appraisal" ? "criterion" : "KPI"} before submitting.`,
                          );
                          return;
                        }
                        if (
                          appraisal.type === "appraisal" &&
                          (!values.section_comments?.job_achievements?.trim() ||
                            !values.section_comments?.initiatives_achieved?.trim())
                        ) {
                          setError(
                            "Complete both comment fields before submitting.",
                          );
                          return;
                        }
                        setError("");
                        setDialog("submit");
                      }}
                      disabled={pending}
                    >
                      <Send className="mr-2 size-4" />
                      Submit assessment
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </section>
          <form onSubmit={submit} className="sr-only">
            <button type="submit">Submit</button>
          </form>
          <p className="text-center text-xs text-muted-foreground">
            {appraisal.employee_name} · {appraisal.employee_staff_id} · Drafts
            are private until you submit.
          </p>
        </>
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
              ? appraisal.type === "appraisal"
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
