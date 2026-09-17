/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  approvePayrollEntry,
  closePayrollRun,
  createPayrollRun,
  deletePayrollRun,
  getPayrollRun,
  listPayrollRuns,
  overridePayrollEntry,
  previewPayroll,
  recalculatePayrollEntry,
  reopenPayrollRun,
  type PayrollEntry,
  type PayrollRun,
} from "@/lib/api/payroll";
import { BulkExportButton } from "./bulk-export-button";
import { PayrollWorkflowBar } from "./payroll-workflow-bar";
import PayrollEntrySheet from "./payroll-entry-sheet";
import { useUser } from "@/providers/user-provider";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { StatsCard } from "@/components/stats-card";
import {
  Banknote,
  MinusCircle,
  CheckCircle2,
  RefreshCcw,
  RotateCcw,
  CheckCheck,
  ChevronRight,
  Trash2,
} from "lucide-react";

import {
  calculateAccommodationAmount,
  calculateMonthlyTax,
  calculatePayrollEntry,
  getAccommodationRate,
  getDaysInMonth,
  getWorkingDaysInMonth,
} from "@/lib/payroll/calculations";

const getCurrentMonth = () => {
  const date = new Date();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
};

function money(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
}

function getOtherDeductionsTotal(entry: PayrollEntry) {
  if (
    Array.isArray(entry.other_deductions) &&
    entry.other_deductions.length > 0
  ) {
    return entry.other_deductions.reduce(
      (sum, item) => sum + Number(item?.amount ?? 0),
      0,
    );
  }

  return Number(entry.other_deductions_amount || 0);
}

function getAdditionsTotal(entry: PayrollEntry) {
  if (Array.isArray(entry.additions) && entry.additions.length > 0) {
    return entry.additions.reduce(
      (sum, item) => sum + Number(item?.amount ?? 0),
      0,
    );
  }

  return Number(entry.additions_amount || 0);
}

function getAccommodationTotal(entry: PayrollEntry) {
  return Number(
    entry.accommodation_amount ??
      (entry as any).calculation_snapshot?.accommodation_amount ??
      0,
  );
}

function formatMonthLabel(isoMonth?: string) {
  if (!isoMonth) return "";
  // expect YYYY-MM or YYYY-MM-DD
  const parts = isoMonth.split("-");
  if (parts.length < 2) return isoMonth;
  const year = parts[0];
  const month = Number(parts[1]);
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const short = names[month - 1] ?? parts[1];
  return `${short}, ${year}`;
}

export function PayrollManager() {
  const { user } = useUser();
  const userRoles = user?.roles && user.roles.length > 0
    ? user.roles
    : [user?.role, ...(user?.secondary_roles || [])].filter(Boolean);
  const isHr = userRoles.includes("hr") || userRoles.includes("super");
  const isMd = userRoles.includes("md") || userRoles.includes("super");

  const [selectedMonth, setSelectedMonth] = useState("");
  const [currentRun, setCurrentRun] = useState<PayrollRun | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [overrideNotes, setOverrideNotes] = useState<Record<string, string>>(
    {},
  );
  const [overrideDays, setOverrideDays] = useState<Record<string, string>>({});
  const [activeEntry, setActiveEntry] = useState<PayrollEntry | null>(null);
  const [busyEntries, setBusyEntries] = useState<Record<string, boolean>>({});
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isPersistedRun = (run?: PayrollRun | null) => {
    return !!run && !!run.id;
  };

  const entries = currentRun?.entries ?? [];
  const pendingCount = entries.filter(
    (entry) => entry.status !== "approved",
  ).length;

  const totalEntries =
    currentRun?.summary?.total_entries ?? entries.length ?? 0;
  const approvedCount =
    currentRun?.summary?.approved_entries ??
    Math.max(0, entries.length - pendingCount);

  const loadMonthRun = useCallback(async () => {
    setIsBusy(true);
    try {
      const runsResult = await listPayrollRuns(selectedMonth || undefined);
      if (!runsResult.success) {
        throw new Error(
          runsResult.error.error || "Failed to load payroll run.",
        );
      }

      const firstRun = runsResult.data.data[0];
      if (!firstRun) {
        const targetMonth = selectedMonth || getCurrentMonth();
        setSelectedMonth(targetMonth);

        // Fetch raw suggestions from preview endpoint
        const previewRes = await previewPayroll(targetMonth);
        if (!previewRes.success) {
          throw new Error(previewRes.error.error || "Failed to load preview suggestions.");
        }

        const previewEntries = previewRes.data.data.entries;
        const calculatedEntries = previewEntries.map((pe: any) => {
          const result = calculatePayrollEntry({
            baseSalary: Number(pe.user.gross_pay || 0),
            contractType: pe.user.contract_type ?? null,
            isIntern: !!pe.is_intern,
            dateJoined: pe.user.date_joined ?? null,
            payrollMonth: targetMonth,
            proratedDays: Number(pe.prorated_days || 0),
            accommodationAmount: Number(pe.accommodation_amount || 0),
            attendanceDays: Number(pe.attendance_suggested_days || 0),
            suspensionDays: Number(pe.compliance_suggested_days || 0),
            otherDeductions: [],
            additions: [],
          });
          return {
            user_id: pe.user.id,
            gross_salary: result.gross_salary,
            taxable_gross: result.taxable_gross,
            is_intern: result.is_intern,
            attendance_days: result.attendance_days,
            suspension_days: result.suspension_days,
            prorated_days: result.prorated_days,
            other_deductions_amount: result.other_deductions_amount,
            other_deductions: result.other_deductions,
            accommodation_amount: result.accommodation_amount,
            additions_amount: result.additions_amount,
            additions: result.additions,
            attendance_suggested_days: Number(pe.attendance_suggested_days || 0),
            compliance_suggested_days: Number(pe.compliance_suggested_days || 0),
            system_suggested_days: Number(pe.attendance_suggested_days || 0) + Number(pe.compliance_suggested_days || 0),
            final_deduction_days: result.final_deduction_days,
            daily_rate: result.daily_rate,
            deduction_amount: result.deduction_amount,
            tax_amount: result.tax_amount,
            net_amount: result.net_amount,
            calculation_snapshot: result.calculation_snapshot,
          };
        });

        const result = await createPayrollRun(targetMonth, false, calculatedEntries);
        if (!result.success) {
          throw new Error(
            result.error.error || "Failed to auto-generate payroll run.",
          );
        }

        const runId = result.data.data.id;
        const runDetails = await getPayrollRun(runId);
        if (!runDetails.success) {
          throw new Error(
            runDetails.error.error || "Failed to fetch generated run details.",
          );
        }

        setCurrentRun(runDetails.data.data);
        toast.success(`Production payroll run generated for ${targetMonth}`);
        return;
      }

      if (!selectedMonth) {
        setSelectedMonth(firstRun.payroll_month);
      }

      const runResult = await getPayrollRun(firstRun.id);
      if (!runResult.success) {
        throw new Error(
          runResult.error.error || "Failed to load payroll run details.",
        );
      }

      setCurrentRun(runResult.data.data);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load payroll run.",
      );
    } finally {
      setIsBusy(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadMonthRun();
  }, [loadMonthRun]);

  const handleApprove = async (entryId: string) => {
    setBusyEntries((p) => ({ ...p, [entryId]: true }));
    try {
      const result = await approvePayrollEntry(entryId);
      if (!result.success) {
        throw new Error(result.error.error || "Failed to approve entry.");
      }
      toast.success("Payroll entry approved.");
      if (currentRun?.id) {
        const refreshed = await getPayrollRun(currentRun.id);
        if (refreshed.success) setCurrentRun(refreshed.data.data);
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Unable to approve entry.",
      );
    } finally {
      setBusyEntries((p) => ({ ...p, [entryId]: false }));
    }
  };

  const handleResetRun = async () => {
    setIsResetDialogOpen(false);
    setIsBusy(true);
    try {
      const previewRes = await previewPayroll(selectedMonth);
      if (!previewRes.success) {
        throw new Error(previewRes.error.error || "Failed to load preview suggestions.");
      }

      const previewEntries = previewRes.data.data.entries;
      const calculatedEntries = previewEntries.map((pe: any) => {
        const result = calculatePayrollEntry({
          baseSalary: Number(pe.user.gross_pay || 0),
          contractType: pe.user.contract_type ?? null,
          isIntern: !!pe.is_intern,
          dateJoined: pe.user.date_joined ?? null,
          payrollMonth: selectedMonth,
          proratedDays: Number(pe.prorated_days || 0),
          accommodationAmount: Number(pe.accommodation_amount || 0),
          attendanceDays: Number(pe.attendance_suggested_days || 0),
          suspensionDays: Number(pe.compliance_suggested_days || 0),
          otherDeductions: [],
          additions: [],
        });
        return {
          user_id: pe.user.id,
          gross_salary: result.gross_salary,
          taxable_gross: result.taxable_gross,
          is_intern: result.is_intern,
          attendance_days: result.attendance_days,
          suspension_days: result.suspension_days,
          prorated_days: result.prorated_days,
          other_deductions_amount: result.other_deductions_amount,
          other_deductions: result.other_deductions,
          accommodation_amount: result.accommodation_amount,
          additions_amount: result.additions_amount,
          additions: result.additions,
          attendance_suggested_days: Number(pe.attendance_suggested_days || 0),
          compliance_suggested_days: Number(pe.compliance_suggested_days || 0),
          system_suggested_days: Number(pe.attendance_suggested_days || 0) + Number(pe.compliance_suggested_days || 0),
          final_deduction_days: result.final_deduction_days,
          daily_rate: result.daily_rate,
          deduction_amount: result.deduction_amount,
          tax_amount: result.tax_amount,
          net_amount: result.net_amount,
          calculation_snapshot: result.calculation_snapshot,
        };
      });

      const result = await createPayrollRun(selectedMonth, true, calculatedEntries);
      if (!result.success) {
        throw new Error(result.error.error || "Failed to reset payroll run.");
      }

      toast.success("Payroll run has been reset and recalculated.");
      const runId = result.data.data.id;
      const runDetails = await getPayrollRun(runId);
      if (runDetails.success) {
        setCurrentRun(runDetails.data.data);
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Unable to reset payroll run.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedEntries.length === 0) return;

    setIsBulkApproving(true);
    const toastId = toast.loading(
      `Approving ${selectedEntries.length} entries...`,
    );

    let successCount = 0;
    let failCount = 0;

    for (const entryId of selectedEntries) {
      try {
        const result = await approvePayrollEntry(entryId);
        if (result.success) successCount++;
        else failCount++;
      } catch (err) {
        failCount++;
      }
    }

    toast.success(
      `Successfully approved ${successCount} entries.${failCount > 0 ? ` ${failCount} failed.` : ""}`,
      { id: toastId },
    );
    setSelectedEntries([]);
    if (currentRun?.id) {
      const refreshed = await getPayrollRun(currentRun.id);
      if (refreshed.success) setCurrentRun(refreshed.data.data);
    }
    setIsBulkApproving(false);
  };

  const toggleSelectAll = () => {
    if (selectedEntries.length === entries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(entries.map((e) => e.id));
    }
  };

  const toggleSelectEntry = (id: string) => {
    setSelectedEntries((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleCloseRun = async () => {
    if (!currentRun) return;
    setIsBusy(true);
    try {
      const result = await closePayrollRun(currentRun.id);
      if (!result.success) {
        throw new Error(result.error.error || "Failed to close payroll run.");
      }
      toast.success("Payroll run closed.");
      const refreshed = await getPayrollRun(currentRun.id);
      if (refreshed.success) setCurrentRun(refreshed.data.data);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Unable to close payroll run.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleReopenRun = async () => {
    if (!currentRun) return;
    setIsBusy(true);
    try {
      const result = await reopenPayrollRun(currentRun.id);
      if (!result.success) {
        throw new Error(result.error.error || "Failed to re-open payroll run.");
      }
      toast.success("Payroll run re-opened.");
      const refreshed = await getPayrollRun(currentRun.id);
      if (refreshed.success) setCurrentRun(refreshed.data.data);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to re-open payroll run.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteRun = async () => {
    if (!currentRun) return;
    setIsDeleteDialogOpen(false);
    setIsBusy(true);
    try {
      const result = await deletePayrollRun(currentRun.id);
      if (!result.success) {
        throw new Error(result.error.error || "Failed to delete payroll run.");
      }
      toast.success(
        `Payroll run for ${formatMonthLabel(currentRun.payroll_month)} deleted.`,
      );
      setCurrentRun(null);
      await loadMonthRun();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to delete payroll run.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleRecalculateEntry = async (entryId: string) => {
    setBusyEntries((p) => ({ ...p, [entryId]: true }));
    try {
      const defaultsRes = await recalculatePayrollEntry(entryId);
      if (!defaultsRes.success) {
        throw new Error(defaultsRes.error.error || "Failed to recalculate entry.");
      }

      const raw = defaultsRes.data.data as any;
      const target = currentRun?.entries?.find((e) => e.id === entryId);
      if (!target) throw new Error("Entry not found in current run.");

      const baseSalary = (target.calculation_snapshot as any)?.base_monthly_salary || Number(target.user?.gross_pay || target.gross_salary || 0);
      const computed = calculatePayrollEntry({
        baseSalary,
        contractType: target.user?.contract_type ?? null,
        isIntern: !!raw.is_intern,
        dateJoined: target.user?.date_joined ?? null,
        payrollMonth: currentRun?.payroll_month || selectedMonth,
        proratedDays: Number(raw.prorated_days || 0),
        accommodationAmount: Number(raw.accommodation_amount || 0),
        attendanceDays: Number(raw.attendance_suggested_days || 0),
        suspensionDays: Number(raw.compliance_suggested_days || 0),
        otherDeductions: [],
        additions: [],
      });

      const result = await overridePayrollEntry(entryId, {
        attendance_days: Number(raw.attendance_suggested_days || 0),
        suspension_days: Number(raw.compliance_suggested_days || 0),
        prorated_days: Number(raw.prorated_days || 0),
        accommodation_amount: Number(raw.accommodation_amount || 0),
        other_deductions_amount: 0,
        other_deductions: [],
        additions_amount: 0,
        additions: [],
        override_note: "",
        deduction_amount: computed.deduction_amount,
        final_deduction_days: computed.final_deduction_days,

        gross_salary: computed.gross_salary,
        taxable_gross: computed.taxable_gross,
        daily_rate: computed.daily_rate,
        tax_amount: computed.tax_amount,
        net_amount: computed.net_amount,
        calculation_snapshot: computed.calculation_snapshot,
      });

      if (!result.success) {
        throw new Error(result.error.error || "Failed to save recalculated default entry.");
      }

      if (currentRun?.id) {
        const refreshed = await getPayrollRun(currentRun.id);
        if (refreshed.success) {
          setCurrentRun(refreshed.data.data);
          if (activeEntry?.id === entryId) {
            const updated = refreshed.data.data.entries?.find(
              (e) => e.id === entryId,
            );
            if (updated) setActiveEntry(updated);
          }
        }
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Unable to recalculate entry.",
      );
    } finally {
      setBusyEntries((p) => ({ ...p, [entryId]: false }));
    }
  };

  // Export current payroll run as CSV (Excel-compatible)
  const exportPayrollCsv = () => {
    if (!currentRun) return;
    const rawMonth = currentRun.payroll_month || selectedMonth;
    const displayMonthLabel = formatMonthLabel(rawMonth);
    // safe filename label like Apr-2026
    const parts = (rawMonth || "").split("-");
    const year = parts[0] ?? "";
    const monthIndex = Number(parts[1] ?? 0) - 1;
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const fileMonthLabel = `${monthNames[monthIndex] ?? parts[1] ?? ""}-${year}`;

    const headers = [
      "Staff ID",
      "Employee Name",
      "Tax ID/ Tax IN",
      "Regular Monthly pay",
      `${displayMonthLabel} GROSS PAY`,
      "PAYE Taxes",
      "Accommodation",
      "Other Deductions",
      "Total Deductions",
      "Additions",
      "Total Additions",
      "Net Pay - Monthly",
    ];

    const rows = (currentRun.entries ?? []).map((entry) => {
      const userAny = (entry.user || {}) as any;
      const staffId = userAny?.staff_id ?? "";
      const name = userAny?.name ?? "";
      const taxId =
        userAny?.tax_id || userAny?.tax_in || userAny?.taxNumber || "";

      const regularMonthlyPay = Number(
        userAny?.monthly_pay ?? userAny?.regular_pay ?? entry.gross_salary ?? 0,
      );
      const grossPay = Number(entry.gross_salary ?? 0);
      const payeTaxes = Number(entry.tax_amount ?? 0);
      const otherDeductions = getOtherDeductionsTotal(entry);
      const accommodation = getAccommodationTotal(entry);
      const totalDeductions =
        Number(entry.deduction_amount ?? 0) + payeTaxes + otherDeductions + accommodation;

      // Attempt to derive additions from calculation snapshot if present
      let additionsValue = 0;
      let additionsDesc = "";
      try {
        const snap = (entry as any).calculation_snapshot ?? {};
        if (snap) {
          if (Array.isArray(snap.additions)) {
            additionsValue = snap.additions.reduce(
              (s: number, a: any) => s + Number(a?.amount ?? 0),
              0,
            );
            additionsDesc = snap.additions
              .map((a: any) => `${a?.name ?? ""}:${a?.amount ?? 0}`)
              .join("; ");
          } else if (typeof snap.additions === "object") {
            additionsValue = Object.values(snap.additions).reduce(
              (s: number, v: any) => s + Number(v ?? 0),
              0,
            );
            additionsDesc = JSON.stringify(snap.additions);
          } else if (snap.total_additions) {
            additionsValue = Number(snap.total_additions || 0);
          }
        }
      } catch (e) {
        additionsValue = 0;
      }

      const totalAdditions = additionsValue;
      const netMonthly = Number(entry.net_amount ?? 0);

      return [
        staffId,
        name,
        taxId || "",
        regularMonthlyPay.toFixed(2),
        grossPay.toFixed(2),
        payeTaxes.toFixed(2),
        accommodation.toFixed(2),
        otherDeductions.toFixed(2),
        totalDeductions.toFixed(2),
        additionsDesc || additionsValue.toFixed(2),
        totalAdditions.toFixed(2),
        netMonthly.toFixed(2),
      ];
    });

    const escapeCell = (v: any) => {
      if (v === null || v === undefined) return '""';
      return '"' + String(v).replace(/"/g, '""') + '"';
    };

    const csv = [headers, ...rows]
      .map((r) => r.map((c) => escapeCell(c)).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_${fileMonthLabel}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const stats = {
    totalGross: entries.reduce(
      (acc, e) => acc + Number(e.gross_salary || 0),
      0,
    ),
    totalNet: entries.reduce((acc, e) => acc + Number(e.net_amount || 0), 0),
    totalTax: entries.reduce((acc, e) => acc + Number(e.tax_amount || 0), 0),
    totalDeductions: entries.reduce(
      (acc, e) =>
        acc +
        Number(e.deduction_amount || 0) +
        Number(e.tax_amount || 0) +
        getAccommodationTotal(e) +
        getOtherDeductionsTotal(e),
      0,
    ),
  };

  const totalSavings = Math.max(0, stats.totalDeductions - stats.totalTax);

  return (
    <div className="space-y-6">
      {/* Summary Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Gross"
          icon={Banknote}
          value={money(stats.totalGross)}
          description={`Sum of gross pay for ${totalEntries} staff`}
          variant="dashboard"
          cardColor="blue"
        />
        <StatsCard
          title="Total Net"
          icon={CheckCircle2}
          value={money(stats.totalNet)}
          description={`Sum of net pay for ${totalEntries} staff`}
          variant="dashboard"
          cardColor="green"
        />
        <StatsCard
          title="Total Tax"
          icon={MinusCircle}
          value={money(stats.totalTax)}
          description="Total PAYE collected"
          variant="dashboard"
          cardColor="red"
        />
        <StatsCard
          title="Total Savings"
          icon={MinusCircle}
          value={money(totalSavings)}
          description="Deductions minus tax"
          variant="dashboard"
          cardColor="orange"
        />
      </div>

      {/* Approval Pipeline Stepper & Actions */}
      {currentRun && (
        <PayrollWorkflowBar
          currentRun={currentRun}
          onRefresh={loadMonthRun}
          isBusy={isBusy}
        />
      )}

      {/* Controls Bar */}
      <div className="bg-card border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="space-y-1.5 min-w-45">
            <Label
              htmlFor="payroll-month"
              className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1"
            >
              Payroll Period
            </Label>
            <div className="relative">
              <Input
                id="payroll-month"
                type="month"
                className="h-10 bg-background"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
              />
            </div>
          </div>
          {isHr && (
            <div className="pt-5 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0"
                disabled={isBusy}
                onClick={loadMonthRun}
                title="Refresh / Re-sync"
              >
                <RefreshCcw className={cn("h-4 w-4", isBusy && "animate-spin")} />{" "}
                Refresh
              </Button>
              {currentRun && currentRun.status !== "closed" && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-100"
                  disabled={isBusy}
                  onClick={() => setIsResetDialogOpen(true)}
                  title="Reset / Start Over"
                >
                  <RotateCcw className="h-4 w-4" /> Reset Payroll
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-5">
          {currentRun && (
            <>
              <BulkExportButton
                entries={
                  selectedEntries.length > 0
                    ? entries.filter((e) => selectedEntries.includes(e.id))
                    : entries
                }
                allCount={entries.length}
                monthLabel={formatMonthLabel(currentRun.payroll_month)}
                payrollMonth={currentRun.payroll_month}
              />

              <Button
                type="button"
                variant="outline"
                className="h-10"
                disabled={isBusy || (entries ?? []).length === 0}
                onClick={exportPayrollCsv}
                title="Export payroll as CSV (Excel)"
              >
                Export CSV
              </Button>

              {currentRun.status === "closed" ? (
                isHr && (
                  <Button
                    type="button"
                    variant="outline"
                    className="font-bold px-6 border-primary text-primary hover:bg-primary/5"
                    disabled={isBusy}
                    onClick={handleReopenRun}
                  >
                    <RefreshCcw
                      className={cn("mr-2 h-4 w-4", isBusy && "animate-spin")}
                    />
                    Re-open for Edits
                  </Button>
                )
              ) : (
                <div className="flex items-center gap-2">
                  {isHr && (
                    <Button
                      type="button"
                      variant="outline"
                      className="font-semibold h-10 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      disabled={isBusy}
                      onClick={() => setIsDeleteDialogOpen(true)}
                      title="Delete this unlocked payroll run"
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Delete Run
                    </Button>
                  )}
                  {isMd && (
                    <Button
                      type="button"
                      variant="default"
                      className="font-bold px-6"
                      disabled={isBusy || pendingCount > 0}
                      onClick={handleCloseRun}
                      title="Finalize and lock this payroll run (MD only)"
                    >
                      Finalize & Close Run
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Batch Actions Bar */}
      {selectedEntries.length > 0 && (
        <div className="bg-primary text-primary-foreground p-3 rounded-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 pl-2">
            <CheckCheck className="h-5 w-5" />
            <span className="font-bold text-sm">
              {selectedEntries.length} staff selected for approval
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-white/10"
              onClick={() => setSelectedEntries([])}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="font-bold bg-white text-primary hover:bg-white/90"
              onClick={handleBulkApprove}
              disabled={isBulkApproving}
            >
              Approve Selected
            </Button>
          </div>
        </div>
      )}

      {currentRun && (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b">
                <th className="p-4 text-center w-12">
                  <Checkbox
                    checked={
                      selectedEntries.length === entries.length &&
                      entries.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                  Staff Details
                </th>
                <th className="p-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                  Gross Pay
                </th>
                <th className="p-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                  Tax (PAYE)
                </th>
                <th className="p-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                  Total Ded.
                </th>
                <th className="p-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                  Net Salary
                </th>
                <th className="p-4 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                  Status
                </th>
                <th className="p-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider pr-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className={cn(
                    "group hover:bg-slate-50/80 transition-colors cursor-pointer",
                    selectedEntries.includes(entry.id) &&
                      "bg-primary/5 hover:bg-primary/5",
                  )}
                  onClick={() => setActiveEntry(entry)}
                >
                  <td
                    className="p-4 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedEntries.includes(entry.id)}
                      onCheckedChange={() => toggleSelectEntry(entry.id)}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        {entry.user?.name ?? "Unknown"}
                        {entry.is_intern && (
                          <Badge
                            variant="outline"
                            className="text-[9px] bg-blue-50 text-blue-600 border-blue-100 uppercase tracking-tighter h-4"
                          >
                            Intern
                          </Badge>
                        )}
                        {entry.user?.exit_date && (
                          <Badge
                            variant="outline"
                            className="text-[9px] bg-rose-50 text-rose-600 border-rose-200 tracking-tighter h-4 px-1.5 font-medium"
                          >
                            Exit: {entry.user.exit_date.split(" ")[0]}
                          </Badge>
                        )}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                        {entry.user?.staff_id ?? "N/A"} •{" "}
                        {entry.user?.department ?? "General"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-semibold text-slate-600 tabular-nums">
                    {money(Number(entry.gross_salary || 0)).replace("NGN", "")}
                  </td>
                  <td className="p-4 text-right font-semibold text-rose-600/80 tabular-nums">
                    ({money(Number(entry.tax_amount || 0)).replace("NGN", "")})
                  </td>
                  <td className="p-4 text-right font-semibold text-rose-600/80 tabular-nums">
                    (
                    {money(
                      Number(entry.deduction_amount || 0) +
                        Number(entry.tax_amount || 0) +
                        getAccommodationTotal(entry) +
                        getOtherDeductionsTotal(entry),
                    ).replace("NGN", "")}
                    )
                  </td>
                  <td className="p-4 text-right font-black text-primary tabular-nums text-base">
                    {money(Number(entry.net_amount || 0)).replace("NGN", "")}
                  </td>
                  <td className="p-4 text-center">
                    <Badge
                      variant={
                        entry.status === "approved" ? "default" : "secondary"
                      }
                      className={cn(
                        "uppercase text-[10px] font-bold tracking-wider px-2.5",
                        entry.status === "approved"
                          ? "bg-green-100 text-green-700 hover:bg-green-100 border-none"
                          : "",
                      )}
                    >
                      {entry.status}
                    </Badge>
                  </td>
                  <td
                    className="p-4 text-right pr-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          entry.status === "approved" ? "ghost" : "default"
                        }
                        className={cn(
                          "h-8 px-4 font-bold text-xs",
                          entry.status === "approved" &&
                            "text-green-600 hover:text-green-700 hover:bg-green-50",
                        )}
                        disabled={
                          entry.status === "approved" ||
                          isBusy ||
                          !!busyEntries[entry.id] ||
                          !isPersistedRun(currentRun)
                        }
                        onClick={() => handleApprove(entry.id)}
                      >
                        {entry.status === "approved" ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approved
                          </div>
                        ) : (
                          "Approve"
                        )}
                      </Button>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors ml-1" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet
        open={!!activeEntry}
        onOpenChange={(open) => {
          if (!open) setActiveEntry(null);
        }}
      >
        <SheetContent className="p-0 sm:max-w-[850px] w-[100vw]">
          {activeEntry && (
            <PayrollEntrySheet
              inSheet
              entry={activeEntry}
              payrollMonth={currentRun?.payroll_month || selectedMonth}
              isPersisted={isPersistedRun(currentRun)}
              onClose={() => setActiveEntry(null)}
              onSave={async (payload) => {
                if (!isPersistedRun(currentRun)) {
                  toast.message("Generate a payroll run to persist overrides.");
                  return;
                }
                const entryId = activeEntry.id;
                setBusyEntries((p) => ({ ...p, [entryId]: true }));
                try {
                  setCurrentRun((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      entries: (prev.entries ?? []).map((e) =>
                        e.id === entryId
                          ? {
                              ...e,
                              ...payload,
                            }
                          : e,
                      ),
                    } as PayrollRun;
                  });

                  const result = await overridePayrollEntry(
                    entryId,
                    payload as any,
                  );
                  if (!result.success) {
                    throw new Error(
                      result.error.error || "Failed to save override.",
                    );
                  }

                  if (currentRun?.id) {
                    const refreshed = await getPayrollRun(currentRun.id);
                    if (refreshed.success) {
                      setCurrentRun(refreshed.data.data);
                      const updated = refreshed.data.data.entries?.find(
                        (e) => e.id === entryId,
                      );
                      if (updated) setActiveEntry(updated);
                    }
                  }
                } catch (err: unknown) {
                  toast.error(
                    err instanceof Error ? err.message : "Failed to save.",
                  );
                } finally {
                  setBusyEntries((p) => ({ ...p, [entryId]: false }));
                }
              }}
              onApprove={handleApprove}
              onRecalculate={handleRecalculateEntry}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Entire Payroll Run?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all current entries for{" "}
              {formatMonthLabel(selectedMonth)} and regenerate them using the
              latest system data (attendance, compliance, etc). All manual
              overrides will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={handleResetRun}
            >
              Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payroll Run?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the payroll run for{" "}
              <strong className="text-slate-900 font-bold">
                {formatMonthLabel(currentRun?.payroll_month || selectedMonth)}
              </strong>
              ? This will remove all calculated payroll entries for this period. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              onClick={handleDeleteRun}
            >
              Delete Run
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
