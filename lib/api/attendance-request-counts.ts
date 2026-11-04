"use server";

import { getCurrentUser } from "@/lib/auth/session";
import { userHasAnyRole } from "@/types/user-types";
import { getWorkFromHomeStats } from "./work-from-home";
import { getLatePermissionReviewQueue } from "./clock-in";

export type AttendanceRequestPendingCounts = Record<"work_from_home" | "half_day" | "late_arrival", number | null>;

export async function getAttendanceRequestPendingCounts(): Promise<AttendanceRequestPendingCounts> {
  const user = await getCurrentUser();
  const counts: AttendanceRequestPendingCounts = { work_from_home: null, half_day: null, late_arrival: null };
  if (!user) return counts;

  const canViewWfh = userHasAnyRole(user, ["hr", "super", "mp", "md", "office-operations"]);
  const canViewPermissions = userHasAnyRole(user, ["hr", "super", "compliance", "office-operations", "mp", "md"]);
  const results = await Promise.allSettled([
    canViewWfh ? getWorkFromHomeStats() : Promise.resolve(null),
    canViewPermissions ? getLatePermissionReviewQueue({ request_type: "half_day", status: "pending", per_page: 1 }) : Promise.resolve(null),
    canViewPermissions ? getLatePermissionReviewQueue({ request_type: "late_arrival", status: "pending", per_page: 1 }) : Promise.resolve(null),
  ]);
  const wfh = results[0].status === "fulfilled" ? results[0].value : null;
  const halfDay = results[1].status === "fulfilled" ? results[1].value : null;
  const late = results[2].status === "fulfilled" ? results[2].value : null;
  if (wfh?.success) counts.work_from_home = wfh.data.data.pending;
  if (halfDay?.success) counts.half_day = halfDay.data.data.summary.pending;
  if (late?.success) counts.late_arrival = late.data.data.summary.pending;
  return counts;
}
