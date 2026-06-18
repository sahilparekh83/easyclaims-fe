"use client";

import { useState, useEffect } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import { Eye, Download, FileSearch, Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  partnerListPolicies,
  partnerViewPolicyPdf,
  partnerDownloadPolicyPdf,
} from "@/imports/core/api";

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageWrap = styled.div`
  max-width: 1240px;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e0e6ec;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  overflow: hidden;
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 18px 0;
  border-bottom: 1px solid #e0e6ec;
`;

const TabBar = styled.div`
  display: flex;
  gap: 0;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  border-bottom: 2px solid ${p => p.$active ? "#0050b0" : "transparent"};
  color: ${p => p.$active ? "#0050b0" : "#6b7a8c"};
  font-size: 13.5px;
  font-weight: ${p => p.$active ? 700 : 500};
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  padding: 10px 16px 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  &:hover { color: #161d26; }
`;

const TopActions = styled.div`
  display: flex;
  gap: 10px;
  padding-bottom: 8px;
  align-items: center;
`;

const SearchWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  height: 34px;
  border: 1px solid #e0e6ec;
  border-radius: 8px;
  padding: 0 12px 0 34px;
  font-size: 13px;
  color: #161d26;
  outline: none;
  width: 220px;
  background: #f7f9fb;
  &:focus { border-color: #0050b0; background: #fff; }
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 10px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  pointer-events: none;
`;

const UploadBtn = styled.button`
  height: 34px;
  background: #0050b0;
  color: #fff;
  border: none;
  border-radius: 9px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover { background: #0046a0; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
`;

const Th = styled.th`
  padding: 11px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7a8c;
  background: #f7f9fb;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  white-space: nowrap;
`;

const Tr = styled.tr`
  border-top: 1px solid #f1f2f6;
  &:hover { background: #f7f9fb; }
`;

const Td = styled.td`
  padding: 12px 16px;
  vertical-align: middle;
  color: #3a4756;
`;

const MonoText = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 12px;
  color: #6b7a8c;
`;

const MemberName = styled.div`
  font-weight: 600;
  color: #161d26;
  font-size: 13.5px;
`;

const MemberEmail = styled.div`
  font-size: 12px;
  color: #6b7a8c;
  margin-top: 2px;
`;

const TypeBadge = styled.span<{ $type: string }>`
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 999px;
  padding: 3px 10px;
  white-space: nowrap;
  background: ${p =>
    p.$type === "Health" ? "#eff6ff" :
    p.$type === "Motor" ? "#f3f4f6" :
    p.$type === "Life" ? "#faf5ff" : "#f3f4f6"};
  color: ${p =>
    p.$type === "Health" ? "#1d4ed8" :
    p.$type === "Motor" ? "#374151" :
    p.$type === "Life" ? "#7c3aed" : "#374151"};
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 999px;
  padding: 3px 10px;
  white-space: nowrap;
  background: ${p =>
    p.$status === "Active" ? "#f0fdf4" :
    p.$status === "Expired" ? "#fffbeb" :
    p.$status === "Cancelled" ? "#fef2f2" : "#f3f4f6"};
  color: ${p =>
    p.$status === "Active" ? "#16a34a" :
    p.$status === "Expired" ? "#b45309" :
    p.$status === "Cancelled" ? "#dc2626" : "#6b7280"};
`;

const ActionBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 6px;
  color: #6b7a8c;
  display: flex;
  align-items: center;
  &:hover { background: #f1f5f9; color: #161d26; }
`;

const EmptyRow = styled.tr`
  td { padding: 48px 16px; text-align: center; color: #9ca3af; font-size: 13.5px; }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-top: 1px solid #f1f2f6;
  font-size: 13px;
  color: #6b7a8c;
`;

const PagBtn = styled.button`
  background: none;
  border: 1px solid #e0e6ec;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #3a4756;
  cursor: pointer;
  &:hover:not(:disabled) { background: #f1f5f9; }
  &:disabled { opacity: 0.4; cursor: default; }
`;

const KVTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; }
  td:first-child { font-weight: 600; color: #6b7a8c; width: 45%; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }
  td:last-child { color: #161d26; }
  tr:last-child td { border-bottom: none; }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

type TabFilter = "all" | "active" | "expired";
const ROWS = 20;

// ─── PDF helpers ──────────────────────────────────────────────────────────────

async function openPdf(policyId: string) {
  try {
    const blob = await partnerViewPolicyPdf(policyId);
    const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch {
    toast.error("Could not load PDF");
  }
}

async function downloadPdf(policyId: string, fileName?: string) {
  try {
    const blob = await partnerDownloadPolicyPdf(policyId);
    const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "policy.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5_000);
  } catch {
    toast.error("Could not download PDF");
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PoliciesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState<TabFilter>("all");
  const [detailPolicy, setDetailPolicy] = useState<any>(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { setPage(0); }, [debouncedSearch, tab]);

  const { data, isLoading } = useQuery({
    queryKey: ["partner", "policies", debouncedSearch, page],
    queryFn: () =>
      partnerListPolicies({
        global_filter: debouncedSearch || undefined,
        sort_field: "created_at",
        sort_order: -1,
        limit: ROWS,
        skip: page * ROWS,
      }),
  });

  const grouped: any[] = (data as any)?.data?.data ?? [];
  const total: number = (data as any)?.data?.total ?? 0;
  const totalPages = Math.ceil(total / ROWS);

  const allPolicies = grouped.flatMap((g: any) =>
    (g.policies ?? []).map((p: any) => ({
      ...p,
      member_name: g.member_name,
      member_email: g.member_email,
      member_id: g.member_id,
    }))
  );

  const policies = allPolicies.filter(p => {
    if (tab === "active") return p.status === "Active";
    if (tab === "expired") return p.status === "Expired";
    return true;
  });

  const TABS: { key: TabFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "expired", label: "Expired" },
  ];

  return (
    <PageWrap>
      <Card>
        <CardTop>
          <TabBar>
            {TABS.map(t => (
              <Tab key={t.key} $active={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label}
              </Tab>
            ))}
          </TabBar>
          <TopActions>
            <SearchWrap>
              <SearchIcon><Search size={13} /></SearchIcon>
              <SearchInput
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search policies…"
              />
            </SearchWrap>
            <UploadBtn>
              + Upload policy
            </UploadBtn>
          </TopActions>
        </CardTop>

        <Table>
          <thead>
            <tr>
              <Th>Policy ID</Th>
              <Th>Member</Th>
              <Th>Type</Th>
              <Th>Insurer</Th>
              <Th>Sum Insured</Th>
              <Th>Period</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <EmptyRow><td colSpan={8}>Loading…</td></EmptyRow>
            ) : policies.length === 0 ? (
              <EmptyRow><td colSpan={8}>No policies found.</td></EmptyRow>
            ) : policies.map((row: any) => (
              <Tr key={row.id}>
                <Td>
                  <MonoText>{row.policy_number || row.id?.slice(-8)?.toUpperCase() || "—"}</MonoText>
                </Td>
                <Td>
                  <MemberName>{row.member_name || "—"}</MemberName>
                  {row.member_email && <MemberEmail>{row.member_email}</MemberEmail>}
                </Td>
                <Td>
                  {row.policy_type
                    ? <TypeBadge $type={row.policy_type}>{row.policy_type}</TypeBadge>
                    : <span style={{ color: "#9ca3af" }}>—</span>}
                </Td>
                <Td>{row.insurer || <span style={{ color: "#9ca3af" }}>—</span>}</Td>
                <Td>
                  {row.sum_insured != null
                    ? <MonoText style={{ color: "#161d26", fontWeight: 600 }}>₹{Number(row.sum_insured).toLocaleString("en-IN")}</MonoText>
                    : <span style={{ color: "#9ca3af" }}>—</span>}
                </Td>
                <Td>
                  {row.start_date || row.end_date
                    ? <MonoText>
                        {row.start_date ? dayjs(row.start_date).format("DD MMM YY") : "—"}
                        {" – "}
                        {row.end_date ? dayjs(row.end_date).format("DD MMM YY") : "—"}
                      </MonoText>
                    : <span style={{ color: "#9ca3af" }}>—</span>}
                </Td>
                <Td>
                  {row.status
                    ? <StatusBadge $status={row.status}>{row.status}</StatusBadge>
                    : <span style={{ color: "#9ca3af" }}>—</span>}
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {row.has_file ? (
                      <>
                        <ActionBtn title="View PDF" onClick={() => openPdf(row.id)}>
                          <Eye size={15} />
                        </ActionBtn>
                        <ActionBtn title="Download PDF" onClick={() => downloadPdf(row.id, row.file_name)}>
                          <Download size={15} />
                        </ActionBtn>
                      </>
                    ) : (
                      <span style={{ color: "#d1d5db", fontSize: 12 }}>No file</span>
                    )}
                    <ActionBtn title="Extracted Details" onClick={() => setDetailPolicy(row)}>
                      <FileSearch size={15} />
                    </ActionBtn>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>

        {total > ROWS && (
          <Pagination>
            <span>
              Showing {page * ROWS + 1}–{Math.min((page + 1) * ROWS, total)} of {total.toLocaleString("en-IN")}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <PagBtn disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</PagBtn>
              <PagBtn disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</PagBtn>
            </div>
          </Pagination>
        )}
      </Card>

      {/* Extracted Details Dialog */}
      <Dialog
        visible={!!detailPolicy}
        onHide={() => setDetailPolicy(null)}
        header={`Extracted Details — ${detailPolicy?.policy_number ?? ""}`}
        style={{ width: "520px" }}
        modal
        draggable={false}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button label="Close" severity="secondary" text onClick={() => setDetailPolicy(null)} />
          </div>
        }
      >
        {Object.keys(detailPolicy?.extracted_fields ?? {}).length > 0 ? (
          <KVTable>
            <tbody>
              {Object.entries(detailPolicy?.extracted_fields ?? {}).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </KVTable>
        ) : (
          <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
            No extracted data available for this policy.
          </p>
        )}
      </Dialog>
    </PageWrap>
  );
}
