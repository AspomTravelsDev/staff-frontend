"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
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
import {
  calculateAccommodationAmount,
  calculateMonthlyTax,
  calculatePayrollEntry,
  countWeekdaysBetween,
  getAccommodationRate,
  getDaysInMonth,
  getWorkingDaysInMonth,
} from "@/lib/payroll/calculations";

const round2 = (val: number) => Math.round(val * 100) / 100;

interface Props {
  entry: PayrollEntry;
  isPersisted?: boolean;
  inSheet?: boolean;
  onClose: () => void;
  onSave: (updated: {
    attendance_days?: number;
    suspension_days?: number;
    prorated_days?: number;
    accommodation_amount?: number;
    other_deductions_amount?: number;
    other_deductions?: { label: string; amount: number }[];
    additions_amount?: number;
    additions?: { label: string; amount: number }[];
    final_deduction_days?: number;
    deduction_amount?: number;
    override_note?: string;
    gross_salary?: number;
    taxable_gross?: number;
    daily_rate?: number;
    tax_amount?: number;
    net_amount?: number;
    calculation_snapshot?: Record<string, any>;
  }) => Promise<void>;
  onApprove: (entryId: string) => Promise<void>;
  onRecalculate?: (entryId: string) => Promise<void>;
  payrollMonth?: string;
}

type OtherDeductionInput = {
  label: string;
  amount: string;
};

type AdditionInput = {
  label: string;
  amount: string;
};

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

function normalizeAdditions(entry: PayrollEntry): AdditionInput[] {
  const list = Array.isArray(entry.additions) ? entry.additions : [];

  if (list.length > 0) {
    return list.map((item) => ({
      label: String(item?.label ?? ""),
      amount: String(item?.amount ?? 0),
    }));
  }

  const fallback = Number(entry.additions_amount ?? 0);
  if (fallback > 0) {
    return [{ label: "Addition", amount: String(fallback) }];
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
  payrollMonth,
}: Props) {
  const [attendanceDays, setAttendanceDays] = useState<string>(
    `${entry.attendance_days ?? 0}`,
  );
  const [suspensionDays, setSuspensionDays] = useState<string>(
    `${entry.suspension_days ?? 0}`,
  );
  const [proratedDays, setProratedDays] = useState<string>(
    `${entry.prorated_days ?? 0}`,
  );
  const [adjustmentType, setAdjustmentType] = useState<"none" | "resumption" | "resignation">(
    () => {
      if (Number(entry.prorated_days ?? 0) > 0) {
        const monthStrVal = payrollMonth || entry.run?.payroll_month;
        const isJoinedThisMonth =
          !!entry.user?.date_joined &&
          !!monthStrVal &&
          entry.user.date_joined.startsWith(monthStrVal);
        return isJoinedThisMonth ? "resumption" : "resignation";
      }
      return "none";
    },
  );
  const [resumptionDate, setResumptionDate] = useState<string>(() => {
    const monthStrVal = payrollMonth || entry.run?.payroll_month;
    if (
      entry.user?.date_joined &&
      monthStrVal &&
      entry.user.date_joined.startsWith(monthStrVal)
    ) {
      return entry.user.date_joined.split(" ")[0];
    }
    return monthStrVal ? `${monthStrVal}-01` : "";
  });
  const [resignationDate, setResignationDate] = useState<string>(() => {
    const monthStrVal = payrollMonth || entry.run?.payroll_month;
    return monthStrVal ? `${monthStrVal}-15` : "";
  });
  const [accommodationAmount, setAccommodationAmount] = useState<string>(
    `${entry.accommodation_amount ?? entry.calculation_snapshot?.accommodation_amount ?? 0}`,
  );
  const [otherDeductions, setOtherDeductions] = useState<OtherDeductionInput[]>(
    () => normalizeOtherDeductions(entry),
  );
  const [additions, setAdditions] = useState<AdditionInput[]>(() =>
    normalizeAdditions(entry),
  );
  const [note, setNote] = useState<string>(entry.override_note ?? "");
  const [isAccommodationOverride, setIsAccommodationOverride] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const [customActualGross, setCustomActualGross] = useState<string>("");
  const [customTaxAmount, setCustomTaxAmount] = useState<string>("");
  const [customDailyRate, setCustomDailyRate] = useState<string>("");
  const [customNetAmount, setCustomNetAmount] = useState<string>("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);

  useEffect(() => {
    setAttendanceDays(`${entry.attendance_days ?? 0}`);
    setSuspensionDays(`${entry.suspension_days ?? 0}`);
    setProratedDays(`${entry.prorated_days ?? 0}`);
    setAccommodationAmount(
      `${entry.accommodation_amount ?? entry.calculation_snapshot?.accommodation_amount ?? 0}`,
    );
    setOtherDeductions(normalizeOtherDeductions(entry));
    setAdditions(normalizeAdditions(entry));
    setNote(entry.override_note ?? "");
    setIsAccommodationOverride(false);

    const monthStrVal = payrollMonth || entry.run?.payroll_month;
    const hasProration = Number(entry.prorated_days ?? 0) > 0;
    const isJoinedThisMonth =
      !!entry.user?.date_joined &&
      !!monthStrVal &&
      entry.user.date_joined.startsWith(monthStrVal);
    
    setAdjustmentType(
      hasProration
        ? isJoinedThisMonth
          ? "resumption"
          : "resignation"
        : "none"
    );
    setResumptionDate(
      isJoinedThisMonth
        ? entry.user!.date_joined!.split(" ")[0]
        : monthStrVal
          ? `${monthStrVal}-01`
          : "",
    );
    setResignationDate(
      monthStrVal ? `${monthStrVal}-15` : ""
    );

    // Compute dynamic defaults based on raw inputs to detect database overrides
    if (monthStrVal) {
      const [year, month] = monthStrVal.split("-").map(Number);
      const daysInMonthVal = getDaysInMonth(year, month);
      const workingDaysInMonthVal = getWorkingDaysInMonth(year, month);

      const baseSalaryVal = (entry.calculation_snapshot as any)?.base_monthly_salary || Number(entry.user?.gross_pay || entry.gross_salary || 0);

      const activeWorkingDays = Math.max(0, workingDaysInMonthVal - Number(entry.prorated_days ?? 0));
      const factor = workingDaysInMonthVal > 0 ? activeWorkingDays / workingDaysInMonthVal : 0;
      const defaultGross = round2(baseSalaryVal * factor);
      const defaultTax = entry.is_intern ? 0 : calculateMonthlyTax(defaultGross);

      let calendarProratedDays = 0;
      if (entry.user?.date_joined) {
        const joinDate = new Date(entry.user.date_joined.split(" ")[0]);
        const monthStart = new Date(year, month - 1, 1);
        if (joinDate > monthStart) {
          const diffMs = joinDate.getTime() - monthStart.getTime();
          calendarProratedDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        }
      }
      const tenureMonthsVal = (() => {
        if (!entry.user?.date_joined) return 0;
        const [joinYear, joinMonth] = entry.user.date_joined.split("-").map(Number);
        return (year - joinYear) * 12 + (month - joinMonth);
      })();
      const accommodationRateVal = getAccommodationRate(entry.user?.contract_type ?? undefined, tenureMonthsVal);
      const defaultAccommodationAmount = calculateAccommodationAmount(accommodationRateVal, daysInMonthVal, calendarProratedDays);
      const finalAccommodationAmount = Number(entry.accommodation_amount !== undefined ? entry.accommodation_amount : defaultAccommodationAmount);

      const otherDeductionsAmount = normalizeOtherDeductions(entry).reduce((sum, d) => sum + Number(d.amount), 0);
      const additionsAmount = normalizeAdditions(entry).reduce((sum, a) => sum + Number(a.amount), 0);

      const dailyRateBase = Math.max(0, defaultGross - defaultTax - finalAccommodationAmount - otherDeductionsAmount);
      const defaultDailyRate = workingDaysInMonthVal > 0 ? round2(dailyRateBase / workingDaysInMonthVal) : 0;

      const attVal = Number(entry.attendance_days ?? 0);
      const suspVal = Number(entry.suspension_days ?? 0);
      const attAmount = round2(attVal * defaultDailyRate);
      const suspAmount = round2(suspVal * defaultDailyRate);
      const defaultDeductionAmount = round2(attAmount + suspAmount);

      const defaultNet = Math.max(0, round2(Math.max(0, defaultGross - defaultTax)) - finalAccommodationAmount - otherDeductionsAmount - defaultDeductionAmount + additionsAmount);

      setCustomActualGross(Number(entry.gross_salary) !== defaultGross ? String(entry.gross_salary) : "");
      setCustomTaxAmount(Number(entry.tax_amount) !== defaultTax ? String(entry.tax_amount) : "");
      setCustomDailyRate(Number(entry.daily_rate) !== defaultDailyRate ? String(entry.daily_rate) : "");
      setCustomNetAmount(Number(entry.net_amount) !== defaultNet ? String(entry.net_amount) : "");
    }
  }, [entry, payrollMonth]);

  const updateOtherDeduction = (
    index: number,
    key: "label" | "amount",
    value: string,
  ) => {
    setOtherDeductions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
    setCustomDailyRate("");
    setCustomNetAmount("");
  };

  const addOtherDeduction = () => {
    setOtherDeductions((prev) => [...prev, { label: "", amount: "" }]);
  };

  const removeOtherDeduction = (index: number) => {
    setOtherDeductions((prev) => prev.filter((_, i) => i !== index));
    setCustomDailyRate("");
    setCustomNetAmount("");
  };

  const updateAddition = (
    index: number,
    key: "label" | "amount",
    value: string,
  ) => {
    setAdditions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
    setCustomNetAmount("");
  };

  const addAddition = () => {
    setAdditions((prev) => [...prev, { label: "", amount: "" }]);
  };

  const removeAddition = (index: number) => {
    setAdditions((prev) => prev.filter((_, i) => i !== index));
    setCustomNetAmount("");
  };

  const monthStr = payrollMonth || entry.run?.payroll_month;

  const daysInMonth = useMemo(() => {
    if (!monthStr) return 30;
    const [year, month] = monthStr.split("-").map(Number);
    return getDaysInMonth(year, month);
  }, [monthStr]);

  const workingDaysInMonth = useMemo(() => {
    if (!monthStr) return 22;
    const [year, month] = monthStr.split("-").map(Number);
    return getWorkingDaysInMonth(year, month);
  }, [monthStr]);

  const tenureMonths = useMemo(() => {
    if (!entry.user?.date_joined || !monthStr) return 0;
    const [joinYear, joinMonth] = entry.user.date_joined.split("-").map(Number);
    const [payYear, payMonth] = monthStr.split("-").map(Number);
    return (payYear - joinYear) * 12 + (payMonth - joinMonth);
  }, [entry.user?.date_joined, monthStr]);

  const suggestedProratedDays = useMemo(() => {
    if (!entry.user?.date_joined || !monthStr) return 0;

    const joinDateParts = entry.user.date_joined
      .split(" ")[0]
      .split("-")
      .map(Number);
    if (joinDateParts.length < 3) return 0;

    const joinYear = joinDateParts[0];
    const joinMonth = joinDateParts[1] - 1;
    const joinDay = joinDateParts[2];

    const [payYear, payMonth] = monthStr.split("-").map(Number);
    const startD = new Date(payYear, payMonth - 1, 1);
    const joinD = new Date(joinYear, joinMonth, joinDay);

    if (joinD > startD) {
      const end = new Date(joinD.getTime());
      end.setDate(end.getDate() - 1);
      return countWeekdaysBetween(startD, end);
    }
    return 0;
  }, [entry.user?.date_joined, monthStr]);

  const calculateDelayFromDate = (dateVal: string) => {
    if (!dateVal || !monthStr) return 0;
    const [year, month, day] = dateVal.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month - 1, day - 1);
    return countWeekdaysBetween(start, end);
  };

  const calculateResignationDelayFromDate = (dateVal: string) => {
    if (!dateVal || !monthStr) return 0;
    const [year, month, day] = dateVal.split("-").map(Number);
    const lastDay = getDaysInMonth(year, month);
    const start = new Date(year, month - 1, day + 1);
    const end = new Date(year, month - 1, lastDay);
    return countWeekdaysBetween(start, end);
  };

  const accommodationRate = useMemo(() => {
    if (!entry.user?.contract_type) {
      return 0;
    }
    return getAccommodationRate(entry.user?.contract_type, tenureMonths);
  }, [entry.user?.contract_type, tenureMonths]);



  const computed = useMemo(() => {
    const parse = (val: string) => {
      const n = parseFloat(val);
      return isNaN(n) ? 0 : n;
    };

    const att = parse(attendanceDays);
    const susp = parse(suspensionDays);
    const prorated = parse(proratedDays);

    const otherDeductionsPayload = otherDeductions
      .map((item) => ({
        label: item.label.trim(),
        amount: parse(item.amount),
      }))
      .filter((item) => item.label.length > 0 && item.amount > 0);

    const additionsPayload = additions
      .map((item) => ({
        label: item.label.trim(),
        amount: parse(item.amount),
      }))
      .filter((item) => item.label.length > 0 && item.amount > 0);

    const baseSalary =
      (entry.calculation_snapshot as any)?.base_monthly_salary ||
      Number(entry.user?.gross_pay || entry.gross_salary || 0);

    const result = calculatePayrollEntry({
      baseSalary,
      contractType: entry.user?.contract_type ?? null,
      isIntern: !!entry.is_intern,
      dateJoined: entry.user?.date_joined ?? null,
      payrollMonth: monthStr || "",
      proratedDays: prorated,
      accommodationAmount: parse(accommodationAmount),
      attendanceDays: att,
      suspensionDays: susp,
      otherDeductions: otherDeductionsPayload,
      additions: additionsPayload,
      customGross: customActualGross !== "" ? parse(customActualGross) : null,
      customTax: customTaxAmount !== "" ? parse(customTaxAmount) : null,
      customDailyRate: customDailyRate !== "" ? parse(customDailyRate) : null,
      customNet: customNetAmount !== "" ? parse(customNetAmount) : null,
    });

    return {
      baseSalary,
      actualGross: result.gross_salary,
      accommodation: result.accommodation_amount,
      attAmount: round2(att * result.daily_rate),
      suspAmount: round2(susp * result.daily_rate),
      othAmount: result.other_deductions_amount,
      addAmount: result.additions_amount,
      prorated,
      attendanceComplianceDeduction: result.deduction_amount,
      taxAmount: result.tax_amount,
      netAmount: result.net_amount,
      dailyRate: result.daily_rate,
      fullOutput: result,
    };
  }, [
    attendanceDays,
    suspensionDays,
    proratedDays,
    accommodationAmount,
    otherDeductions,
    additions,
    monthStr,
    entry.gross_salary,
    entry.is_intern,
    entry.calculation_snapshot,
    entry.user,
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

      const additionsPayload = additions
        .map((item) => ({
          label: item.label.trim(),
          amount: parse(item.amount),
        }))
        .filter((item) => item.label.length > 0 && item.amount > 0);

      const additionsAmountTotal = additionsPayload.reduce(
        (sum, item) => sum + item.amount,
        0,
      );

      await onSave({
        attendance_days: parse(attendanceDays),
        suspension_days: parse(suspensionDays),
        prorated_days: parse(proratedDays),
        accommodation_amount: parse(accommodationAmount),
        other_deductions_amount: computed.othAmount,
        other_deductions: otherDeductionsPayload,
        additions_amount: computed.addAmount,
        additions: additionsPayload,
        override_note: note || undefined,
        deduction_amount: computed.attendanceComplianceDeduction,
        final_deduction_days: computed.fullOutput.final_deduction_days,
        
        gross_salary: computed.actualGross,
        taxable_gross: computed.actualGross,
        daily_rate: computed.dailyRate,
        tax_amount: computed.taxAmount,
        net_amount: computed.netAmount,
        calculation_snapshot: computed.fullOutput.calculation_snapshot,
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

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Left Column (Inputs) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Salary Overview */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-muted/30 border-none shadow-none">
                <CardHeader className="pb-1.5 p-3">
                  <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">
                    Salary
                  </CardDescription>
                  <CardTitle className="text-sm font-bold text-slate-800 truncate">
                    {money(computed.baseSalary)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-muted/30 border-none shadow-none">
                <CardHeader className="pb-1.5 p-3">
                  <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">
                    Actual Gross
                  </CardDescription>
                  <CardTitle className="text-sm font-bold text-slate-800 truncate">
                    {money(computed.actualGross)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-muted/30 border-none shadow-none">
                <CardHeader className="pb-1.5 p-3">
                  <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground truncate">
                    Daily Rate
                  </CardDescription>
                  <CardTitle className="text-sm font-bold text-slate-800 truncate">
                    {money(computed.dailyRate)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Deductions Breakdown Inputs */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Deductions & Adjustments
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Suggested values are calculated from system logs.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="grid gap-4">
                {/* Proration Adjustment (Resumption / Resignation) */}
                <div className="border rounded-xl p-4 bg-muted/5 hover:bg-muted/10 transition-colors space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adjustment-type" className="text-xs font-semibold text-slate-700">
                      Proration Adjustment Type
                    </Label>
                    <select
                      id="adjustment-type"
                      value={adjustmentType}
                      onChange={(e) => {
                        const val = e.target.value as "none" | "resumption" | "resignation";
                        setAdjustmentType(val);
                        setCustomActualGross("");
                        setCustomTaxAmount("");
                        setCustomDailyRate("");
                        setCustomNetAmount("");
                        if (val === "none") {
                          setProratedDays("0");
                          if (!isAccommodationOverride) {
                            setAccommodationAmount(`${accommodationRate}`);
                          }
                        } else if (val === "resumption") {
                          const delay = calculateDelayFromDate(resumptionDate);
                          setProratedDays(`${delay}`);
                          if (!isAccommodationOverride) {
                            const parts = resumptionDate.split("-");
                            const day = parts.length === 3 ? Number(parts[2]) : 1;
                            const calendarProratedDays = day - 1;
                            const calculated = calculateAccommodationAmount(accommodationRate, daysInMonth, calendarProratedDays);
                            setAccommodationAmount(`${calculated}`);
                          }
                        } else if (val === "resignation") {
                          const delay = calculateResignationDelayFromDate(resignationDate);
                          setProratedDays(`${delay}`);
                          if (!isAccommodationOverride) {
                            const parts = resignationDate.split("-");
                            const day = parts.length === 3 ? Number(parts[2]) : 15;
                            const calendarProratedDays = daysInMonth - day;
                            const calculated = calculateAccommodationAmount(accommodationRate, daysInMonth, calendarProratedDays);
                            setAccommodationAmount(`${calculated}`);
                          }
                        }
                      }}
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="none">No Proration Adjustment</option>
                      <option value="resumption">Resumed Mid-Month</option>
                      <option value="resignation">Resigned Before Month End</option>
                    </select>
                  </div>

                  {adjustmentType === "resumption" && (
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-dashed animate-in fade-in duration-200">
                      <div className="space-y-2">
                        <Label
                          htmlFor="resumption-date"
                          className="text-xs font-semibold text-slate-600"
                        >
                          Resumption Date
                        </Label>
                        <Input
                          id="resumption-date"
                          type="date"
                          min={monthStr ? `${monthStr}-01` : undefined}
                          max={
                            monthStr && daysInMonth
                              ? `${monthStr}-${daysInMonth}`
                              : undefined
                          }
                          value={resumptionDate}
                          onChange={(e) => {
                            const dateVal = e.target.value;
                            setResumptionDate(dateVal);
                            setCustomActualGross("");
                            setCustomTaxAmount("");
                            setCustomDailyRate("");
                            setCustomNetAmount("");
                            const delay = calculateDelayFromDate(dateVal);
                            setProratedDays(`${delay}`);
                            if (!isAccommodationOverride) {
                              const parts = dateVal.split("-");
                              const day = parts.length === 3 ? Number(parts[2]) : 1;
                              const calendarProratedDays = day - 1;
                              const calculated = calculateAccommodationAmount(accommodationRate, daysInMonth, calendarProratedDays);
                              setAccommodationAmount(`${calculated}`);
                            }
                          }}
                          className="bg-background text-xs h-9 cursor-pointer"
                        />
                        {entry.user?.date_joined && (
                          <p className="text-[10px] text-muted-foreground">
                            System Date:{" "}
                            <span className="font-semibold text-slate-600">
                              {entry.user.date_joined.split(" ")[0]}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="prorated-days"
                          className="text-xs font-semibold text-slate-600"
                        >
                          Days Missed Before Joining
                        </Label>
                        <div className="relative">
                          <Input
                            id="prorated-days"
                            type="number"
                            step="0.01"
                            value={proratedDays}
                            onChange={(e) => {
                              setProratedDays(e.target.value);
                              setCustomActualGross("");
                              setCustomTaxAmount("");
                              setCustomDailyRate("");
                              setCustomNetAmount("");
                            }}
                            className="pr-16 bg-background text-xs h-9"
                          />
                          <div className="absolute inset-y-0 right-3 flex items-center text-[10px] text-muted-foreground pointer-events-none">
                            days
                          </div>
                        </div>
                        {suggestedProratedDays > 0 && (
                          <p className="text-[10px] text-orange-600 font-medium">
                            Suggested delay: {suggestedProratedDays} days
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {adjustmentType === "resignation" && (
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-dashed animate-in fade-in duration-200">
                      <div className="space-y-2">
                        <Label
                          htmlFor="resignation-date"
                          className="text-xs font-semibold text-slate-600"
                        >
                          Resignation Date
                        </Label>
                        <Input
                          id="resignation-date"
                          type="date"
                          min={monthStr ? `${monthStr}-01` : undefined}
                          max={
                            monthStr && daysInMonth
                              ? `${monthStr}-${daysInMonth}`
                              : undefined
                          }
                          value={resignationDate}
                          onChange={(e) => {
                            const dateVal = e.target.value;
                            setResignationDate(dateVal);
                            setCustomActualGross("");
                            setCustomTaxAmount("");
                            setCustomDailyRate("");
                            setCustomNetAmount("");
                            const delay = calculateResignationDelayFromDate(dateVal);
                            setProratedDays(`${delay}`);
                            if (!isAccommodationOverride) {
                              const parts = dateVal.split("-");
                              const day = parts.length === 3 ? Number(parts[2]) : 15;
                              const calendarProratedDays = daysInMonth - day;
                              const calculated = calculateAccommodationAmount(accommodationRate, daysInMonth, calendarProratedDays);
                              setAccommodationAmount(`${calculated}`);
                            }
                          }}
                          className="bg-background text-xs h-9 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="prorated-days"
                          className="text-xs font-semibold text-slate-600"
                        >
                          Days Missed After Resignation
                        </Label>
                        <div className="relative">
                          <Input
                            id="prorated-days"
                            type="number"
                            step="0.01"
                            value={proratedDays}
                            onChange={(e) => {
                              setProratedDays(e.target.value);
                              setCustomActualGross("");
                              setCustomTaxAmount("");
                              setCustomDailyRate("");
                              setCustomNetAmount("");
                            }}
                            className="pr-16 bg-background text-xs h-9"
                          />
                          <div className="absolute inset-y-0 right-3 flex items-center text-[10px] text-muted-foreground pointer-events-none">
                            days
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {adjustmentType !== "none" && (
                    <div className="flex justify-between items-center text-right pt-2 border-t">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        Proration Effect
                      </span>
                      <span className="text-base font-bold text-amber-600">
                        -{money(computed.baseSalary - computed.actualGross)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Accommodation */}
                <div className="grid grid-cols-2 gap-4 border rounded-xl p-4 bg-muted/5 hover:bg-muted/10 transition-colors">
                  <div className="space-y-2">
                    <Label
                      htmlFor="accommodation-amount"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Accommodation Fee
                    </Label>
                    <div className="relative">
                      <Input
                        id="accommodation-amount"
                        type="number"
                        step="0.01"
                        value={accommodationAmount}
                        onChange={(e) => {
                          setIsAccommodationOverride(true);
                          setAccommodationAmount(e.target.value);
                          setCustomActualGross("");
                          setCustomTaxAmount("");
                          setCustomDailyRate("");
                          setCustomNetAmount("");
                        }}
                        className="pr-16 bg-background text-xs h-9"
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center text-[10px] text-muted-foreground pointer-events-none">
                        NGN
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Default Rate: {money(accommodationRate)}
                    </p>
                  </div>
                  <div className="flex flex-col justify-center items-end text-right">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      Deduction Value
                    </span>
                    <span className="text-base font-bold text-red-600 mt-1">
                      -{money(computed.accommodation)}
                    </span>
                  </div>
                </div>

                {/* Attendance */}
                <div className="grid grid-cols-2 gap-4 border rounded-xl p-4 bg-muted/5 hover:bg-muted/10 transition-colors">
                  <div className="space-y-2">
                    <Label
                      htmlFor="att-days"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Absent Days (Unpaid)
                    </Label>
                    <div className="relative">
                      <Input
                        id="att-days"
                        type="number"
                        step="0.01"
                        value={attendanceDays}
                        onChange={(e) => {
                          setAttendanceDays(e.target.value);
                          setCustomActualGross("");
                          setCustomTaxAmount("");
                          setCustomDailyRate("");
                          setCustomNetAmount("");
                        }}
                        className="pr-16 bg-background text-xs h-9"
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center text-[10px] text-muted-foreground pointer-events-none">
                        days
                      </div>
                    </div>
                    {Number(entry.attendance_suggested_days) > 0 && (
                      <p className="text-[10px] text-orange-600 font-medium leading-tight">
                        Suggested absences: {entry.attendance_suggested_days}{" "}
                        days
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col justify-center items-end text-right">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      Absence Deduction
                    </span>
                    <span className="text-base font-bold text-red-600 mt-1">
                      -{money(computed.attAmount)}
                    </span>
                  </div>
                </div>

                {/* Suspensions */}
                <div className="grid grid-cols-2 gap-4 border rounded-xl p-4 bg-muted/5 hover:bg-muted/10 transition-colors">
                  <div className="space-y-2">
                    <Label
                      htmlFor="susp-days"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Suspension Period
                    </Label>
                    <div className="relative">
                      <Input
                        id="susp-days"
                        type="number"
                        step="0.01"
                        value={suspensionDays}
                        onChange={(e) => {
                        setSuspensionDays(e.target.value);
                        setCustomActualGross("");
                        setCustomTaxAmount("");
                        setCustomDailyRate("");
                        setCustomNetAmount("");
                      }}
                        className="pr-16 bg-background text-xs h-9"
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center text-[10px] text-muted-foreground pointer-events-none">
                        days
                      </div>
                    </div>
                    {Number(entry.compliance_suggested_days) > 0 && (
                      <p className="text-[10px] text-orange-600 font-medium">
                        Suggested: {entry.compliance_suggested_days} days
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col justify-center items-end text-right">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      Suspension Deduction
                    </span>
                    <span className="text-base font-bold text-red-600 mt-1">
                      -{money(computed.suspAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Overrides Collapsible */}
            <div className="border rounded-xl p-4 bg-muted/5 hover:bg-muted/10 transition-colors space-y-4">
              <button
                type="button"
                className="flex items-center justify-between w-full text-left font-bold text-xs uppercase tracking-wider text-slate-700 focus:outline-none cursor-pointer"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              >
                <span>Manual Calculation Overrides (Advanced)</span>
                <span className="text-muted-foreground font-semibold">{isAdvancedOpen ? "Hide" : "Show"}</span>
              </button>
              
              {isAdvancedOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-dashed animate-in fade-in duration-200">
                  {/* Actual Gross Override */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="custom-gross" className="text-xs font-semibold text-slate-600">
                        Actual Gross Pay
                      </Label>
                      {customActualGross !== "" && (
                        <button
                          type="button"
                          className="text-[10px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                          onClick={() => setCustomActualGross("")}
                        >
                          Revert to Auto
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="custom-gross"
                        type="number"
                        step="0.01"
                        value={customActualGross !== "" ? customActualGross : computed.fullOutput.gross_salary}
                        onChange={(e) => setCustomActualGross(e.target.value)}
                        onFocus={() => {
                          if (customActualGross === "") {
                            setCustomActualGross(String(computed.fullOutput.gross_salary));
                          }
                        }}
                        className={cn(
                          "pr-12 bg-background text-xs h-9",
                          customActualGross !== "" && "border-amber-500 focus-visible:ring-amber-500"
                        )}
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center text-[10px] text-muted-foreground pointer-events-none">
                        NGN
                      </div>
                    </div>
                  </div>

                  {/* PAYE Tax Override */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="custom-tax" className="text-xs font-semibold text-slate-600">
                        PAYE Tax
                      </Label>
                      {customTaxAmount !== "" && (
                        <button
                          type="button"
                          className="text-[10px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                          onClick={() => setCustomTaxAmount("")}
                        >
                          Revert to Auto
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="custom-tax"
                        type="number"
                        step="0.01"
                        value={customTaxAmount !== "" ? customTaxAmount : computed.fullOutput.tax_amount}
                        onChange={(e) => setCustomTaxAmount(e.target.value)}
                        onFocus={() => {
                          if (customTaxAmount === "") {
                            setCustomTaxAmount(String(computed.fullOutput.tax_amount));
                          }
                        }}
                        className={cn(
                          "pr-12 bg-background text-xs h-9",
                          customTaxAmount !== "" && "border-amber-500 focus-visible:ring-amber-500"
                        )}
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center text-[10px] text-muted-foreground pointer-events-none">
                        NGN
                      </div>
                    </div>
                  </div>

                  {/* Daily Rate Override */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="custom-daily-rate" className="text-xs font-semibold text-slate-600">
                        Daily Rate
                      </Label>
                      {customDailyRate !== "" && (
                        <button
                          type="button"
                          className="text-[10px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                          onClick={() => setCustomDailyRate("")}
                        >
                          Revert to Auto
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="custom-daily-rate"
                        type="number"
                        step="0.01"
                        value={customDailyRate !== "" ? customDailyRate : computed.fullOutput.daily_rate}
                        onChange={(e) => setCustomDailyRate(e.target.value)}
                        onFocus={() => {
                          if (customDailyRate === "") {
                            setCustomDailyRate(String(computed.fullOutput.daily_rate));
                          }
                        }}
                        className={cn(
                          "pr-12 bg-background text-xs h-9",
                          customDailyRate !== "" && "border-amber-500 focus-visible:ring-amber-500"
                        )}
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center text-[10px] text-muted-foreground pointer-events-none">
                        NGN
                      </div>
                    </div>
                  </div>

                  {/* Net Pay Override */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="custom-net" className="text-xs font-semibold text-slate-600">
                        Net Pay
                      </Label>
                      {customNetAmount !== "" && (
                        <button
                          type="button"
                          className="text-[10px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                          onClick={() => setCustomNetAmount("")}
                        >
                          Revert to Auto
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="custom-net"
                        type="number"
                        step="0.01"
                        value={customNetAmount !== "" ? customNetAmount : computed.fullOutput.net_amount}
                        onChange={(e) => setCustomNetAmount(e.target.value)}
                        onFocus={() => {
                          if (customNetAmount === "") {
                            setCustomNetAmount(String(computed.fullOutput.net_amount));
                          }
                        }}
                        className={cn(
                          "pr-12 bg-background text-xs h-9",
                          customNetAmount !== "" && "border-amber-500 focus-visible:ring-amber-500"
                        )}
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center text-[10px] text-muted-foreground pointer-events-none">
                        NGN
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Other Deductions */}
            <div className="border rounded-xl p-4 bg-muted/5 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Other Deductions
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOtherDeduction}
                  className="h-7 text-[11px] font-semibold"
                >
                  Add Item
                </Button>
              </div>
              {otherDeductions.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">
                  No other deductions added.
                </p>
              ) : (
                <div className="space-y-2">
                  {otherDeductions.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_140px_auto] items-center gap-2"
                    >
                      <Input
                        type="text"
                        placeholder="Label"
                        value={item.label}
                        onChange={(e) =>
                          updateOtherDeduction(index, "label", e.target.value)
                        }
                        className="h-9 text-xs bg-background"
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
                          className="pl-10 h-9 text-xs bg-background"
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
                        className="text-muted-foreground hover:text-foreground h-9 w-9"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end text-xs text-muted-foreground border-t pt-2 mt-1">
                Total:{" "}
                <span className="ml-2 font-bold text-red-600">
                  {money(computed.othAmount)}
                </span>
              </div>
            </div>

            {/* Additions */}
            <div className="border rounded-xl p-4 bg-muted/5 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Additions
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAddition}
                  className="h-7 text-[11px] font-semibold"
                >
                  Add Item
                </Button>
              </div>
              {additions.length === 0 ? (
                <p className="text-[11px] text-muted-foreground italic">
                  No additions added.
                </p>
              ) : (
                <div className="space-y-2">
                  {additions.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_140px_auto] items-center gap-2"
                    >
                      <Input
                        type="text"
                        placeholder="Label"
                        value={item.label}
                        onChange={(e) =>
                          updateAddition(index, "label", e.target.value)
                        }
                        className="h-9 text-xs bg-background"
                      />
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) =>
                            updateAddition(index, "amount", e.target.value)
                          }
                          className="pl-10 h-9 text-xs bg-background"
                        />
                        <div className="absolute inset-y-0 left-3 flex items-center text-xs text-muted-foreground pointer-events-none">
                          ₦
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAddition(index)}
                        className="text-muted-foreground hover:text-foreground h-9 w-9"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-end text-xs text-muted-foreground border-t pt-2 mt-1">
                Total:{" "}
                <span className="ml-2 font-bold text-emerald-600">
                  {money(computed.addAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (Computation & Summary) */}
          <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-0">
            {/* Calculation Summary */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Net Computation
              </h3>
              <div className="grid gap-3 rounded-xl border p-4 bg-card shadow-sm text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Monthly Contract Salary</span>
                  <span className="font-semibold">
                    {money(computed.baseSalary)}
                  </span>
                </div>
                {computed.prorated > 0 && (
                  <div className="flex justify-between text-red-600 bg-red-50/55 p-2 rounded-lg">
                    <span className="italic">
                      {adjustmentType === "resignation"
                        ? `Resigned Before Month End (${computed.prorated} days)`
                        : `Joined Mid-Month (${computed.prorated} days)`}
                    </span>
                    <span className="font-semibold">
                      -{money(computed.baseSalary - computed.actualGross)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t pt-2 font-bold text-slate-800">
                  <span>Actual Gross Salary:</span>
                  <span>{money(computed.actualGross)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-red-600">
                  <span>Income Tax (PAYE)</span>
                  <span className="font-semibold">
                    -{money(computed.taxAmount)}
                  </span>
                </div>
                {computed.accommodation > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Accommodation Fee</span>
                    <span className="font-semibold">
                      -{money(computed.accommodation)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center border-t pt-2 bg-slate-50/50 p-2 rounded-lg">
                  <span className="font-bold text-slate-700">
                    After Tax & Acc:
                  </span>
                  <span className="font-black text-slate-900">
                    {money(
                      computed.actualGross -
                        computed.taxAmount -
                        computed.accommodation,
                    )}
                  </span>
                </div>

                <Separator />

                {computed.attAmount > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span className="italic">
                      Absent Days ({attendanceDays} days):
                    </span>
                    <span className="font-semibold">
                      -{money(computed.attAmount)}
                    </span>
                  </div>
                )}
                {computed.suspAmount > 0 && (
                  <div className="flex justify-between items-center text-red-600">
                    <span className="italic">
                      Suspension Ded. ({suspensionDays} days):
                    </span>
                    <span className="font-semibold">
                      -{money(computed.suspAmount)}
                    </span>
                  </div>
                )}
                {computed.othAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Other Deductions</span>
                    <span className="font-semibold">
                      -{money(computed.othAmount)}
                    </span>
                  </div>
                )}
                {computed.addAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Additions</span>
                    <span className="font-semibold">
                      +{money(computed.addAmount)}
                    </span>
                  </div>
                )}
                <Separator className="border-dashed" />
                <div className="flex justify-between items-center pt-1">
                  <span className="font-bold text-slate-800 text-sm">
                    Final Net Pay
                  </span>
                  <span className="text-xl font-black text-primary tracking-tight">
                    {money(computed.netAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2 border rounded-xl p-4 bg-muted/5">
              <Label
                htmlFor="override-note"
                className="text-xs uppercase tracking-wider text-muted-foreground font-bold"
              >
                Internal Note
              </Label>
              <Input
                id="override-note"
                placeholder="Reason for overrides..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-background text-xs h-9"
              />
            </div>
          </div>
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
