import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { userHasAnyRole } from "@/types/user-types";
import { AttendancePermissionReview } from "../attendance-requests/attendance-permission-review";

export default async function HrLateRequestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!userHasAnyRole(user, ["hr", "super", "compliance", "office-operations", "mp", "md"])) redirect("/my/attendance");
  return <AttendancePermissionReview canReview={userHasAnyRole(user, ["hr", "super", "compliance", "office-operations"])} />;
}
