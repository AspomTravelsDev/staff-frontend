"use client";

import { useState } from "react";
import { useUser } from "@/providers/user-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserAction } from "../actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Employee } from "@/lib/api/employees";
import { getInitials } from "@/lib/utils";
import { getRoleLabel } from "@/types/user-types";

const contractLabels: Record<string, string> = { full_time: "Full staff", part_time: "Part time", contract: "Contract", nysc: "NYSC", intern: "Intern" };

function Detail({ label, value }: { label: string; value?: string | null }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value || "Not provided"}</dd></div>;
}

function displayDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : format(parsed, "d MMM yyyy");
}

function StaffIdEditor({ employee, onUpdated }: { employee: Employee; onUpdated?: (employee: Employee) => void }) {
  const [value, setValue] = useState(employee.staff_id || "");
  const [savedValue, setSavedValue] = useState(employee.staff_id || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return <form className="space-y-2" onSubmit={async event => {
    event.preventDefault();
    const staffId = value.trim();
    if (!staffId || staffId.length > 255) { setError("Enter a staff ID of up to 255 characters."); return; }
    if (saving || staffId === savedValue) return;
    setSaving(true);
    setError("");
    try {
      const result = await updateUserAction(employee.id, { staff_id: staffId });
      if (!result.success) { setError(result.error || "Could not save staff ID. Please try again."); return; }
      setValue(staffId);
      setSavedValue(staffId);
      onUpdated?.({ ...employee, staff_id: staffId });
      toast.success("Staff ID updated");
    } catch {
      setError("Could not save staff ID. Please try again.");
    } finally { setSaving(false); }
  }}>
    <Label htmlFor="employee-details-staff-id">Staff ID</Label>
    <div className="flex flex-wrap gap-2">
      <Input id="employee-details-staff-id" className="min-w-0 flex-1" value={value} onChange={event => { setValue(event.target.value); setError(""); }} required maxLength={255} disabled={saving} aria-invalid={!!error} aria-describedby={error ? "employee-staff-id-error" : undefined} />
      <Button type="submit" disabled={saving || !value.trim() || value.trim() === savedValue}>{saving ? "Saving…" : "Save staff ID"}</Button>
    </div>
    {error && <p id="employee-staff-id-error" role="alert" className="text-sm text-destructive">{error}</p>}
  </form>;
}

export function EmployeeDetailsSheet({ employee, open, onOpenChange, onUpdated }: { employee: Employee | null; open: boolean; onOpenChange: (open: boolean) => void; onUpdated?: (employee: Employee) => void }) {
  const { user } = useUser();
  const userRoles = user?.roles?.length ? user.roles : [user?.role, ...(user?.secondary_roles || [])];
  const canEditStaffId = userRoles.some(role => role === "hr" || role === "super");
  const name = employee ? `${employee.firstName} ${employee.lastName}`.trim() : "Employee details";
  const roles = employee ? (employee.roles?.length ? employee.roles : [employee.role, ...(employee.secondary_roles || [])]).filter(Boolean) : [];
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
      <SheetHeader><div className="flex items-center gap-3 pr-6"><Avatar className="size-12"><AvatarImage src={employee?.image_url || undefined} /><AvatarFallback>{getInitials(name || "Employee")}</AvatarFallback></Avatar><div className="min-w-0"><SheetTitle className="truncate">{name}</SheetTitle><SheetDescription>{employee?.staff_id || "Staff profile"}</SheetDescription></div></div></SheetHeader>
      {employee && <div className="space-y-6 px-4 pb-6">
        <section>{canEditStaffId ? <StaffIdEditor key={`${employee.id}-${employee.staff_id}`} employee={employee} onUpdated={onUpdated} /> : <dl><Detail label="Staff ID" value={employee.staff_id} /></dl>}</section>
        <div className="flex flex-wrap gap-2"><Badge variant={employee.status === "Active" ? "default" : "secondary"}>{employee.status}</Badge>{employee.is_supervisor && <Badge variant="outline">Supervisor</Badge>}</div>
        {employee.is_blacklisted && <section className="space-y-3"><h3 className="text-sm font-semibold">Blacklist record</h3><Badge variant="destructive">Blacklisted</Badge><p className="whitespace-pre-wrap text-sm">{employee.blacklist_reason || "No reason recorded"}</p><p className="text-xs text-muted-foreground">Added {displayDate(employee.blacklisted_at) || "Date not recorded"}</p></section>}
        <section className="space-y-3"><h3 className="text-sm font-semibold">Contact</h3><dl className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Detail label="Work email" value={employee.email} /><Detail label="Phone" value={employee.phone} /><Detail label="Mobile phone" value={employee.mobile_phone} /><Detail label="Date of birth" value={displayDate(employee.dob)} /></dl></section>
        <Separator />
        <section className="space-y-3"><h3 className="text-sm font-semibold">Role and department</h3><p className="text-sm">{employee.department || "Department not assigned"}</p><div className="flex flex-wrap gap-1.5">{roles.length ? roles.map(role => <Badge key={role} variant="outline">{getRoleLabel(role, { isSupervisor: employee.is_supervisor })}</Badge>) : <span className="text-sm text-muted-foreground">No role assigned</span>}</div></section>
        <Separator />
        <section className="space-y-3"><h3 className="text-sm font-semibold">Employment</h3><dl className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Detail label="Contract type" value={employee.contract_type ? contractLabels[employee.contract_type] || employee.contract_type : null} /><Detail label="Joined" value={displayDate(employee.joinDate)} /><Detail label="Current contract starts" value={displayDate(employee.contract_start_date)} /><Detail label="Current contract ends" value={displayDate(employee.contract_end_date)} /><Detail label="Exit date" value={displayDate(employee.exit_date || employee.exitDate)} /><Detail label="Exit type" value={employee.exit_type ? employee.exit_type.replaceAll("_", " ") : null} /></dl>{employee.exit_reason && <div><p className="text-xs text-muted-foreground">Exit reason</p><p className="mt-1 whitespace-pre-wrap text-sm">{employee.exit_reason}</p></div>}</section>
        {(employee.contract_history?.length || 0) > 0 && <><Separator /><section className="space-y-3"><h3 className="text-sm font-semibold">Contract history</h3><ol className="space-y-3">{employee.contract_history?.map(item => <li key={item.id} className="rounded-md border p-3"><p className="text-sm font-medium">{contractLabels[item.contract_type] || item.contract_type}</p><p className="mt-1 text-xs text-muted-foreground">{displayDate(item.start_date) || "Unknown start"} – {displayDate(item.end_date) || "Current"}</p>{item.change_reason && <p className="mt-2 text-sm">{item.change_reason}</p>}</li>)}</ol></section></>}
      </div>}
    </SheetContent>
  </Sheet>;
}
