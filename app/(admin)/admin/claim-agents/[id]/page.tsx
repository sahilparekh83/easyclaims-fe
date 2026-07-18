"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { adminGetClaimAgentOverview, adminListClaims } from "@/imports/core/api";

interface ClaimRow {
  id: string;
  claim_number: string;
  member_id: string;
  member_name: string | null;
  policy_number: string | null;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
];

function titleCase(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

const ROWS = 20;

export default function ClaimAgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);

  const { data: agentData, isLoading: agentLoading } = useQuery({
    queryKey: ["admin", "claim-agent-overview", agentId],
    queryFn: () => adminGetClaimAgentOverview(agentId),
  });
  const agent = agentData?.data;

  const { data: claimsData, isLoading: claimsLoading } = useQuery({
    queryKey: ["admin", "claim-agent-claims", agentId, status, page],
    queryFn: () => adminListClaims({
      assigned_agent_id: agentId, skip: page * ROWS, limit: ROWS,
      status: status || undefined,
    }),
    enabled: !!agentId,
  });
  const claims: ClaimRow[] = claimsData?.data?.data ?? [];
  const total: number = claimsData?.data?.total ?? 0;

  if (agentLoading) return <div style={{ padding: "2rem", color: "#6b7280" }}>Loading agent…</div>;
  if (!agent) return <div style={{ padding: "2rem", color: "#ef4444" }}>Claim agent not found.</div>;

  const openMemberInNewTab = (e: React.MouseEvent, memberId: string) => {
    e.stopPropagation();
    window.open(`/admin/members/${memberId}`, "_blank", "noopener,noreferrer");
  };

  const memberBody = (row: ClaimRow) => row.member_id ? (
    <span
      style={{ color: "#0050b0", cursor: "pointer", fontWeight: 600 }}
      onClick={(e) => openMemberInNewTab(e, row.member_id)}
    >
      {row.member_name || "Member"}
    </span>
  ) : (row.member_name || "—");

  const statusBody = (row: ClaimRow) => <StatusBadge value={titleCase(row.status)} />;
  const dateBody = (row: ClaimRow) => dayjs(row.created_at).format("DD MMM YYYY");

  const statuses = ["pending", "processing", "accepted", "rejected"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7a8c" }}>
        <span style={{ cursor: "pointer" }} onClick={() => router.push("/admin/claim-agents")}>Claim Agents</span>
        <ChevronRight size={13} />
        <span style={{ color: "#161d26", fontWeight: 600 }}>{agent.name}</span>
      </div>

      <PageHeader
        title={agent.name}
        subtitle={agent.email}
        actions={<StatusBadge value={agent.is_active} trueLabel="Active" falseLabel="Deactivated" />}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
        <InfoTile label="Total Claims" value={agent.total_claims} />
        {statuses.map(s => (
          <InfoTile key={s} label={titleCase(s)} value={agent.status_counts[s] ?? 0} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <Dropdown
          value={status}
          onChange={e => { setStatus(e.value); setPage(0); }}
          options={STATUS_OPTIONS}
          style={{ width: 220 }}
        />
      </div>

      <DataTable
        value={claims}
        loading={claimsLoading}
        paginator
        rows={ROWS}
        totalRecords={total}
        lazy
        first={page * ROWS}
        onPage={e => setPage(e.page ?? 0)}
        emptyMessage="No claims assigned to this agent"
        onRowClick={e => {
          const row = e.data as ClaimRow;
          router.push(`/admin/claim-tickets/${row.id}?agent_id=${agentId}&agent_name=${encodeURIComponent(agent.name)}`);
        }}
        rowHover
        style={{ cursor: "pointer" }}
        dataKey="id"
      >
        <Column field="claim_number" header="Claim #" sortable style={{ fontFamily: "monospace" }} />
        <Column header="Member" body={memberBody} />
        <Column field="policy_number" header="Policy" />
        <Column header="Status" body={statusBody} />
        <Column header="Created" body={dateBody} sortable sortField="created_at" />
      </DataTable>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e8eaf0", borderRadius: 12, padding: "12px 14px",
    }}>
      <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.04em", color: "#9ca3af", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#161d26" }}>{value}</div>
    </div>
  );
}
