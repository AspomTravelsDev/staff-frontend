"use server";

import { redirect } from "next/navigation";
import { logout } from "@/lib/auth/api";
import { clearSession, getAuthToken } from "@/lib/auth/session";

export async function logoutAction() {
    const token = await getAuthToken();
    await logout(token ?? undefined);

    // Clear auth cookies
    await clearSession();

    redirect("/login");
}
