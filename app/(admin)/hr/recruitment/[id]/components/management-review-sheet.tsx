"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import {
  getManagementReview,
  decideManagementReview,
} from "@/lib/api/recruitment-pipeline";
import {
  pipelineLabels,
  type ManagementReview,
  type ManagementDecisionType,
  type PipelineRecord,
} from "@/lib/types/recruitment-pipeline";

export const managementDecisionLabels = {
  approve: "Approved for offer preparation",
  hold: "On hold",
  return: "Returned to HR",
  decline: "Declined",
};
const score = (value: number | null | undefined) =>
  value == null ? "Not scored" : `${value.toFixed(1)}/100`;
const money = (value: number | null | undefined) =>
  value == null
    ? "Not recorded"
    : `NGN ${Number(value).toLocaleString("en-NG")}`;
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function AssessmentEvidence({ record }: { record: PipelineRecord }) {
  const d = record.definition,
    p = record.payload;
  const items =
    record.stage === "oral_interview"
      ? d.oral_questions.map((q) => ({ id: q.id, label: q.text, max: 5 }))
      : record.stage === "written_exam"
        ? [
            ...d.written_questions.map((q) => ({
              id: q.id,
              label: q.text,
              max: 5,
            })),
            ...d.computer_criteria.map((q) => ({ ...q, max: 5 })),
          ]
        : record.stage === "practical"
          ? d.practical_modules.flatMap((m) =>
              m.criteria.map((c) => ({
                id: c.id,
                label: `${m.name} · ${c.label}`,
                max: c.max,
              })),
            )
          : [];
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {record.state === "skipped"
          ? "Skipped by HR exception. No completed score."
          : `${score(record.results?.score_100)}${record.results?.threshold == null ? "" : ` · Pass mark ${record.results.threshold}%`}`}
      </p>
      {record.stage === "call_screening" && (
        <dl className="grid gap-2 text-xs sm:grid-cols-2">
          {Object.entries({
            "Salary expectation": money(p.salary_expectation),
            Location: p.location,
            Age: p.age,
            "NYSC status": p.nysc_status,
            Accommodation: p.accommodation,
            "Notice period": p.notice_period,
            Compatibility: p.compatibility,
          }).map(([label, value]) => (
            <div key={label}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd>{value ?? "Not recorded"}</dd>
            </div>
          ))}
        </dl>
      )}
      {!!items.length && (
        <dl className="divide-y">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 py-2 text-xs"
            >
              <dt className="leading-relaxed">{item.label}</dt>
              <dd className="shrink-0 font-medium tabular-nums">
                {p.grades?.[item.id] == null
                  ? "Not scored"
                  : `${p.grades[item.id]}/${item.max}`}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {!!record.results?.checks?.length && (
        <ul className="space-y-1 text-xs">
          {record.results.checks.map((c, i) => (
            <li key={i} className={c.passed ? "" : "text-destructive"}>
              {c.label}: {c.passed ? "Met" : "Not met"}
            </li>
          ))}
        </ul>
      )}
      <div className="text-xs">
        {p.manual_review && (
          <p className="mb-2 whitespace-pre-wrap">
            HR manual CV review: {p.review_note}
          </p>
        )}
        <p className="font-medium">Recorded notes</p>
        <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
          {p.notes ||
            "No notes recorded. Grades do not represent a transcript of the applicant’s answers."}
        </p>
      </div>
      {p.advancement_note && (
        <p className="whitespace-pre-wrap text-xs">
          HR advancement note: {p.advancement_note}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Recorded by {record.updated_by?.name || "HR"} ·{" "}
        {date(record.updated_at)}
        {p.interview_mode ? ` · ${p.interview_mode}` : ""}
      </p>
    </div>
  );
}

export function ManagementReviewContent({
  data,
  onVersion,
}: {
  data: ManagementReview;
  onVersion?: (version: number) => void;
}) {
  const pack = data.review.snapshot,
    records = pack.records;
  const brief = records.find((r) => r.stage === "management_review")?.payload;
  const call = records.find((r) => r.stage === "call_screening")?.payload;
  const warnings = records.filter(
    (r) =>
      r.stage !== "management_review" &&
      (r.state === "skipped" ||
        r.results?.passed === false ||
        r.results?.manual_review),
  );
  return (
    <Tabs defaultValue="summary" className="gap-3">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="assessments">Assessments</TabsTrigger>
        <TabsTrigger value="cv">CV</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="summary" className="space-y-4">
        {!!warnings.length && (
          <div role="note" className="rounded-md border p-3 text-xs">
            <p className="font-medium">Exceptions to review</p>
            <ul className="mt-1 space-y-1">
              {warnings.map((r) => (
                <li key={r.stage}>
                  {pipelineLabels[r.stage]}:{" "}
                  {r.state === "skipped"
                    ? "skipped by exception"
                    : r.results?.manual_review
                      ? "manually reviewed by HR without an AI score"
                      : "below standard or required check not met"}
                  .
                </li>
              ))}
            </ul>
          </div>
        )}
        <section className="space-y-1 text-sm">
          <h3 className="font-semibold">HR recommendation</h3>
          <p className="whitespace-pre-wrap leading-relaxed">
            {brief?.recommendation || "Not recorded"}
          </p>
        </section>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Key strengths", brief?.strengths],
            ["Concerns & unresolved gaps", brief?.concerns],
          ].map(([label, value]) => (
            <section key={label} className="space-y-1 text-xs">
              <h3 className="font-semibold">{label}</h3>
              <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {value || "Not recorded by HR"}
              </p>
            </section>
          ))}
        </div>
        <section className="space-y-1 text-xs">
          <h3 className="font-semibold">Interview summary</h3>
          <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
            {brief?.notes ||
              "No overall summary recorded. Stage notes are available under Assessments."}
          </p>
        </section>
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">
            Assessment results · {score(pack.final_score)}
          </h3>
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Pass mark</TableHead>
                <TableHead>Weight</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(
                [
                  ["oral_interview", 35],
                  ["written_exam", 25],
                  ["practical", 40],
                ] as const
              ).map(([stage, weight]) => {
                const r = records.find((r) => r.stage === stage);
                return (
                  <TableRow key={stage}>
                    <TableCell>{pipelineLabels[stage]}</TableCell>
                    <TableCell>
                      {r?.state === "completed"
                        ? score(r.results?.score_100)
                        : "Not scored"}
                    </TableCell>
                    <TableCell>
                      {r?.results?.threshold == null
                        ? "—"
                        : `${r.results.threshold}%`}
                    </TableCell>
                    <TableCell>{weight}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground">
            Written: answers 60%, observed computer skills 40%. CV and call
            screening do not contribute to this total.
          </p>
        </section>
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Salary & availability</h3>
          <dl className="grid gap-3 text-xs sm:grid-cols-2">
            {Object.entries({
              "Salary expectation": money(call?.salary_expectation),
              "Role budget": `${money(pack.role.salary_budget_min)}–${money(pack.role.salary_budget_max)}`,
              "Notice period": call?.notice_period || "Not recorded",
              Location: call?.location || "Not recorded",
              Compatibility: call?.compatibility || "Not recorded",
            }).map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </TabsContent>
      <TabsContent value="assessments" className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Submitted grades and recorded evidence. Written and practical files
          are held outside the portal.
        </p>
        <Accordion type="multiple">
          {records
            .filter((r) => r.stage !== "management_review")
            .map((r) => (
              <AccordionItem key={r.stage} value={r.stage}>
                <AccordionTrigger className="py-3 text-sm">
                  {pipelineLabels[r.stage]}
                </AccordionTrigger>
                <AccordionContent>
                  <AssessmentEvidence record={r} />
                </AccordionContent>
              </AccordionItem>
            ))}
        </Accordion>
      </TabsContent>
      <TabsContent value="cv" className="space-y-3 text-xs">
        <p className="font-medium">
          CV screening:{" "}
          {pack.candidate.ai_score == null
            ? "Not scored"
            : `${pack.candidate.ai_score}%`}
        </p>
        <p className="whitespace-pre-wrap leading-relaxed">
          {pack.candidate.ai_summary ||
            pack.candidate.ai_evaluation?.summary ||
            "No AI summary recorded."}
        </p>
        {(
          [
            ["strengths", "AI-noted strengths"],
            ["gaps", "Gaps to clarify"],
          ] as const
        ).map(([key, label]) => (
          <section key={key}>
            <h3 className="font-medium">{label}</h3>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {pack.candidate.ai_evaluation?.[key]?.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </section>
        ))}
        <p className="text-muted-foreground">
          AI screening is advisory. This is the analysis included in the
          submitted brief.
        </p>
        <Button asChild variant="outline">
          <a
            href={`/api/recruitment/candidates/${pack.candidate.id}/cv`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download original CV
          </a>
        </Button>
      </TabsContent>
      <TabsContent value="history" className="space-y-4 text-xs">
        <section className="space-y-2">
          <h3 className="font-semibold">Review submissions & decisions</h3>
          {data.history.map((h) => (
            <div key={h.id} className="border-b pb-2">
              <p>
                Version {h.version} · {h.submitted_by.name} ·{" "}
                {date(h.created_at)}
              </p>
              {onVersion && h.version !== data.review.version && (
                <Button
                  variant="link"
                  className="h-auto px-0 py-1"
                  onClick={() => onVersion(h.version)}
                >
                  View submitted version {h.version}
                </Button>
              )}
              {h.decision && (
                <>
                  <p className="mt-1 font-medium">
                    {managementDecisionLabels[h.decision.decision]} ·{" "}
                    {h.decision.actor.name}
                  </p>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {h.decision.reason || "No additional comment"}
                  </p>
                </>
              )}
            </div>
          ))}
        </section>
        <section className="space-y-2">
          <h3 className="font-semibold">Recruitment history at submission</h3>
          {pack.events.map((e) => (
            <div key={e.id} className="border-b pb-2">
              <p>
                {e.event.replaceAll("_", " ")} · {pipelineLabels[e.from_stage]}{" "}
                · {e.actor.name} · {date(e.created_at)}
              </p>
              {e.reason && (
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {e.reason}
                </p>
              )}
            </div>
          ))}
        </section>
      </TabsContent>
    </Tabs>
  );
}

export function ManagementReviewSheet({
  candidateId,
  roleId,
  onClose,
  onSaved,
}: {
  candidateId: string;
  roleId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [data, setData] = useState<ManagementReview | null>(null),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0),
    [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<ManagementDecisionType | "">(""),
    [reason, setReason] = useState(""),
    [followUp, setFollowUp] = useState("");
  const inFlight = useRef(false);
  const [version, setVersion] = useState<number | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    getManagementReview(candidateId, version)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled)
          setError("The review brief could not be loaded. Please retry.");
      });
    return () => {
      cancelled = true;
    };
  }, [candidateId, reload, version]);
  function close() {
    if (
      !busy &&
      ((!decision && !reason) ||
        window.confirm("Close without recording this management decision?"))
    )
      onClose();
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!data || !decision || !data.can_decide || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await decideManagementReview(candidateId, roleId, {
        review_id: data.review.id,
        decision,
        reason: reason.trim() || undefined,
        follow_up_date: decision === "hold" ? followUp : undefined,
      });
      if (result.success) {
        setData(result.data);
        setDecision("");
        setReason("");
        setFollowUp("");
        toast.success("Management decision recorded.");
        onSaved();
        router.refresh();
      } else {
        setError(result.error);
        if (result.errorCode === "HTTP_409") setReload((v) => v + 1);
      }
    } catch {
      setError(
        "The decision could not be saved. Your comments are retained. Please retry.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <SheetContent className="w-full gap-3 overflow-y-auto sm:max-w-3xl">
        <SheetHeader className="border-b p-3 pr-10">
          <SheetTitle>
            {data?.review.snapshot.candidate.name || "Candidate review"}
          </SheetTitle>
          <SheetDescription>
            {data
              ? `${data.review.snapshot.role.title} · Submitted by ${data.review.submitted_by.name} · Version ${data.review.version}`
              : "Loading review brief…"}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-3 pb-3">
          {error && (
            <div role="alert" className="space-y-2 text-xs">
              <p className="text-destructive">{error}</p>
              {!data && (
                <Button
                  variant="outline"
                  onClick={() => setReload((v) => v + 1)}
                >
                  Retry loading
                </Button>
              )}
            </div>
          )}
          {data && (
            <>
              {data.outcome !== "active" && (
                <p className="text-xs text-muted-foreground">
                  Applicant{" "}
                  {data.outcome === "hold"
                    ? "is on hold"
                    : `is ${data.outcome}`}
                  . This brief remains available for reference.
                </p>
              )}
              {data.updated_since_submission && (
                <p role="alert" className="rounded-md border p-3 text-xs">
                  Updated since submission. This is the submitted version; HR
                  must submit an updated brief before a new decision.
                </p>
              )}
              {!data.is_latest && (
                <p className="text-xs text-muted-foreground">
                  Viewing a previous submission. Decisions are available only on
                  the latest submitted version.
                </p>
              )}
              <ManagementReviewContent
                data={data}
                onVersion={(v) => {
                  setData(null);
                  setVersion(v);
                  setDecision("");
                  setReason("");
                }}
              />
              {data.decision && (
                <div className="space-y-1 border-t pt-3 text-xs">
                  <p className="font-semibold">
                    {managementDecisionLabels[data.decision.decision]}
                  </p>
                  <p>
                    By {data.decision.actor.name} ·{" "}
                    {date(data.decision.created_at)}
                  </p>
                  <p className="whitespace-pre-wrap">{data.decision.reason}</p>
                  {data.decision.follow_up_date && (
                    <p>Follow up: {date(data.decision.follow_up_date)}</p>
                  )}
                  {data.decision.decision === "approve" && (
                    <p className="text-muted-foreground">
                      {data.offer_status === "accepted"
                        ? "Onboarding is completed and the applicant is hired."
                        : data.offer_status === "offered"
                          ? "HR has sent the offer and onboarding package."
                          : "Sent to HR for offer preparation. No offer has been sent yet."}
                    </p>
                  )}
                </div>
              )}
              {data.can_decide && (
                <form onSubmit={save} className="space-y-3 border-t pt-3">
                  <h3 className="text-sm font-semibold">Management decision</h3>
                  <div className="space-y-1.5">
                    <Label htmlFor="management-decision">Decision</Label>
                    <Select
                      required
                      value={decision}
                      disabled={busy}
                      onValueChange={(v) =>
                        setDecision(v as ManagementDecisionType)
                      }
                    >
                      <SelectTrigger id="management-decision">
                        <SelectValue placeholder="Choose a decision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approve">
                          Approve for offer preparation
                        </SelectItem>
                        <SelectItem value="hold">Hold</SelectItem>
                        <SelectItem value="return">Return to HR</SelectItem>
                        <SelectItem value="decline">Decline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {decision && (
                    <>
                      <div className="space-y-1.5">
                        <Label htmlFor="management-reason">
                          {decision === "approve"
                            ? "Comment (optional)"
                            : "Reason / next steps for HR"}
                        </Label>
                        <Textarea
                          id="management-reason"
                          disabled={busy}
                          required={decision !== "approve"}
                          minLength={decision !== "approve" ? 3 : undefined}
                          maxLength={2000}
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </div>
                      {decision === "hold" && (
                        <div className="space-y-1.5">
                          <Label htmlFor="management-follow-up">
                            Follow-up date
                          </Label>
                          <Input
                            id="management-follow-up"
                            type="date"
                            required
                            disabled={busy}
                            value={followUp}
                            onChange={(e) => setFollowUp(e.target.value)}
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        This records a decision for HR. It does not send an
                        offer or change assessment marks.
                      </p>
                      <Button type="submit" disabled={busy}>
                        {busy ? "Recording…" : "Record decision"}
                      </Button>
                    </>
                  )}
                </form>
              )}
            </>
          )}
          <Button variant="outline" disabled={busy} onClick={close}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
