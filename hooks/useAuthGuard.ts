"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

const PORTAL_MAP: Record<string, string> = {
  SUPERADMIN: "/admin",
  ADMIN: "/admin",
  PARTNER: "/partner",
  MEMBER: "/member",
};

// Reads the auth cookie directly (not via middleware — see middleware.ts for why)
// and redirects if the user isn't logged in or is in the wrong portal.
export function useAuthGuard(requiredPortal: "/admin" | "/partner" | "/member") {
  const router = useRouter();

  useEffect(() => {
    const userType = Cookies.get("ec_user_type");

    if (!userType) {
      const next = window.location.pathname;
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
      return;
    }

    const allowedPortal = PORTAL_MAP[userType];
    if (allowedPortal !== requiredPortal) {
      router.replace(`${allowedPortal ?? "/member"}/dashboard`);
    }
  }, [requiredPortal, router]);
}
