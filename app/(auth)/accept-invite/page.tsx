import { AcceptInviteForm } from "./components/accept-invite-form";

interface AcceptInvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage({
  searchParams,
}: AcceptInvitePageProps) {
  const { token } = await searchParams;

  return <AcceptInviteForm token={token || ""} />;
}
