"use server";

import { clearSession } from "@/lib/auth/session";
// import { redirect } from "next/navigation";

export async function logoutAction() {
    await clearSession();
    // We don't redirect here because we might want to show a message first
    // or let the client handle the redirection
}
