"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Save, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Employee, EmployeeContractPeriodInput } from "@/lib/api/employees";
import { updateEmployeeContractPeriodsAction } from "../actions";

type PeriodDraft = EmployeeContractPeriodInput & { key: string };
const labels: Record<string, string> = { full_time: "Full staff", part_time: "Part time", contract: "Contract", nysc: "NYSC", intern: "Intern" };
const newPeriod = (): PeriodDraft => ({ key: crypto.randomUUID(), contract_type: "full_time", start_date: "", end_date: null, change_reason: "" });

function initialPeriods(employee: Employee | null): PeriodDraft[] {
  if (!employee) return [];
  if (employee.contract_history?.length) return employee.contract_history.map(period => ({
    id: period.id,
    key: period.id,
    contract_type: period.contract_type,
    start_date: period.start_date || "",
    end_date: period.end_date,
    change_reason: period.change_reason || "",
  }));
  if (employee.contract_type) return [{
    key: crypto.randomUUID(),
    contract_type: employee.contract_type,
    start_date: employee.contract_start_date || employee.joinDate || "",
    end_date: employee.contract_end_date || null,
    change_reason: "Existing contract period",
  }];
  return [];
}

export function EmployeeContractDialog({ employee, open, onOpenChange }: {
  employee: Employee | null; open: boolean; onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [periods, setPeriods] = useState<PeriodDraft[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setPeriods(initialPeriods(employee));
  }, [open, employee]);

  const updatePeriod = (key: string, patch: Partial<PeriodDraft>) => setPeriods(current => current.map(period => period.key === key ? { ...period, ...patch } : period));
  const hasOverlap = periods.some((period, index) => periods.some((other, otherIndex) => {
    if (index === otherIndex || !period.start_date || !other.start_date) return false;
    const periodStart = period.start_date;
    const periodEnd = period.end_date || "9999-12-31";
    const otherStart = other.start_date;
    const otherEnd = other.end_date || "9999-12-31";
    return periodStart <= otherEnd && otherStart <= periodEnd;
  }));
  const canSave = periods.length > 0 && !hasOverlap && periods.every(period =>
    period.start_date && (!period.end_date || period.end_date >= period.start_date) && period.change_reason.trim().length >= 10,
  );

  async function save() {
    if (!employee || !canSave) return;
    setBusy(true);
    const result = await updateEmployeeContractPeriodsAction(employee.id, periods.map(({ key: _key, ...period }) => period));
    setBusy(false);
    if (!result.success) {
      toast.error(result.error || "Could not save contract periods.");
      return;
    }
    toast.success("Contract periods saved.");
    onOpenChange(false);
    router.refresh();
  }

  return <Dialog open={open} onOpenChange={value => !busy && onOpenChange(value)}>
    <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Manage contract periods</DialogTitle>
        <DialogDescription>{employee ? `${employee.firstName} ${employee.lastName} · ${employee.staff_id}` : "Edit the employee's contract timeline."} Each period needs a type, dates, and reason. Periods cannot overlap.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {periods.length === 0 && <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No contract periods recorded. Add the employee&apos;s first period to establish their current contract.</p>}
        {periods.map((period, index) => <section key={period.key} className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><CalendarRange className="size-4 text-muted-foreground" />Period {index + 1}{!period.end_date && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">No end date</span>}</div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1"><Label>Contract type</Label><Select value={period.contract_type} onValueChange={value => updatePeriod(period.key, { contract_type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="full_time">Full staff</SelectItem><SelectItem value="part_time">Part time</SelectItem><SelectItem value="contract">Contract</SelectItem><SelectItem value="nysc">NYSC</SelectItem><SelectItem value="intern">Intern</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Start date</Label><Input type="date" value={period.start_date} onChange={event => updatePeriod(period.key, { start_date: event.target.value })} /></div>
            <div className="space-y-1.5"><Label>End date <span className="font-normal text-muted-foreground">(optional)</span></Label><Input type="date" min={period.start_date || undefined} value={period.end_date || ""} onChange={event => updatePeriod(period.key, { end_date: event.target.value || null })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Reason for this period or change</Label><Textarea rows={2} maxLength={500} value={period.change_reason} onChange={event => updatePeriod(period.key, { change_reason: event.target.value })} placeholder="At least 10 characters" /></div>
          <p className="text-xs text-muted-foreground">{labels[period.contract_type] || period.contract_type}{period.end_date ? ` · ${period.start_date || "Start date needed"} to ${period.end_date}` : " · current or open-ended period"}</p>
        </section>)}
        {hasOverlap && <p role="alert" className="text-sm text-destructive">These dates overlap. Adjust the periods so only one contract applies on each date.</p>}
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setPeriods(current => [...current, newPeriod()])}><Plus className="size-4" />Add period</Button>
      </div>
      <DialogFooter><Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={busy || !canSave} onClick={save}><Save className="mr-2 size-4" />{busy ? "Saving…" : "Save periods"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
