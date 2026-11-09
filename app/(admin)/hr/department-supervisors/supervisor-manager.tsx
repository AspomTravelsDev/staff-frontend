"use client";

import { useState, useTransition } from "react";
import { Loader2, UserRound, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { assignDepartmentSupervisor, clearDepartmentSupervisor, type DepartmentSupervisorRow } from "@/lib/api/department-supervisors.actions";

export function DepartmentSupervisorManager({ initialDepartments }: { initialDepartments: DepartmentSupervisorRow[] }) {
  const [departments, setDepartments] = useState(initialDepartments);
  const [selected, setSelected] = useState<Record<string, string>>(() => Object.fromEntries(
    initialDepartments.map((row) => [row.name, row.supervisor?.id ?? ""]),
  ));
  const [pendingDepartment, setPendingDepartment] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const assignedCount = departments.filter((row) => row.supervisor).length;
  const attentionCount = departments.length - assignedCount;

  function save(department: DepartmentSupervisorRow, supervisorId: string) {
    setSelected((rows) => ({ ...rows, [department.name]: supervisorId }));
    if (supervisorId === (department.supervisor?.id ?? "")) return;
    setPendingDepartment(department.name);
    startTransition(async () => {
      const result = await assignDepartmentSupervisor(department.name, supervisorId);
      if (!result.success) {
        toast.error(result.error.message);
        setSelected((rows) => ({ ...rows, [department.name]: department.supervisor?.id ?? "" }));
        setPendingDepartment(null);
        return;
      }
      const candidate = department.staff.find((person) => person.id === supervisorId);
      if (!candidate) {
        toast.error("That staff member is no longer available as a supervisor. Reload the page and try again.");
        setSelected((rows) => ({ ...rows, [department.name]: department.supervisor?.id ?? "" }));
        setPendingDepartment(null);
        return;
      }
      setDepartments((rows) => rows.map((row) => row.name === department.name ? { ...row, supervisor: candidate } : row));
      toast.success(`${candidate.name} is now the official ${department.name} supervisor.`);
      setPendingDepartment(null);
    });
  }

  function clear(department: DepartmentSupervisorRow) {
    setPendingDepartment(department.name);
    startTransition(async () => {
      const result = await clearDepartmentSupervisor(department.name);
      if (!result.success) {
        toast.error(result.error.message);
        setPendingDepartment(null);
        return;
      }
      setDepartments((rows) => rows.map((row) => row.name === department.name ? { ...row, supervisor: null } : row));
      setSelected((rows) => ({ ...rows, [department.name]: "" }));
      toast.success(`${department.name} supervisor assignment cleared.`);
      setPendingDepartment(null);
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Department Supervisors</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose the official supervisor used when staff start a performance appraisal.</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y py-3 text-sm">
        <span className="inline-flex items-center gap-2"><UserRoundCheck className="size-4 text-primary" /> <strong className="tabular-nums">{assignedCount}</strong> assigned</span>
        <span className="inline-flex items-center gap-2"><UserRound className="size-4 text-muted-foreground" /> <strong className="tabular-nums">{attentionCount}</strong> need assignment</span>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b py-4">
          <CardTitle className="text-base">Supervisor assignments</CardTitle>
          <CardDescription>Each department has one official reviewer. Assignments apply to appraisals started from now on.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-44">Department</TableHead>
                  <TableHead className="min-w-56">Official supervisor</TableHead>
                  <TableHead className="min-w-72">Select staff</TableHead>
                  <TableHead className="w-32 text-right">Clear</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((department) => {
                  const busy = isPending && pendingDepartment === department.name;
                  const value = selected[department.name] ?? "";
                  return (
                    <TableRow key={department.name}>
                      <TableCell className="whitespace-nowrap font-medium">{department.name}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {department.supervisor ? <span className="font-medium">
                          {department.supervisor.name}
                          {department.supervisor.staff_id && <span className="ml-2 text-sm font-normal text-muted-foreground">{department.supervisor.staff_id}</span>}
                        </span> : <span className="text-sm text-muted-foreground">Unassigned</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {department.staff.length ? <div className="flex items-center gap-3">
                          <Select value={value} disabled={isPending} onValueChange={(next) => save(department, next)}>
                            <SelectTrigger aria-label={`Choose ${department.name} supervisor`} className="w-full max-w-sm">
                              <SelectValue placeholder="Choose supervisor" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                              {department.staff.map((candidate) => <SelectItem key={candidate.id} value={candidate.id}>
                                {candidate.name}{candidate.staff_id ? ` · ${candidate.staff_id}` : ""}
                              </SelectItem>)}
                            </SelectContent>
                          </Select>
                          {busy && <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" /> Saving</span>}
                        </div> : <span className="text-sm text-muted-foreground">No active staff in this department</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" disabled={!department.supervisor || isPending} onClick={() => clear(department)}>
                          Clear
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!departments.length && <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No departments are available.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          <p className="border-t px-4 py-3 text-xs text-muted-foreground">Selecting a staff member assigns them immediately and enables their supervisor access. The department assignment determines who receives new appraisal reviews.</p>
        </CardContent>
      </Card>
    </div>
  );
}
