"use client";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import { Bell } from "lucide-react";
import {
  memberListNotifications,
  memberMarkNotificationRead,
  memberMarkAllNotificationsRead,
  memberDeleteNotification,
} from "@/imports/core/api";

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageWrap = styled.div`max-width: 720px; display: flex; flex-direction: column; gap: 20px;`;

const PageHeader = styled.div`display: flex; align-items: center; justify-content: space-between;`;

const PageTitle = styled.h1`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 19px; font-weight: 800; color: #161d26; margin: 0;
`;

const GhostBtn = styled.button`
  background: none; border: 1px solid #e0e6ec; border-radius: 9px;
  padding: 8px 14px; font-size: 13px; font-weight: 600; color: #3a4756; cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  &:hover { background: #f1f5f9; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const Card = styled.div`
  background: #fff; border: 1px solid #e0e6ec; border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  overflow: hidden;
`;

const NotifRow = styled.div<{ $unread: boolean }>`
  display: flex; align-items: flex-start; gap: 13px;
  padding: 14px 20px; border-top: 1px solid #f1f3f6;
  background: ${p => p.$unread ? "#fafcff" : "#fff"};
  &:first-child { border-top: none; }
  &:hover { background: #f7f9fb; }
`;

const TypeDot = styled.div<{ $color: string }>`
  width: 9px; height: 9px; border-radius: 50%;
  background: ${p => p.$color}; flex: none; margin-top: 5px;
`;

const NotifTitle = styled.div<{ $unread: boolean }>`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px; font-weight: ${p => p.$unread ? 600 : 500};
  color: ${p => p.$unread ? "#161d26" : "#6b7a8c"};
`;

const NotifBody = styled.div`font-size: 13px; color: #6b7a8c; margin-top: 3px; line-height: 1.45;`;

const NotifTime = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 11px; color: #9ca3af; margin-top: 4px;
`;

const UnreadDot = styled.div`
  width: 8px; height: 8px; border-radius: 50%;
  background: #0050b0; flex: none; margin-top: 5px;
`;

const ActionBtn = styled.button<{ $accent?: boolean; $danger?: boolean }>`
  background: none; border: 1px solid #e0e6ec; border-radius: 7px;
  padding: 4px 9px; font-size: 12px; font-weight: 600; cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: ${p => p.$danger ? "#dc2626" : p.$accent ? "#0050b0" : "#6b7a8c"};
  white-space: nowrap;
  &:hover { background: #f1f5f9; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const EmptyState = styled.div`
  padding: 56px 20px; text-align: center;
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string; type: string; title: string; body?: string | null;
  is_read: boolean; created_at?: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  renewal: "#e0a526",
  alert: "#ef4444",
  info: "#0050b0",
  success: "#65a147",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemberNotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["member", "notifications"],
    queryFn: () => memberListNotifications({ skip: 0, limit: 50 }),
  });

  const notifications: Notification[] = (data as any)?.data?.data ?? [];
  const unreadCount: number = (data as any)?.data?.unread_count ?? 0;

  const markReadMutation = useMutation({
    mutationFn: memberMarkNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member", "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["member", "notifications", "unread-count"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: memberMarkAllNotificationsRead,
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["member", "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["member", "notifications", "unread-count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: memberDeleteNotification,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["member", "notifications"] }); },
    onError: () => toast.error("Failed to delete notification"),
  });

  return (
    <PageWrap>
      <PageHeader>
        <div>
          <PageTitle>Notifications</PageTitle>
          {unreadCount > 0 && (
            <div style={{ fontSize: 13, color: "#6b7a8c", marginTop: 2 }}>{unreadCount} unread</div>
          )}
        </div>
        {unreadCount > 0 && (
          <GhostBtn onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
            {markAllMutation.isPending ? "Marking…" : "Mark all read"}
          </GhostBtn>
        )}
      </PageHeader>

      <Card>
        {isLoading ? (
          <EmptyState><p style={{ color: "#6b7a8c" }}>Loading…</p></EmptyState>
        ) : notifications.length === 0 ? (
          <EmptyState>
            <Bell size={32} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: "#6b7a8c" }}>No notifications yet</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>You're all caught up</div>
          </EmptyState>
        ) : notifications.map(n => (
          <NotifRow key={n.id} $unread={!n.is_read}>
            <TypeDot $color={TYPE_COLORS[n.type?.toLowerCase()] ?? "#6b7a8c"} />
            <div style={{ flex: 1 }}>
              <NotifTitle $unread={!n.is_read}>{n.title}</NotifTitle>
              {n.body && <NotifBody>{n.body}</NotifBody>}
              <NotifTime>{n.created_at ? dayjs(n.created_at).format("DD MMM YYYY · HH:mm") : "—"}</NotifTime>
            </div>
            {!n.is_read && <UnreadDot />}
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              {!n.is_read && (
                <ActionBtn $accent disabled={markReadMutation.isPending} onClick={() => markReadMutation.mutate(n.id)}>
                  Mark read
                </ActionBtn>
              )}
              <ActionBtn $danger disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(n.id)}>
                <i className="pi pi-trash" style={{ fontSize: 11 }} />
              </ActionBtn>
            </div>
          </NotifRow>
        ))}
      </Card>
    </PageWrap>
  );
}
