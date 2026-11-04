export interface ExportEmployee {
  id: string;
  name: string;
  joinDate?: string | null;
  contract_type?: string | null;
}

/** Derived eligibility under the handbook rule, not a saved HR confirmation. */
export function confirmationStatus(employee: ExportEmployee, asOf: string): string {
  const type = employee.contract_type?.toLowerCase();
  if (type && ["intern", "nysc", "contract"].includes(type)) return "Not applicable";
  if (type !== "full_time") return "Needs review";
  const joined = employee.joinDate?.slice(0, 10);
  if (!joined || !/^\d{4}-\d{2}-\d{2}$/.test(joined)) return "Needs review";
  const date = new Date(`${joined}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== joined || joined > asOf) return "Needs review";
  // Clamp month-end anniversaries (e.g. August 31 + six months = February 28).
  const anniversary = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 6, 1));
  const lastDay = new Date(Date.UTC(anniversary.getUTCFullYear(), anniversary.getUTCMonth() + 1, 0)).getUTCDate();
  anniversary.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return asOf > anniversary.toISOString().slice(0, 10) ? "Confirmed" : "Not yet confirmed";
}

export interface ExportLeave {
  employeeId: string;
  status: string;
  startDate: string;
  endDate: string;
  type?: string;
}

export function leavePayStatus(employee: ExportEmployee, leave: ExportLeave, date: string): "Paid leave" | "Unpaid leave" {
  const type = leave.type?.trim().toLowerCase();
  if (type === "unpaid") return "Unpaid leave";
  if (type === "ante-natal") return "Paid leave";
  return confirmationStatus(employee, date) === "Confirmed" ? "Paid leave" : "Unpaid leave";
}

/** Count each approved weekday once; the end date is the resumption date. */
export function approvedLeavePayStatus(employee: ExportEmployee, leaves: ExportLeave[], date: string) {
  const matches = leaves.filter(leave => leave.employeeId === employee.id && leave.status.toLowerCase() === "approved" && leave.startDate <= date && date < leave.endDate);
  if (!matches.length) return null;
  // Explicit unpaid leave wins if conflicting approvals overlap.
  return matches.some(leave => leavePayStatus(employee, leave, date) === "Unpaid leave") ? "Unpaid leave" : "Paid leave";
}
