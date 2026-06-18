"use client";

import React from "react";
import AppShell from "@/components/layout/AppShell";
import { useQuery } from "@tanstack/react-query";
import { memberListNotifications } from "@/imports/core/api";
import { useRouter } from "next/navigation";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["member", "notifications", "unread-count"],
    queryFn: () => memberListNotifications({ unread_only: true, limit: 1 }),
    refetchInterval: 60_000,
  });

  const unreadCount: number = (data as any)?.data?.unread_count ?? 0;

  function handleBellClick() {
    router.push("/member/notifications");
  }

  return (
    <AppShell
      portal="member"
      title="Member Portal"
      unreadCount={unreadCount}
      onBellClick={handleBellClick}
    >
      {children}
    </AppShell>
  );
}
