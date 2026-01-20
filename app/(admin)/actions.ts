"use server";

import { logout } from "@/lib/auth/api";
import { redirect } from "next/navigation";

export async function logoutAction() {
    await logout();

    // TODO: Clear auth token from cookies when backend is ready
    redirect("/login");
}
