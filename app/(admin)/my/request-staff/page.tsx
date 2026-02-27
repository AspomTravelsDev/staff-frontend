import { getMyHrRequests } from "@/lib/api/hr-requests";
import { RequestStaffModal } from "./components/request-staff-modal";
import { RequestStaffTable } from "./components/request-staff-table";
import { getCurrentUser } from "@/lib/auth/session";

export default async function RequestStaffPage() {
  const user = await getCurrentUser();
  const department =
    (user as any)?.department?.name || (user as any)?.role || "";

  let requests = [];
  try {
    const response = await getMyHrRequests();
    console.log(
      "[My Requests Page] API Response:",
      JSON.stringify(response, null, 2),
    );
    requests = response.data?.data || response.data || [];
    console.log("[My Requests Page] Extracted data:", requests);
  } catch (error) {
    console.error("[My Requests Page] Failed to fetch custom requests:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request Staff</h1>
          <p className="text-muted-foreground">
            Submit a request for new interns, corps members, or full staff.
          </p>
        </div>
        <RequestStaffModal userDepartment={department} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">My Requests</h2>
        <RequestStaffTable requests={requests} />
      </div>
    </div>
  );
}
