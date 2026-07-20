"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { adminListClaimAgentsOverview } from "@/imports/core/api";

interface AgentRow {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  total_claims: number;
  status_counts: Record<string, number>;
}

const ACTIVE_OPTIONS = [
  { label: "All agents", value: "all" },
  { label: "Active only", value: "active" },
];

const ROWS = 20;

export default function ClaimAgentsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<"all" | "active">("all");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "claim-agents-overview", activeFilter, page],
    queryFn: () => adminListClaimAgentsOverview({
      skip: page * ROWS, limit: ROWS,
      active_only: activeFilter === "active",
    }),
  });

  const agents: AgentRow[] = data?.data?.data ?? [];
  const total: number = data?.data?.total ?? 0;

  const statusBody = (row: AgentRow) => (
    <StatusBadge value={row.is_active} trueLabel="Active" falseLabel="Deactivated" />
  );
  const countBody = (status: string) => (row: AgentRow) => row.status_counts[status] ?? 0;

  return (
    <>
      <PageHeader
        title="Claim Agents"
        subtitle="Workload and status breakdown for everyone holding the Claims Agent role."
      />

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Dropdown
          value={activeFilter}
          onChange={e => { setActiveFilter(e.value); setPage(0); }}
          options={ACTIVE_OPTIONS}
          style={{ width: 200 }}
        />
      </div>

      <DataTable
        value={agents}
        loading={isLoading}
        paginator
        rows={ROWS}
        totalRecords={total}
        lazy
        first={page * ROWS}
        onPage={e => setPage(e.page ?? 0)}
        emptyMessage="No claim agents found"
        onRowClick={e => router.push(`/admin/claim-agents/${(e.data as AgentRow).id}`)}
        rowHover
        style={{ cursor: "pointer" }}
        dataKey="id"
      >
        <Column field="name" header="Agent" sortable />
        <Column field="email" header="Email" />
        <Column header="Status" body={statusBody} />
        <Column header="Pending" body={countBody("pending")} />
        <Column header="Processing" body={countBody("processing")} />
        <Column header="Accepted" body={countBody("accepted")} />
        <Column header="Rejected" body={countBody("rejected")} />
        <Column field="total_claims" header="Total Claims" sortable />
      </DataTable>
    </>
  );
}
