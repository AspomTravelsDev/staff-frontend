import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth Proxy
 *
 * Protects routes by checking for auth token cookie.
 * - Unauthenticated users accessing protected routes → redirect to /login
 * - Authenticated users accessing auth pages → redirect to /dashboard
 *
 * Note: This only checks for token existence, not validity.
 * Token validation happens in getCurrentUser() on the server.
 */

const AUTH_COOKIE_NAME = "auth_token";

// Routes that require authentication
const protectedRoutes = [
    "/dashboard",
    "/accounts",
    "/compliance",
    "/forms",
    "/hr",
    "/visa",
    "/admin",
    "/my",
    "/activity",
    "/announcements",
    "/attendance",
    "/chat",
    "/crm",
    "/it",
];

// Routes that are always public, even if they match a protected prefix
const publicRoutes = [
    "/visa/apply",
    "/applicant",
    "/api",
    "/auth",
    "/",
];

// Routes only for unauthenticated users
const authRoutes = ["/login", "/reset-password", "/update-password", "/accept-invite"];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    // First check if it's a public route (whitelist)
    const isPublicRoute = publicRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Check if accessing a protected route without auth
    const isProtectedRoute = protectedRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isProtectedRoute && !token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Check if accessing auth routes while authenticated
    const isAuthRoute = authRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export { proxy as middleware };

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - api routes
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)",
    ],
};
