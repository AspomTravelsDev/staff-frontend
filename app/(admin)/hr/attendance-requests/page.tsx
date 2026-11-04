import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasAnyRole } from "@/types/user-types";
import { WorkFromHomeContent } from "../work-from-home/work-from-home-content";
import { AttendancePermissionReview } from "./attendance-permission-review";
import { AttendanceRequestTabs } from "./request-tabs";
import { getAttendanceRequestPendingCounts } from "@/lib/api/attendance-request-counts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Attendance Requests | Aspom Portal" };

export default async function AttendanceRequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const canViewWfh = userHasAnyRole(user, ["hr", "super", "mp", "md", "office-operations"]);
  const canViewPermissions = userHasAnyRole(user, ["hr", "super", "compliance", "office-operations", "mp", "md"]);
  const canReviewPermissions = userHasAnyRole(user, ["hr", "super", "compliance", "office-operations"]);
  const tabs = [
    { value: "work_from_home", label: "Work From Home", disabled: !canViewWfh },
    { value: "half_day", label: "Half Day", disabled: !canViewPermissions },
    { value: "late_arrival", label: "Late Arrival", disabled: !canViewPermissions },
  ];
  if (!canViewWfh && !canViewPermissions) redirect("/my/attendance");
  const params = await searchParams;
  const active = tabs.find(tab => tab.value === params.type && !tab.disabled)?.value ?? tabs.find(tab => !tab.disabled)!.value;
  const pendingCounts = await getAttendanceRequestPendingCounts();
  return <div className="flex min-w-0 flex-col gap-4">
    <header><h1 className="text-2xl font-semibold">Attendance Requests</h1><p className="mt-1 text-sm text-muted-foreground">Manage work-from-home, half-day and late-arrival requests.</p></header>
    <AttendanceRequestTabs active={active} tabs={tabs} initialCounts={pendingCounts} viewerId={user.id} />
    {tabs.some(tab => tab.disabled) && <p className="text-sm text-muted-foreground">Disabled tabs aren’t available to your current roles.</p>}
    {active === "work_from_home" ? <WorkFromHomeContent embedded searchParams={Promise.resolve({ ...params, status: params.status ?? "pending" })} /> : <AttendancePermissionReview key={active} embedded canReview={canReviewPermissions} requestType={active as "half_day" | "late_arrival"} />}
  </div>;
}
