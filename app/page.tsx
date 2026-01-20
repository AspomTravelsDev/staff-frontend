import { redirect } from "next/navigation";

export default function Page() {
  // TODO: Check auth state and redirect accordingly
  // For now, redirect to login
  redirect("/login");
}
