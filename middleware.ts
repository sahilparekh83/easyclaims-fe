import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth gating used to live here (reading the ec_user_type cookie), but on
// Firebase Hosting's Cloud Functions-backed SSR, request.cookies is
// unreliable — it does not consistently see cookies the browser sends,
// so the redirect logic silently failed in production while working fine
// in `next dev`. Auth/portal gating now happens client-side in
// hooks/useAuthGuard.ts (used by each portal layout), which reads cookies
// directly via js-cookie in the browser. This middleware only sets
// headers now — nothing here depends on per-request cookie visibility.
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64");

  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("x-nonce", nonce);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
