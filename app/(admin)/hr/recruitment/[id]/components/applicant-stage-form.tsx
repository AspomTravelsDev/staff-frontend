"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PipelineDisclosure } from "../../components/pipeline-disclosure";
import {
  getRecruitmentPipeline,
  saveRecruitmentStage,
} from "@/lib/api/recruitment-pipeline";
import {
  pipelineLabels,
  pipelineStages,
  type PipelineContext,
  type PipelinePayload,
} from "@/lib/types/recruitment-pipeline";

export function ApplicantStageForm({
  initial,
  onUpdate,
  onComplete,
  onDiscard,
  registerClose,
  viewStage,
  onDone,
  closing = false,
  onReject,
}: {
  initial: PipelineContext;
  onUpdate: (context: PipelineContext) => void;
  onComplete: (context: PipelineContext) => void;
  onDiscard: () => void;
  registerClose: (guard: () => Promise<boolean>) => () => void;
  viewStage?: import("@/lib/types/recruitment-pipeline").PipelineStage;
  onDone?: () => void;
  closing?: boolean;
  onReject?: () => void;
}) {
  const [context, setContext] = useState(initial);
  const stage = viewStage ?? context.candidate.pipeline_stage!;
  const nextStage = pipelineStages[pipelineStages.indexOf(stage) + 1];
  const initialPayload = initial.records.find((r) => r.stage === stage)
    ?.payload ?? { grades: {}, notes: "" };
  const [payload, setPayload] = useState<PipelinePayload>(initialPayload);
  const [busy, setBusy] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [saveState, setSaveState] = useState("Saved");
  const callbacks = useRef({ onUpdate, onComplete, onDiscard });
  const errorTarget = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (error) {
      errorTarget.current?.focus();
      errorTarget.current?.scrollIntoView({ block: "nearest" });
    }
  }, [error]);
  callbacks.current = { onUpdate, onComplete, onDiscard };
  const queue = useRef({
    payload: initialPayload,
    revision: initial.candidate.pipeline_revision!,
    version: 0,
    saved: 0,
    running: null as Promise<boolean> | null,
    blocked: false,
  });
  const record = context.records.find((r) => r.stage === stage),
    definition = record?.definition ?? context.definition;
  const editable =
    stage === context.candidate.pipeline_stage &&
    context.candidate.pipeline_outcome === "active" &&
    (!record || record.state === "draft");
  const disabled = !editable || busy;
  function change(next: PipelinePayload) {
    queue.current.payload = next;
    queue.current.version++;
    setPayload(next);
    setSaveState("Unsaved changes");
    setError("");
  }
  function field<K extends keyof PipelinePayload>(
    key: K,
    value: PipelinePayload[K],
  ) {
    change({ ...queue.current.payload, [key]: value });
  }
  function grade(id: string, value: number | null) {
    const latest = queue.current.payload;
    change({ ...latest, grades: { ...latest.grades, [id]: value } });
  }
  const flush = useCallback(
    function flush(): Promise<boolean> {
      const q = queue.current;
      if (q.running) return q.running;
      if (q.saved === q.version) return Promise.resolve(true);
      if (q.blocked) return Promise.resolve(false);
      q.running = (async () => {
        setSaving(true);
        try {
          while (q.saved !== q.version) {
            const version = q.version;
            const result = await saveRecruitmentStage(
              initial.candidate.id,
              initial.role.id,
              {
                revision: q.revision,
                stage,
                payload: q.payload,
                complete: false,
              },
            );
            if (!result.success) {
              q.blocked = true;
              setError(result.error);
              setSaveState("Not saved");
              return false;
            }
            q.revision = result.data.candidate.pipeline_revision!;
            q.saved = version;
            setContext(result.data);
            callbacks.current.onUpdate(result.data);
          }
          setSaveState("Saved");
          return true;
        } catch {
          q.blocked = true;
          setError(
            "Changes could not be saved. Your edits are still here. Retry before closing.",
          );
          setSaveState("Not saved");
          return false;
        } finally {
          q.running = null;
          setSaving(false);
        }
      })();
      return q.running;
    },
    [initial.candidate.id, initial.role.id, stage],
  );
  useEffect(() => {
    if (
      !editable ||
      busy ||
      queue.current.blocked ||
      queue.current.version === queue.current.saved
    )
      return;
    const timer = setTimeout(() => void flush(), 900);
    return () => clearTimeout(timer);
  }, [payload, editable, busy, flush]);
  useEffect(
    () => registerClose(async () => (busy ? false : await flush())),
    [busy, flush, registerClose],
  );
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (queue.current.version !== queue.current.saved) event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);
  async function complete(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (!(await flush())) return;
      const q = queue.current;
      const result = await saveRecruitmentStage(
        context.candidate.id,
        context.role.id,
        {
          revision: q.revision,
          stage,
          payload: q.payload,
          complete: true,
          advance: stage !== "oral_interview" && stage !== "management_review",
        },
      );
      if (result.success) {
        q.saved = q.version;
        callbacks.current.onComplete(result.data);
      } else {
        setError(result.error);
        if (result.errorCode === "HTTP_409") q.blocked = true;
      }
    } catch {
      setError(
        stage === "oral_interview"
          ? "The oral interview could not be completed. Your draft is retained. Please retry."
          : "The applicant could not be moved. Your draft is retained. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function reject() {
    if (busy || closing || !onReject) return;
    setBusy(true);
    setError("");
    try {
      if (await flush()) onReject();
    } finally {
      setBusy(false);
    }
  }
  async function reload() {
    if (
      queue.current.saved !== queue.current.version &&
      !window.confirm("Reload the saved draft and discard unsaved edits?")
    )
      return;
    setBusy(true);
    try {
      const next = await getRecruitmentPipeline(context.candidate.id);
      const nextPayload = next.records.find(
        (r) => r.stage === (viewStage ?? next.candidate.pipeline_stage),
      )?.payload ?? { grades: {}, notes: "" };
      queue.current = {
        payload: nextPayload,
        revision: next.candidate.pipeline_revision!,
        version: 0,
        saved: 0,
        running: null,
        blocked: false,
      };
      setContext(next);
      setPayload(nextPayload);
      setError("");
      setSaveState("Saved");
      callbacks.current.onUpdate(next);
    } catch {
      setError("The saved draft could not be loaded. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  function mark(id: string, label: string) {
    return (
      <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
        <Input
          id={`mark-${id}`}
          aria-label={`${label} score out of 5`}
          type="number"
          inputMode="numeric"
          className="w-14"
          min={0}
          max={5}
          step={1}
          required
          disabled={disabled}
          value={payload.grades?.[id] ?? ""}
          onChange={(e) => {
            const value = e.target.value === "" ? null : Number(e.target.value);
            if (
              value === null ||
              (Number.isInteger(value) && value >= 0 && value <= 5)
            )
              grade(id, value);
          }}
        />
        <span>/ 5</span>
      </div>
    );
  }
  const criterionRows = (
    items: { id: string; label: string; guide?: string }[],
  ) => (
    <div className="divide-y">
      {items.map((item) => (
        <div key={item.id} className="py-1">
          {item.guide ? (
            <PipelineDisclosure
              title={
                <span className="font-medium text-foreground">
                  {item.label}
                </span>
              }
              suffix={mark(item.id, item.label)}
            >
              <p className="text-xs leading-relaxed text-muted-foreground">
                {item.guide}
              </p>
            </PipelineDisclosure>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <Label
                htmlFor={`mark-${item.id}`}
                className="min-w-0 leading-relaxed"
              >
                {item.label}
              </Label>
              {mark(item.id, item.label)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
  return (
    <form onSubmit={complete} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {record?.state === "completed"
            ? "Completed"
            : editable
              ? stage === "oral_interview"
                ? `${definition.oral_questions.filter((question) => payload.grades?.[question.id] != null).length}/${definition.oral_questions.length} answers scored · saves automatically`
                : "Draft · changes save automatically"
              : `Read only · ${context.candidate.pipeline_outcome}`}
        </span>
        <span role="status">{saving ? "Saving…" : saveState}</span>
      </div>
      {error && (
        <div
          ref={errorTarget}
          tabIndex={-1}
          role="alert"
          className="space-y-2 text-xs"
        >
          <p className="text-destructive">{error}</p>
          {stage === "oral_interview" &&
            definition.oral_questions.some(
              (question) => payload.grades?.[question.id] == null,
            ) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const question = definition.oral_questions.find(
                    (question) => payload.grades?.[question.id] == null,
                  );
                  if (question) {
                    const target = document.getElementById(
                      `question-${question.id}`,
                    );
                    target?.focus();
                    target?.scrollIntoView({ block: "center" });
                  }
                }}
              >
                Score remaining answers
              </Button>
            )}
          {queue.current.blocked && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy || saving}
                onClick={() => {
                  queue.current.blocked = false;
                  void flush();
                }}
              >
                Retry save
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy || saving}
                onClick={() => void reload()}
              >
                Reload saved draft
              </Button>
              {queue.current.version !== queue.current.saved && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={busy || saving}
                  onClick={() => {
                    if (window.confirm("Discard the unsaved edits and close?"))
                      callbacks.current.onDiscard();
                  }}
                >
                  Discard unsaved edits
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {stage === "call_screening" && (
        <>
          <p className="text-xs text-muted-foreground">
            Monthly budget: NGN{" "}
            {context.role.salary_budget_min?.toLocaleString()}–
            {context.role.salary_budget_max?.toLocaleString()}. This stage is
            unscored.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                [
                  "salary_expectation",
                  "Monthly salary expectation (NGN)",
                  "number",
                ],
                ["location", "Location", "text"],
                ["age", "Age", "number"],
                ["nysc_status", "NYSC status", "text"],
                ["accommodation", "Accommodation needed", "text"],
                ["notice_period", "Notice period / earliest start", "text"],
              ] as const
            ).map(([key, label, type]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`call-${key}`}>{label}</Label>
                <Input
                  id={`call-${key}`}
                  required
                  type={type}
                  min={type === "number" ? 0 : undefined}
                  max={key === "age" ? 120 : undefined}
                  disabled={disabled}
                  value={payload[key] ?? ""}
                  onChange={(e) =>
                    field(
                      key,
                      (type === "number"
                        ? e.target.value === ""
                          ? null
                          : Number(e.target.value)
                        : e.target.value) as never,
                    )
                  }
                />
              </div>
            ))}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="call-compatibility">
                HR compatibility assessment
              </Label>
              <Select
                required
                disabled={disabled}
                value={payload.compatibility ?? ""}
                onValueChange={(value) =>
                  field(
                    "compatibility",
                    value as PipelinePayload["compatibility"],
                  )
                }
              >
                <SelectTrigger id="call-compatibility" className="w-full">
                  <SelectValue placeholder="Choose assessment" />
                </SelectTrigger>
                <SelectContent>
                  {["Compatible", "Needs discussion", "Not compatible"].map(
                    (value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          {payload.salary_expectation != null && (
            <p className="text-xs text-muted-foreground">
              {payload.salary_expectation >
              (context.role.salary_budget_max ?? Infinity)
                ? "Above budget — discuss with HR."
                : payload.salary_expectation <
                    (context.role.salary_budget_min ?? 0)
                  ? "Below budget range — confirm expectations."
                  : "Within salary budget."}{" "}
              HR decides compatibility.
            </p>
          )}
        </>
      )}
      {stage === "oral_interview" && (
        <>
          <p className="text-xs text-muted-foreground">
            Ask, listen and score each answer. Notes are optional.
          </p>
          <PipelineDisclosure title="Scoring reference">
            <p className="text-xs text-muted-foreground">
              1 weak · 2 developing · 3 competent · 4 strong · 5 excellent.
              Score evidence and sound judgment. Follow-ups carry no extra
              points.
            </p>
          </PipelineDisclosure>
          <div className="divide-y">
            {definition.oral_questions.map((question, index) => (
              <section key={question.id} className="space-y-2 py-3">
                <h3
                  id={`question-${question.id}`}
                  tabIndex={-1}
                  className="text-sm font-medium leading-relaxed"
                >
                  {index + 1}. {question.text}
                </h3>
                <RadioGroup
                  disabled={disabled}
                  aria-labelledby={`question-${question.id}`}
                  value={payload.grades?.[question.id]?.toString() ?? ""}
                  onValueChange={(value) => grade(question.id, Number(value))}
                  className="flex w-fit gap-1.5"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div key={value} className="relative">
                      <RadioGroupItem
                        id={`score-${question.id}-${value}`}
                        value={String(value)}
                        aria-label={`${value} out of 5`}
                        className="peer absolute inset-0 z-10 size-full rounded-md opacity-0 after:inset-0 disabled:opacity-0"
                      />
                      <Label
                        htmlFor={`score-${question.id}-${value}`}
                        className="flex size-8 cursor-pointer items-center justify-center rounded-md border text-xs peer-aria-checked:border-primary peer-aria-checked:bg-primary peer-aria-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-disabled:cursor-default peer-disabled:opacity-50 hover:bg-muted"
                      >
                        {value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {(question.anchors || question.follow_ups?.length > 0) && (
                  <PipelineDisclosure title="Guidance and follow-ups">
                    <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                      {Object.entries(question.anchors ?? {}).map(
                        ([score, text]) => (
                          <p key={score}>
                            {score}/5: {text}
                          </p>
                        ),
                      )}
                      {question.follow_ups?.map((text, i) => (
                        <p key={i}>{text}</p>
                      ))}
                    </div>
                  </PipelineDisclosure>
                )}
              </section>
            ))}
          </div>
        </>
      )}
      {stage === "written_exam" && (
        <>
          <p className="text-xs text-muted-foreground">
            Review the Word document, then enter each mark.
          </p>
          <section>
            <h3 className="text-xs font-medium">Written answers · 60%</h3>
            <div className="divide-y">
              {definition.written_questions.map((question, index) => (
                <div key={question.id} className="py-1">
                  <PipelineDisclosure
                    title={
                      <span className="font-medium text-foreground">
                        {index < 3
                          ? `General question ${index + 1}`
                          : `Role question ${index - 2}`}
                      </span>
                    }
                    suffix={mark(question.id, `Question ${index + 1}`)}
                  >
                    <p className="text-xs leading-relaxed">{question.text}</p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {question.guide}
                    </p>
                  </PipelineDisclosure>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3 className="text-xs font-medium">Computer skills · 40%</h3>
            {criterionRows(definition.computer_criteria)}
          </section>
        </>
      )}
      {stage === "practical" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Use any practical exercise suited to the role, then record your score.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="practical-score">Practical score (out of 10)</Label>
            <Input
              id="practical-score"
              type="number"
              min={0}
              max={10}
              step={0.1}
              required
              disabled={disabled}
              className="max-w-40"
              value={payload.practical_score !== undefined ? payload.practical_score ?? "" : record?.results?.score_100 != null ? record.results.score_100 / 10 : ""}
              onChange={(event) => field("practical_score", event.target.value === "" ? null : Number(event.target.value))}
            />
          </div>
        </div>
      )}
      {stage === "management_review" && (
        <>
          <p className="text-sm font-medium">
            Combined assessment:{" "}
            {context.final_score == null
              ? "Not available"
              : `${context.final_score.toFixed(1)}/100`}
          </p>
          <dl className="divide-y text-xs">
            {context.records
              .filter((r) =>
                ["oral_interview", "written_exam", "practical"].includes(
                  r.stage,
                ),
              )
              .map((r) => (
                <div key={r.id} className="flex justify-between gap-2 py-2">
                  <dt>{pipelineLabels[r.stage]}</dt>
                  <dd>
                    {r.state === "completed" ? (r.results?.score_100?.toFixed(1) ?? "Not scored") : "Not scored"}
                    {r.results?.passed === false ? " · Below standard" : ""}
                  </dd>
                </div>
              ))}
          </dl>
          <div className="space-y-1.5">
            <Label htmlFor="recommendation">HR recommendation</Label>
            <Textarea
              id="recommendation"
              required
              minLength={3}
              maxLength={2000}
              disabled={disabled}
              value={payload.recommendation ?? ""}
              onChange={(e) => field("recommendation", e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Confirm the brief before submitting. Management will see a saved
            copy of the stage scores, recorded evidence and your recommendation.
          </p>
          <PipelineDisclosure title="Review recorded stage notes">
            <div className="space-y-3 text-xs">
              {context.records
                .filter((r) => r.stage !== "management_review")
                .map((r) => (
                  <section key={r.id}>
                    <h3 className="font-medium">{pipelineLabels[r.stage]}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                      {r.payload.notes || "No stage notes recorded."}
                    </p>
                    {r.payload.advancement_note && (
                      <p className="mt-1">
                        Advancement note: {r.payload.advancement_note}
                      </p>
                    )}
                  </section>
                ))}
            </div>
          </PipelineDisclosure>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="review-strengths">Key strengths (optional)</Label>
              <Textarea
                id="review-strengths"
                disabled={disabled}
                maxLength={4000}
                value={payload.strengths ?? ""}
                onChange={(e) => field("strengths", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="review-concerns">
                Concerns & unresolved gaps (optional)
              </Label>
              <Textarea
                id="review-concerns"
                disabled={disabled}
                maxLength={4000}
                value={payload.concerns ?? ""}
                onChange={(e) => field("concerns", e.target.value)}
              />
            </div>
          </div>
        </>
      )}
      <PipelineDisclosure
        title={
          stage === "management_review"
            ? "Interview summary (optional)"
            : "Notes (optional)"
        }
        defaultOpen={Boolean(payload.notes)}
      >
        <Textarea
          disabled={disabled}
          aria-label="Stage notes"
          maxLength={20000}
          value={payload.notes ?? ""}
          onChange={(e) => field("notes", e.target.value)}
        />
      </PipelineDisclosure>
      {stage !== "management_review" &&
        stage !== "oral_interview" &&
        (record?.results?.passed === false || payload.advancement_note) && (
          <div className="space-y-1.5">
            <Label htmlFor="advancement-note">
              HR note for moving below standard
            </Label>
            <Textarea
              id="advancement-note"
              disabled={disabled}
              required={record?.results?.passed === false}
              minLength={3}
              maxLength={2000}
              value={payload.advancement_note ?? ""}
              onChange={(e) => field("advancement_note", e.target.value)}
              placeholder="Explain why this applicant should proceed"
            />
          </div>
        )}
      {record?.results && (
        <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
          <p>
            {record.results.score_100 != null
              ? `Score: ${record.results.score_100.toFixed(1)}/100${record.results.threshold != null ? ` · Pass mark ${record.results.threshold}%` : ""}`
              : record.results.missing.length
                ? `${record.results.missing.length} fields or marks remaining`
                : "Unscored stage"}
          </p>
          {record.results.checks
            .filter((check) => !check.passed)
            .map((check) => (
              <p key={check.label} className="text-destructive">
                Required check: {check.label}
              </p>
            ))}
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
        {onDone && (
          <Button
            type="button"
            variant="outline"
            disabled={busy || closing}
            onClick={onDone}
          >
            {closing ? "Saving…" : "Close"}
          </Button>
        )}
        {onReject && stage === context.candidate.pipeline_stage && context.candidate.pipeline_outcome === "active" && ["call_screening", "oral_interview", "written_exam", "practical"].includes(stage) && (
          <Button type="button" variant="destructive" disabled={busy || saving || closing} onClick={() => void reject()}>
            Reject &amp; review email
          </Button>
        )}
        {editable && (
          <Button type="submit" disabled={busy || saving || closing}>
            {busy
              ? "Saving…"
              : stage === "management_review"
                ? "Submit for management review"
                : stage === "oral_interview"
                  ? "Complete oral interview"
                  : `Move to ${nextStage === "management_review" ? "management review" : pipelineLabels[nextStage]?.toLowerCase()}`}
          </Button>
        )}
      </div>
    </form>
  );
}
