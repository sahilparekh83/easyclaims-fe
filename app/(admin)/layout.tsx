"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/AppShell";
import { adminListNotifications, getMe } from "@/imports/core/api";
import { useAuthStore } from "@/stores/AuthStore";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard("/admin");
  const router = useRouter();
  const setPermissions = useAuthStore((s) => s.setPermissions);

  const { data: meData } = useQuery({
    queryKey: ["admin", "me"],
    queryFn: getMe,
    staleTime: 60_000,
  });

  useEffect(() => {
    const me = meData?.data;
    if (me) setPermissions(me.permissions ?? [], !!me.is_superadmin);
  }, [meData, setPermissions]);

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
