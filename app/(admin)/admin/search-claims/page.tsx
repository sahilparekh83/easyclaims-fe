"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import dayjs from "dayjs";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { useDebounce } from "@/hooks/useDebounce";
import { adminSearchAllClaims } from "@/imports/core/api";

interface ClaimRow {
  id: string;
  claim_number: string;
  member_name: string | null;
  member_email: string | null;
  policy_number: string | null;
  status: string;
  claimed_amount: number | null;
  assigned_agent_name: string | null;
  created_at: string;
}

function titleCase(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

const ROWS = 20;

export default function SearchClaimsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "claims", "search-all", debouncedSearch, page],
    queryFn: () => adminSearchAllClaims({ search: debouncedSearch, skip: page * ROWS, limit: ROWS }),
    enabled: debouncedSearch.trim().length > 0,
  });

  const claims: ClaimRow[] = data?.data?.data ?? [];
  const total: number = data?.data?.total ?? 0;

  const statusBody = (row: ClaimRow) => <StatusBadge value={titleCase(row.status)} />;
  const amountBody = (row: ClaimRow) => row.claimed_amount ? `₹${Number(row.claimed_amount).toLocaleString("en-IN")}` : "—";
  const dateBody = (row: ClaimRow) => dayjs(row.created_at).format("DD MMM YYYY");
  const agentBody = (row: ClaimRow) => row.assigned_agent_name || <span style={{ color: "#9ca3af" }}>Unassigned</span>;
  const memberBody = (row: ClaimRow) => (
    <div>
      <div>{row.member_name || "—"}</div>
      {row.member_email && <div style={{ fontSize: 12, color: "#6b7a8c" }}>{row.member_email}</div>}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Search Claims"
        subtitle="Look up any claim in the system by claim number, member name, or member code — across every agent's queue."
      />

      <div style={{ marginBottom: 16 }}>
        <span className="p-input-icon-left" style={{ position: "relative" }}>
          <InputText
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by claim number, member name, or member code…"
            style={{ width: 380 }}
            autoFocus
          />
        </span>
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
        emptyMessage={debouncedSearch.trim() ? "No matching claims found" : "Start typing to search claims"}
        onRowClick={e => router.push(`/admin/claim-tickets/${(e.data as ClaimRow).id}`)}
        rowHover
        style={{ cursor: "pointer" }}
        dataKey="id"
      >
        <Column field="claim_number" header="Claim #" style={{ fontFamily: "monospace" }} />
        <Column header="Member" body={memberBody} />
        <Column field="policy_number" header="Policy" />
        <Column header="Claimed Amount" body={amountBody} />
        <Column header="Status" body={statusBody} />
        <Column header="Assigned Agent" body={agentBody} />
        <Column header="Submitted" body={dateBody} />
      </DataTable>
    </>
  );
}
