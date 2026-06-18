"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  partnerListNotifications,
  partnerMarkNotificationRead,
  partnerMarkAllNotificationsRead,
  partnerDeleteNotification,
} from "@/imports/core/api";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import { Bell, Trash2 } from "lucide-react";

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  max-width: 720px;
`;

const PageTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const PageTitle = styled.h1`
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 19px;
  font-weight: 800;
  color: #161d26;
  letter-spacing: -0.01em;
  margin: 0;
`;

const MarkAllBtn = styled.button`
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #e0e6ec;
  background: #fff;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #3a4756;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover:not(:disabled) { background: #f7f9fb; }
  &:disabled { opacity: 0.45; cursor: default; }
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e0e6ec;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  overflow: hidden;
`;

const NotifRow = styled.div<{ $unread: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 20px;
  border-top: 1px solid #e0e6ec;
  background: ${p => p.$unread ? '#f7fbff' : '#fff'};
  transition: background 0.1s;
  &:first-child { border-top: none; }
  &:hover { background: #f7f9fb; }
`;

const TypeDot = styled.span<{ $color: string }>`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${p => p.$color};
  flex-shrink: 0;
  margin-top: 6px;
`;

const NotifBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotifTitle = styled.div`
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #161d26;
  margin-bottom: 2px;
`;

const NotifMessage = styled.div`
  font-size: 13px;
  color: #6b7a8c;
  line-height: 1.5;
  margin-bottom: 4px;
`;

const NotifTime = styled.div`
  font-size: 11px;
  color: #6b7a8c;
`;

const NotifRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const UnreadDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0050b0;
  flex-shrink: 0;
`;

const MarkReadBtn = styled.button`
  height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid #e0e6ec;
  background: #fff;
  font-size: 11.5px;
  font-weight: 600;
  color: #3a4756;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #f7f9fb; color: #0050b0; border-color: #0050b0; }
`;

const DeleteBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e0e6ec;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  &:hover { color: #dc2626; border-color: #fecaca; background: #fef2f2; }
`;

const EmptyState = styled.div`
  padding: 60px 24px;
  text-align: center;
  color: #6b7a8c;
`;

const EmptyIcon = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #f7f9fb;
  border: 1px solid #e0e6ec;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
`;

const SkeletonRow = styled.div`
  padding: 14px 20px;
  border-top: 1px solid #e0e6ec;
  display: flex;
  gap: 12px;
  align-items: center;
  &:first-child { border-top: none; }
`;

const Skel = styled.div<{ $w?: string }>`
  height: 14px;
  border-radius: 4px;
  width: ${p => p.$w || "100%"};
  background: linear-gradient(90deg, #e0e6ec 25%, #f7f9fb 50%, #e0e6ec 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type?: string;
}

function dotColor(type?: string): string {
  if (!type) return "#6b7a8c";
  const t = type.toLowerCase();
  if (t.includes("alert") || t.includes("warn") || t.includes("expir")) return "#e0a526";
  if (t.includes("success") || t.includes("renew") || t.includes("activ")) return "#65a147";
  return "#0050b0";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PartnerNotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["partner", "notifications"],
    queryFn: () => partnerListNotifications({ sort_order: -1, limit: 50 }),
  });

  const rawData = (data as any)?.data;
  const notifications: Notification[] = Array.isArray(rawData)
    ? rawData
    : (rawData?.data ?? []);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["partner", "notifications"] });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => partnerMarkNotificationRead(id),
    onSuccess: invalidate,
    onError: () => toast.error("Failed to mark as read"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => partnerDeleteNotification(id),
    onSuccess: () => { toast.success("Notification deleted"); invalidate(); },
    onError: () => toast.error("Failed to delete notification"),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => partnerMarkAllNotificationsRead(),
    onSuccess: () => { toast.success("All notifications marked as read"); invalidate(); },
    onError: () => toast.error("Failed to mark all as read"),
  });

  const hasUnread = notifications.some(n => !n.is_read);

  return (
    <Page>
      <PageTop>
        <PageTitle>Notifications</PageTitle>
        <MarkAllBtn
          disabled={!hasUnread || isLoading || markAllReadMutation.isPending}
          onClick={() => markAllReadMutation.mutate()}
        >
          <i className="pi pi-check-square" style={{ fontSize: 13 }} />
          {markAllReadMutation.isPending ? "Marking…" : "Mark all read"}
        </MarkAllBtn>
      </PageTop>

      <Card>
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <SkeletonRow key={i}>
                <Skel $w="9px" style={{ borderRadius: "50%", height: 9, flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Skel $w="55%" />
                  <Skel $w="80%" style={{ height: 11 }} />
                </div>
              </SkeletonRow>
            ))}
          </>
        ) : notifications.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <Bell size={22} color="#6b7a8c" />
            </EmptyIcon>
            <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: "#161d26", marginBottom: 6 }}>
              No notifications yet
            </div>
            <div style={{ fontSize: 13 }}>You're all caught up!</div>
          </EmptyState>
        ) : (
          notifications.map(notif => (
            <NotifRow key={notif.id} $unread={!notif.is_read}>
              <TypeDot $color={dotColor(notif.type)} />
              <NotifBody>
                <NotifTitle>{notif.title}</NotifTitle>
                {notif.message && <NotifMessage>{notif.message}</NotifMessage>}
                <NotifTime>{dayjs(notif.created_at).format("DD MMM YYYY · HH:mm")}</NotifTime>
              </NotifBody>
              <NotifRight>
                {!notif.is_read && <UnreadDot />}
                {!notif.is_read && (
                  <MarkReadBtn
                    onClick={() => markReadMutation.mutate(notif.id)}
                    disabled={markReadMutation.isPending && (markReadMutation.variables as string) === notif.id}
                  >
                    Mark read
                  </MarkReadBtn>
                )}
                <DeleteBtn
                  onClick={() => deleteMutation.mutate(notif.id)}
                  disabled={deleteMutation.isPending && (deleteMutation.variables as string) === notif.id}
                >
                  <Trash2 size={13} />
                </DeleteBtn>
              </NotifRight>
            </NotifRow>
          ))
        )}
      </Card>
    </Page>
  );
}
