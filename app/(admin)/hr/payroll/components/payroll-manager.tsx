"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  approvePayrollEntry,
  closePayrollRun,
  createPayrollRun,
  getPayrollRun,
  listPayrollRuns,
  overridePayrollEntry,
  type PayrollEntry,
  type PayrollRun,
} from "@/lib/api/payroll";
import PayrollEntrySheet from "./payroll-entry-sheet";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { StatsCard } from "@/components/stats-card";
import { 
  Banknote, 
  MinusCircle, 
  CheckCircle2, 
  RefreshCcw, 
  RotateCcw,
  CheckCheck,
  ChevronRight
} from "lucide-react";

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

export function PayrollManager() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
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

  const isPersistedRun = (run?: PayrollRun | null) => {
    return !!run && !!run.id;
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
      const runsResult = await listPayrollRuns(selectedMonth);
      if (!runsResult.success) {
        throw new Error(
          runsResult.error.error || "Failed to load payroll run.",
        );
      }

      const firstRun = runsResult.data.data[0];
      if (!firstRun) {
        const result = await createPayrollRun(selectedMonth);
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
        toast.success(`Payroll run generated for ${selectedMonth}`);
        return;
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
    if (!window.confirm("Are you sure you want to RESET this payroll run? This will delete all current entries and manual overrides, and recalculate everything from scratch.")) {
      return;
    }

    setIsBusy(true);
    try {
      const result = await createPayrollRun(selectedMonth, true);
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
    const toastId = toast.loading(`Approving ${selectedEntries.length} entries...`);
    
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

    toast.success(`Successfully approved ${successCount} entries.${failCount > 0 ? ` ${failCount} failed.` : ''}`, { id: toastId });
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
      setSelectedEntries(entries.map(e => e.id));
    }
  };

  const toggleSelectEntry = (id: string) => {
    setSelectedEntries(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
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

  const stats = {
    totalPaid: entries.reduce((acc, e) => acc + Number(e.gross_salary || 0), 0),
    totalDeductions: entries.reduce((acc, e) => acc + Number(e.deduction_amount || 0) + Number(e.tax_amount || 0), 0),
    progress: totalEntries > 0 ? (approvedCount / totalEntries) * 100 : 0
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Payroll Cost"
          icon={Banknote}
          value={money(stats.totalPaid)}
          description={`Sum of gross pay for ${totalEntries} staff`}
          variant="dashboard"
          cardColor="blue"
        />
        <StatsCard
          title="Deductions & Tax"
          icon={MinusCircle}
          value={money(stats.totalDeductions)}
          description="Total company savings this run"
          variant="dashboard"
          cardColor="red"
        />
        <StatsCard
          title="Approval Progress"
          icon={CheckCircle2}
          value={`${approvedCount} / ${totalEntries}`}
          description={`${Math.round(stats.progress)}% of entries finalized`}
          variant="dashboard"
          cardColor="green"
        />
      </div>

      {/* Controls Bar */}
      <div className="bg-card border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="space-y-1.5 min-w-[180px]">
            <Label htmlFor="payroll-month" className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Payroll Period</Label>
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
          <div className="pt-5 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={isBusy}
              onClick={loadMonthRun}
              title="Refresh / Re-sync"
            >
              <RefreshCcw className={cn("h-4 w-4", isBusy && "animate-spin")} />
            </Button>
            {currentRun && currentRun.status !== 'closed' && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-100"
                disabled={isBusy}
                onClick={handleResetRun}
                title="Reset / Start Over"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-5">
          {currentRun && (
            <Button
              type="button"
              variant="default"
              className="font-bold px-6"
              disabled={
                isBusy || pendingCount > 0 || currentRun.status === "closed"
              }
              onClick={handleCloseRun}
            >
              {currentRun.status === "closed" ? "Payroll Run Closed" : "Finalize & Close Run"}
            </Button>
          )}
        </div>
      </div>

      {/* Batch Actions Bar */}
      {selectedEntries.length > 0 && (
        <div className="bg-primary text-primary-foreground p-3 rounded-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 pl-2">
            <CheckCheck className="h-5 w-5" />
            <span className="font-bold text-sm">{selectedEntries.length} staff selected for approval</span>
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
                    checked={selectedEntries.length === entries.length && entries.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">Staff Details</th>
                <th className="p-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider">Gross Pay</th>
                <th className="p-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider">Tax (PAYE)</th>
                <th className="p-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider">Total Ded.</th>
                <th className="p-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider">Net Salary</th>
                <th className="p-4 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider">Status</th>
                <th className="p-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className={cn(
                    "group hover:bg-slate-50/80 transition-colors cursor-pointer",
                    selectedEntries.includes(entry.id) && "bg-primary/5 hover:bg-primary/5"
                  )}
                  onClick={() => setActiveEntry(entry)}
                >
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
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
                          <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-600 border-blue-100 uppercase tracking-tighter h-4">Intern</Badge>
                        )}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                        {entry.user?.staff_id ?? "N/A"} • {entry.user?.department ?? "General"}
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
                    ({money(Number(entry.deduction_amount || 0)).replace("NGN", "")})
                  </td>
                  <td className="p-4 text-right font-black text-primary tabular-nums text-base">
                    {money(Number(entry.net_amount || 0)).replace("NGN", "")}
                  </td>
                  <td className="p-4 text-center">
                    <Badge
                      variant={entry.status === "approved" ? "default" : "secondary"}
                      className={cn(
                        "uppercase text-[10px] font-bold tracking-wider px-2.5",
                        entry.status === "approved" ? "bg-green-100 text-green-700 hover:bg-green-100 border-none" : ""
                      )}
                    >
                      {entry.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={entry.status === 'approved' ? 'ghost' : 'default'}
                        className={cn(
                          "h-8 px-4 font-bold text-xs",
                          entry.status === 'approved' && "text-green-600 hover:text-green-700 hover:bg-green-50"
                        )}
                        disabled={
                          entry.status === "approved" ||
                          isBusy ||
                          !!busyEntries[entry.id] ||
                          !isPersistedRun(currentRun)
                        }
                        onClick={() => handleApprove(entry.id)}
                      >
                        {entry.status === 'approved' ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approved
                          </div>
                        ) : 'Approve'}
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
        <SheetContent className="p-0">
          {activeEntry && (
            <PayrollEntrySheet
              inSheet
              entry={activeEntry}
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
                  const finalDays =
                    payload.final_deduction_days ??
                    activeEntry.final_deduction_days;
                  const deductionAmount =
                    payload.deduction_amount !== undefined
                      ? payload.deduction_amount
                      : Math.round(
                          Number(activeEntry.daily_rate || 0) *
                            Number(finalDays || 0) *
                            100,
                        ) / 100;
                  const taxableGross = Math.max(
                    0,
                    Number(activeEntry.gross_salary || 0) - deductionAmount,
                  );
                  const taxAmount = activeEntry.is_intern
                    ? 0
                    : calculateMonthlyTax(taxableGross);
                  const netAmount = Math.max(
                    0,
                    Number(activeEntry.gross_salary || 0) -
                      deductionAmount -
                      taxAmount,
                  );

                  // optimistic update
                  setCurrentRun((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      entries: (prev.entries ?? []).map((e) =>
                        e.id === entryId
                          ? {
                              ...e,
                              attendance_days: payload.attendance_days ?? e.attendance_days,
                              suspension_days: payload.suspension_days ?? e.suspension_days,
                              other_deductions_amount: payload.other_deductions_amount ?? e.other_deductions_amount,
                              final_deduction_days: finalDays,
                              deduction_amount: deductionAmount,
                              taxable_gross: taxableGross,
                              tax_amount: taxAmount,
                              net_amount: netAmount,
                              override_note:
                                payload.override_note ?? e.override_note,
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
                    if (refreshed.success) setCurrentRun(refreshed.data.data);
                  }
                } catch (err: unknown) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "Failed to save override.",
                  );
                  if (currentRun?.id) {
                    const refreshed = await getPayrollRun(currentRun.id);
                    if (refreshed.success) setCurrentRun(refreshed.data.data);
                  }
                } finally {
                  setBusyEntries((p) => ({ ...p, [entryId]: false }));
                }
              }}
              onApprove={async (entryId) => {
                await handleApprove(entryId);
                setActiveEntry(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
