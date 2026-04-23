"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import React from "react";
import { createApplication, sendInvite } from "@/lib/api/hr";
import { downloadPdfFormsAction } from "@/app/(public)/applicant/[id]/pdf-actions";
import { toast } from "sonner";

// Salary breakdown percentages
const SALARY_PERCENTAGES = {
  basic: 0.1835,
  rent_housing: 0.0552,
  transport: 0.0552,
  medical: 0.1826,
  furniture: 0.0634,
  utility: 0.0345,
  entertainment: 0.0446,
  meal_subsidy: 0.1336,
  clothing: 0.1328,
  passages: 0.1146,
};

// Static simple tax percentage unused now in favor of PAYE logic
// const TAX_PERCENTAGE = 0.153;

export function CreateApplicationForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [grossSalary, setGrossSalary] = useState<number>(0);
  const [isIntern, setIsIntern] = useState(false);

  // Derive breakdown from grossSalary using useMemo
  const breakdown = React.useMemo(() => {
    if (grossSalary > 0) {
      let calculatedTax = 0;
      if (!isIntern) {
        // Calculate PAYE Tax exactly as Payslip does for non-intern staff.
        let remainingTaxable = grossSalary * 12;
        let annualTax = 0;

        const band1 = Math.min(remainingTaxable, 800000);
        remainingTaxable -= band1;

        if (remainingTaxable > 0) {
          const band2 = Math.min(remainingTaxable, 2200000);
          annualTax += band2 * 0.15;
          remainingTaxable -= band2;
        }
        if (remainingTaxable > 0) {
          const band3 = Math.min(remainingTaxable, 9000000);
          annualTax += band3 * 0.18;
          remainingTaxable -= band3;
        }
        if (remainingTaxable > 0) {
          const band4 = Math.min(remainingTaxable, 13000000);
          annualTax += band4 * 0.21;
          remainingTaxable -= band4;
        }
        if (remainingTaxable > 0) {
          annualTax += remainingTaxable * 0.25;
        }

        calculatedTax = Math.round((annualTax / 12) * 100) / 100;
      }

      const calculated = {
        basic: Math.round(grossSalary * SALARY_PERCENTAGES.basic * 100) / 100,
        rent_housing:
          Math.round(grossSalary * SALARY_PERCENTAGES.rent_housing * 100) / 100,
        transport:
          Math.round(grossSalary * SALARY_PERCENTAGES.transport * 100) / 100,
        medical:
          Math.round(grossSalary * SALARY_PERCENTAGES.medical * 100) / 100,
        furniture:
          Math.round(grossSalary * SALARY_PERCENTAGES.furniture * 100) / 100,
        utility:
          Math.round(grossSalary * SALARY_PERCENTAGES.utility * 100) / 100,
        entertainment:
          Math.round(grossSalary * SALARY_PERCENTAGES.entertainment * 100) /
          100,
        meal_subsidy:
          Math.round(grossSalary * SALARY_PERCENTAGES.meal_subsidy * 100) / 100,
        clothing:
          Math.round(grossSalary * SALARY_PERCENTAGES.clothing * 100) / 100,
        passages:
          Math.round(grossSalary * SALARY_PERCENTAGES.passages * 100) / 100,
        statutory_tax_deduction: calculatedTax,
        net_salary: 0,
      };
      calculated.net_salary =
        Math.round((grossSalary - calculated.statutory_tax_deduction) * 100) /
        100;
      return calculated;
    } else {
      return {
        basic: 0,
        rent_housing: 0,
        transport: 0,
        medical: 0,
        furniture: 0,
        utility: 0,
        entertainment: 0,
        meal_subsidy: 0,
        clothing: 0,
        passages: 0,
        statutory_tax_deduction: 0,
        net_salary: 0,
      };
    }
  }, [grossSalary, isIntern]);

  // ... inside component
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const applicant_name = formData.get("applicant_name") as string;
    const applicant_email = formData.get("applicant_email") as string;
    const position_title = formData.get("position_title") as string;
    const reporting_to = formData.get("reporting_to") as string;
    const effective_date = formData.get("effective_date") as string;

    // Use the calculated breakdown from state
    // Check if grossSalary matches? It should if state is up to date.

    try {
      const application = await createApplication({
        applicant_name,
        applicant_email,
        position_title,
        is_intern: isIntern,
        reporting_to,
        effective_date,
        salary_gross: grossSalary,
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

          <div className="space-y-2 rounded-md border p-3">
            <Label
              htmlFor="is_intern"
              className="flex cursor-pointer items-start gap-3"
            >
              <input
                id="is_intern"
                name="is_intern"
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={isIntern}
                onChange={(event) => setIsIntern(event.target.checked)}
              />
              <span className="text-sm">
                Mark this applicant as an intern (tax exempt in onboarding
                salary calculation and offer letter).
              </span>
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reporting_to">Reporting To</Label>
            <Input
              id="reporting_to"
              name="reporting_to"
              type="text"
              required
              placeholder="e.g., Nancy O. Peters"
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
        </CardContent>
      </Card>

      {/* Salary Information */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salary_gross">Gross Salary (₦)</Label>
            <Input
              id="salary_gross"
              name="salary_gross"
              type="number"
              step="0.01"
              required
              placeholder="220000.00"
              onChange={(e) => setGrossSalary(Number(e.target.value) || 0)}
            />
          </div>

          {grossSalary > 0 && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="font-medium">Auto-calculated Net Salary:</div>
              <div className="text-lg font-bold text-primary">
                ₦
                {breakdown.net_salary.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                (Gross: ₦{grossSalary.toLocaleString()} - Tax: ₦
                {breakdown.statutory_tax_deduction.toLocaleString()}
                {isIntern ? " [Intern exemption]" : ""})
              </div>
            </div>
          )}

          <Separator />

          <div className="text-sm font-medium">
            Salary Breakdown
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (Auto-calculated based on percentages)
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="basic">Basic (18.35%)</Label>
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
              <Label htmlFor="rent_housing">Rent/Housing (5.52%)</Label>
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
              <Label htmlFor="transport">Transport (5.52%)</Label>
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
              <Label htmlFor="medical">Medical (18.26%)</Label>
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
              <Label htmlFor="furniture">Furniture (6.34%)</Label>
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
              <Label htmlFor="utility">Utility (3.45%)</Label>
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
              <Label htmlFor="entertainment">Entertainment (4.46%)</Label>
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
              <Label htmlFor="meal_subsidy">Meal Subsidy (13.36%)</Label>
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
              <Label htmlFor="clothing">Clothing (13.28%)</Label>
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
              <Label htmlFor="passages">Passages (11.46%)</Label>
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

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="statutory_tax_deduction">
              Statutory Tax Deduction{" "}
              {isIntern ? "(Intern exempt: 0.00)" : "(PAYE calculated)"}
            </Label>
            <Input
              id="statutory_tax_deduction"
              name="statutory_tax_deduction"
              type="number"
              step="0.01"
              required
              value={breakdown.statutory_tax_deduction}
              readOnly
              className="bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Application"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
