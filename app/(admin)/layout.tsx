"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/AppShell";
import { adminListNotifications } from "@/imports/core/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["admin", "notifications", "unread"],
    queryFn: () => adminListNotifications({ unread_only: true, limit: 1 }),
    refetchInterval: 60_000,
  });

  const unreadCount: number = data?.data?.total ?? 0;

  const handleBellClick = () => {
    router.push("/admin/notifications");
  };

  return (
    <AppShell
      portal="admin"
      title="Admin Portal"
      unreadCount={unreadCount}
      onBellClick={handleBellClick}
    >
      {children}
    </AppShell>
  );
}
