"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  reportRecruitmentOfferFailure,
  generateRecruitmentOfferDocuments,
} from "@/lib/api/recruitment-pipeline";
import { onboardCandidateAction } from "@/lib/api/recruitment";
import { sendInvite } from "@/lib/api/hr";
import { calculateNetFromGross } from "@/lib/payroll/payroll-reverse-calculator";
import type {
  RecruitmentCandidate,
  RecruitmentRole,
} from "@/lib/types/recruitment";

export function PrepareOfferDialog({
  candidate,
  role,
  onClose,
}: {
  candidate: RecruitmentCandidate;
  role: RecruitmentRole;
  onClose: () => void;
}) {
  const router = useRouter();
  const application = candidate.offer_application;
  const terms = application?.employment_terms;
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(""),
    [dirty, setDirty] = useState(false);
  const [name, setName] = useState(
      application?.applicant_name ?? candidate.name,
    ),
    [email, setEmail] = useState(
      application?.applicant_email ?? candidate.email ?? "",
    ),
    [title, setTitle] = useState(application?.position_title ?? role.title),
    [date, setDate] = useState(terms?.effective_date ?? ""),
    [gross, setGross] = useState(
      String(
        terms?.gross_salary ??
          candidate.pipeline_summary?.salary_expectation ??
          "",
      ),
    ),
    [exempt, setExempt] = useState(Boolean(terms?.is_tax_exempt)),
    [sentId, setSentId] = useState<string | null>(
      ["offered", "accepted"].includes(candidate.status)
        ? candidate.onboarding_application_id
        : null,
    );
  const inFlight = useRef(false);
  const breakdown = calculateNetFromGross(Number(gross) || 0, exempt);
  function close() {
    if (
      !busy &&
      (!dirty ||
        sentId ||
        window.confirm("Close without saving these offer details?"))
    )
      onClose();
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current || !email.trim() || Number(gross) <= 0 || !date)
      return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    let prepared: { id: string; generation: string } | null = null;
    try {
      setProgress("Saving employment terms…");
      const result = await onboardCandidateAction(candidate.id, role.id, {
        applicant_name: name.trim(),
        applicant_email: email.trim(),
        position_title: title.trim(),
        reporting_to: "Nancy O. Peters",
        effective_date: date,
        salary_gross: breakdown.gross_salary,
        is_tax_exempt: exempt,
        salary_breakdown: {
          basic_salary: breakdown.basic,
          housing_allowance: breakdown.rent_housing,
          transport_allowance: breakdown.transport,
          utility_allowance: breakdown.utility,
          statutory_tax_deduction: breakdown.statutory_tax_deduction,
          net_salary: breakdown.net_salary,
          gross_salary: breakdown.gross_salary,
          medical_allowance: breakdown.medical,
          furniture_allowance: breakdown.furniture,
          entertainment_allowance: breakdown.entertainment,
          meal_subsidy: breakdown.meal_subsidy,
          clothing_allowance: breakdown.clothing,
          passages_allowance: breakdown.passages,
        },
      });
      if (!result.success)
        throw new Error(result.error || "Employment terms could not be saved.");
      const appId = result.data?.onboarding_application?.id;
      if (!appId)
        throw new Error("The offer application could not be prepared.");
      const generation =
        result.data?.onboarding_application?.form_data?.recruitment_offer
          ?.generation;
      if (!generation)
        throw new Error(
          "The prepared offer version could not be verified. Retry preparation.",
        );
      prepared = { id: appId, generation };
      setDirty(false);
      setProgress("Generating offer letter and NDA…");
      const pdf = await generateRecruitmentOfferDocuments(
        candidate.id,
        appId,
        generation,
      );
      if (pdf && "error" in pdf && pdf.error) throw new Error(pdf.error);
      setProgress("Sending offer package…");
      await sendInvite(appId);
      setSentId(appId);
      setDirty(false);
      toast.success("Offer package sent. Applicant marked as offered.");
      router.refresh();
    } catch (err) {
      if (prepared) {
        try {
          await reportRecruitmentOfferFailure(
            candidate.id,
            prepared.id,
            prepared.generation,
          );
        } catch {
          /* Preserve the original offer error. */
        }
      }
      setError(
        err instanceof Error
          ? err.message
          : "The offer could not be sent. Your details are retained; retry when ready.",
      );
      router.refresh();
    } finally {
      setBusy(false);
      setProgress("");
      inFlight.current = false;
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {sentId ? "Offer sent" : "Prepare offer"} · {candidate.name}
          </DialogTitle>
          <DialogDescription>
            {sentId
              ? "The offer letter, NDA and onboarding invitation have been sent. Continue tracking the application from recruitment or onboarding."
              : "Management has approved this candidate. Confirm the employment terms and recipient; the portal will generate and email the offer letter, NDA and onboarding invitation."}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        {sentId ? (
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Close
            </Button>
            <Button asChild>
              <Link href="/hr/applications">View onboarding</Link>
            </Button>
          </DialogFooter>
        ) : (
          <form
            onSubmit={submit}
            onChange={() => setDirty(true)}
            className="space-y-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  id: "offer-name",
                  label: "Candidate name",
                  value: name,
                  set: setName,
                  type: "text",
                },
                {
                  id: "offer-email",
                  label: "Email recipient",
                  value: email,
                  set: setEmail,
                  type: "email",
                },
                {
                  id: "offer-title",
                  label: "Position",
                  value: title,
                  set: setTitle,
                  type: "text",
                },
                {
                  id: "offer-date",
                  label: "Start date",
                  value: date,
                  set: setDate,
                  type: "date",
                },
                {
                  id: "offer-gross",
                  label: "Monthly gross salary (NGN)",
                  value: gross,
                  set: setGross,
                  type: "number",
                },
              ].map((f) => (
                <div key={f.id} className="space-y-1.5">
                  <Label htmlFor={f.id}>{f.label}</Label>
                  <Input
                    id={f.id}
                    type={f.type}
                    value={f.value}
                    min={f.type === "number" ? 1 : undefined}
                    step={f.type === "number" ? "0.01" : undefined}
                    required
                    disabled={busy}
                    onChange={(e) => f.set(e.target.value)}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Reporting manager: Nancy O. Peters
            </p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="offer-tax-exempt"
                checked={exempt}
                disabled={busy}
                onCheckedChange={(v) => {
                  setExempt(v === true);
                  setDirty(true);
                }}
              />
              <Label htmlFor="offer-tax-exempt">Statutory tax exemption</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Calculated monthly net: NGN{" "}
              {breakdown.net_salary.toLocaleString("en-NG")} · Role budget: NGN{" "}
              {Number(role.salary_budget_min).toLocaleString("en-NG")}–
              {Number(role.salary_budget_max).toLocaleString("en-NG")}
            </p>
            {Number(gross) > Number(role.salary_budget_max) && (
              <p className="text-xs text-destructive">
                This salary is above the role budget. Confirm the amount is
                authorised before sending.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              The applicant becomes Offered only after the email is sent
              successfully. If generation or sending fails, their application is
              retained for retry.
            </p>
            {progress && (
              <p role="status" className="text-xs">
                {progress}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={close}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy || Number(gross) <= 0}>
                {busy ? "Preparing & sending…" : "Generate & send offer"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
