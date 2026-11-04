"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Pencil, Users } from "lucide-react";
import type { Employee } from "@/lib/api/employees";
import { calculatePayrollEntry, isTaxExempt } from "@/lib/payroll/calculations";
import { EditSalarySheet } from "./edit-salary-sheet";

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  nysc: "NYSC",
  intern: "Intern",
};

const CONTRACT_TYPE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  full_time: "default",
  part_time: "secondary",
  contract: "secondary",
  nysc: "outline",
  intern: "outline",
};

function formatNGN(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function getEstimatedNet(emp: Employee): number {
  const gross = parseFloat(emp.gross_pay) || 0;
  if (gross <= 0) return 0;

  const now = new Date();
  const payrollMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const isIntern = isTaxExempt(emp.contract_type);

  const result = calculatePayrollEntry({
    baseSalary: gross,
    contractType: emp.contract_type ?? null,
    isIntern,
    dateJoined: emp.joinDate ?? null,
    payrollMonth,
    proratedDays: 0,
    accommodationAmount: null,
    attendanceDays: 0,
    suspensionDays: 0,
    otherDeductions: [],
    additions: [],
  });

  return result.net_amount;
}

interface SalarySettingsProps {
  initialEmployees: Employee[];
}

export function SalarySettings({ initialEmployees }: SalarySettingsProps) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [contractFilter, setContractFilter] = useState("all");
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);

  // Unique departments from employees list
  const departments = useMemo(() => {
    const depts = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));
    return depts.sort();
  }, [employees]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = employees;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
          e.staff_id?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q),
      );
    }

    if (deptFilter && deptFilter !== "all") {
      list = list.filter((e) => e.department === deptFilter);
    }

    if (contractFilter && contractFilter !== "all") {
      list = list.filter((e) => (e.contract_type ?? "full_time") === contractFilter);
    }

    return list;
  }, [employees, search, deptFilter, contractFilter]);

  const totalGross = useMemo(
    () => filtered.reduce((sum, e) => sum + (parseFloat(e.gross_pay) || 0), 0),
    [filtered],
  );

  const totalEstNet = useMemo(
    () => filtered.reduce((sum, e) => sum + getEstimatedNet(e), 0),
    [filtered],
  );

  const handleSaved = (updated: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="col-span-2 rounded-xl border bg-card p-3 sm:col-span-1 sm:p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Staff Shown</p>
          <p className="text-2xl font-bold">{filtered.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">of {employees.length} total</p>
        </div>
        <div className="rounded-xl border bg-card p-3 sm:p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Total Gross</p>
          <p className="text-2xl font-bold">{formatNGN(totalGross)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">combined monthly</p>
        </div>
        <div className="rounded-xl border bg-card p-3 sm:p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Est. Total Net</p>
          <p className="text-2xl font-bold text-green-700">{formatNGN(totalEstNet)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">estimated, full month</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="salary-search"
            placeholder="Search name, staff ID…"
            className="pl-9 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger id="salary-dept-filter" className="h-11 w-full sm:w-44">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={contractFilter} onValueChange={setContractFilter}>
          <SelectTrigger id="salary-contract-filter" className="h-11 w-full sm:w-40">
            <SelectValue placeholder="All Contract Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(CONTRACT_TYPE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card py-16 text-center text-muted-foreground">
          <Users className="mx-auto h-8 w-8 mb-3 opacity-40" />
          <p className="text-sm">No staff found matching your filters.</p>
        </div>
      ) : (
        <>
        <div className="space-y-2 md:hidden">
          {filtered.map((emp) => {
            const fullName = `${emp.firstName} ${emp.lastName}`.trim();
            const gross = parseFloat(emp.gross_pay) || 0;
            const estNet = getEstimatedNet(emp);
            const contractLabel = CONTRACT_TYPE_LABELS[emp.contract_type ?? ""] ?? emp.contract_type ?? "—";
            return (
              <article key={emp.id} className="rounded-xl border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-semibold">{fullName}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{emp.staff_id || "No staff ID"} · {emp.department || "No department"}</p>
                  </div>
                  <Badge variant={CONTRACT_TYPE_VARIANTS[emp.contract_type ?? ""] ?? "outline"} className="shrink-0 text-xs">{contractLabel}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3">
                  <div><p className="text-xs text-muted-foreground">Gross pay</p><p className="mt-0.5 text-sm font-semibold tabular-nums">{gross > 0 ? formatNGN(gross) : "Not set"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Estimated net</p><p className="mt-0.5 text-sm font-semibold tabular-nums text-green-700">{estNet > 0 ? formatNGN(estNet) : "—"}</p></div>
                </div>
                <Button id={`edit-salary-mobile-${emp.id}`} type="button" variant="outline" className="mt-3 min-h-11 w-full gap-2" onClick={() => setEditEmployee(emp)}>
                  <Pencil className="h-4 w-4" />Edit salary
                </Button>
              </article>
            );
          })}
        </div>
        <div className="hidden overflow-x-auto rounded-md border md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Staff</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead className="text-right">Gross Pay</TableHead>
                <TableHead className="text-right">
                  <span className="flex items-center justify-end gap-1">
                    Est. Net
                    <span
                      title="Estimated net pay for a full month with no absences or extras."
                      className="rounded-full bg-muted text-muted-foreground text-[10px] font-bold w-4 h-4 flex items-center justify-center cursor-help"
                    >
                      ?
                    </span>
                  </span>
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((emp) => {
                const gross = parseFloat(emp.gross_pay) || 0;
                const estNet = getEstimatedNet(emp);
                const fullName = `${emp.firstName} ${emp.lastName}`.trim();
                const contractLabel = CONTRACT_TYPE_LABELS[emp.contract_type ?? ""] ?? emp.contract_type ?? "—";
                const contractVariant = CONTRACT_TYPE_VARIANTS[emp.contract_type ?? ""] ?? "outline";

                return (
                  <TableRow key={emp.id} className="group">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{fullName}</p>
                        {emp.staff_id && (
                          <p className="text-xs text-muted-foreground font-mono">{emp.staff_id}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {emp.department || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={contractVariant} className="text-xs">
                        {contractLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {gross > 0 ? formatNGN(gross) : (
                        <span className="text-muted-foreground text-xs italic">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {estNet > 0 ? (
                        <span className="text-green-700 font-medium tabular-nums text-sm">
                          {formatNGN(estNet)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        id={`edit-salary-${emp.id}`}
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 opacity-100 transition-opacity sm:h-8 sm:w-8 sm:opacity-0 sm:group-hover:opacity-100"
                        onClick={() => setEditEmployee(emp)}
                        title={`Edit salary for ${fullName}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        </>
      )}

      <EditSalarySheet
        employee={editEmployee}
        open={!!editEmployee}
        onClose={() => setEditEmployee(null)}
        onSaved={handleSaved}
      />
    </div>
  );
}
