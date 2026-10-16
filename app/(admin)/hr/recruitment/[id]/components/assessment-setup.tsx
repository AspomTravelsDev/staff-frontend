"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveAssessmentPlan } from "@/lib/api/applicant-assessment";
import type {
  AssessmentBank,
  AssessmentPlan,
} from "@/lib/types/applicant-assessment";
import type { RecruitmentRole } from "@/lib/types/recruitment";
import {
  assessmentConfigurationIssues,
  configurationFromDefinition,
  defaultAssessmentConfiguration,
  suggestedAssessmentTrack,
} from "@/lib/recruitment/assessment-configuration";
import { AssessmentQuestionPicker } from "../../components/assessment-question-picker";

export function AssessmentSetup({
  role,
  bank,
  initialPlan,
}: {
  role: RecruitmentRole;
  bank: AssessmentBank;
  initialPlan: AssessmentPlan | null;
}) {
  const [plan, setPlan] = useState(initialPlan);
  const [configuration, setConfiguration] = useState(() =>
    initialPlan
      ? configurationFromDefinition(
          initialPlan.definition,
          bank,
          !!initialPlan.locked_at,
        )
      : defaultAssessmentConfiguration(
          bank,
          suggestedAssessmentTrack(role.department),
        ),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [conflict, setConflict] = useState(false);
  const locked = !!plan?.locked_at;
  const original = plan
    ? configurationFromDefinition(plan.definition, bank, true)
    : null;
  const dirty =
    !original ||
    plan?.definition.bank_version !== bank.version ||
    JSON.stringify(original.custom_questions) !==
      JSON.stringify(configuration.custom_questions) ||
    original.track !== configuration.track ||
    original.practical !== configuration.practical ||
    JSON.stringify([...original.question_ids].sort()) !==
      JSON.stringify([...configuration.question_ids].sort());
  const issues = assessmentConfigurationIssues(bank, configuration);
  async function save() {
    setBusy(true);
    setMessage("");
    setError(false);
    try {
      const result = await saveAssessmentPlan(role.id, {
        revision: plan?.revision ?? 0,
        ...configuration,
      });
      if (result.success) {
        setPlan(result.data);
        setMessage(
          "Question set saved. You can now start applicant assessments.",
        );
      } else {
        setError(true);
        setMessage(result.error);
        setConflict(result.errorCode === "HTTP_409");
      }
    } catch {
      setError(true);
      setMessage("The question set could not be saved. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link
        href={`/hr/recruitment/${role.id}`}
        className="inline-flex min-h-10 items-center gap-2 text-sm underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" />
        Back to {role.title}
      </Link>
      <header className="space-y-2 border-b pb-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Applicant Assessment setup
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every applicant receives all general questions plus the talent and
          role questions selected for this vacancy.
        </p>
      </header>
      {locked && (
        <p className="flex items-start gap-2 rounded-md border bg-muted/30 p-3 text-sm">
          <LockKeyhole className="mt-0.5 size-4 shrink-0" />
          This question set is locked because interviews have started. Existing
          interviews retain their saved questions. Bank{" "}
          {plan.definition.bank_version}.
        </p>
      )}
      {!locked && plan && plan.definition.bank_version !== bank.version && <p className="rounded-md border bg-muted/30 p-3 text-sm">A new department assessment pack is available. Review the updated questions and tasks, then save to use it for this vacancy.</p>}
      <AssessmentQuestionPicker
        bank={bank}
        value={configuration}
        onChange={setConfiguration}
        disabled={locked || busy}
        lockedQuestions={locked ? plan.definition.questions : undefined}
        lockedDefinition={locked ? plan.definition : undefined}
      />
      {!locked && issues.length > 0 && (
        <p role="status" className="text-sm text-destructive">
          {issues[0]}
        </p>
      )}
      <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t bg-background py-3">
        <p
          role={error ? "alert" : "status"}
          className={`max-w-xl text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}
        >
          {message ||
            (locked
              ? "Preserved for every interview in this vacancy."
              : dirty
                ? "You have unsaved changes."
                : "Question set saved.")}
        </p>
        {!locked && (
          <Button
            className="h-11 px-5 text-sm"
            onClick={save}
            disabled={!!issues.length || busy || conflict || !dirty}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}Save question
            set
          </Button>
        )}
        {conflict && (
          <Button
            className="h-11"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Reload setup
          </Button>
        )}
      </footer>
    </div>
  );
}
