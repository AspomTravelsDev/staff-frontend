import { InviteForm } from "./components/invite-form";
import { PendingInvites } from "./components/pending-invites";
import { getInvites } from "@/lib/auth/api";
import { getAuthToken } from "@/lib/auth/session";
import { getRolesMetadataContract } from "@/lib/auth/roles-metadata";

export default async function AdminInvitePage() {
  const token = await getAuthToken();
  const [result, roleMetadata] = await Promise.all([
    getInvites(token ?? undefined),
    getRolesMetadataContract(),
  ]);
  const invites = result.success ? result.data.data : [];
  const roleOptions = roleMetadata.roles.map((role) => ({
    label: role.label,
    value: role.value,
  }));

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 space-y-8">
      <InviteForm
        roleOptions={roleOptions}
        roleToDepartment={roleMetadata.role_to_department}
      />
      <PendingInvites invites={invites} />
    </div>
  );
}
