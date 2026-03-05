import { InviteForm } from "./components/invite-form";
import { PendingInvites } from "./components/pending-invites";
import { getInvites } from "@/lib/auth/api";
import { getAuthToken } from "@/lib/auth/session";

export default async function AdminInvitePage() {
  const token = await getAuthToken();
  const result = await getInvites(token ?? undefined);
  const invites = result.success ? result.data.data : [];

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 space-y-8">
      <InviteForm />
      <PendingInvites invites={invites} />
    </div>
  );
}
