"use client";

import { useEffect, useMemo, useState } from "react";
import type { PayrollEntry } from "@/lib/api/payroll";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Save, CheckCircle2, X, RotateCcw } from "lucide-react";

interface Props {
  entry: PayrollEntry;
  isPersisted?: boolean;
  inSheet?: boolean;
  onClose: () => void;
  onSave: (updated: {
    attendance_days?: number;
    suspension_days?: number;
    other_deductions_amount?: number;
    other_deductions?: { label: string; amount: number }[];
    final_deduction_days?: number;
    deduction_amount?: number;
    override_note?: string;
  }) => Promise<void>;
  onApprove: (entryId: string) => Promise<void>;
  onRecalculate?: (entryId: string) => Promise<void>;
}

type OtherDeductionInput = {
  label: string;
  amount: string;
};

function calculateMonthlyTax(taxableGross: number) {
  let remainingTaxable = Math.max(0, taxableGross * 12);
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

  return Math.round((annualTax / 12) * 100) / 100;
}

function money(amount: number) {
  const val = isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(val);
}

function normalizeOtherDeductions(entry: PayrollEntry): OtherDeductionInput[] {
  const list = Array.isArray(entry.other_deductions)
    ? entry.other_deductions
    : [];

  if (list.length > 0) {
    return list.map((item) => ({
      label: String(item?.label ?? ""),
      amount: String(item?.amount ?? 0),
    }));
  }

  const fallback = Number(entry.other_deductions_amount ?? 0);
  if (fallback > 0) {
    return [{ label: "Other Deduction", amount: String(fallback) }];
  }

  return [];
}

export function PayrollEntrySheet({
  entry,
  isPersisted = true,
  inSheet = false,
  onClose,
  onSave,
  onApprove,
  onRecalculate,
}: Props) {
  const [attendanceDays, setAttendanceDays] = useState<string>(
    `${entry.attendance_days ?? 0}`,
  );
  const [suspensionDays, setSuspensionDays] = useState<string>(
    `${entry.suspension_days ?? 0}`,
  );
  const [otherDeductions, setOtherDeductions] = useState<OtherDeductionInput[]>(
    () => normalizeOtherDeductions(entry),
  );
  const [note, setNote] = useState<string>(entry.override_note ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    setAttendanceDays(`${entry.attendance_days ?? 0}`);
    setSuspensionDays(`${entry.suspension_days ?? 0}`);
    setOtherDeductions(normalizeOtherDeductions(entry));
    setNote(entry.override_note ?? "");
  }, [entry]);

  const updateOtherDeduction = (
    index: number,
    key: "label" | "amount",
    value: string,
  ) => {
    setOtherDeductions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  };

  const addOtherDeduction = () => {
    setOtherDeductions((prev) => [...prev, { label: "", amount: "" }]);
  };

  const removeOtherDeduction = (index: number) => {
    setOtherDeductions((prev) => prev.filter((_, i) => i !== index));
  };

  const dailyRate = Number(entry.daily_rate || 0);

  const computed = useMemo(() => {
    const parse = (val: string) => {
      const n = parseFloat(val);
      return isNaN(n) ? 0 : n;
    };

    const att = parse(attendanceDays);
    const susp = parse(suspensionDays);
    const othAmount = otherDeductions.reduce(
      (sum, item) => sum + parse(item.amount),
      0,
    );

    const finalDays = att + susp;

    // New tax order: tax is computed on gross (not taxable_gross)
    const grossSalary = Number(entry.gross_salary || 0);
    const taxAmount = entry.is_intern ? 0 : calculateMonthlyTax(grossSalary);

    // After-tax amount
    const afterTax = Math.max(0, grossSalary - taxAmount);

    // For deduction calculation, we need an estimated daily rate
    // The backend computes: dailyRateProvisional = afterTax / workingDays
    // We estimate workingDays from the snapshot or use current dailyRate as guide
    const workingDays =
      (entry.calculation_snapshot as any)?.working_days ||
      (afterTax > 0 && dailyRate > 0 ? Math.round(afterTax / dailyRate) : 21);

    const dailyRateProvisional =
      workingDays > 0 ? Math.round((afterTax / workingDays) * 100) / 100 : 0;
    const attendanceComplianceDeduction =
      Math.round(finalDays * dailyRateProvisional * 100) / 100;

    // Final net = (Gross - Tax) - Attendance/Compliance/Other Deductions
    const netAmount = Math.max(
      0,
      afterTax - attendanceComplianceDeduction - othAmount,
    );

    // Daily rate based on (gross - tax) over working days
    const dailyRateFinal = dailyRateProvisional;

    return {
      attAmount: Math.round(att * dailyRateProvisional * 100) / 100,
      suspAmount: Math.round(susp * dailyRateProvisional * 100) / 100,
      othAmount,
      finalDays,
      attendanceComplianceDeduction,
      taxableGross: grossSalary,
      taxAmount,
      netAmount,
      dailyRate: dailyRateFinal,
    };
  }, [
    attendanceDays,
    suspensionDays,
    otherDeductions,
    dailyRate,
    entry.gross_salary,
    entry.is_intern,
    entry.calculation_snapshot,
  ]);

  async function handleSave(approveAfter = false) {
    if (approveAfter) setIsPublishing(true);
    else setIsSaving(true);

    try {
      const parse = (val: string) => {
        const n = parseFloat(val);
        return isNaN(n) ? 0 : n;
      };

      const otherDeductionsPayload = otherDeductions
        .map((item) => ({
          label: item.label.trim(),
          amount: parse(item.amount),
        }))
        .filter((item) => item.label.length > 0 && item.amount > 0);

      const otherAmountTotal = otherDeductionsPayload.reduce(
        (sum, item) => sum + item.amount,
        0,
      );

      await onSave({
        attendance_days: parse(attendanceDays),
        suspension_days: parse(suspensionDays),
        other_deductions_amount: otherAmountTotal,
        other_deductions: otherDeductionsPayload,
        override_note: note || undefined,
      });

      if (approveAfter) {
        await onApprove(entry.id);
        toast.success("Payroll entry published.");
        onClose();
      } else {
        toast.success("Override saved.");
      }
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to process request.",
      );
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  }

  async function handleRecalculate() {
    if (!onRecalculate) return;
    setIsRecalculating(true);
    try {
      await onRecalculate(entry.id);
      toast.success("Entry recalculated from system records.");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to recalculate.",
      );
    } finally {
      setIsRecalculating(false);
    }
  }

  const isApproved = entry.status === "approved";

  const body = (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">
              {entry.user?.name ?? "Staff"}
            </h2>
            <Badge variant={isApproved ? "default" : "secondary"}>
              {entry.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {entry.user?.staff_id} • {entry.user?.department}
          </p>
        </div>
        {!inSheet && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Salary Overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-muted/30 border-none shadow-none">
            <CardHeader className="pb-2">
              <CardDescription>Monthly Gross</CardDescription>
              <CardTitle className="text-xl">
                {money(entry.gross_salary)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-muted/30 border-none shadow-none">
            <CardHeader className="pb-2">
              <CardDescription>Daily Rate (After Tax)</CardDescription>
              <CardTitle className="text-xl">
                {money(computed.dailyRate)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Deductions Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Deductions Breakdown
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Suggested days are pre-filled based on system records.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="grid gap-6">
            {/* Attendance */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="att-days" className="text-xs">
                  Attendance Days
                </Label>
                <div className="relative">
                  <Input
                    id="att-days"
                    type="number"
                    step="0.01"
                    value={attendanceDays}
                    onChange={(e) => setAttendanceDays(e.target.value)}
                    className="pr-16"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground pointer-events-none">
                    days
                  </div>
                </div>
                {Number(entry.attendance_suggested_days) > 0 && (
                  <p className="text-[10px] text-orange-600 font-medium leading-tight">
                    Suggested: {entry.attendance_suggested_days}
                    {Number(entry.prorated_days) > 0 && (
                      <span className="block opacity-75 font-normal">
                        ({entry.prorated_days} unemployed +{" "}
                        {Math.max(
                          0,
                          Number(entry.attendance_suggested_days) -
                            Number(entry.prorated_days),
                        )}{" "}
                        absent)
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="h-10 flex items-center text-muted-foreground">
                <Separator orientation="vertical" className="h-4" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Monetary Value
                </Label>
                <div className="h-10 flex items-center font-medium text-red-600">
                  {money(computed.attAmount)}
                </div>
              </div>
            </div>

            {/* Suspensions */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="susp-days" className="text-xs">
                  Suspension Days
                </Label>
                <div className="relative">
                  <Input
                    id="susp-days"
                    type="number"
                    step="0.01"
                    value={suspensionDays}
                    onChange={(e) => setSuspensionDays(e.target.value)}
                    className="pr-16"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground pointer-events-none">
                    days
                  </div>
                </div>
                {Number(entry.compliance_suggested_days) > 0 && (
                  <p className="text-[10px] text-orange-600 font-medium">
                    Suggested: {entry.compliance_suggested_days}
                  </p>
                )}
              </div>
              <div className="h-10 flex items-center text-muted-foreground">
                <Separator orientation="vertical" className="h-4" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Monetary Value
                </Label>
                <div className="h-10 flex items-center font-medium text-red-600">
                  {money(computed.suspAmount)}
                </div>
              </div>
            </div>

            {/* Other Deductions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Other Deductions</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOtherDeduction}
                >
                  Add Item
                </Button>
              </div>
              {otherDeductions.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  No other deductions added.
                </p>
              ) : (
                <div className="space-y-2">
                  {otherDeductions.map((item, index) => (
                    <div
                      key={`${index}-${item.label}`}
                      className="grid grid-cols-[1fr_140px_auto] items-center gap-2"
                    >
                      <Input
                        type="text"
                        placeholder="Label"
                        value={item.label}
                        onChange={(e) =>
                          updateOtherDeduction(index, "label", e.target.value)
                        }
                      />
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) =>
                            updateOtherDeduction(
                              index,
                              "amount",
                              e.target.value,
                            )
                          }
                          className="pl-10"
                        />
                        <div className="absolute inset-y-0 left-3 flex items-center text-xs text-muted-foreground pointer-events-none">
                          ₦
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOtherDeduction(index)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end text-xs text-muted-foreground">
                Total:{" "}
                <span className="ml-2 font-medium text-red-600">
                  {money(computed.othAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Calculation Summary */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Net Computation
          </h3>
          <div className="grid gap-3 rounded-lg border p-4 bg-muted/10">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gross Salary</span>
              <span>{money(entry.gross_salary)}</span>
            </div>
            <div className="flex justify-between text-sm text-red-600">
              <span>Income Tax (PAYE)</span>
              <span>- {money(computed.taxAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t pt-1">
              <span className="font-semibold text-primary">After Tax:</span>
              <span className="font-bold text-primary">
                {money(computed.taxableGross - computed.taxAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground italic">
                Attendance/Compliance Ded. ({computed.finalDays} days):
              </span>
              <span className="font-medium text-destructive">
                -{money(computed.attendanceComplianceDeduction)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-red-600">
              <span>Other Deductions</span>
              <span>- {money(computed.othAmount)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between items-center pt-1">
              <span className="font-bold">Final Net Pay</span>
              <span className="text-xl font-bold text-primary">
                {money(computed.netAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label
            htmlFor="override-note"
            className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
          >
            Internal Note
          </Label>
          <Input
            id="override-note"
            placeholder="Add a reason for this override..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t mt-auto flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        {isPersisted && (
          <>
            {onRecalculate && (
              <Button
                variant="outline"
                className="text-orange-600 border-orange-100 hover:bg-orange-50"
                disabled={isSaving || isPublishing || isRecalculating}
                onClick={handleRecalculate}
                title="Reset to system suggested values"
              >
                {isRecalculating ? (
                  "Resetting..."
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="secondary"
              disabled={isSaving || isPublishing || isRecalculating}
              onClick={() => handleSave(false)}
            >
              {isSaving ? "Saving..." : <Save className="h-4 w-4" />}
            </Button>
            <Button
              className="flex-2 gap-2"
              disabled={isSaving || isPublishing}
              onClick={() => handleSave(true)}
            >
              {isPublishing ? (
                "Publishing..."
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {isApproved ? "Update & Re-Publish" : "Save & Publish"}
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return body;
}

export default PayrollEntrySheet;
