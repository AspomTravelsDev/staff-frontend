"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Send, Loader2, ArrowRight, CheckCircle2, ShieldOff } from "lucide-react";
import type { RecruitmentCandidate } from "@/lib/types/recruitment";
import { onboardCandidateAction } from "@/lib/api/recruitment";
import { downloadPdfFormsAction } from "@/app/(public)/applicant/[id]/pdf-actions";
import { sendInvite } from "@/lib/api/hr";
import {
  calculateNetFromGross,
  calculateGrossFromNet,
  ComputedSalaryPackage,
} from "@/lib/payroll/payroll-reverse-calculator";
import { toast } from "sonner";
import Link from "next/link";

interface AcceptOnboardModalProps {
  candidate: RecruitmentCandidate | null;
  roleId: string;
  roleTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AcceptOnboardModal({
  candidate,
  roleId,
  roleTitle,
  open,
  onOpenChange,
}: AcceptOnboardModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    applicant_name: "",
    applicant_email: "",
    position_title: roleTitle,
    reporting_to: "", // defaults to "Nancy O. Peters" if left blank
    effective_date: new Date().toISOString().split("T")[0],
  });

  // Salary State: Gross ↔ Net bidirectional inputs and Tax Exemption
  const [grossInput, setGrossInput] = useState<string>("200000");
  const [netInput, setNetInput] = useState<string>("187500");
  const [lastEdited, setLastEdited] = useState<"gross" | "net">("gross");
  const [isTaxExempt, setIsTaxExempt] = useState(false);

  // Compute breakdown dynamically in background based on active input and tax exemption
  const breakdown: ComputedSalaryPackage = useMemo(() => {
    if (lastEdited === "net") {
      const netVal = Number(netInput) || 0;
      return calculateGrossFromNet(netVal, isTaxExempt);
    } else {
      const grossVal = Number(grossInput) || 0;
      return calculateNetFromGross(grossVal, isTaxExempt);
    }
  }, [lastEdited, grossInput, netInput, isTaxExempt]);

  // Pre-fill when candidate changes
  useEffect(() => {
    if (candidate) {
      const parsedSalary = candidate.interview_rubric?.logistics?.recommended_salary
        ? parseFloat(candidate.interview_rubric.logistics.recommended_salary.replace(/[^0-9.]/g, ""))
        : null;

      const gross = parsedSalary && !isNaN(parsedSalary) && parsedSalary > 0 ? parsedSalary : 200000;
      const calc = calculateNetFromGross(gross, false);

      setFormData({
        applicant_name: candidate.name || "",
        applicant_email: candidate.email || "",
        position_title: roleTitle || "",
        reporting_to: "", // blank by default; Nancy O. Peters will be used
        effective_date: new Date().toISOString().split("T")[0],
      });

      setGrossInput(String(gross));
      setNetInput(String(calc.net_salary));
      setLastEdited("gross");
      setIsTaxExempt(false);
      setCreatedAppId(null);
    }
  }, [candidate, roleTitle]);

  const handleGrossChange = (val: string) => {
    setLastEdited("gross");
    setGrossInput(val);
    const num = Number(val) || 0;
    if (num > 0) {
      const calc = calculateNetFromGross(num, isTaxExempt);
      setNetInput(calc.net_salary ? String(calc.net_salary) : "");
    } else {
      setNetInput("");
    }
  };

  const handleNetChange = (val: string) => {
    setLastEdited("net");
    setNetInput(val);
    const num = Number(val) || 0;
    if (num > 0) {
      const calc = calculateGrossFromNet(num, isTaxExempt);
      setGrossInput(calc.gross_salary ? String(calc.gross_salary) : "");
    } else {
      setGrossInput("");
    }
  };

  const handleTaxExemptToggle = (checked: boolean) => {
    setIsTaxExempt(checked);
    if (lastEdited === "net") {
      const netVal = Number(netInput) || 0;
      const calc = calculateGrossFromNet(netVal, checked);
      setGrossInput(calc.gross_salary ? String(calc.gross_salary) : "");
    } else {
      const grossVal = Number(grossInput) || 0;
      const calc = calculateNetFromGross(grossVal, checked);
      setNetInput(calc.net_salary ? String(calc.net_salary) : "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate) return;

    if (!formData.applicant_email) {
      toast.error("Candidate email is required to send their offer letter.");
      return;
    }

    const finalGross = breakdown.gross_salary;
    if (finalGross <= 0) {
      toast.error("Please enter a valid Gross or Net salary.");
      return;
    }

    const toastId = toast.loading("Configuring employment terms...");
    try {
      setLoading(true);
      const result = await onboardCandidateAction(candidate.id, roleId, {
        applicant_name: formData.applicant_name,
        applicant_email: formData.applicant_email,
        position_title: formData.position_title,
        reporting_to: formData.reporting_to.trim() || "Nancy O. Peters",
        effective_date: formData.effective_date,
        salary_gross: finalGross,
        is_tax_exempt: isTaxExempt,
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

      const newApp = result.onboarding_application;
      if (!newApp?.id) {
        throw new Error("Failed to initialize onboarding application.");
      }

      toast.loading("Generating offer letter & NDA PDFs...", { id: toastId });
      const pdfResult = await downloadPdfFormsAction(newApp.id, { includeAdminOnly: true });
      if (pdfResult && "error" in pdfResult && pdfResult.error) {
        console.error("PDF generation warning/error:", pdfResult.error);
        throw new Error(`Failed to generate documents: ${pdfResult.error}`);
      }

      toast.loading(`Emailing offer letter package to ${formData.applicant_email}...`, { id: toastId });
      await sendInvite(newApp.id);

      setCreatedAppId(newApp.id);
      toast.success(
        `Offer letter & onboarding package dispatched to ${formData.applicant_email}!`,
        { id: toastId }
      );
      router.refresh();
    } catch (err: any) {
      console.error("Error dispatching offer package:", err);
      toast.error(err.message || "Failed to create offer & onboarding application.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Send className="h-5 w-5 text-primary" />
            Send Offer Letter & Onboarding Invite
          </DialogTitle>
          <DialogDescription>
            Configure employment terms and dispatch the official offer letter to <strong>{candidate?.name}</strong>. Candidate status will update to <strong>Offered</strong>, and automatically mirror to <strong>Accepted / Hired</strong> once onboarding is completed.
          </DialogDescription>
        </DialogHeader>

        {createdAppId ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Offer Letter Dispatched!</h3>
              <p className="text-sm text-muted-foreground">
                The candidate’s status is now <strong>Offered</strong>. Once they accept the offer and complete onboarding, their status will automatically update to <strong>Accepted / Hired</strong>.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Back to Workspace
              </Button>
              <Button asChild className="gap-1.5">
                <Link href={`/hr/applications`}>
                  View In Onboarding Queue
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="applicant_name">Candidate Name</Label>
                <Input
                  id="applicant_name"
                  value={formData.applicant_name}
                  onChange={(e) => setFormData({ ...formData, applicant_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="applicant_email">Email for Offer & Onboarding</Label>
                <Input
                  id="applicant_email"
                  type="email"
                  value={formData.applicant_email}
                  onChange={(e) => setFormData({ ...formData, applicant_email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="position_title">Position Title</Label>
                <Input
                  id="position_title"
                  value={formData.position_title}
                  onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reporting_to">Reporting Manager</Label>
                <Input
                  id="reporting_to"
                  value={formData.reporting_to}
                  onChange={(e) => setFormData({ ...formData, reporting_to: e.target.value })}
                  placeholder="Nancy O. Peters (Default)"
                />
                <p className="text-[10px] text-muted-foreground">
                  Leave blank to default to Nancy O. Peters.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="effective_date">Effective Start Date</Label>
              <Input
                id="effective_date"
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                required
              />
            </div>

            {/* Compensation Section: Gross and Net Only (No Breakdown) */}
            <div className="space-y-3 border-t pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="salary_gross" className="text-xs font-semibold">
                    Gross Monthly Salary (₦)
                  </Label>
                  <Input
                    id="salary_gross"
                    type="number"
                    min={0}
                    step="any"
                    value={grossInput}
                    onChange={(e) => handleGrossChange(e.target.value)}
                    placeholder="e.g. 200,000"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="salary_net" className="text-xs font-semibold flex items-center justify-between">
                    <span>Net Monthly Salary (₦)</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {isTaxExempt ? "Tax Exempt" : "After PAYE Tax"}
                    </span>
                  </Label>
                  <Input
                    id="salary_net"
                    type="number"
                    min={0}
                    step="any"
                    value={netInput}
                    onChange={(e) => handleNetChange(e.target.value)}
                    placeholder="e.g. 187,500"
                    required
                  />
                </div>
              </div>

              {/* Tax Exemption Option */}
              <div className="rounded-lg border p-3 bg-muted/20 hover:bg-muted/30 transition-colors">
                <label
                  htmlFor="is_tax_exempt"
                  className="flex cursor-pointer items-start gap-3 select-none"
                >
                  <input
                    id="is_tax_exempt"
                    name="is_tax_exempt"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded accent-primary cursor-pointer"
                    checked={isTaxExempt}
                    onChange={(e) => handleTaxExemptToggle(e.target.checked)}
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldOff className="h-3.5 w-3.5 text-amber-500" />
                      Tax Exempt Candidate
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Exempt this salary from PAYE statutory tax deduction (Gross = Net).
                    </p>
                  </div>
                </label>
              </div>

              {/* Summary Pill */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Est. PAYE Tax:</span>
                  <span className="font-semibold text-foreground">
                    {isTaxExempt
                      ? "₦0.00 (Exempt)"
                      : `₦${Number(breakdown.statutory_tax_deduction || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Monthly Take-Home:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ₦{Number(breakdown.net_salary || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Offer Letter & Onboarding Invite
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
