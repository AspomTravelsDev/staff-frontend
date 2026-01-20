import { UpdatePasswordForm } from "./components/update-password-form";

interface UpdatePasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function UpdatePasswordPage({
  searchParams,
}: UpdatePasswordPageProps) {
  const { token } = await searchParams;

  return <UpdatePasswordForm token={token || ""} />;
}
