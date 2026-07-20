"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListTickets, adminUpdateTicketStatus } from "@/imports/core/api";
import { toast } from "react-toastify";
import styled from "styled-components";
import dayjs from "dayjs";

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  max-width: 1100px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: #161d26;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: #6b7a8c;
  margin: 4px 0 0;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const FilterBtn = styled.button<{ $active: boolean }>`
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid ${p => p.$active ? "#0050b0" : "#e0e6ec"};
  background: ${p => p.$active ? "#eff6ff" : "#fff"};
  color: ${p => p.$active ? "#0050b0" : "#6b7a8c"};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover { border-color: #0050b0; color: #0050b0; }
`;

const TableScroll = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #e0e6ec;
  border-radius: 12px;
  overflow: hidden;
`;

const Th = styled.th`
  text-align: left;
  padding: 11px 14px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7a8c;
  background: #f7f9fb;
  border-bottom: 1px solid #e0e6ec;
`;

const Td = styled.td`
  padding: 12px 14px;
  font-size: 13px;
  color: #161d26;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
`;

const Tr = styled.tr`
  &:last-child td { border-bottom: none; }
  &:hover td { background: #f7f9fb; }
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  background: ${p =>
    p.$status === "open" ? "#fef9c3" :
    p.$status === "in_progress" ? "#dbeafe" :
    "#f0fdf4"};
  color: ${p =>
    p.$status === "open" ? "#854d0e" :
    p.$status === "in_progress" ? "#1d4ed8" :
    "#15803d"};
`;

const PriorityBadge = styled.span<{ $priority: string }>`
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  background: ${p => p.$priority === "high" ? "#fef2f2" : p.$priority === "medium" ? "#fff7ed" : "#f0fdf4"};
  color: ${p => p.$priority === "high" ? "#b91c1c" : p.$priority === "medium" ? "#c2410c" : "#15803d"};
`;

const DupBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  margin-left: 6px;
`;

const ActionSelect = styled.select`
  padding: 5px 10px;
  border: 1px solid #e0e6ec;
  border-radius: 8px;
  font-size: 12px;
  color: #161d26;
  cursor: pointer;
  background: #fff;
  &:focus { outline: none; border-color: #0050b0; }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: #9ca3af;
  font-size: 14px;
`;

const KpiRow = styled.div`
  display: flex;
  gap: 14px;
  margin-bottom: 20px;
`;

const KpiCard = styled.div`
  background: #fff;
  border: 1px solid #e0e6ec;
  border-radius: 12px;
  padding: 16px 22px;
  min-width: 120px;
`;

const KpiValue = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: #161d26;
`;

const KpiLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7a8c;
  margin-top: 2px;
`;

// ─── Component ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
];

export default function TicketsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "tickets", statusFilter],
    queryFn: () => adminListTickets({ status: statusFilter || undefined, limit: 100 }),
  });

  const tickets: any[] = data?.data?.data ?? [];
  const openCount: number = data?.data?.open_count ?? 0;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminUpdateTicketStatus(id, status),
    onSuccess: () => {
      toast.success("Ticket status updated");
      qc.invalidateQueries({ queryKey: ["admin", "tickets"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  const totalCount = tickets.length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved").length;

  return (
    <Page>
      <Header>
        <div>
          <Title>Tickets</Title>
          <Subtitle>AI-raised support tickets from Claim Assistant, WhatsApp &amp; Email.</Subtitle>
        </div>
      </Header>

      <KpiRow>
        <KpiCard>
          <KpiValue style={{ color: "#854d0e" }}>{openCount}</KpiValue>
          <KpiLabel>Open</KpiLabel>
        </KpiCard>
        <KpiCard>
          <KpiValue style={{ color: "#1d4ed8" }}>{inProgressCount}</KpiValue>
          <KpiLabel>In Progress</KpiLabel>
        </KpiCard>
        <KpiCard>
          <KpiValue style={{ color: "#15803d" }}>{resolvedCount}</KpiValue>
          <KpiLabel>Resolved</KpiLabel>
        </KpiCard>
        <KpiCard>
          <KpiValue>{totalCount}</KpiValue>
          <KpiLabel>Total</KpiLabel>
        </KpiCard>
      </KpiRow>

      <FilterRow>
        {STATUS_FILTERS.map(f => (
          <FilterBtn key={f.value} $active={statusFilter === f.value} onClick={() => setStatusFilter(f.value)}>
            {f.label}
          </FilterBtn>
        ))}
      </FilterRow>

      <TableScroll>
      <Table>
        <thead>
          <tr>
            <Th>Member</Th>
            <Th>Partner</Th>
            <Th>Category</Th>
            <Th>Priority</Th>
            <Th>Summary</Th>
            <Th>Channel</Th>
            <Th>Status</Th>
            <Th>Created</Th>
            <Th>Action</Th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><Td colSpan={9} style={{ textAlign: "center", color: "#9ca3af" }}>Loading…</Td></tr>
          ) : tickets.length === 0 ? (
            <tr>
              <Td colSpan={9}>
                <EmptyState>No tickets found.</EmptyState>
              </Td>
            </tr>
          ) : (
            tickets.map(t => (
              <Tr key={t.id}>
                <Td>
                  <div style={{ fontWeight: 600 }}>{t.member_name || "—"}</div>
                  <div style={{ fontSize: 11, color: "#6b7a8c" }}>{t.member_email || ""}</div>
                </Td>
                <Td style={{ fontSize: 12, color: "#6b7a8c" }}>{t.partner_name || "—"}</Td>
                <Td>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{t.category || "—"}</span>
                  {t.is_duplicate && <DupBadge>Duplicate</DupBadge>}
                </Td>
                <Td><PriorityBadge $priority={t.priority}>{t.priority || "—"}</PriorityBadge></Td>
                <Td style={{ maxWidth: 260, fontSize: 12 }}>{t.summary || "—"}</Td>
                <Td style={{ fontSize: 12, color: "#6b7a8c", textTransform: "capitalize" }}>{t.channel || "—"}</Td>
                <Td><StatusBadge $status={t.status}>{t.status?.replace("_", " ")}</StatusBadge></Td>
                <Td style={{ fontSize: 12, color: "#6b7a8c", whiteSpace: "nowrap" }}>
                  {t.created_at ? dayjs(t.created_at).format("DD MMM, HH:mm") : "—"}
                </Td>
                <Td>
                  <ActionSelect
                    value={t.status}
                    onChange={e => statusMutation.mutate({ id: t.id, status: e.target.value })}
                    disabled={statusMutation.isPending}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </ActionSelect>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
      </TableScroll>
    </Page>
  );
}
