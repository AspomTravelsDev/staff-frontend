/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { sortPayrollEntries, splitPayrollExportEntries, type PayrollExportGroup } from "@/lib/payroll/export-groups";
import { currentPayrollMonth, nextPayrollMonth } from "@/lib/payroll/months";
import {
  createPayrollRun,
  deletePayrollRun,
  getPayrollRun,
  listPayrollRuns,
  overridePayrollEntry,
  previewPayroll,
  recalculatePayrollEntry,
  reopenPayrollRun,
  refreshPayrollStaff,
  type PayrollEntry,
  type PayrollRun,
} from "@/lib/api/payroll";
import { BulkExportButton } from "./bulk-export-button";
import { PayrollSupportingDocuments } from "./payroll-supporting-documents";
import { PayrollGuide } from "./payroll-guide";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PayrollWorkflowBar } from "./payroll-workflow-bar";
import PayrollEntrySheet from "./payroll-entry-sheet";
import { useUser } from "@/providers/user-provider";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  RefreshCcw,
  RotateCcw,
  ChevronRight,
  Trash2,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";

import {
  calculateAccommodationAmount,
  calculateMonthlyTax,
  calculatePayrollEntry,
  getAccommodationRate,
  getDaysInMonth,
  getWorkingDaysInMonth,
} from "@/lib/payroll/calculations";

const getCurrentMonth = currentPayrollMonth;

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

function calculatePreviewEntries(previewEntries: any[], targetMonth: string) {
    return previewEntries.map((pe: any) => {
      const result = calculatePayrollEntry({
        baseSalary: Number(pe.user.gross_pay || 0),
        contractType: pe.user.contract_type ?? null,
        isIntern: !!pe.is_intern,
        dateJoined: pe.user.date_joined ?? null,
        payrollMonth: targetMonth,
        proratedDays: Number(pe.prorated_days || 0),
        accommodationAmount: Number(pe.accommodation_amount || 0),
        attendanceDays: Number(pe.attendance_suggested_days || 0),
        halfDayCount: Number(pe.half_day_suggested_count || 0),
        unapprovedLeaveDays: Number(pe.unapproved_leave_suggested_days || 0),
        unauthorizedLateDays: Number(pe.unauthorized_late_suggested_days || 0),
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
        half_day_count: result.half_day_count,
        unapproved_leave_days: result.unapproved_leave_days,
        unauthorized_late_days: result.unauthorized_late_days,
        suspension_days: result.suspension_days,
        prorated_days: result.prorated_days,
        other_deductions_amount: result.other_deductions_amount,
        other_deductions: result.other_deductions,
        accommodation_amount: result.accommodation_amount,
        additions_amount: result.additions_amount,
        additions: result.additions,
        attendance_suggested_days: Number(pe.attendance_suggested_days || 0),
        half_day_suggested_count: Number(pe.half_day_suggested_count || 0),
        unapproved_leave_suggested_days: Number(pe.unapproved_leave_suggested_days || 0),
        unauthorized_late_suggested_days: Number(pe.unauthorized_late_suggested_days || 0),
        compliance_suggested_days: Number(pe.compliance_suggested_days || 0),
        system_suggested_days: Number(pe.attendance_suggested_days || 0) + Number(pe.half_day_suggested_count || 0) * 0.5 + Number(pe.unapproved_leave_suggested_days || 0) + Math.max(0, Math.floor(Number(pe.unauthorized_late_suggested_days || 0)) - 2) + Number(pe.compliance_suggested_days || 0),
        final_deduction_days: result.final_deduction_days,
        daily_rate: result.daily_rate,
        deduction_amount: result.deduction_amount,
        tax_amount: result.tax_amount,
        net_amount: result.net_amount,
        calculation_snapshot: result.calculation_snapshot,
      };
    });
}

export function PayrollManager({ initialMonth, initialRun, initialLatestMonth, salarySettings, commentsOpen = false }: { initialMonth: string; initialRun: PayrollRun | null; initialLatestMonth: string; salarySettings: ReactNode; commentsOpen?: boolean }) {
  const [activeTab, setActiveTab] = useState("runs");
  const { user } = useUser();
  const userRoles = user?.roles && user.roles.length > 0
    ? user.roles
    : [user?.role, ...(user?.secondary_roles || [])].filter(Boolean);
  const isHr = userRoles.includes("hr") || userRoles.includes("super");
  const canCreatePayroll = userRoles.includes("hr");

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [latestPayrollMonth, setLatestPayrollMonth] = useState(initialLatestMonth);
  const [currentRun, setCurrentRun] = useState<PayrollRun | null>(initialRun);
  const [isBusy, setIsBusy] = useState(false);
  const [activeEntry, setActiveEntry] = useState<PayrollEntry | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [staffSearch, setStaffSearch] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isPersistedRun = (run?: PayrollRun | null) => {
    return !!run && !!run.id;
  };
  const canEditEntries = isHr && isPersistedRun(currentRun) &&
    !!currentRun && ["draft", "hr_draft", "account_review", "compliance_review", "mp_review", "md_approval"].includes(currentRun.status);
  const canRefreshStaff = canEditEntries && !!currentRun && ["draft", "hr_draft"].includes(currentRun.status);

  const entries = sortPayrollEntries(currentRun?.entries ?? []);
  const searchTerm = staffSearch.trim().toLocaleLowerCase();
  const visibleEntries = entries.filter(entry => !searchTerm || [entry.user?.name, entry.user?.staff_id, entry.user?.department, entry.user?.email].some(value => value?.toLocaleLowerCase().includes(searchTerm)));
  const selectedVisibleCount = visibleEntries.filter(entry => selectedEntries.includes(entry.id)).length;
  const allVisibleSelected = visibleEntries.length > 0 && selectedVisibleCount === visibleEntries.length;
  const exportGroups = splitPayrollExportEntries(entries);

  const handleRefreshStaff = async () => {
    if (!currentRun || !canRefreshStaff) return;
    setIsBusy(true);
    try {
      const preview = await previewPayroll(currentRun.payroll_month);
      if (!preview.success) throw new Error(preview.error.error || "Unable to check staff changes.");
      const existingIds = new Set(currentRun.entries?.map(entry => entry.user_id));
      const additions = preview.data.data.entries.filter(entry => !existingIds.has(entry.user.id));
      const result = await refreshPayrollStaff(currentRun.id, calculatePreviewEntries(additions, currentRun.payroll_month));
      if (!result.success) throw new Error(result.error.error || "Unable to refresh staff list.");
      const details = await getPayrollRun(currentRun.id);
      if (!details.success) throw new Error("Staff refreshed. Reload payroll to see the updated list.");
      const updated = details.data.data;
      const added = (updated.entries?.length ?? 0) - (currentRun.entries?.length ?? 0);
      const reviews = updated.entries?.filter(entry => entry.staff_review_reasons?.length).length ?? 0;
      setCurrentRun(updated);
      setActiveEntry(null);
      toast.success(`${added} staff added · ${reviews} need review · ${currentRun.entries?.length ?? 0} saved entries preserved`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to refresh staff list.");
    } finally {
      setIsBusy(false);
    }
  };

  const generateMonthRun = useCallback(async (targetMonth: string) => {
    // Fetch raw suggestions from preview endpoint
    const previewRes = await previewPayroll(targetMonth, true);
    if (!previewRes.success) {
      throw new Error(previewRes.error.error || "Failed to load preview suggestions.");
    }

    const previewEntries = previewRes.data.data.entries;
    const calculatedEntries = calculatePreviewEntries(previewEntries, targetMonth);

    const result = await createPayrollRun(targetMonth, false, calculatedEntries, true);
    if (!result.success) {
      throw new Error(
        result.error.error || "Failed to create payroll run.",
      );
    }

    const runId = result.data.data.id;
    const runDetails = await getPayrollRun(runId);
    if (!runDetails.success) {
      throw new Error(
        runDetails.error.error || "Failed to fetch generated run details.",
      );
    }


    return runDetails.data.data;
  }, []);

  const loadMonthRun = useCallback(async (targetMonth = selectedMonth) => {
    setIsBusy(true);
    try {
      const allRunsResult = await listPayrollRuns();
      if (!allRunsResult.success) throw new Error(allRunsResult.error.error || "Unable to load payroll periods.");
      const latestMonth = allRunsResult.data.data[0]?.payroll_month || "";
      setLatestPayrollMonth(latestMonth);
      if (targetMonth && targetMonth > (latestMonth || getCurrentMonth())) {
        targetMonth = latestMonth || getCurrentMonth();
        setSelectedMonth(targetMonth);
      }
      const runsResult = targetMonth ? await listPayrollRuns(targetMonth) : allRunsResult;
      if (!runsResult.success) {
        throw new Error(
          runsResult.error.error || "Failed to load payroll run.",
        );
      }

      const firstRun = runsResult.data.data[0];
      if (!firstRun) {
        setCurrentRun(null);
        setSelectedEntries([]);
        if (!targetMonth) setSelectedMonth(getCurrentMonth());
        return;
      }

      if (!targetMonth) {
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

  const handleCreateNextPayroll = async () => {
    if (!canCreatePayroll || isBusy) return;
    setIsBusy(true);
    try {
      const result = await listPayrollRuns();
      if (!result.success) throw new Error(result.error.error || "Unable to load payroll periods.");
      const latest = result.data.data[0]?.payroll_month;
      const targetMonth = latest ? nextPayrollMonth(latest) : getCurrentMonth();
      const run = await generateMonthRun(targetMonth);
      setLatestPayrollMonth(targetMonth); setCurrentRun(run); setSelectedEntries([]); setSelectedMonth(targetMonth);
      toast.success(`Payroll created for ${formatMonthLabel(targetMonth)}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create next payroll.");
    } finally { setIsBusy(false); }
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
          halfDayCount: Number(pe.half_day_suggested_count || 0),
          unapprovedLeaveDays: Number(pe.unapproved_leave_suggested_days || 0),
            unauthorizedLateDays: Number(pe.unauthorized_late_suggested_days || 0),
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
          half_day_count: result.half_day_count,
          unapproved_leave_days: result.unapproved_leave_days,
            unauthorized_late_days: result.unauthorized_late_days,
          suspension_days: result.suspension_days,
          prorated_days: result.prorated_days,
          other_deductions_amount: result.other_deductions_amount,
          other_deductions: result.other_deductions,
          accommodation_amount: result.accommodation_amount,
          additions_amount: result.additions_amount,
          additions: result.additions,
          attendance_suggested_days: Number(pe.attendance_suggested_days || 0),
          half_day_suggested_count: Number(pe.half_day_suggested_count || 0),
          unapproved_leave_suggested_days: Number(pe.unapproved_leave_suggested_days || 0),
            unauthorized_late_suggested_days: Number(pe.unauthorized_late_suggested_days || 0),
          compliance_suggested_days: Number(pe.compliance_suggested_days || 0),
            system_suggested_days: Number(pe.attendance_suggested_days || 0) + Number(pe.half_day_suggested_count || 0) * 0.5 + Number(pe.unapproved_leave_suggested_days || 0) + Math.max(0, Math.floor(Number(pe.unauthorized_late_suggested_days || 0)) - 2) + Number(pe.compliance_suggested_days || 0),
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

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedEntries(previous => previous.filter(id => !visibleEntries.some(entry => entry.id === id)));
    } else {
      setSelectedEntries(previous => [...new Set([...previous, ...visibleEntries.map(entry => entry.id)])]);
    }
  };

  const toggleSelectEntry = (id: string) => {
    setSelectedEntries((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
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
    try {
      const defaultsRes = await recalculatePayrollEntry(entryId);
      if (!defaultsRes.success) {
        throw new Error(defaultsRes.error.error || "Failed to recalculate entry.");
      }

      const raw = defaultsRes.data.data as any;
      const target = currentRun?.entries?.find((e) => e.id === entryId);
      if (!target) throw new Error("Entry not found in current run.");

      const baseSalary = raw.gross_pay !== undefined && raw.gross_pay !== null && Number(raw.gross_pay) > 0
        ? Number(raw.gross_pay)
        : Number(target.user?.gross_pay || (target.calculation_snapshot as any)?.base_monthly_salary || target.gross_salary || 0);

      const contractType = raw.contract_type ?? target.user?.contract_type ?? null;
      const isIntern = raw.is_intern !== undefined ? !!raw.is_intern : !!target.is_intern;
      const dateJoined = raw.date_joined ?? target.user?.date_joined ?? null;
      const exitDate = raw.exit_date ?? target.user?.exit_date ?? null;

      const computed = calculatePayrollEntry({
        baseSalary,
        contractType,
        isIntern,
        dateJoined,
        exitDate,
        payrollMonth: currentRun?.payroll_month || selectedMonth,
        proratedDays: Number(raw.prorated_days || 0),
        accommodationAmount: Number(raw.accommodation_amount || 0),
        attendanceDays: Number(raw.attendance_suggested_days || 0),
        halfDayCount: Number(raw.half_day_suggested_count || 0),
        unapprovedLeaveDays: Number(raw.unapproved_leave_suggested_days || 0),
        unauthorizedLateDays: Number(raw.unauthorized_late_suggested_days || 0),
        suspensionDays: Number(raw.compliance_suggested_days || 0),
        otherDeductions: [],
        additions: [],
      });

      const result = await overridePayrollEntry(entryId, {
        attendance_days: Number(raw.attendance_suggested_days || 0),
        half_day_count: Number(raw.half_day_suggested_count || 0),
        unapproved_leave_days: Number(raw.unapproved_leave_suggested_days || 0),
        unauthorized_late_days: Number(raw.unauthorized_late_suggested_days || 0),
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
            if (updated) {
              if (raw.gross_pay !== undefined && updated.user) {
                updated.user.gross_pay = raw.gross_pay;
              }
              setActiveEntry(updated);
            }
          }
        }
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Unable to recalculate entry.",
      );
    }
  };

  // Export current payroll run as CSV (Excel-compatible)
  const exportPayrollCsv = (group: PayrollExportGroup) => {
    if (!currentRun) return;
    const exportEntries = exportGroups[group];
    if (!exportEntries.length) {
      toast.info(`No ${group === "fhon" ? "FHON" : "Full Staff"} entries in this payroll run.`);
      return;
    }
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

    const rows = exportEntries.map((entry) => {
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
    a.download = `payroll_${group}_${fileMonthLabel}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const summarizeGroup = (groupEntries: PayrollEntry[]) => ({
    gross: groupEntries.reduce((sum, entry) => sum + Number(entry.gross_salary || 0), 0),
    net: groupEntries.reduce((sum, entry) => sum + Number(entry.net_amount || 0), 0),
    tax: groupEntries.reduce((sum, entry) => sum + Number(entry.tax_amount || 0), 0),
    deductions: groupEntries.reduce((sum, entry) => sum + Number(entry.deduction_amount || 0)
      + getAccommodationTotal(entry) + getOtherDeductionsTotal(entry), 0),
    additions: groupEntries.reduce((sum, entry) => sum + getAdditionsTotal(entry), 0),
  });
  const summaryRows = [
    { key: 'full_staff', label: 'Full Staff', count: exportGroups.full_staff.length, totals: summarizeGroup(exportGroups.full_staff) },
    { key: 'fhon', label: 'FHON', count: exportGroups.fhon.length, totals: summarizeGroup(exportGroups.fhon) },
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
      {/* Payroll tools */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList className="w-full max-w-xs shrink-0">
          <TabsTrigger value="runs" className="flex-1">Payroll Runs</TabsTrigger>
          <TabsTrigger value="salary" className="flex-1">Salary Settings</TabsTrigger>
        </TabsList>
        {activeTab === "runs" && (
      <div className="ml-auto flex max-w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <div className="flex min-w-0 items-center gap-3" data-payroll-tour="period">
          <Label htmlFor="payroll-month" className="shrink-0 text-sm font-medium">Payroll period</Label>
          <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
              <Input
                id="payroll-month"
                type="month"
                max={latestPayrollMonth || getCurrentMonth()}
                disabled={isBusy}
                className="h-9 bg-background"
                value={selectedMonth}
                onChange={(event) => {
                  const value = event.target.value;
                  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return;
                  if (value > (latestPayrollMonth || getCurrentMonth())) {
                    toast.error("Create the next payroll period before selecting it.");
                    return;
                  }
                  setSelectedEntries([]); setActiveEntry(null); setCurrentRun(null); setSelectedMonth(value); void loadMonthRun(value);
                }}
              />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <PayrollGuide disabled={isBusy} />
          {canCreatePayroll && <Button type="button" className="h-9" disabled={isBusy} onClick={handleCreateNextPayroll}>Create next payroll</Button>}
          {currentRun && <BulkExportButton
            entries={selectedEntries.length > 0 ? entries.filter(entry => selectedEntries.includes(entry.id)) : entries}
            allCount={entries.length}
            monthLabel={formatMonthLabel(currentRun.payroll_month)}
            payrollMonth={currentRun.payroll_month}
            onExportCsv={exportPayrollCsv}
            fullStaffCount={exportGroups.full_staff.length}
            fhonCount={exportGroups.fhon.length}
            disabled={isBusy}
          />}
          {isHr && <DropdownMenu>
            <DropdownMenuTrigger asChild><Button type="button" variant="outline" className="h-9" disabled={isBusy} data-payroll-tour="actions"><MoreHorizontal className="size-4" /><span>More actions</span></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => { void loadMonthRun(); }}><RefreshCcw className="size-4" />Refresh payroll</DropdownMenuItem>
              {isHr && currentRun && <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Manage this period</DropdownMenuLabel>
                {currentRun.status === 'closed' ? (
                  <DropdownMenuItem onSelect={() => { void handleReopenRun(); }}><RotateCcw className="size-4" />Reopen for edits</DropdownMenuItem>
                ) : <>
                  <DropdownMenuItem onSelect={() => setIsResetDialogOpen(true)}><RotateCcw className="size-4" />Reset payroll</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onSelect={() => setIsDeleteDialogOpen(true)}><Trash2 className="size-4" />Delete payroll run</DropdownMenuItem>
                </>}
              </>}
            </DropdownMenuContent>
          </DropdownMenu>}
        </div>
      </div>


        )}
      </div>
      <TabsContent value="runs" className="space-y-4">
      <div className="space-y-3" data-payroll-tour="summary">
        {summaryRows.map(({ key, label, count, totals }) => (
          <section key={key} aria-labelledby={`payroll-summary-${key}`} className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 id={`payroll-summary-${key}`} className="text-base font-semibold">{label}</h2>
              <Badge variant="secondary">{count} {count === 1 ? 'person' : 'people'}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard compact title="Gross Pay" icon={Banknote} value={money(totals.gross)}
                description={`Gross pay for ${count} ${label} personnel`} variant="dashboard" cardColor="blue" />
              {key === 'full_staff' ? (
                <StatsCard compact title="PAYE Tax" icon={MinusCircle} value={money(totals.tax)}
                  description="Total PAYE for Full Staff" variant="dashboard" cardColor="red" />
              ) : (
                <StatsCard compact title="Deductions" icon={MinusCircle} value={money(totals.deductions)}
                  description="Attendance, accommodation & other deductions" variant="dashboard" cardColor="orange" />
              )}
              {key === 'full_staff' ? (
                <StatsCard compact title="Other Deductions" icon={MinusCircle} value={money(totals.deductions)}
                  description="Attendance, accommodation & other deductions; excludes PAYE" variant="dashboard" cardColor="orange" />
              ) : (
                <StatsCard compact title="Additions" icon={PlusCircle} value={money(totals.additions)}
                  description="Bonuses and other recorded additions" variant="dashboard" cardColor="purple" />
              )}
              <StatsCard compact title="Net Pay" icon={CheckCircle2} value={money(totals.net)}
                description="Total amount payable" variant="dashboard" cardColor="green" />
            </div>
          </section>
        ))}
      </div>

      {/* Approval Pipeline Stepper & Actions */}
      {currentRun && (
        <PayrollWorkflowBar
          commentsOpen={commentsOpen && currentRun.payroll_month === initialMonth}
          currentRun={currentRun}
          onRefresh={loadMonthRun}
          isBusy={isBusy}
        />
      )}

      {currentRun && <PayrollSupportingDocuments key={currentRun.id} run={currentRun} canUpload={isHr} busy={isBusy} onUpdated={updated => setCurrentRun(current => current?.id === updated.id ? updated : current)} />}

      {currentRun && (
        <>
        {canRefreshStaff && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
          <p className="text-sm text-muted-foreground">Add new staff while preserving saved calculations. Review flagged changes individually.</p>
          <Button variant="outline" disabled={isBusy} onClick={handleRefreshStaff}><RefreshCcw className={cn("size-4", isBusy && "animate-spin")} />Refresh staff list</Button>
        </div>}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" data-payroll-tour="search">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input aria-label="Search payroll staff" placeholder="Search name, staff ID or department…" className="h-9 pl-9 pr-9" value={staffSearch} onChange={event => { setStaffSearch(event.target.value); setSelectedEntries([]); }} />
            {staffSearch && <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 size-9" aria-label="Clear staff search" onClick={() => { setStaffSearch(""); setSelectedEntries([]); }}><X className="size-4" /></Button>}
          </div>
          <p className="text-xs text-muted-foreground" role="status">{visibleEntries.length} of {entries.length} staff</p>
        </div>
        <div className="space-y-2 md:hidden" data-payroll-tour="staff">
          {visibleEntries.length > 0 && (
            <label className="flex min-h-11 items-center gap-3 rounded-lg border bg-card px-3 text-sm font-medium">
              <Checkbox
                checked={allVisibleSelected ? true : selectedVisibleCount > 0 ? "indeterminate" : false}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all visible payroll entries"
              />
              Select all visible staff
            </label>
          )}
          {visibleEntries.map((entry) => (
            <article key={entry.id} className={cn("rounded-xl border bg-card p-3", selectedEntries.includes(entry.id) && "border-primary/40 bg-primary/[0.03]")}>
              <div className="flex items-start gap-3">
                <Checkbox
                  className="mt-1 size-5"
                  checked={selectedEntries.includes(entry.id)}
                  onCheckedChange={() => toggleSelectEntry(entry.id)}
                  aria-label={`Select ${entry.user?.name ?? "staff member"}`}
                />
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setActiveEntry(entry)}>
                  <span className="flex flex-wrap items-center gap-2 font-semibold leading-snug text-foreground">
                    <span className="break-words">{entry.user?.name ?? "Unknown"}</span>
                    {!!entry.staff_review_reasons?.length && <Badge variant="outline">Review: {entry.staff_review_reasons.join(", ")}</Badge>}
                    {entry.is_intern && <Badge variant="outline" className="h-5 px-1.5 text-[9px]">Intern</Badge>}
                  </span>
                  <span className="mt-1 block break-words text-xs text-muted-foreground">{entry.user?.staff_id ?? "N/A"} · {entry.user?.department ?? "General"}</span>
                  <span className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t pt-3">
                    <span className="min-w-0"><span className="block text-[11px] text-muted-foreground">Gross</span><span className="block truncate text-sm font-medium tabular-nums">{money(Number(entry.gross_salary || 0))}</span></span>
                    <span className="min-w-0"><span className="block text-[11px] text-muted-foreground">PAYE tax</span><span className="block truncate text-sm font-medium tabular-nums text-rose-600">{money(Number(entry.tax_amount || 0))}</span></span>
                    <span className="min-w-0"><span className="block text-[11px] text-muted-foreground">Total deductions</span><span className="block truncate text-sm font-medium tabular-nums text-rose-600">{money(Number(entry.deduction_amount || 0) + Number(entry.tax_amount || 0) + getAccommodationTotal(entry) + getOtherDeductionsTotal(entry))}</span></span>
                    <span className="min-w-0"><span className="block text-[11px] text-muted-foreground">Net salary</span><span className="block truncate text-base font-bold tabular-nums text-primary">{money(Number(entry.net_amount || 0))}</span></span>
                  </span>
                </button>
              </div>
              <div className="mt-3 flex justify-end gap-2 border-t pt-3">
                <Button type="button" variant="outline" className="min-h-11 w-full" onClick={() => setActiveEntry(entry)}>View payroll details</Button>
              </div>
            </article>
          ))}
          {visibleEntries.length === 0 && <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">{searchTerm ? "No staff match your search. Try another name, staff ID or department." : "No payroll entries for this period."}</div>}
        </div>
        <div className="hidden overflow-x-auto rounded-xl border bg-card md:block" data-payroll-tour="staff">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b">
                <th className="p-4 text-center w-12">
                  <Checkbox
                    checked={allVisibleSelected ? true : selectedVisibleCount > 0 ? "indeterminate" : false}
                    aria-label="Select all visible payroll entries"
                    disabled={visibleEntries.length === 0}
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
                <th className="p-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider pr-6">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibleEntries.map((entry) => (
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
                        {!!entry.staff_review_reasons?.length && <Badge variant="outline">Review: {entry.staff_review_reasons.join(", ")}</Badge>}
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
                  <td
                    className="p-4 text-right pr-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors ml-1" />
                    </div>
                  </td>
                </tr>
              ))}
              {visibleEntries.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">{searchTerm ? "No staff match your search. Try another name, staff ID or department." : "No payroll entries for this period."}</td></tr>}
            </tbody>
          </table>
        </div>
        </>
      )}

      <Sheet
        open={!!activeEntry}
        onOpenChange={(open) => {
          if (!open) setActiveEntry(null);
        }}
      >
        <SheetContent className="h-[100dvh] max-h-[100dvh] w-screen overflow-hidden p-0 sm:h-full sm:max-h-none sm:max-w-[850px]">
          {activeEntry && (
          <PayrollEntrySheet
              inSheet
              entry={activeEntry}
              payrollMonth={currentRun?.payroll_month || selectedMonth}
              isPersisted={isPersistedRun(currentRun)}
              canEdit={canEditEntries}
              onClose={() => setActiveEntry(null)}
              onSave={async (payload) => {
                if (!isPersistedRun(currentRun)) {
                  toast.message("Generate a payroll run to persist overrides.");
                  return;
                }
                const entryId = activeEntry.id;
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
                }
              }}
              onRecalculate={canEditEntries ? handleRecalculateEntry : undefined}
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
      </TabsContent>
      <TabsContent value="salary">{salarySettings}</TabsContent>
    </Tabs>
  );
}
