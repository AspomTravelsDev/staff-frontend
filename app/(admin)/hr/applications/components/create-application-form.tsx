"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import React from "react";
import { createApplication, sendInvite } from "@/lib/api/hr";
import { downloadPdfFormsAction } from "@/app/(public)/applicant/[id]/pdf-actions";
import { toast } from "sonner";
import { SALARY_PERCENTAGES } from "@/lib/config/payroll";
import {
  calculateNetFromGross,
  calculateGrossFromNet,
  ComputedSalaryPackage,
} from "@/lib/payroll/payroll-reverse-calculator";
import { ArrowLeftRight, Sparkles, ShieldOff } from "lucide-react";

export function CreateApplicationForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);

  // Bidirectional state
  const [grossInput, setGrossInput] = useState<string>("");
  const [netInput, setNetInput] = useState<string>("");
  const [lastEdited, setLastEdited] = useState<"gross" | "net">("gross");
  const [isTaxExempt, setIsTaxExempt] = useState<boolean>(false);

  // Compute breakdown dynamically based on last active source and tax exemption
  const breakdown: ComputedSalaryPackage = useMemo(() => {
    if (lastEdited === "net") {
      const netVal = Number(netInput) || 0;
      return calculateGrossFromNet(netVal, isTaxExempt);
    } else {
      const grossVal = Number(grossInput) || 0;
      return calculateNetFromGross(grossVal, isTaxExempt);
    }
  }, [grossInput, netInput, lastEdited, isTaxExempt]);

  // Gross Input Handler
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

  // Net Input Handler
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

  // Tax Exemption Toggle Handler
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const applicant_name = formData.get("applicant_name") as string;
    const applicant_email = formData.get("applicant_email") as string;
    const position_title = formData.get("position_title") as string;
    const reporting_to = formData.get("reporting_to") as string;
    const effective_date = formData.get("effective_date") as string;

    const finalGross = breakdown.gross_salary;

    if (finalGross <= 0) {
      toast.error("Please enter a valid Gross or Net salary.");
      setIsPending(false);
      return;
    }

    try {
      const application = await createApplication({
        applicant_name,
        applicant_email,
        position_title,
        is_intern: false,
        reporting_to,
        effective_date,
        salary_gross: finalGross,
        salary_breakdown: breakdown,
      });

      const toastId = toast.loading("Generating initial offer letter...");
      await downloadPdfFormsAction(application.id, { includeAdminOnly: true });

      toast.loading("Emailing invitation to applicant...", { id: toastId });
      await sendInvite(application.id);

      toast.success("Application created and invite sent!", { id: toastId });
      setSuccess(true);

      setTimeout(() => {
        router.push("/hr/applications");
      }, 1500);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(message);
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center">
        <h3 className="text-lg font-semibold text-green-800">
          Application Created Successfully!
        </h3>
        <p className="text-green-600 mt-2">
          Redirecting to applications list...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="applicant_name">Applicant Full Name</Label>
              <Input
                id="applicant_name"
                name="applicant_name"
                type="text"
                required
                placeholder="e.g., John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicant_email">Applicant Email</Label>
              <Input
                id="applicant_email"
                name="applicant_email"
                type="email"
                required
                placeholder="applicant@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position_title">Position Title</Label>
            <Input
              id="position_title"
              name="position_title"
              type="text"
              required
              placeholder="e.g., Full Stack Developer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reporting_to">Reporting To</Label>
              <Input
                id="reporting_to"
                name="reporting_to"
                type="text"
                required
                defaultValue="Nancy O. Peters"
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="effective_date">Effective Date</Label>
              <Input
                id="effective_date"
                name="effective_date"
                type="date"
                required
              />
            </div>
          </div>

          <div className="space-y-2 rounded-md border p-3 bg-muted/20">
            <Label
              htmlFor="is_tax_exempt"
              className="flex cursor-pointer items-start gap-3"
            >
              <input
                id="is_tax_exempt"
                name="is_tax_exempt"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded"
                checked={isTaxExempt}
                onChange={(e) => handleTaxExemptToggle(e.target.checked)}
              />
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <ShieldOff className="size-3.5 text-amber-500" />
                  Tax Exempt Salary
                </span>
                <p className="text-xs text-muted-foreground">
                  Exempts this salary from PAYE statutory tax deductions (Gross = Net).
                </p>
              </div>
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Salary Information (Bidirectional Gross ↔ Net) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="size-5 text-primary" />
            Salary Package & Auto-Calculation
          </CardTitle>
          <CardDescription>
            Enter either Gross Salary or Desired Net Salary. Amount is automatically calculates the counterpart and PAYE tax in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary_gross" className="font-semibold text-xs flex items-center justify-between">
                <span>Gross Salary (₦)</span>
                {lastEdited === "net" && breakdown.gross_salary > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-normal text-[11px] flex items-center gap-1">
                    <Sparkles className="size-3" /> Auto-calculated from Net
                  </span>
                )}
              </Label>
              <Input
                id="salary_gross"
                name="salary_gross"
                type="number"
                step="0.01"
                required
                placeholder="e.g. 220000.00"
                value={grossInput}
                onChange={(e) => handleGrossChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary_net" className="font-semibold text-xs flex items-center justify-between">
                <span>Desired Net Salary (₦)</span>
                {lastEdited === "gross" && breakdown.net_salary > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-normal text-[11px] flex items-center gap-1">
                    <Sparkles className="size-3" /> Auto-calculated from Gross
                  </span>
                )}
              </Label>
              <Input
                id="salary_net"
                name="salary_net"
                type="number"
                step="0.01"
                placeholder="e.g. 198583.33"
                value={netInput}
                onChange={(e) => handleNetChange(e.target.value)}
              />
            </div>
          </div>

          {breakdown.gross_salary > 0 && (
            <div className="rounded-lg bg-muted p-3.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Auto-Calculated Net Pay:</span>
              <span className="text-lg font-bold text-primary">
                ₦{breakdown.net_salary.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <Separator />

          <div className="text-sm font-medium">
            Salary Breakdown
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (Auto-calculated from Gross Salary percentages)
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="basic">Basic ({SALARY_PERCENTAGES.basic * 100}%)</Label>
              <Input
                id="basic"
                name="basic"
                type="number"
                step="0.01"
                required
                value={breakdown.basic}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rent_housing">Rent/Housing ({SALARY_PERCENTAGES.rent_housing * 100}%)</Label>
              <Input
                id="rent_housing"
                name="rent_housing"
                type="number"
                step="0.01"
                required
                value={breakdown.rent_housing}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transport">Transport ({SALARY_PERCENTAGES.transport * 100}%)</Label>
              <Input
                id="transport"
                name="transport"
                type="number"
                step="0.01"
                required
                value={breakdown.transport}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medical">Medical ({SALARY_PERCENTAGES.medical * 100}%)</Label>
              <Input
                id="medical"
                name="medical"
                type="number"
                step="0.01"
                required
                value={breakdown.medical}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="furniture">Furniture ({SALARY_PERCENTAGES.furniture * 100}%)</Label>
              <Input
                id="furniture"
                name="furniture"
                type="number"
                step="0.01"
                required
                value={breakdown.furniture}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="utility">Utility ({SALARY_PERCENTAGES.utility * 100}%)</Label>
              <Input
                id="utility"
                name="utility"
                type="number"
                step="0.01"
                required
                value={breakdown.utility}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entertainment">Entertainment ({SALARY_PERCENTAGES.entertainment * 100}%)</Label>
              <Input
                id="entertainment"
                name="entertainment"
                type="number"
                step="0.01"
                required
                value={breakdown.entertainment}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meal_subsidy">Meal Subsidy ({SALARY_PERCENTAGES.meal_subsidy * 100}%)</Label>
              <Input
                id="meal_subsidy"
                name="meal_subsidy"
                type="number"
                step="0.01"
                required
                value={breakdown.meal_subsidy}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clothing">Clothing ({SALARY_PERCENTAGES.clothing * 100}%)</Label>
              <Input
                id="clothing"
                name="clothing"
                type="number"
                step="0.01"
                required
                value={breakdown.clothing}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passages">Passages ({SALARY_PERCENTAGES.passages * 100}%)</Label>
              <Input
                id="passages"
                name="passages"
                type="number"
                step="0.01"
                required
                value={breakdown.passages}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/hr/applications")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating Application..." : "Create Application & Send Invite"}
        </Button>
      </div>
    </form>
  );
}
