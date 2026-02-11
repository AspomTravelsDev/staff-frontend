import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";

/**
 * Logout Route Handler
 * 
 * Handles session cleanup when authentication fails or user logs out.
 * This is a Route Handler, so cookie modification is allowed here.
 */
export async function GET(request: NextRequest) {
    // Clear the session cookies
    await clearSession();

    // Redirect to login page
    return NextResponse.redirect(new URL("/login", request.url));
}
