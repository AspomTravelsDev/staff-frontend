import type {
  ApplicantAssessment,
  AssessmentDefinition,
  AssessmentDraft,
  AssessmentResults,
  AssessmentSection,
} from "@/lib/types/applicant-assessment";
import { assessmentSectionNames } from "@/lib/types/applicant-assessment";

// This is a draft preview only. Laravel validates and calculates persisted results.
export function previewAssessment(
  plan: AssessmentDefinition,
  draft: AssessmentDraft,
): AssessmentResults {
  const answers = new Map(draft.answers.map((a) => [a.question_id, a]));
  const sections: AssessmentResults["sections"] = {};
  const competencies: AssessmentResults["competencies"] = {};
  for (const [key, name] of Object.entries(plan.competencies))
    competencies[key] = { name, average: null, count: 0 };
  for (const [key, weight] of Object.entries(plan.weights))
    sections[key] = { weight: weight ?? 0, average: null, count: 0 };
  const missing: string[] = [];
  let total = 0;
  for (const q of plan.questions.filter((q) => q.scored)) {
    if (q.section === "practical" && plan.practical_module) continue;
    total++;
    const answer = answers.get(q.id);
    if (answer?.score == null) missing.push(q.id);
    if (answer?.score != null) {
      for (const value of [
        sections[q.scoring_section && sections[q.scoring_section] ? q.scoring_section : q.section],
        competencies[q.competency ?? ""],
      ]) {
        value.average =
          ((value.average ?? 0) * value.count + answer.score) /
          (value.count + 1);
        value.count++;
      }
    }
  }
  if (plan.practical_module) {
    total++;
    const criteria = plan.practical_module.criteria;
    const complete = criteria.every((criterion) => draft.practical_marks[criterion.id] != null);
    if (!complete) missing.push("practical-module");
    else {
      const maximum = criteria.reduce((sum, criterion) => sum + criterion.max, 0);
      const score = criteria.reduce((sum, criterion) => sum + Number(draft.practical_marks[criterion.id]), 0) / maximum * 5;
      sections.practical.average = score;
      sections.practical.count = 1;
    }
  }
  const overall = missing.length
    ? null
    : Object.values(sections).reduce(
        (sum, section) => sum + ((section.average ?? 0) * section.weight) / 100,
        0,
      );
  const score100 = overall == null ? null : overall * 20;
  const gateItems = score100 == null ? [] : [
    ...Object.entries(plan.decision_rules?.critical_competencies ?? {}).map(([id, minimum]) => ({
      type: "competency" as const,
      id,
      label: competencies[id]?.name ?? id,
      minimum,
      actual: competencies[id]?.average ?? null,
      passed: (competencies[id]?.average ?? 0) >= minimum,
    })),
    ...(plan.practical_module ? [{
      type: "practical" as const,
      id: plan.practical_module.id,
      label: plan.practical_module.name,
      minimum: plan.practical_module.minimum_score,
      actual: sections.practical?.average == null ? null : sections.practical.average * 20,
      passed: (sections.practical?.average ?? 0) * 20 >= plan.practical_module.minimum_score,
    }] : []),
    ...(plan.practical_module?.criteria.filter(c => c.required).map(c => ({
      type: "practical" as const, id: c.id, label: c.label, minimum: c.minimum ?? 1,
      actual: draft.practical_marks[c.id] ?? null,
      passed: (draft.practical_marks[c.id] ?? 0) >= (c.minimum ?? 1),
    })) ?? []),
    ...(plan.practical_modules?.map(task => {
      const maximum = task.criteria.reduce((sum, c) => sum + c.max, 0);
      const actual = task.criteria.reduce((sum, c) => sum + (draft.practical_marks[c.id] ?? 0), 0) / maximum * 100;
      return {type: "practical" as const, id: task.id, label: task.name, minimum: task.minimum_score, actual, passed: actual >= task.minimum_score};
    }) ?? []),
  ];
  const gates = gateItems.length ? { passed: gateItems.every((item) => item.passed), items: gateItems } : undefined;
  const bands = plan.decision_rules?.score_bands;
  const decisionGuidance = score100 == null ? null : gates?.passed === false ? "Do not hire" : score100 >= (bands?.strong_hire ?? 84) ? "Strong hire" : score100 >= (bands?.hire ?? 70) ? "Hire" : score100 >= (bands?.hold ?? 60) ? "Hold" : "Do not hire";
  return {
    sections,
    competencies,
    total,
    completed: total - missing.length,
    missing,
    overall,
    score_100: score100,
    gates,
    decision_guidance: decisionGuidance,
    practical_tasks: plan.practical_modules?.map(task => {
      const complete = task.criteria.every(c => draft.practical_marks[c.id] != null);
      return {id: task.id, name: task.name, maximum: task.criteria.reduce((sum,c) => sum + c.max,0), earned: complete ? task.criteria.reduce((sum,c) => sum + (draft.practical_marks[c.id] ?? 0),0) : null, complete};
    }),
  };
}

export function AssessmentResultsView({
  results,
  provisional = false,
}: {
  results: AssessmentResults;
  provisional?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b pb-4">
        <h2 className="text-xl font-semibold">
          {provisional ? "Assessment preview" : "Assessment result"}
        </h2>
        <p className="text-lg font-semibold tabular-nums">
          {results.overall == null
            ? "Incomplete"
            : `${results.overall.toFixed(2)}/5 · ${results.score_100?.toFixed(1)}/100`}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-3 font-medium">Section scores</h3>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-2 font-normal">Section</th>
                <th className="pb-2 text-right font-normal">Weight</th>
                <th className="pb-2 text-right font-normal">Score /5</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(results.sections).map(([key, value]) => (
                <tr key={key} className="border-t">
                  <td className="py-3">
                    {assessmentSectionNames[key as AssessmentSection]}
                  </td>
                  <td className="text-right tabular-nums">{value.weight}%</td>
                  <td className="text-right tabular-nums">
                    {value.average?.toFixed(2) ?? "Not assessed"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="mb-3 font-medium">Competency scores</h3>
          <dl className="divide-y text-sm">
            {Object.entries(results.competencies).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-3 py-2">
                <dt>
                  {value.name}
                  <span className="block text-xs text-muted-foreground">
                    {value.count} {value.count === 1 ? "answer" : "answers"}
                  </span>
                </dt>
                <dd className="shrink-0 tabular-nums">
                  {value.average?.toFixed(2) ?? "Not assessed"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      {!!results.practical_tasks?.length && <section className="space-y-2 text-sm">
        <h3 className="font-medium">Practical scorecard</h3>
        <dl className="divide-y">{results.practical_tasks.map(task => <div key={task.id} className="flex justify-between gap-3 py-2"><dt>{task.name}</dt><dd className="shrink-0 tabular-nums">{task.earned == null ? "Incomplete" : `${task.earned}/${task.maximum}`}</dd></div>)}</dl>
      </section>}
      {results.gates?.items.length ? (
        <section className="rounded-md border bg-muted/20 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-medium">{provisional ? "Live hiring checks" : "Hiring checks"}</h3>
            <span className={results.gates.passed ? "font-medium text-emerald-700" : "font-medium text-destructive"}>
              {results.gates.passed ? "All required checks passed" : "A required check failed"}
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {results.gates.items.map((gate) => (
              <li key={`${gate.type}-${gate.id}`} className="flex justify-between gap-3">
                <span>{gate.label}</span>
                <span className={gate.passed ? "text-emerald-700" : "text-destructive"}>
                  {gate.actual == null ? "Not assessed" : `${gate.actual.toFixed(gate.type === "practical" ? 0 : 2)} / minimum ${gate.minimum}`}
                </span>
              </li>
            ))}
          </ul>
          {results.decision_guidance && (
            <p className="mt-3 border-t pt-3 text-muted-foreground">
              Hiring guidance: <span className="font-medium text-foreground">{results.decision_guidance}</span>
            </p>
          )}
        </section>
      ) : null}
      {provisional && (
        <p className="text-sm text-muted-foreground">
          Section and competency averages use graded answers so far. A final
          overall score requires a grade for every selected question.
          Competencies describe the same answers and are not added to the total
          again.
        </p>
      )}
    </div>
  );
}

export function AssessmentReport({
  assessment,
  candidate,
  role,
}: {
  assessment: ApplicantAssessment;
  candidate: string;
  role: string;
}) {
  const plan = assessment.plan_snapshot;
  const score = assessment.results.score_100;
  return (
    <article className="assessment-report space-y-6 bg-white text-black">
      <header className="border-b-2 border-emerald-600 pb-5">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src="/aspom-logo.png"
              alt="Aspom Travels"
              crossOrigin="anonymous"
              className="h-12 w-auto object-contain"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Recruitment assessment
              </p>
              <h1 className="mt-1 text-2xl font-bold">{candidate}</h1>
              <p className="mt-1 text-sm text-gray-600">
                {role} · {plan.track.name}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-600">
            <p className="font-semibold uppercase text-gray-900">
              {assessment.state}
            </p>
            <p className="mt-1">Revision {assessment.revision}</p>
            <p className="mt-1">{assessment.interview_date.slice(0, 10)}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t pt-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Interviewer
            </p>
            <p className="mt-1 font-medium">{assessment.interviewer.name}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Question bank
            </p>
            <p className="mt-1 font-medium">{plan.bank_version}</p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-[1fr_220px] gap-4">
        <div className="rounded-md border border-gray-200 bg-gray-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500">
            Assessment outcome
          </p>
          <p className="mt-2 text-2xl font-bold">
            {assessment.recommendation || "Assessment in progress"}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {assessment.results.completed}/{assessment.results.total} scored
            questions completed
          </p>
        </div>
        <div className="rounded-md bg-emerald-700 p-5 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-100">
            Overall score
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums">
            {score == null ? "—" : score.toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-emerald-100">out of 100</p>
          {assessment.results.overall != null && (
            <p className="mt-2 border-t border-emerald-500 pt-2 text-xs text-emerald-100">
              {assessment.results.overall.toFixed(2)} / 5 average
            </p>
          )}
        </div>
      </section>

      {assessment.submitted_by && (
        <p className="text-xs text-gray-600">
          Submitted by {assessment.submitted_by.name} ·{" "}
          {assessment.submitted_at
            ? new Date(assessment.submitted_at).toLocaleString("en-GB", {
                timeZone: "Africa/Lagos",
              })
            : ""}
        </p>
      )}

      {!!plan.practical_modules?.length && <section className="space-y-4">
        <h2 className="border-b border-gray-300 pb-2 text-lg font-bold">Practical marks and critical checks</h2>
        {plan.practical_modules.map(task => <div key={task.id} className="space-y-2">
          <h3 className="font-semibold">{task.name}</h3>
          <dl className="divide-y text-sm">{task.criteria.map(c => <div key={c.id} className="flex justify-between gap-3 py-2"><dt>{c.label}{c.required ? ` · minimum ${c.minimum ?? 1}` : ""}</dt><dd>{assessment.practical_marks?.[c.id] ?? "Not marked"}/{c.max}</dd></div>)}</dl>
        </div>)}
        <p className="text-sm">Calculated guidance: {assessment.results.decision_guidance ?? "Incomplete"}</p>
        <ul className="space-y-1 text-sm">{assessment.results.gates?.items.map(gate => <li key={`${gate.type}-${gate.id}`}>{gate.label}: {gate.passed ? "Passed" : "Review required"}</li>)}</ul>
      </section>}
      <section className="space-y-4">
        <h2 className="border-b border-gray-300 pb-2 text-lg font-bold">
          Score breakdown
        </h2>
        <AssessmentResultsView results={assessment.results} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-emerald-800">
            Key strengths
          </h2>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
            {assessment.strengths || "None recorded"}
          </p>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-amber-800">
            Key concerns
          </h2>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
            {assessment.concerns || "None recorded"}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="border-b border-gray-300 pb-2 text-lg font-bold">
          Recommendation and rationale
        </h2>
        <p className="text-base font-semibold">
          {assessment.recommendation || "No recommendation recorded"}
        </p>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {assessment.rationale || "No rationale recorded"}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="border-b border-gray-300 pb-2 text-lg font-bold">
          Interview evidence
        </h2>
        {plan.questions.map((q) => {
          const answer = assessment.answers.find((a) => a.question_id === q.id);
          return (
            <div key={q.id} className="space-y-2 border-b border-gray-200 pb-4">
              <h3 className="font-semibold">{q.text}</h3>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {assessmentSectionNames[q.section]}
                {q.section === "practical" && plan.practical_module ? " · Marked by practical criteria" : q.scored
                  ? ` · Grade: ${answer?.score ?? "Unscored"}/5`
                  : " · Information only"}
              </p>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">
                {q.scored
                  ? answer?.notes || "No notes"
                  : assessment.unscored_responses[q.id] || "Not recorded"}
              </p>
            </div>
          );
        })}
      </section>
    </article>
  );
}
