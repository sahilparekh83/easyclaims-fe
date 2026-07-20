"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import dayjs from "dayjs";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import AssignClaimAgentDialog from "@/components/ui/AssignClaimAgentDialog";
import { useAuthStore } from "@/stores/AuthStore";
import { useDebounce } from "@/hooks/useDebounce";
import { adminListClaims } from "@/imports/core/api";

interface ClaimRow {
  id: string;
  claim_number: string;
  member_name: string | null;
  policy_number: string | null;
  status: string;
  claimed_amount: number | null;
  assigned_agent_name: string | null;
  created_at: string;
}

const IN_PROGRESS_SUB_OPTIONS = [
  { label: "All (Pending + Processing)", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
];

const TABS: { key: "in_progress" | "accepted" | "rejected"; label: string }[] = [
  { key: "in_progress", label: "In Progress" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
];

function titleCase(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

const ROWS = 20;

export default function ClaimTicketsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const isSuperadmin = useAuthStore(s => s.isSuperadmin);
  const initialTab = (searchParams.get("tab") as "in_progress" | "accepted" | "rejected") || "in_progress";
  const initialStatus = searchParams.get("status") ?? "";
  const [activeTab, setActiveTab] = useState<"in_progress" | "accepted" | "rejected">(initialTab);
  const [inProgressSubStatus, setInProgressSubStatus] = useState(initialStatus);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [dateRange, setDateRange] = useState<Date[] | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ClaimRow[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);

  const dateFrom = dateRange?.[0] ? dayjs(dateRange[0]).startOf("day").toISOString() : undefined;
  const dateTo = dateRange?.[1] ? dayjs(dateRange[1]).endOf("day").toISOString() : undefined;

  const changeTab = (tab: "in_progress" | "accepted" | "rejected") => {
    setActiveTab(tab);
    setPage(0);
    setSelected([]);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "claims", activeTab, inProgressSubStatus, debouncedSearch, dateFrom, dateTo, page],
    queryFn: () => adminListClaims({
      skip: page * ROWS, limit: ROWS,
      ...(activeTab === "in_progress"
        ? (inProgressSubStatus ? { status: inProgressSubStatus } : { statuses: ["pending", "processing"] })
        : { status: activeTab }),
      search: debouncedSearch || undefined,
      date_from: dateFrom, date_to: dateTo,
    }),
  });

  const claims: ClaimRow[] = data?.data?.data ?? [];
  const total: number = data?.data?.total ?? 0;

  const statusBody = (row: ClaimRow) => <StatusBadge value={titleCase(row.status)} />;
  const amountBody = (row: ClaimRow) => row.claimed_amount ? `₹${Number(row.claimed_amount).toLocaleString("en-IN")}` : "—";
  const dateBody = (row: ClaimRow) => dayjs(row.created_at).format("DD MMM YYYY");
  const agentBody = (row: ClaimRow) => row.assigned_agent_name || <span style={{ color: "#9ca3af" }}>Unassigned</span>;

  return (
    <>
      <PageHeader
        title="Claim Tickets"
        subtitle="Every policy claim filed by members, auto-assigned to your claims team."
        actions={isSuperadmin && activeTab === "in_progress" && selected.length > 0 ? (
          <Button label={`Assign Claim Agent (${selected.length})`} icon="pi pi-user-plus" onClick={() => setAssignOpen(true)} />
        ) : undefined}
      />

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e5e9f0", marginBottom: 16 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => changeTab(t.key)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "10px 16px", fontSize: 13.5, fontWeight: 600,
              color: activeTab === t.key ? "#0050b0" : "#6b7a8c",
              borderBottom: activeTab === t.key ? "2px solid #0050b0" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <span className="p-input-icon-left" style={{ position: "relative" }}>
          <InputText
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by claim number…"
            style={{ width: 220 }}
          />
        </span>
        {activeTab === "in_progress" && (
          <Dropdown
            value={inProgressSubStatus}
            onChange={e => { setInProgressSubStatus(e.value); setPage(0); }}
            options={IN_PROGRESS_SUB_OPTIONS}
            style={{ width: 220 }}
          />
        )}
        <Calendar
          value={dateRange as any}
          onChange={e => { setDateRange(e.value as Date[]); setPage(0); }}
          selectionMode="range"
          readOnlyInput
          placeholder="Filter by date range"
          showButtonBar
          style={{ width: 260 }}
        />
      </div>

      <DataTable
        value={claims}
        loading={isLoading}
        paginator
        rows={ROWS}
        totalRecords={total}
        lazy
        first={page * ROWS}
        onPage={e => setPage((e.page ?? 0))}
        emptyMessage="No claims found"
        onRowClick={e => router.push(`/admin/claim-tickets/${(e.data as ClaimRow).id}`)}
        rowHover
        style={{ cursor: "pointer" }}
        selection={isSuperadmin && activeTab === "in_progress" ? selected : undefined}
        onSelectionChange={isSuperadmin && activeTab === "in_progress" ? (e: any) => setSelected(e.value) : undefined}
        dataKey="id"
      >
        {isSuperadmin && activeTab === "in_progress" && <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />}
        <Column field="claim_number" header="Claim #" sortable style={{ fontFamily: "monospace" }} />
        <Column field="member_name" header="Member" />
        <Column field="policy_number" header="Policy" />
        <Column header="Claimed Amount" body={amountBody} />
        <Column header="Status" body={statusBody} />
        <Column header="Assigned Agent" body={agentBody} />
        <Column header="Submitted" body={dateBody} sortable sortField="created_at" />
      </DataTable>

      <AssignClaimAgentDialog
        visible={assignOpen}
        claimIds={selected.map(c => c.id)}
        onHide={() => setAssignOpen(false)}
        onAssigned={() => {
          setAssignOpen(false);
          setSelected([]);
          queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
        }}
      />
    </>
  );
}
