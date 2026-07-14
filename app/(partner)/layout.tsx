"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import { useQuery } from "@tanstack/react-query";
import { partnerListNotifications } from "@/imports/core/api";
import { useRouter, usePathname } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";

function deriveTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  // last meaningful segment becomes the title
  const last = segments[segments.length - 1] ?? "dashboard";
  return last.charAt(0).toUpperCase() + last.slice(1);
}

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard("/partner");
  const router = useRouter();
  const pathname = usePathname();

  const { data } = useQuery({
    queryKey: ["partner", "notifications", "unread-count"],
    queryFn: () => partnerListNotifications({ unread_only: true, limit: 1 }),
    refetchInterval: 60_000,
  });

  const unreadCount: number = (data as any)?.data?.total ?? (data as any)?.data?.unread_count ?? 0;

  const title = deriveTitle(pathname);

  function handleBellClick() {
    router.push("/partner/notifications");
  }

  return (
    <AppShell
      portal="partner"
      title={title}
      unreadCount={unreadCount}
      onBellClick={handleBellClick}
    >
      {children}
    </AppShell>
  );
}
