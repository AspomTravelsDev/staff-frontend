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
import {
  calculateAccommodationAmount,
  calculateActualGrossWorkingDays,
  calculateMonthlyTax,
  countWeekdaysBetween,
  getAccommodationRate,
  getDaysInMonth,
  getWorkingDaysInMonth,
} from "@/lib/payroll/calculations";

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
  const [isMidMonthResumption, setIsMidMonthResumption] = useState<boolean>(
    () => {
      const monthStrVal = payrollMonth || entry.run?.payroll_month;
      return (
        Number(entry.prorated_days ?? 0) > 0 ||
        (!!entry.user?.date_joined &&
          !!monthStrVal &&
          entry.user.date_joined.startsWith(monthStrVal))
      );
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
    setIsMidMonthResumption(hasProration || isJoinedThisMonth);
    setResumptionDate(
      isJoinedThisMonth
        ? entry.user!.date_joined!.split(" ")[0]
        : monthStrVal
          ? `${monthStrVal}-01`
          : "",
    );
  }, [entry, payrollMonth]);

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

  const updateAddition = (
    index: number,
    key: "label" | "amount",
    value: string,
  ) => {
    setAdditions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  };

  const addAddition = () => {
    setAdditions((prev) => [...prev, { label: "", amount: "" }]);
  };

  const removeAddition = (index: number) => {
    setAdditions((prev) => prev.filter((_, i) => i !== index));
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
    const othAmount = otherDeductions.reduce(
      (sum, item) => sum + parse(item.amount),
      0,
    );
    const addAmount = additions.reduce(
      (sum, item) => sum + parse(item.amount),
      0,
    );

    const baseSalary =
      (entry.calculation_snapshot as any)?.base_monthly_salary ||
      Number(entry.user?.gross_pay || entry.gross_salary || 0);

    // Linear Proration Factor
    const activeWorkingDays = Math.max(0, workingDaysInMonth - prorated);
    const factor = workingDaysInMonth > 0 ? activeWorkingDays / workingDaysInMonth : 0.0;

    // Prorated Gross & Tax (Linear)
    const actualGross = Math.round(baseSalary * factor * 100) / 100;
    const baseTax = entry.is_intern ? 0 : calculateMonthlyTax(baseSalary);
    const taxAmount = entry.is_intern ? 0 : Math.round(baseTax * factor * 100) / 100;

    const baseNet = Math.max(0, baseSalary - baseTax);
    const proratedNet = Math.round(baseNet * factor * 100) / 100;

    const accAmount = parse(accommodationAmount);

    // Daily rate base (June Gross - Tax - Accommodation - Other Deductions)
    const dailyRateBase = Math.max(
      0,
      actualGross - taxAmount - accAmount - othAmount,
    );

    // Daily rate based on dailyRateBase over workingDaysInMonth
    const dailyRateFinal =
      workingDaysInMonth > 0
        ? Math.round((dailyRateBase / workingDaysInMonth) * 100) / 100
        : 0;

    const attAmount = Math.round(att * dailyRateFinal * 100) / 100;
    const suspAmount = Math.round(susp * dailyRateFinal * 100) / 100;

    const attendanceComplianceDeduction =
      Math.round((attAmount + suspAmount) * 100) / 100;

    // Final Net = proratedNet - accommodation - other - penalties + additions
    const netAmount = Math.max(
      0,
      proratedNet - accAmount - othAmount - attendanceComplianceDeduction + addAmount,
    );

    return {
      baseSalary,
      actualGross,
      accommodation: accAmount,
      attAmount,
      suspAmount,
      othAmount,
      addAmount,
      prorated,
      attendanceComplianceDeduction,
      taxAmount,
      netAmount,
      dailyRate: dailyRateFinal,
    };
  }, [
    attendanceDays,
    suspensionDays,
    proratedDays,
    accommodationAmount,
    otherDeductions,
    additions,
    daysInMonth,
    workingDaysInMonth,
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
        other_deductions_amount: otherAmountTotal,
        other_deductions: otherDeductionsPayload,
        additions_amount: additionsAmountTotal,
        additions: additionsPayload,
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
                {/* Resumption Delay (Joined Mid-Month) */}
                <div className="border rounded-xl p-4 bg-muted/5 hover:bg-muted/10 transition-colors space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="mid-month-toggle"
                        className="text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        Resumed Mid-Month?
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Toggle to calculate proration delay for mid-month
                        resumption.
                      </p>
                    </div>
                    <input
                      id="mid-month-toggle"
                      type="checkbox"
                      checked={isMidMonthResumption}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsMidMonthResumption(checked);
                        if (!checked) {
                          setProratedDays("0");
                          if (!isAccommodationOverride) {
                            setAccommodationAmount(`${accommodationRate}`);
                          }
                        } else {
                          const delay = calculateDelayFromDate(resumptionDate);
                          setProratedDays(`${delay}`);
                          if (!isAccommodationOverride) {
                            const parts = resumptionDate.split("-");
                            const day = parts.length === 3 ? Number(parts[2]) : 1;
                            const calendarProratedDays = day - 1;
                            const calculated = calculateAccommodationAmount(accommodationRate, daysInMonth, calendarProratedDays);
                            setAccommodationAmount(`${calculated}`);
                          }
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>

                  {isMidMonthResumption && (
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
                            onChange={(e) => setProratedDays(e.target.value)}
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

                  {isMidMonthResumption && (
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
                        onChange={(e) => setAttendanceDays(e.target.value)}
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
                        onChange={(e) => setSuspensionDays(e.target.value)}
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
                      Joined Mid-Month ({computed.prorated} days)
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
