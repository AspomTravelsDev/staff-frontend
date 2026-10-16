"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PracticalWorkspace } from "./practical-workspace";
import { AssessmentPreparation } from "./assessment-preparation";
import {
  getApplicantAssessment,
  getAssessmentRevision,
  reopenApplicantAssessment,
  saveApplicantAssessment,
  startApplicantAssessment,
  submitApplicantAssessment,
} from "@/lib/api/applicant-assessment";
import {
  assessmentDraft,
  AssessmentSaveQueue,
} from "@/lib/recruitment/assessment-draft";
import {
  assessmentSectionNames,
  type ApplicantAssessment,
  type AssessmentContext,
  type AssessmentDraft,
  type AssessmentPlan,
  type AssessmentSection,
} from "@/lib/types/applicant-assessment";
import {
  AssessmentReport,
  AssessmentResultsView,
  previewAssessment,
} from "./assessment-results";

const sections: AssessmentSection[] = [
  "general",
  "role",
  "talent",
  "expectations",
  "candidate_questions",
  "closing",
  "practical",
];
const controlClass =
  "min-h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
export function ApplicantAssessmentScreen({
  context: initialContext,
  initialPlan,
  planError,
}: {
  context: AssessmentContext;
  initialPlan: AssessmentPlan | null;
  planError?: string;
}) {
  const searchParams = useSearchParams();
  const [context, setContext] = useState(initialContext);
  const [assessment, setAssessment] = useState(initialContext.assessment);
  const [overrides, setOverrides] = useState<AssessmentDraft | undefined>();
  const [generation, setGeneration] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    setBusy(true);
    setError("");
    try {
      const result = await startApplicantAssessment(
        context.candidate.id,
        context.role.id,
      );
      if (result.success) setAssessment(result.data);
      else setError(result.error);
    } catch {
      setError("The assessment could not start. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  function replace(
    value: ApplicantAssessment,
    draft?: AssessmentDraft,
    nextContext?: AssessmentContext,
  ) {
    setAssessment(value);
    setOverrides(draft);
    setGeneration((n) => n + 1);
    if (nextContext) setContext(nextContext);
  }
  if (assessment)
    return (
      <AssessmentEditor
        key={`${assessment.id}-${generation}`}
        initial={assessment}
        initialDraft={overrides}
        context={context}
        downloadOnLoad={searchParams.get("download") === "assessment"}
        onReplace={replace}
      />
    );
  return (
    <div className="w-full space-y-6">
      <Link
        href={`/hr/recruitment/${context.role.id}`}
        className="inline-flex items-center gap-2 text-sm hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to vacancy
      </Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Applicant Assessment</h1>
        <p className="text-lg">
          {context.candidate.name} · {context.role.title}
        </p>
      </header>
      {planError && (
        <p role="alert" className="text-destructive">
          {planError}
        </p>
      )}
      {!initialPlan ? (
        <div className="space-y-3 rounded-lg border p-4">
          <h2 className="text-xl font-semibold">
            Choose the interview questions first
          </h2>
          <p className="text-muted-foreground">
            Configure a shared question set for this vacancy before starting
            interviews.
          </p>
          <Link
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            href={`/hr/recruitment/${context.role.id}/assessment-setup`}
          >
            Set up assessment
          </Link>
        </div>
      ) : (
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="text-xl font-semibold">
            {initialPlan.definition.track.name}
          </h2>
          <p>
            {initialPlan.definition.questions.filter((q) => q.scored).length}{" "}
            scored questions ·{" "}
            {initialPlan.definition.weights.practical
              ? "Includes practical exercise"
              : "No practical exercise"}
          </p>
          <p className="text-muted-foreground">
            Start with introductions and explain the interview format. Grades
            and evidence notes save as you work. Starting the first interview
            locks this vacancy’s question set.
          </p>
          <p className="text-sm text-muted-foreground">
            {initialPlan.definition.guidance}
          </p>
          {context.candidate.status === "interviewing" ? (
            <Button
              className="h-11 px-5 text-sm"
              disabled={busy}
              onClick={start}
            >
              {busy && <Loader2 className="size-4 animate-spin" />}Start
              interview assessment
            </Button>
          ) : (
            <p role="status">
              Move the applicant to Interviewing to start an assessment.
            </p>
          )}
          <Link
            className="ml-4 text-sm underline underline-offset-4"
            href={`/hr/recruitment/${context.role.id}/assessment-setup`}
          >
            Review question set
          </Link>
        </div>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function AssessmentEditor({
  initial,
  initialDraft,
  context,
  downloadOnLoad,
  onReplace,
}: {
  initial: ApplicantAssessment;
  initialDraft?: AssessmentDraft;
  context: AssessmentContext;
  downloadOnLoad: boolean;
  onReplace: (
    assessment: ApplicantAssessment,
    draft?: AssessmentDraft,
    context?: AssessmentContext,
  ) => void;
}) {
  const [assessment, setAssessment] = useState(initial);
  const [draft, setDraft] = useState(
    () => initialDraft ?? assessmentDraft(initial),
  );
  const [, force] = useReducer((value) => value + 1, 0);
  const [queue] = useState(
    () =>
      new AssessmentSaveQueue(
        initialDraft ?? assessmentDraft(initial),
        initial.revision,
        (value, revision) =>
          saveApplicantAssessment(context.candidate.id, { ...value, revision }),
        setAssessment,
        force,
        !!initialDraft,
      ),
  );
  const [active, setActive] = useState<AssessmentSection | "prepare" | "review">(
    initial.state === "submitted" ? "review" : (initial.answers.some(a => a.score != null) ? "general" : "prepare"),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [history, setHistory] = useState<ApplicantAssessment | null>(null);
  const [conflict, setConflict] = useState<AssessmentContext | null>(null);
  const [pdfReport, setPdfReport] = useState<ApplicantAssessment | null>(null);
  const downloadHandled = useRef(false);
  const plan = assessment.plan_snapshot;
  const editable =
    assessment.state === "draft" && context.candidate.status === "interviewing";
  const paused = !editable || busy;
  const results = editable
    ? previewAssessment(plan, draft)
    : assessment.results;
  const availableSections = sections.filter((section) =>
    plan.questions.some((q) => q.section === section),
  );
  const currentSectionQuestions = plan.questions.filter(
    (q) => q.section === active && q.scored,
  );

  useEffect(() => {
    if (paused || !queue.dirty || queue.error) return;
    const timer = setTimeout(() => {
      void queue.flush();
    }, 1000);
    return () => clearTimeout(timer);
  }, [draft, paused, queue]);
  useEffect(() => {
    function unload(event: BeforeUnloadEvent) {
      if (queue.dirty || queue.saving) event.preventDefault();
    }
    function click(event: MouseEvent) {
      const anchor = (event.target as HTMLElement).closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || !queue.dirty) return;
      if (
        anchor.href === window.location.href ||
        anchor.getAttribute("href")?.startsWith("#")
      )
        return;
      if (
        !window.confirm(
          "Some assessment edits have not been saved. Stay here to save them, or leave without those edits?",
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [queue]);
  useEffect(() => {
    if (!pdfReport) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const toastId = toast.loading("Generating assessment PDF...");
      try {
        const { createAssessmentPdfBlob } = await import("@/lib/recruitment/assessment-pdf");
        const blob = await createAssessmentPdfBlob({
          assessment: pdfReport,
          candidate: context.candidate.name,
          role: context.role.title,
          logoSource: new URL("/aspom-logo.png", window.location.origin).href,
        });
        if (cancelled) {
          toast.dismiss(toastId);
          return;
        }
        const safeName = context.candidate.name
          .trim()
          .replace(/[^a-zA-Z0-9_-]/g, "_");
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Applicant_Assessment_${safeName}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        toast.success("Assessment PDF downloaded successfully.", { id: toastId });
      } catch (error) {
        console.error("Failed to generate assessment PDF:", error);
        toast.error("Failed to generate assessment PDF.", { id: toastId });
      } finally {
        if (!cancelled) setPdfReport(null);
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pdfReport, context.candidate.name, context.role.title]);
  useEffect(() => {
    if (
      downloadOnLoad &&
      assessment.state === "submitted" &&
      !downloadHandled.current
    ) {
      downloadHandled.current = true;
      setPdfReport({ ...assessment });
    }
  }, [assessment, downloadOnLoad]);
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (active === "prepare" || active === "practical" || paused || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key >= "1" && event.key <= "5" && active !== "review") {
        const question = currentSectionQuestions.find(
          (item) => item.scored && !(item.section === "practical" && plan.practical_module) && !draft.answers.find((answer) => answer.question_id === item.id)?.score,
        );
        if (question) {
          event.preventDefault();
          answer(question.id, "score", Number(event.key));
        }
      }
      if (event.key === "ArrowRight" && active !== "review") {
        event.preventDefault();
        const index = availableSections.indexOf(active);
        setActive(availableSections[index + 1] ?? "review");
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [active, availableSections, currentSectionQuestions, draft.answers, paused, plan.practical_module]);

  function change(next: AssessmentDraft) {
    setDraft(next);
    queue.update(next);
    setError("");
  }
  function answer(
    id: string,
    field: "notes" | "score",
    value: string | number | null,
  ) {
    change({
      ...draft,
      answers: draft.answers.map((a) =>
        a.question_id === id ? { ...a, [field]: value } : a,
      ),
    });
  }
  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (!(await queue.flush())) return;
      const result = await submitApplicantAssessment(
        context.candidate.id,
        context.role.id,
        { ...queue.draft, revision: queue.revision },
      );
      if (result.success) {
        setAssessment(result.data);
        setActive("review");
      } else {
        setError(result.error);
        if (result.errorCode === "HTTP_409") {
          queue.error = { message: result.error, code: result.errorCode };
          force();
        }
      }
    } catch {
      setError(
        "Submission could not be confirmed. Retry to check whether it completed.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function reopen() {
    setBusy(true);
    setError("");
    try {
      const result = await reopenApplicantAssessment(
        context.candidate.id,
        context.role.id,
        assessment.revision,
        reopenReason,
      );
      if (result.success) onReplace(result.data);
      else setError(result.error);
    } catch {
      setError("The assessment could not be reopened. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  async function loadConflict() {
    setBusy(true);
    setError("");
    try {
      const result = await getApplicantAssessment(context.candidate.id);
      if (result.success) setConflict(result.data);
      else setError(result.error);
    } catch {
      setError("The saved version could not be loaded. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  async function viewHistory(id: string) {
    setBusy(true);
    setError("");
    try {
      const result = await getAssessmentRevision(context.candidate.id, id);
      if (result.success && result.data.snapshot)
        setHistory(result.data.snapshot);
      else
        setError(
          result.success
            ? "No submitted result is attached to this event."
            : result.error,
        );
    } catch {
      setError("The previous result could not be loaded. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  const saveText = queue.error
    ? "Not saved"
    : queue.saving
      ? "Saving…"
      : queue.dirty
        ? "Unsaved changes"
        : `Saved · ${new Date(assessment.updated_at).toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit" })}`;
  if (history)
    return (
      <div className="w-full space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button
            className="h-10"
            variant="outline"
            onClick={() => setHistory(null)}
          >
            Back to current assessment
          </Button>
          <Button
            className="h-10"
            variant="outline"
            disabled={!!pdfReport}
            onClick={() => setPdfReport({ ...history })}
          >
            <Download className="size-4" />
            Download previous result PDF
          </Button>
        </div>
        <AssessmentReport
          assessment={history}
          candidate={context.candidate.name}
          role={context.role.title}
        />
      </div>
    );
  return (
    <div className="w-full space-y-6">
      <Link
        href={`/hr/recruitment/${context.role.id}`}
        className="inline-flex items-center gap-2 text-sm hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to {context.role.title}
      </Link>
      <header className="space-y-3 border-b pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Applicant Assessment
            </h1>
            <p className="mt-1 text-base font-medium">{context.candidate.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.track.name} · {context.role.title} ·{" "}
              {assessment.state === "submitted" ? "Submitted" : "Draft"}
            </p>
          </div>
          <p
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            {queue.saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : !queue.dirty && !queue.error ? (
              <Check className="size-4" />
            ) : null}
            {saveText}
          </p>
        </div>

      </header>
      {!editable && assessment.state === "draft" && (
        <p className="rounded-md border bg-muted/40 p-4 text-sm">
          This draft is read-only while the applicant is{" "}
          {context.candidate.status}. Return them to Interviewing to continue.
        </p>
      )}
      {queue.error && (
        <div
          role="alert"
          className="space-y-3 rounded-md border border-destructive/40 p-4"
        >
          <p className="text-sm text-destructive">{queue.error.message}</p>
          <p className="text-sm">Your current edits remain on this page.</p>
          {queue.error.code === "HTTP_409" ? (
            <Button
              className="h-10"
              variant="outline"
              disabled={busy}
              onClick={loadConflict}
            >
              Load saved version to compare
            </Button>
          ) : (
            <Button
              className="h-10"
              variant="outline"
              disabled={queue.saving || busy}
              onClick={() => {
                void queue.retry();
              }}
            >
              Retry save
            </Button>
          )}
        </div>
      )}
      {conflict?.assessment && (
        <AssessmentConflict
          latest={conflict.assessment}
          local={draft}
          canMerge={
            conflict.candidate.status === "interviewing" &&
            conflict.assessment.state === "draft"
          }
          onResolve={(merged) => {
            onReplace(conflict.assessment!, merged, conflict);
          }}
          onCancel={() => setConflict(null)}
        />
      )}
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[190px_minmax(0,1fr)]">
        <nav
          aria-label="Interview sections"
          className="flex gap-2 overflow-x-auto lg:sticky lg:top-4 lg:flex-col"
        >
          <p className="hidden px-3 pb-1 text-sm text-muted-foreground lg:block">
            {results.completed}/{results.total} complete
          </p>
          {["prepare" as const, ...availableSections, "review" as const].map((section) => {
            const qs = plan.questions.filter(
              (q) => q.section === section && q.scored,
            );
            const taskCriteria = plan.practical_module?.criteria ?? [];
            const complete = section === "practical" && taskCriteria.length
              ? taskCriteria.filter(c => draft.practical_marks[c.id] != null).length
              : qs.filter(q => !results.missing.includes(q.id)).length;
            const count = section === "practical" && taskCriteria.length ? taskCriteria.length : qs.length;
            return (
              <div key={section} className="shrink-0">
                {section === availableSections[0] && <p className="mb-1 mt-3 hidden px-3 text-xs font-medium text-muted-foreground lg:block">During the interview</p>}
                {(section === "practical" || (!plan.weights.practical && section === "review")) && <p className="mb-1 mt-3 hidden px-3 text-xs font-medium text-muted-foreground lg:block">After the interview</p>}
              <button
                key={section}
                type="button"
                aria-current={active === section ? "step" : undefined}
                onClick={() => setActive(section)}
                className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active === section ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                <span>
                  {section === "prepare" ? "Preparation" : section === "review" ? "Review & submit" : section === "practical" ? "Mark practical work" : assessmentSectionNames[section]}
                </span>
                {count > 0 && (
                  <span className="tabular-nums">
                    {complete}/{count}
                  </span>
                )}
              </button>
              </div>
            );
          })}
        </nav>
        <main className="min-w-0 space-y-6">
          {active === "prepare" ? (
            <AssessmentPreparation plan={plan} draft={draft} disabled={paused} onChange={change} onContinue={() => setActive(availableSections[0] ?? "review")} />
          ) : active !== "review" ? (
            <>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">
                  {active === "practical" ? "Mark practical work" : assessmentSectionNames[active]}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {active === "practical" ? "After the interview, review the completed work and enter each mark below. Leave it blank until reviewed." : active === "expectations" ? "These answers do not affect the score." : "Ask the question, listen to the response, and add a score."}
                </p>

                {active === "practical" && plan.practical_module && (
                  <>
                    <PracticalWorkspace plan={plan} marks={draft.practical_marks} notes={draft.unscored_responses} disabled={paused} onChange={(marks) => change({...draft, practical_marks: marks})} onNotes={(id, note) => change({...draft, unscored_responses: {...draft.unscored_responses, [id]: note}})} />
                    {!plan.practical_modules?.length && plan.questions.filter(q => q.section === "practical" && q.scored).slice(0, 1).map(question => (
                      <details key={question.id} className="mt-4 text-sm text-muted-foreground">
                        <summary className="cursor-pointer">Practical evidence (optional)</summary>
                        <Textarea className="mt-2 min-h-20" aria-label="Practical evidence" disabled={paused} value={draft.answers.find(a => a.question_id === question.id)?.notes ?? ""} onChange={event => answer(question.id, "notes", event.target.value)} />
                      </details>
                    ))}
                  </>
                )}
              </div>
              {plan.questions
                .filter((q) => q.section === active && !(active === "practical" && plan.practical_module))
                .map((question, index) => {
                  const value = draft.answers.find(
                    (a) => a.question_id === question.id,
                  );
                  return (
                    <section
                      id={question.id}
                      key={question.id}
                      className="space-y-3 border-b pb-5"
                    >
                      {plan.track.id === "accounts" && question.section === "role" && (
                        <p className="text-xs text-muted-foreground">{question.scoring_section === "interview" ? "Structured interview · 10 points total" : "Additional role knowledge · 10 points total"}</p>
                      )}
                      <h3 className="text-base font-medium leading-relaxed">
                        {index + 1}. {question.text}
                      </h3>
                      {question.scored && !(question.section === "practical" && plan.practical_module) && (
                        <>
                          <p className="text-sm text-muted-foreground">
                            {plan.competencies[question.competency ?? ""]}
                          </p>
                          <fieldset disabled={paused} className="space-y-2">
                            <legend className="mb-2 text-sm font-medium">
                              Score
                            </legend>
                            <div className="flex flex-wrap gap-2">
                              {[1, 2, 3, 4, 5].map((score) => (
                                <label
                                  key={score}
                                  className={`relative flex min-h-11 min-w-12 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 text-sm has-focus-visible:ring-2 has-focus-visible:ring-ring ${value?.score === score ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                                >
                                  <input
                                    className="sr-only"
                                    type="radio"
                                    name={`grade-${question.id}`}
                                    aria-label={`${score} out of 5`}
                                    checked={value?.score === score}
                                    onChange={() =>
                                      answer(question.id, "score", score)
                                    }
                                  />
                                  {score}
                                </label>
                              ))}
                            </div>
                            {value?.score != null && editable && (
                              <button
                                className="min-h-9 text-sm text-muted-foreground underline underline-offset-4"
                                type="button"
                                onClick={() =>
                                  answer(question.id, "score", null)
                                }
                                disabled={paused}
                              >
                                Clear grade
                              </button>
                            )}
                          </fieldset>
                          <details className="text-sm">
                            <summary className="w-fit cursor-pointer rounded-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                              Question-specific guidance & follow-ups
                            </summary>
                            <dl className="mt-3 space-y-2 leading-relaxed">
                              {Object.entries(question.anchors ?? {}).map(
                                ([score, text]) => (
                                  <div key={score}>
                                    <dt className="inline font-medium">
                                      {score}/5:{" "}
                                    </dt>
                                    <dd className="inline text-muted-foreground">
                                      {text}
                                    </dd>
                                  </div>
                                ),
                              )}
                            </dl>
                            <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
                              {question.follow_ups.map((prompt) => (
                                <li key={prompt}>{prompt}</li>
                              ))}
                            </ul>
                          </details>
                        </>
                      )}
                      <details
                        className="space-y-2"
                        open={!question.scored || undefined}
                      >
                        <summary className="cursor-pointer text-sm text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring">
                          {value?.notes || draft.unscored_responses[question.id]
                            ? "View / edit notes"
                            : "Add notes (optional)"}
                        </summary>
                        <label
                          htmlFor={`notes-${question.id}`}
                          className="text-sm font-medium"
                        >
                          {question.scored ? "Notes (optional)" : "Notes"}
                        </label>
                        <Textarea
                          id={`notes-${question.id}`}
                          className="min-h-16 text-sm md:text-sm"
                          maxLength={10000}
                          disabled={paused}
                          value={
                            question.scored
                              ? (value?.notes ?? "")
                              : (draft.unscored_responses[question.id] ?? "")
                          }
                          onChange={(event) =>
                            question.scored
                              ? answer(question.id, "notes", event.target.value)
                              : change({
                                  ...draft,
                                  unscored_responses: {
                                    ...draft.unscored_responses,
                                    [question.id]: event.target.value,
                                  },
                                })
                          }
                        />
                      </details>
                    </section>
                  );
                })}
              <Button
                className="h-11 px-4 text-sm"
                onClick={() => {
                  const i = availableSections.indexOf(active);
                  setActive(availableSections[i + 1] ?? "review");
                }}
              >
                {active === "closing" && plan.weights.practical ? "Continue to practical marking" : active === "practical" ? "Review assessment" : `Continue to ${availableSections[availableSections.indexOf(active) + 1] ? assessmentSectionNames[availableSections[availableSections.indexOf(active) + 1]] : "review"}`}
              </Button>
              {active !== "practical" && currentSectionQuestions.length > 0 && (
                <p className="text-xs text-muted-foreground">Tip: press 1–5 to grade the next unscored question in this section. Use → to continue.</p>
              )}
            </>
          ) : (
            <>
              <AssessmentResultsView
                results={results}
                provisional={assessment.state === "draft"}
              />
              {results.missing.length > 0 && (
                <div className="space-y-3 rounded-md border p-3">
                  <h3 className="font-medium">
                    Complete these answers before submission
                  </h3>
                  <ul className="space-y-2">
                    {plan.questions
                      .filter((q) => results.missing.includes(q.id))
                      .map((q) => (
                        <li key={q.id}>
                          <button
                            type="button"
                            className="text-left text-sm text-primary underline underline-offset-4"
                            onClick={() => setActive(q.section)}
                          >
                            {q.text}
                          </button>
                        </li>
                      ))}
                    {results.missing.includes("practical-module") && (
                      <li>
                        <button type="button" className="text-left text-sm text-primary underline underline-offset-4" onClick={() => setActive("practical")}>
                          Complete practical task marks
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              <div className="space-y-5 border-t pt-6">
                {(
                  [
                    ["strengths", "Key strengths"],
                    ["concerns", "Key concerns"],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field} className="space-y-2">
                    <label htmlFor={field} className="text-sm font-medium">
                      {label}
                    </label>
                    <Textarea
                      className="min-h-24 text-sm md:text-sm"
                      id={field}
                      disabled={paused}
                      maxLength={10000}
                      value={draft[field]}
                      onChange={(event) =>
                        change({ ...draft, [field]: event.target.value })
                      }
                    />
                  </div>
                ))}
                <fieldset className="space-y-3 rounded-lg border bg-muted/20 p-3">
                  <legend className="px-1 text-sm font-semibold">
                    Hiring details <span className="font-normal text-muted-foreground">(optional)</span>
                  </legend>
                  <p className="text-sm text-muted-foreground">
                    Keep the offer details with the interview decision instead of completing a separate rubric.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {([
                      ["reviewer_designation", "Reviewer designation", "text"],
                      ["availability_to_resume", "Availability to resume", "text"],
                      ["salary_expectation", "Salary expectation (NGN)", "number"],
                      ["recommended_salary", "Recommended salary (NGN)", "number"],
                    ] as const).map(([field, label, type]) => (
                      <div key={field} className="space-y-2">
                        <label htmlFor={`hiring-${field}`} className="text-sm font-medium">{label}</label>
                        <Input
                          id={`hiring-${field}`}
                          type={type}
                          min={type === "number" ? 0 : undefined}
                          disabled={paused}
                          value={draft.hiring_review[field] ?? ""}
                          onChange={(event) =>
                            change({
                              ...draft,
                              hiring_review: {
                                ...draft.hiring_review,
                                [field]: type === "number" ? (event.target.value === "" ? null : Number(event.target.value)) : event.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                    <div className="space-y-2">
                      <label htmlFor="hiring-nysc" className="text-sm font-medium">NYSC status</label>
                      <select id="hiring-nysc" className={`${controlClass} w-full`} disabled={paused} value={draft.hiring_review.nysc_status} onChange={(event) => change({ ...draft, hiring_review: { ...draft.hiring_review, nysc_status: event.target.value } })}>
                        <option value="">Not recorded</option><option>Completed</option><option>In progress</option><option>Exempt</option><option>Not applicable</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="hiring-accommodation" className="text-sm font-medium">Accommodation</label>
                      <select id="hiring-accommodation" className={`${controlClass} w-full`} disabled={paused} value={draft.hiring_review.accommodation} onChange={(event) => change({ ...draft, hiring_review: { ...draft.hiring_review, accommodation: event.target.value } })}>
                        <option value="">Not recorded</option><option>Not needed</option><option>Required</option><option>To discuss</option>
                      </select>
                    </div>
                  </div>
                </fieldset>
                <div className="space-y-2">
                  <label
                    htmlFor="assessment-recommendation"
                    className="block text-sm font-medium"
                  >
                    Recommendation (required)
                  </label>
                  <select
                    id="assessment-recommendation"
                    className={`${controlClass} w-full`}
                    value={draft.recommendation}
                    disabled={paused}
                    onChange={(event) =>
                      change({ ...draft, recommendation: event.target.value })
                    }
                  >
                    <option value="">Choose your recommendation</option>
                    {["Strong hire", "Hire", "Hold", "Do not hire"].map(
                      (item) => (
                        <option key={item}>{item}</option>
                      ),
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="assessment-rationale"
                    className="text-sm font-medium"
                  >
                    Reason for recommendation (required)
                  </label>
                  <Textarea
                    id="assessment-rationale"
                    className="min-h-16 text-sm md:text-sm"
                    maxLength={10000}
                    value={draft.rationale}
                    disabled={paused}
                    onChange={(event) =>
                      change({ ...draft, rationale: event.target.value })
                    }
                  />
                </div>
              </div>
              {editable && (
                <div className="space-y-3 border-t pt-5">
                  <p className="text-sm text-muted-foreground">
                    Submission preserves the assessment and your recommendation.
                    HR can then decide the applicant’s next step.
                  </p>
                  <Button
                    className="h-11 px-5 text-sm"
                    disabled={
                      busy ||
                      !!queue.error ||
                      !!results.missing.length ||
                      !draft.recommendation ||
                      !draft.rationale.trim() ||
                      !draft.interviewer_name.trim() ||
                      !draft.interview_date
                    }
                    onClick={submit}
                  >
                    {busy && <Loader2 className="size-4 animate-spin" />}Submit
                    assessment
                  </Button>
                </div>
              )}
              <Button
                className="h-11 px-4 text-sm"
                variant="outline"
                disabled={!!pdfReport}
                onClick={() => setPdfReport({ ...assessment })}
              >
                <Download className="size-4" />
                Download assessment PDF
              </Button>
              {assessment.state === "submitted" && (
                <div className="space-y-5 border-t pt-6">
                  <p className="text-sm text-muted-foreground">
                    Submitted by {assessment.submitted_by?.name} ·{" "}
                    {assessment.submitted_at
                      ? new Date(assessment.submitted_at).toLocaleString(
                          "en-GB",
                          { timeZone: "Africa/Lagos" },
                        )
                      : ""}{" "}
                    · Revision {assessment.revision}
                  </p>
                  {context.candidate.status === "interviewing" && (
                    <details className="space-y-3">
                      <summary className="w-fit cursor-pointer text-sm underline underline-offset-4">
                        Correct this assessment
                      </summary>
                      <div className="space-y-3 pt-3">
                        <label
                          htmlFor="reopen-reason"
                          className="text-sm font-medium"
                        >
                          Reason for reopening
                        </label>
                        <Textarea
                          id="reopen-reason"
                          value={reopenReason}
                          maxLength={2000}
                          onChange={(event) =>
                            setReopenReason(event.target.value)
                          }
                          disabled={busy}
                        />
                        <p className="text-sm text-muted-foreground">
                          The submitted result stays in history. Corrections
                          create a new version.
                        </p>
                        <Button
                          className="h-10"
                          variant="outline"
                          disabled={busy || reopenReason.trim().length < 3}
                          onClick={reopen}
                        >
                          Reopen for correction
                        </Button>
                      </div>
                    </details>
                  )}
                </div>
              )}
              {!!assessment.revisions?.length && (
                <section className="space-y-3 border-t pt-6">
                  <h3 className="font-semibold">Assessment history</h3>
                  <ul className="divide-y">
                    {assessment.revisions.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                      >
                        <div>
                          <p>
                            Revision {item.revision} · {item.event} ·{" "}
                            {item.actor.name}
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            {new Date(item.created_at).toLocaleString("en-GB", {
                              timeZone: "Africa/Lagos",
                            })}
                            {item.reason ? ` · ${item.reason}` : ""}
                          </p>
                        </div>
                        {item.event === "submitted" && (
                          <Button
                            variant="outline"
                            className="h-10"
                            disabled={busy}
                            onClick={() => viewHistory(item.id)}
                          >
                            View result
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </main>

      </div>

    </div>
  );
}

function AssessmentConflict({
  latest,
  local,
  canMerge,
  onResolve,
  onCancel,
}: {
  latest: ApplicantAssessment;
  local: AssessmentDraft;
  canMerge: boolean;
  onResolve: (draft?: AssessmentDraft) => void;
  onCancel: () => void;
}) {
  const saved = assessmentDraft(latest);
  const fields = [
    "interviewer_name",
    "interview_date",
    "strengths",
    "concerns",
    "recommendation",
    "rationale",
  ] as const;
  const diffs: { key: string; label: string; mine: string; theirs: string }[] =
    [];
  for (const field of fields)
    if (local[field] !== saved[field])
      diffs.push({
        key: field,
        label: field.replaceAll("_", " "),
        mine: local[field],
        theirs: saved[field],
      });
  for (const q of latest.plan_snapshot.questions) {
    if (q.scored) {
      const mine = local.answers.find((a) => a.question_id === q.id),
        theirs = saved.answers.find((a) => a.question_id === q.id);
      if (JSON.stringify(mine) !== JSON.stringify(theirs))
        diffs.push({
          key: q.id,
          label: q.text,
          mine: `${mine?.score ?? "Unscored"}/5 — ${mine?.notes ?? ""}`,
          theirs: `${theirs?.score ?? "Unscored"}/5 — ${theirs?.notes ?? ""}`,
        });
    } else if (
      (local.unscored_responses[q.id] ?? "") !==
      (saved.unscored_responses[q.id] ?? "")
    )
      diffs.push({
        key: q.id,
        label: q.text,
        mine: local.unscored_responses[q.id] ?? "",
        theirs: saved.unscored_responses[q.id] ?? "",
      });
  }
  const [choices, setChoices] = useState<Record<string, "mine" | "theirs">>({});
  for (const criterion of latest.plan_snapshot.practical_module?.criteria ?? []) {
    const mine = local.practical_marks[criterion.id] ?? null;
    const theirs = saved.practical_marks[criterion.id] ?? null;
    if (mine !== theirs) diffs.push({key: `practical:${criterion.id}`, label: criterion.label, mine: mine == null ? "Not marked" : `${mine}/${criterion.max}`, theirs: theirs == null ? "Not marked" : `${theirs}/${criterion.max}`});
  }
  function merge() {
    const next = {
      ...saved,
      answers: [...saved.answers],
      unscored_responses: { ...saved.unscored_responses },
      practical_marks: { ...saved.practical_marks },
    };
    for (const criterion of latest.plan_snapshot.practical_module?.criteria ?? []) {
      if (choices[`practical:${criterion.id}`] === "mine") next.practical_marks[criterion.id] = local.practical_marks[criterion.id] ?? null;
    }
    for (const field of fields)
      if (choices[field] === "mine") next[field] = local[field];
    for (const q of latest.plan_snapshot.questions)
      if (choices[q.id] === "mine") {
        if (q.scored)
          next.answers = next.answers.map((a) =>
            a.question_id === q.id
              ? local.answers.find((item) => item.question_id === q.id)!
              : a,
          );
        else
          next.unscored_responses[q.id] = local.unscored_responses[q.id] ?? "";
      }
    onResolve(next);
  }
  return (
    <section className="space-y-4 rounded-lg border p-5">
      <h2 className="text-xl font-semibold">
        Compare your edits with revision {latest.revision}
      </h2>
      <p className="text-sm">
        Choose which value to keep for each difference. Your edits have not
        overwritten the saved assessment.
      </p>
      {!canMerge && (
        <p className="text-sm">
          The assessment is now read-only. You can view the saved record or keep
          this page open to copy your notes.
        </p>
      )}
      {diffs.map((diff) => (
        <fieldset key={diff.key} className="space-y-3 border-t pt-4">
          <legend className="pt-4 text-sm font-medium">{diff.label}</legend>
          {(["mine", "theirs"] as const).map((choice) => (
            <label key={choice} className="flex items-start gap-3 text-sm">
              <input
                type="radio"
                name={`conflict-${diff.key}`}
                disabled={!canMerge}
                checked={choices[diff.key] === choice}
                onChange={() =>
                  setChoices((current) => ({ ...current, [diff.key]: choice }))
                }
                className="mt-1 accent-primary"
              />
              <span>
                <span className="block font-medium">
                  {choice === "mine" ? "My value" : "Saved value"}
                </span>
                <span className="mt-1 block whitespace-pre-wrap break-words text-muted-foreground">
                  {diff[choice] || "Empty"}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-3">
        {canMerge && (
          <Button
            className="h-10"
            disabled={diffs.some((diff) => !choices[diff.key])}
            onClick={merge}
          >
            Apply choices and save
          </Button>
        )}
        <Button
          className="h-10"
          variant="outline"
          onClick={() => {
            if (
              !diffs.length ||
              window.confirm(
                "Use the saved assessment and discard your differing edits?",
              )
            )
              onResolve();
          }}
        >
          Use saved assessment
        </Button>
        <Button className="h-10" variant="ghost" onClick={onCancel}>
          Keep comparing later
        </Button>
      </div>
    </section>
  );
}
