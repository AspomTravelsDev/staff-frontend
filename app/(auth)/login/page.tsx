import { LoginForm } from "./components/login-form";

export default async function LoginPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const redirect =
    typeof searchParams.redirect === "string"
      ? searchParams.redirect
      : undefined;

  return <LoginForm redirect={redirect} />;
}
