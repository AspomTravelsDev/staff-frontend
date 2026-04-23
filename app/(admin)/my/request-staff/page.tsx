import { getMyHrRequests } from "@/lib/api/hr-requests";
import { RequestStaffModal } from "./components/request-staff-modal";
import { RequestStaffTable } from "./components/request-staff-table";
import { getCurrentUser } from "@/lib/auth/session";
import { getRolesMetadataContract } from "@/lib/auth/roles-metadata";

export default async function RequestStaffPage() {
  const [user, roleMetadata] = await Promise.all([
    getCurrentUser(),
    getRolesMetadataContract(),
  ]);
  const department =
    (user as any)?.department?.name || (user as any)?.role || "";
  const roleOptions = roleMetadata.roles.map((role) => ({
    label: role.label,
    value: role.value,
  }));

  let requests = [];
  try {
    const response = await getMyHrRequests();
    requests = response.data?.data || response.data || [];
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
        <RequestStaffModal
          userDepartment={department}
          roleOptions={roleOptions}
          roleToDepartment={roleMetadata.role_to_department}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">My Requests</h2>
        <RequestStaffTable requests={requests} />
      </div>
    </div>
  );
}
