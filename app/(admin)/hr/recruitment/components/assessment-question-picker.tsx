"use client";

import { useId, useState } from "react";
import { Check, ClipboardList } from "lucide-react";
import {
  assessmentSectionNames,
  type AssessmentBank,
  type AssessmentConfiguration,
  type AssessmentQuestion,
  type AssessmentDefinition,
  type AssessmentSection,
} from "@/lib/types/applicant-assessment";
import { defaultAssessmentConfiguration } from "@/lib/recruitment/assessment-configuration";

export function AssessmentQuestionPicker({
  bank,
  value,
  onChange,
  disabled = false,
  lockedQuestions,
  lockedDefinition,
}: {
  bank: AssessmentBank;
  value: AssessmentConfiguration;
  onChange: (value: AssessmentConfiguration) => void;
  disabled?: boolean;
  lockedQuestions?: AssessmentQuestion[];
  lockedDefinition?: AssessmentDefinition;
}) {
  const id = useId();
  const [active, setActive] = useState<AssessmentSection>("talent");
  const questions =
    lockedQuestions?.filter((q) => !q.custom) ??
    bank.questions.filter(
      (q) => q.scored && (!q.track || q.track === value.track),
    );
  const general = questions.filter((q) => q.section === "general");
  const tabs: AssessmentSection[] = value.practical
    ? ["talent", "role", "practical"]
    : ["talent", "role"];
  const section = tabs.includes(active) ? active : "talent";
  const chosen = questions.filter((q) => value.question_ids.includes(q.id));
  const selectedTrack = bank.tracks.find(track => track.id === value.track);
  const practicalModules = lockedDefinition ? lockedDefinition.practical_modules : selectedTrack?.practical_modules;
  const weights = lockedDefinition?.weights ?? selectedTrack?.assessment_weights;
  function togglePractical(enabled: boolean) {
    setActive(enabled ? "practical" : "talent");
    onChange({
      ...value,
      practical: enabled,
      question_ids: enabled
        ? [...new Set([...value.question_ids, `${value.track}-practical-1`])]
        : value.question_ids.filter(
            (questionId) => !questionId.includes("-practical-"),
          ),
    });
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="space-y-2">
          <label htmlFor={`${id}-track`} className="text-sm font-medium">
            Interview track
          </label>
          <select
            id={`${id}-track`}
            value={value.track}
            disabled={disabled}
            onChange={(event) => {
              setActive("talent");
              onChange({
                ...defaultAssessmentConfiguration(bank, event.target.value),
                custom_questions: value.custom_questions,
              });
            }}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Choose an assessment track</option>
            {bank.tracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </select>
        </div>
        <label className="flex min-h-11 items-center gap-3 rounded-md border px-3 text-sm">
          <input
            type="checkbox"
            checked={value.practical}
            disabled={disabled || !value.track}
            onChange={(event) => togglePractical(event.target.checked)}
            className="size-4 accent-primary"
          />
          Include a practical task
        </label>
      </div>
      <p className="text-sm text-muted-foreground">
        The department suggests a track. Use Graduate Trainees for entry-level
        applicants in any department.
      </p>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Check className="size-4 text-primary" />
        All {general.length} general questions are included automatically.
      </p>
      {value.track ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ClipboardList className="size-4 text-muted-foreground" />
              {chosen.length + (value.custom_questions?.length ?? 0)} scored
              questions
            </div>
            <p className="text-xs text-muted-foreground">
              {value.practical
                ? Object.entries(weights ?? {}).filter(([,weight]) => weight).map(([section,weight]) => `${assessmentSectionNames[section as AssessmentSection]} ${weight}%`).join(" · ")
                : "General 20% · Talent 40% · Role 40%"}
            </p>
          </div>
          <div
            role="tablist"
            aria-label="Question sections"
            className="flex gap-1 overflow-x-auto rounded-md bg-muted/40 p-1"
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                id={`${id}-tab-${tab}`}
                aria-selected={section === tab}
                aria-controls={`${id}-questions`}
                onClick={() => setActive(tab)}
                tabIndex={section === tab ? 0 : -1}
                onKeyDown={(event) => {
                  if (
                    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      event.key,
                    )
                  )
                    return;
                  event.preventDefault();
                  const index =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? tabs.length - 1
                        : (tabs.indexOf(tab) +
                            (event.key === "ArrowRight" ? 1 : -1) +
                            tabs.length) %
                          tabs.length;
                  setActive(tabs[index]);
                  event.currentTarget.parentElement
                    ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                    [index]?.focus();
                }}
                className={`min-h-10 shrink-0 rounded-md px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${section === tab ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {assessmentSectionNames[tab]}{" "}
                <span className="ml-2 tabular-nums">
                  {chosen.filter((q) => q.section === tab).length}
                </span>
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id={`${id}-questions`}
            aria-labelledby={`${id}-tab-${section}`}
            className="divide-y rounded-lg border"
          >
            {section === "practical" && practicalModules?.length ? (
              <div className="divide-y">
                <p className="px-3 py-3 text-sm text-muted-foreground">All tasks below are included as one consistent practical pack. Mark each task during the interview.</p>
                {practicalModules.map(task => <div key={task.id} className="space-y-1 px-3 py-3 text-sm"><p className="font-medium">{task.name}</p><p className="text-muted-foreground">{task.duration_minutes ? `${task.duration_minutes} minutes · ` : "Assessor review · "}{task.criteria.reduce((sum,c) => sum + c.max,0)} marks · {task.criteria.length} criteria</p></div>)}
              </div>
            ) : questions
              .filter((q) => q.section === section)
              .map((question) => (
                <div
                  key={question.id}
                  className={`px-3 py-3 transition-colors ${value.question_ids.includes(question.id) ? "bg-primary/[0.03]" : ""}`}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={value.question_ids.includes(question.id)}
                      disabled={disabled}
                      className="mt-1 size-4 shrink-0 accent-primary"
                      onChange={(event) =>
                        onChange({
                          ...value,
                          question_ids: event.target.checked
                            ? [...value.question_ids, question.id]
                            : value.question_ids.filter(
                                (selectedId) => selectedId !== question.id,
                              ),
                        })
                      }
                    />
                    <span className="min-w-0">
                      <span className="block text-sm leading-relaxed">
                        {question.text}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {bank.competencies[question.competency ?? ""]}
                      </span>
                    </span>
                  </label>
                  {question.anchors && (
                    <details className="ml-7 mt-2 text-xs text-muted-foreground">
                      <summary className="w-fit cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        Scoring guidance
                      </summary>
                      <dl className="mt-3 space-y-2 leading-relaxed">
                        {Object.entries(question.anchors).map(
                          ([score, text]) => (
                            <div key={score}>
                              <dt className="inline font-medium text-foreground">
                                {score}/5:{" "}
                              </dt>
                              <dd className="inline">{text}</dd>
                            </div>
                          ),
                        )}
                      </dl>
                    </details>
                  )}
                </div>
              ))}
          </div>
          <section
            className="space-y-3 border-t pt-4"
            aria-label="Custom questions"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Custom role questions</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add questions specific to this vacancy. They contribute to the
                  role section score.
                </p>
              </div>
              {!disabled && (
                <button
                  type="button"
                  disabled={(value.custom_questions?.length ?? 0) >= 20}
                  className="min-h-10 rounded-md border px-3 text-sm font-medium hover:bg-muted disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() =>
                    onChange({
                      ...value,
                      custom_questions: [
                        ...(value.custom_questions ?? []),
                        {
                          id: `custom-${crypto.randomUUID()}`,
                          text: "",
                          competency: "",
                        },
                      ],
                    })
                  }
                >
                  Add custom question
                </button>
              )}
            </div>
            {(value.custom_questions ?? []).map((question, index) => (
              <div
                key={question.id}
                className="space-y-3 rounded-md border p-3"
              >
                <label
                  htmlFor={`${id}-${question.id}`}
                  className="block text-sm font-medium"
                >
                  Custom question {index + 1}
                </label>
                <textarea
                  id={`${id}-${question.id}`}
                  value={question.text}
                  disabled={disabled}
                  maxLength={2000}
                  rows={2}
                  placeholder="What would you like to ask?"
                  className="w-full rounded-md border bg-background p-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) =>
                    onChange({
                      ...value,
                      custom_questions: value.custom_questions?.map((q) =>
                        q.id === question.id
                          ? { ...q, text: event.target.value }
                          : q,
                      ),
                    })
                  }
                />
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <label
                      htmlFor={`${id}-${question.id}-competency`}
                      className="text-sm"
                    >
                      Competency assessed
                    </label>
                    <select
                      id={`${id}-${question.id}-competency`}
                      value={question.competency}
                      disabled={disabled}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                      onChange={(event) =>
                        onChange({
                          ...value,
                          custom_questions: value.custom_questions?.map((q) =>
                            q.id === question.id
                              ? { ...q, competency: event.target.value }
                              : q,
                          ),
                        })
                      }
                    >
                      <option value="">Choose a competency</option>
                      {Object.entries(bank.competencies).map(([key, name]) => (
                        <option key={key} value={key}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!disabled && (
                    <button
                      type="button"
                      aria-label={`Remove custom question ${index + 1}`}
                      className="min-h-10 rounded-md px-3 text-sm text-destructive hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() =>
                        onChange({
                          ...value,
                          custom_questions: value.custom_questions?.filter(
                            (q) => q.id !== question.id,
                          ),
                        })
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </section>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Interview questions use grades 1–5. Practical tasks use criterion marks. Notes are optional. Salary,
            availability and candidate questions are included as unscored
            information. The question set locks when the first interview
            assessment starts.
          </p>
        </>
      ) : (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Choose a track to see suggested talent and role questions.
        </p>
      )}
    </div>
  );
}
