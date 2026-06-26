import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/", "/upload"];

const PORTAL_MAP: Record<string, string[]> = {
  SUPERADMIN: ["/admin"],
  PARTNER: ["/partner"],
  MEMBER: ["/member"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64");

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  const userType = request.cookies.get("ec_user_type")?.value;
  // ec_user_type is set on login and cleared on logout — reliable auth indicator
  const isAuthenticated = Boolean(userType);

  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("x-nonce", nonce);

  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isPublic && pathname !== "/upload") {
    const redirectTo = userType === "SUPERADMIN"
      ? "/admin/dashboard"
      : userType === "PARTNER"
        ? "/partner/dashboard"
        : "/member/dashboard";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // Block access to wrong portal
  if (isAuthenticated && userType) {
    const allowedPrefixes = PORTAL_MAP[userType] || [];
    const isPortalRoute = ["/admin", "/partner", "/member"].some((p) => pathname.startsWith(p));
    if (isPortalRoute && !allowedPrefixes.some((p) => pathname.startsWith(p))) {
      const portalRoot = allowedPrefixes[0] ?? "/member";
      return NextResponse.redirect(new URL(portalRoot + "/dashboard", request.nextUrl.origin));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
