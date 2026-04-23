"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
  const [overrideNotes, setOverrideNotes] = useState<Record<string, string>>({});
  const [overrideDays, setOverrideDays] = useState<Record<string, string>>({});

  const entries = currentRun?.entries ?? [];
  const pendingCount = entries.filter((entry) => entry.status !== "approved").length;

  const loadMonthRun = async () => {
    setIsBusy(true);
    try {
      const runsResult = await listPayrollRuns(selectedMonth);
      if (!runsResult.success) {
        throw new Error(runsResult.error.error || "Failed to load payroll run.");
      }

      const firstRun = runsResult.data.data[0];
      if (!firstRun) {
        setCurrentRun(null);
        toast.message("No payroll run found for selected month.");
        return;
      }

      const runResult = await getPayrollRun(firstRun.id);
      if (!runResult.success) {
        throw new Error(runResult.error.error || "Failed to load payroll run details.");
      }

      setCurrentRun(runResult.data.data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to load payroll run.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleGenerate = async () => {
    setIsBusy(true);
    try {
      const result = await createPayrollRun(selectedMonth);
      if (!result.success) {
        throw new Error(result.error.error || "Failed to generate payroll run.");
      }
      toast.success("Payroll run generated.");
      const runId = result.data.data.id;
      const runDetails = await getPayrollRun(runId);
      if (!runDetails.success) {
        throw new Error(runDetails.error.error || "Generated run but failed to fetch details.");
      }
      setCurrentRun(runDetails.data.data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to generate payroll run.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleOverride = async (entry: PayrollEntry) => {
    setIsBusy(true);
    try {
      const daysRaw = overrideDays[entry.id];
      const finalDays =
        typeof daysRaw === "string" && daysRaw.trim() !== ""
          ? Number(daysRaw)
          : undefined;

      const result = await overridePayrollEntry(entry.id, {
        final_deduction_days: finalDays,
        override_note: overrideNotes[entry.id],
      });
      if (!result.success) {
        throw new Error(result.error.error || "Failed to save override.");
      }

      toast.success("Override saved.");
      if (currentRun?.id) {
        const refreshed = await getPayrollRun(currentRun.id);
        if (refreshed.success) setCurrentRun(refreshed.data.data);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to save override.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleApprove = async (entryId: string) => {
    setIsBusy(true);
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
      toast.error(error instanceof Error ? error.message : "Unable to approve entry.");
    } finally {
      setIsBusy(false);
    }
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
      toast.error(error instanceof Error ? error.message : "Unable to close payroll run.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-[200px_auto_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="payroll-month">Payroll Month</Label>
            <Input
              id="payroll-month"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          </div>
          <Button type="button" variant="outline" disabled={isBusy} onClick={loadMonthRun}>
            Load Month
          </Button>
          <Button type="button" disabled={isBusy} onClick={handleGenerate}>
            Generate Run
          </Button>
        </div>

        {currentRun && (
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="secondary">Status: {currentRun.status}</Badge>
            <Badge variant="outline">Entries: {entries.length}</Badge>
            <Badge variant="outline">Pending: {pendingCount}</Badge>
            <Badge variant="outline">
              Approved: {entries.length - pendingCount}
            </Badge>
            <Button
              type="button"
              className="ml-auto"
              disabled={isBusy || pendingCount > 0 || currentRun.status === "closed"}
              onClick={handleCloseRun}
            >
              Close Payroll Run
            </Button>
          </div>
        )}
      </div>

      {currentRun && (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">Staff</th>
                <th className="p-2 text-left">Suggested Days</th>
                <th className="p-2 text-left">Final Days</th>
                <th className="p-2 text-left">Deduction</th>
                <th className="p-2 text-left">Tax</th>
                <th className="p-2 text-left">Net</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t align-top">
                  <td className="p-2">
                    <div className="font-medium">{entry.user?.name ?? "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">
                      {entry.user?.staff_id ?? "N/A"} | {entry.user?.department ?? "General"}
                    </div>
                    {entry.is_intern && (
                      <div className="text-xs text-blue-600 font-medium">Intern (Tax Exempt)</div>
                    )}
                  </td>
                  <td className="p-2">
                    <div>Attendance: {entry.attendance_suggested_days}</div>
                    <div>Compliance: {entry.compliance_suggested_days}</div>
                    <div className="font-medium">Total: {entry.system_suggested_days}</div>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={overrideDays[entry.id] ?? `${entry.final_deduction_days}`}
                      disabled={entry.status === "approved" || isBusy}
                      onChange={(event) =>
                        setOverrideDays((previous) => ({
                          ...previous,
                          [entry.id]: event.target.value,
                        }))
                      }
                    />
                    <Input
                      className="mt-2"
                      placeholder="Override note (optional)"
                      value={overrideNotes[entry.id] ?? entry.override_note ?? ""}
                      disabled={entry.status === "approved" || isBusy}
                      onChange={(event) =>
                        setOverrideNotes((previous) => ({
                          ...previous,
                          [entry.id]: event.target.value,
                        }))
                      }
                    />
                  </td>
                  <td className="p-2">{money(entry.deduction_amount)}</td>
                  <td className="p-2">{money(entry.tax_amount)}</td>
                  <td className="p-2 font-semibold">{money(entry.net_amount)}</td>
                  <td className="p-2">
                    <Badge variant={entry.status === "approved" ? "default" : "secondary"}>
                      {entry.status}
                    </Badge>
                  </td>
                  <td className="p-2 space-x-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={entry.status === "approved" || isBusy}
                      onClick={() => handleOverride(entry)}
                    >
                      Save Override
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={entry.status === "approved" || isBusy}
                      onClick={() => handleApprove(entry.id)}
                    >
                      Approve
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
