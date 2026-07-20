"use client";

import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import PageHeader from "@/components/ui/PageHeader";
import {
  adminListNotifications,
  adminMarkNotificationRead,
  adminMarkAllNotificationsRead,
  adminDeleteNotification,
} from "@/imports/core/api";

interface Notification {
  id: string;
  title: string;
  message?: string;
  body?: string;
  is_read: boolean;
  created_at: string;
}

// ─── Styled ───────────────────────────────────────────────────────────────────

const Toolbar = styled.div`
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  margin-bottom: 16px;
`;

const SearchInput = styled.input`
  height: 36px; padding: 0 12px 0 32px; border-radius: 999px;
  border: 1px solid #e8eaf0; font-size: 13px; outline: none; background: #f8f9fb; width: 260px;
  &:focus { border-color: #2563eb; }
`;

const SearchWrap = styled.div`position: relative;`;

const SearchIcon = styled.span`
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  color: #94a3b8; pointer-events: none; display: flex;
`;

const FilterBtn = styled.button<{ $active: boolean }>`
  height: 36px; padding: 0 14px; border-radius: 999px;
  border: 1px solid ${p => p.$active ? '#2563eb' : '#e8eaf0'};
  background: ${p => p.$active ? '#eff6ff' : '#fff'};
  color: ${p => p.$active ? '#2563eb' : '#374151'};
  font-size: 13px; font-weight: ${p => p.$active ? 600 : 400};
  cursor: pointer; transition: all 0.12s;
  &:hover { border-color: #2563eb; color: #2563eb; }
`;

const TableScroll = styled.div`width: 100%; overflow-x: auto;`;
const Table = styled.table`width: 100%; min-width: 640px; border-collapse: collapse; font-size: 13.5px;`;
const Th = styled.th`
  padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; background: #f8f9fb;
  border-bottom: 1px solid #e8eaf0;
`;
const Td = styled.td<{ $unread?: boolean }>`
  padding: 12px 16px; border-top: 1px solid #f1f2f6; vertical-align: middle;
  background: ${p => p.$unread ? '#eff6ff' : 'transparent'};
  font-weight: ${p => p.$unread ? 600 : 400};
`;

const ReadBadge = styled.span<{ $read: boolean }>`
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11.5px; font-weight: 600; padding: 3px 10px; border-radius: 999px;
  background: ${p => p.$read ? '#f0fdf4' : '#fef2f2'};
  color: ${p => p.$read ? '#16a34a' : '#b91c1c'};
`;

const MemberName = styled.div`
  font-weight: 700; font-size: 13px; color: #0f172a;
`;

const MsgPreview = styled.div`
  font-size: 12px; color: #64748b; margin-top: 2px;
  max-width: 340px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  cursor: default;
`;

const TooltipBox = styled.div<{ $x: number; $y: number }>`
  position: fixed;
  top: ${p => p.$y + 6}px;
  left: ${p => p.$x}px;
  z-index: 9999;
  background: #1e293b; color: #f8fafc; font-size: 12px; line-height: 1.6;
  padding: 8px 12px; border-radius: 8px; max-width: 340px; white-space: normal;
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
  pointer-events: none;
`;

const ActionBtns = styled.div`display: flex; gap: 6px;`;

const SmBtn = styled.button<{ $variant: 'info' | 'danger' }>`
  height: 30px; padding: 0 12px; border-radius: 7px; border: none;
  cursor: pointer; font-size: 12px; font-weight: 600;
  background: ${p => p.$variant === 'info' ? '#eff6ff' : '#fef2f2'};
  color: ${p => p.$variant === 'info' ? '#2563eb' : '#b91c1c'};
  &:hover { opacity: 0.85; }
`;

const Card = styled.div`
  background: #fff; border: 1px solid #e8eaf0; border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06); overflow: hidden;
`;

const EmptyMsg = styled.div`
  padding: 40px; text-align: center; color: #94a3b8; font-size: 14px;
`;

const CountLabel = styled.span`
  font-size: 12px; color: #64748b; margin-left: auto;
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: () => adminListNotifications({ limit: 200 }),
  });

  const allItems: Notification[] = data?.data?.data ?? [];

  const items = useMemo(() => {
    let list = allItems;
    if (readFilter === "unread") list = list.filter(n => !n.is_read);
    if (readFilter === "read")   list = list.filter(n => n.is_read);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(n =>
        (n.body ?? n.message ?? "").toLowerCase().includes(q) ||
        n.title.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allItems, search, readFilter]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => adminMarkNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      toast.success("Marked as read");
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => adminMarkAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      toast.success("All marked as read");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
      toast.success("Notification deleted");
    },
  });

  const unreadCount = allItems.filter(n => !n.is_read).length;

  const extractName = (n: Notification) => {
    const msg = n.body ?? n.message ?? "";
    const match = msg.match(/^(.+?)\s+(?:via\s|uploaded)/i);
    return match ? match[1].trim() : null;
  };

  const formatMsg = (n: Notification) => {
    const msg = n.body ?? n.message ?? "";
    // "Shubham Jain via Apex Health Advisors uploaded a Health policy."
    // → "Uploaded Health policy · Apex Health Advisors"
    const m = msg.match(/via\s+(.+?)\s+uploaded\s+a\s+(.+?)\s+policy/i);
    if (m) return `Uploaded ${m[2]} policy · ${m[1]}`;
    // fallback: strip name from start
    const stripped = msg.replace(/^.+?\s+(?:via\s+|uploaded)/i, "").replace(/^\s*/, "");
    return stripped || msg;
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="View and manage admin notifications"
        actions={
          <Button
            label="Mark All Read"
            icon="pi pi-check-square"
            severity="secondary"
            onClick={() => markAllReadMutation.mutate()}
            loading={markAllReadMutation.isPending}
            disabled={unreadCount === 0}
          />
        }
      />

      <Toolbar>
        <SearchWrap>
          <SearchIcon>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx={11} cy={11} r={7} /><path d="M21 21l-4-4" />
            </svg>
          </SearchIcon>
          <SearchInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or title…"
          />
        </SearchWrap>

        <FilterBtn $active={readFilter === "all"}    onClick={() => setReadFilter("all")}>All</FilterBtn>
        <FilterBtn $active={readFilter === "unread"} onClick={() => setReadFilter("unread")}>
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </FilterBtn>
        <FilterBtn $active={readFilter === "read"}   onClick={() => setReadFilter("read")}>Read</FilterBtn>

        <CountLabel>{items.length} notification{items.length !== 1 ? "s" : ""}</CountLabel>
      </Toolbar>

      <Card>
        <TableScroll>
        <Table>
          <thead>
            <tr>
              <Th>Title</Th>
              <Th>Message</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><Td colSpan={5} style={{ textAlign: "center", color: "#94a3b8" }}>Loading…</Td></tr>
            ) : items.length === 0 ? (
              <tr><Td colSpan={5}><EmptyMsg>No notifications found.</EmptyMsg></Td></tr>
            ) : items.map(row => {
              const name = extractName(row);
              const fullMsg = row.body ?? row.message ?? "—";
              const displayMsg = formatMsg(row);
              return (
              <tr key={row.id}>
                <Td $unread={!row.is_read} style={{ maxWidth: 260 }}>{row.title}</Td>
                <Td $unread={!row.is_read}>
                  {name && <MemberName>{name}</MemberName>}
                  <MsgPreview
                    onMouseEnter={e => {
                      const r = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({ text: fullMsg, x: r.left, y: r.bottom });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    {displayMsg}
                  </MsgPreview>
                </Td>
                <Td $unread={!row.is_read}>
                  <ReadBadge $read={row.is_read}>{row.is_read ? "Read" : "Unread"}</ReadBadge>
                </Td>
                <Td $unread={!row.is_read} style={{ whiteSpace: "nowrap", color: "#64748b", fontSize: 12.5 }}>
                  {dayjs(row.created_at).format("DD MMM YYYY HH:mm")}
                </Td>
                <Td $unread={!row.is_read}>
                  <ActionBtns>
                    {!row.is_read && (
                      <SmBtn $variant="info" onClick={() => markReadMutation.mutate(row.id)}>
                        Mark Read
                      </SmBtn>
                    )}
                    <SmBtn $variant="danger" onClick={() => deleteMutation.mutate(row.id)}>
                      Delete
                    </SmBtn>
                  </ActionBtns>
                </Td>
              </tr>
              );
            })}
          </tbody>
        </Table>
        </TableScroll>
      </Card>

      {tooltip && (
        <TooltipBox $x={tooltip.x} $y={tooltip.y}>{tooltip.text}</TooltipBox>
      )}
    </>
  );
}
