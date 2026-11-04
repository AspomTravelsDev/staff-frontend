import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sessionLogoutUrl } from "./return-path";

/** Route handlers clear cookies; server components cannot modify them. */
export async function redirectToSessionLogin(): Promise<never> {
  const requestHeaders = await headers();
  redirect(sessionLogoutUrl(requestHeaders.get("x-portal-return-path")));
}
