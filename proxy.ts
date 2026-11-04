import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { safeReturnPath } from "@/lib/auth/return-path";

const protectedRoutes = [
    "/dashboard",
    "/accounts",
    "/compliance",
    "/forms",
    "/hr",
    "/visa",
    "/birth-services",
    "/admin",
    "/my",
    "/activity",
    "/announcements",
    "/attendance",
    "/chat",
    "/crm",
    "/it",
    "/directory",
    "/operations",
    "/social-media",
];


const publicRoutes = [
    "/visa/apply",
    "/applicant",
    "/api",
    "/auth",
    "/",
];


const matches = (pathname: string, routes: string[]) => routes.some(route => pathname === route || pathname.startsWith(`${route}/`));

/** Cheap routing check only. Server user lookup and Laravel authorize actual data. */
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("auth_token")?.value;
    const returnPath = safeReturnPath(pathname + request.nextUrl.search);
    const requestHeaders = new Headers(request.headers);
    // Overwrite incoming values so recovery always uses the actual requested page.
    requestHeaders.set("x-portal-return-path", returnPath);
    const next = () => NextResponse.next({ request: { headers: requestHeaders } });
    const clear = (response: NextResponse) => {
        response.cookies.delete("auth_token");
        response.cookies.delete("auth_user");
        return response;
    };
    const login = () => {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", returnPath);
        if (request.headers.get("next-action")) {
            // Next's action client consumes this header instead of following an HTML fetch redirect.
            return clear(new NextResponse(null, { headers: {
                "x-action-redirect": `${loginUrl.pathname}${loginUrl.search};replace`,
                "Content-Type": "text/plain",
                "Cache-Control": "no-store",
            } }));
        }
        return clear(NextResponse.redirect(loginUrl, 303));
    };

    if (matches(pathname, publicRoutes)) return next();
    const protectedPage = matches(pathname, protectedRoutes);
    if (protectedPage && !token) return login();
    // Do not duplicate /api/user here: this also runs for every route prefetch.
    // A cookie is not proof of identity. getCurrentUser validates it on the server;
    // the API client redirects on protected 401s, including retained-layout navigation.
    return next();
}

export { proxy as middleware };
export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)"],
};
