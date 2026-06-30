"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import { Download, FileSearch, Search, AlertTriangle, Check, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  partnerListPolicies,
  partnerDownloadPolicyPdf,
} from "@/imports/core/api";

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageWrap = styled.div`max-width: 1240px;`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e0e6ec;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  overflow: hidden;
`;

const CardTop = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; padding: 10px 18px 0; border-bottom: 1px solid #e0e6ec;
`;

const TabBar = styled.div`display: flex; gap: 0;`;

const Tab = styled.button<{ $active: boolean }>`
  background: none; border: none;
  border-bottom: 2px solid ${p => p.$active ? "#0050b0" : "transparent"};
  color: ${p => p.$active ? "#0050b0" : "#6b7a8c"};
  font-size: 13.5px; font-weight: ${p => p.$active ? 700 : 500};
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  padding: 10px 16px 12px; cursor: pointer; transition: all 0.15s; white-space: nowrap;
  &:hover { color: #161d26; }
`;

const TopActions = styled.div`
  display: flex; gap: 10px; padding-bottom: 8px; align-items: center;
`;

const SearchWrap = styled.div`position: relative; display: flex; align-items: center;`;

const SearchInput = styled.input`
  height: 34px; border: 1px solid #e0e6ec; border-radius: 8px;
  padding: 0 12px 0 34px; font-size: 13px; color: #161d26;
  outline: none; width: 220px; background: #f7f9fb;
  &:focus { border-color: #0050b0; background: #fff; }
`;

const SearchIcon = styled.span`
  position: absolute; left: 10px; color: #94a3b8;
  display: flex; align-items: center; pointer-events: none;
`;

const Table = styled.table`width: 100%; border-collapse: collapse; font-size: 13.5px;`;

const Th = styled.th`
  padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em; color: #6b7a8c; background: #f7f9fb;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif; white-space: nowrap;
`;

const Tr = styled.tr`
  border-top: 1px solid #f1f2f6;
  &:hover { background: #f7f9fb; }
`;

const Td = styled.td`padding: 12px 16px; vertical-align: middle; color: #3a4756;`;

const MonoText = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 12px; color: #6b7a8c;
`;

const MemberName = styled.div`font-weight: 600; color: #161d26; font-size: 13.5px;`;
const MemberEmail = styled.div`font-size: 12px; color: #6b7a8c; margin-top: 2px;`;

const TypeBadge = styled.span<{ $type: string }>`
  font-size: 11.5px; font-weight: 600; border-radius: 999px; padding: 3px 10px; white-space: nowrap;
  background: ${p => p.$type === "Health" ? "#dbeafe" : p.$type === "Life" ? "#f3e8ff" : p.$type === "Motor" ? "#f1f5f9" : "#f3f4f6"};
  color: ${p => p.$type === "Health" ? "#1e40af" : p.$type === "Life" ? "#7e22ce" : p.$type === "Motor" ? "#374151" : "#374151"};
`;

const AiBadge = styled.span<{ $s: string }>`
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11.5px; font-weight: 600; border-radius: 999px; padding: 3px 10px; white-space: nowrap;
  background: ${p =>
    p.$s === "processing"  ? "#f1f5f9" :
    p.$s === "need_review" ? "#fffbeb" :
    p.$s === "active"      ? "#f0fdf4" :
    p.$s === "rejected"    ? "#fef2f2" : "#f1f5f9"};
  color: ${p =>
    p.$s === "processing"  ? "#64748b" :
    p.$s === "need_review" ? "#b45309" :
    p.$s === "active"      ? "#16a34a" :
    p.$s === "rejected"    ? "#dc2626" : "#64748b"};
`;

const StatusPill = styled.span<{ $s: string }>`
  display: inline-flex; align-items: center;
  font-size: 11.5px; font-weight: 600; border-radius: 999px; padding: 3px 10px; white-space: nowrap;
  background: ${p =>
    p.$s === "active"      ? "#f0fdf4" :
    p.$s === "need_review" || p.$s === "pending" ? "#fffbeb" :
    p.$s === "processing"  ? "#f1f5f9" :
    p.$s === "rejected"    ? "#fef2f2" : "#f1f5f9"};
  color: ${p =>
    p.$s === "active"      ? "#16a34a" :
    p.$s === "need_review" || p.$s === "pending" ? "#b45309" :
    p.$s === "processing"  ? "#64748b" :
    p.$s === "rejected"    ? "#dc2626" : "#64748b"};
`;

const ActionBtn = styled.button`
  background: none; border: 1px solid #e0e6ec; border-radius: 7px;
  padding: 5px 8px; cursor: pointer; color: #6b7a8c; display: inline-flex; align-items: center;
  &:hover { background: #f1f5f9; color: #0050b0; border-color: #0050b0; }
`;

const EmptyRow = styled.tr`
  td { padding: 48px 16px; text-align: center; color: #9ca3af; font-size: 13.5px; }
`;

const ExpiryWarning = styled.span<{ $expired?: boolean }>`
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600;
  color: ${p => p.$expired ? "#dc2626" : "#b45309"};
  background: ${p => p.$expired ? "#fee2e2" : "#fef3c7"};
  border: 1px solid ${p => p.$expired ? "#fca5a5" : "#fde68a"};
  border-radius: 999px; padding: 2px 7px; margin-top: 3px; white-space: nowrap;
`;

function getDaysUntilExpiry(endDate: string | null | undefined): number | null {
  if (!endDate) return null;
  return dayjs(endDate).diff(dayjs().startOf("day"), "day");
}

const Pagination = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 18px; border-top: 1px solid #f1f2f6; font-size: 13px; color: #6b7a8c;
`;

const PagBtn = styled.button`
  background: none; border: 1px solid #e0e6ec; border-radius: 8px;
  padding: 6px 14px; font-size: 13px; font-weight: 600; color: #3a4756; cursor: pointer;
  &:hover:not(:disabled) { background: #f1f5f9; }
  &:disabled { opacity: 0.4; cursor: default; }
`;



type TabFilter = "active" | "expired";
const ROWS = 20;

// ─── PDF helpers ──────────────────────────────────────────────────────────────

async function downloadPdf(policyId: string, fileName?: string) {
  try {
    const blob = await partnerDownloadPolicyPdf(policyId);
    const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url; a.download = fileName || "policy.pdf";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5_000);
  } catch { toast.error("Could not download PDF"); }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PoliciesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState<TabFilter>("active");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { setPage(0); }, [debouncedSearch, tab]);

  const { data, isLoading } = useQuery({
    queryKey: ["partner", "policies", debouncedSearch, page],
    queryFn: () => partnerListPolicies({
      global_filter: debouncedSearch || undefined,
      sort_field: "created_at", sort_order: -1, limit: ROWS, skip: page * ROWS,
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
    const d = getDaysUntilExpiry(p.end_date);
    const isExpired = p.status === "expired" || (d !== null && d < 0);
    if (tab === "active") return !isExpired;
    if (tab === "expired") return isExpired;
    return true;
  });

  const TABS: { key: TabFilter; label: string }[] = [
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
              <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search policies…" />
            </SearchWrap>
          </TopActions>
        </CardTop>

        <Table>
          <thead>
            <tr>
              <Th>Policy</Th>
              <Th>Member</Th>
              <Th>Type</Th>
              <Th>Insurer</Th>
              <Th>Sum Insured</Th>
              <Th>AI Extraction</Th>
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
                  <MonoText style={{ fontSize: 13 }}>{row.policy_number || "—"}</MonoText>
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
                  {(() => {
                    const d = getDaysUntilExpiry(row.end_date);
                    if (d !== null && d < 0) return <span style={{ color: "#9ca3af" }}>—</span>;
                    if (row.status === "processing")                              return <AiBadge $s="processing">⏳ Processing</AiBadge>;
                    if (row.status === "need_review" || row.status === "pending") return <AiBadge $s="need_review"><AlertTriangle size={11} /> Need Review</AiBadge>;
                    if (row.status === "active")                                  return <AiBadge $s="active"><Check size={11} /> Approved</AiBadge>;
                    if (row.status === "rejected")                                return <AiBadge $s="rejected"><X size={11} /> Rejected</AiBadge>;
                    return <span style={{ color: "#9ca3af" }}>—</span>;
                  })()}
                </Td>
                <Td>
                  {(() => {
                    const d = getDaysUntilExpiry(row.end_date);
                    const isExpired = d !== null && d < 0;
                    const effectiveStatus = isExpired ? "expired" : row.status;
                    return (
                      <>
                        <StatusPill $s={effectiveStatus}>
                          {effectiveStatus === "expired"    ? "Expired" :
                           effectiveStatus === "active"      ? "Active" :
                           effectiveStatus === "need_review" || effectiveStatus === "pending" ? "Pending" :
                           effectiveStatus === "processing"  ? "Processing" :
                           effectiveStatus === "rejected"    ? "Rejected" : effectiveStatus ?? "—"}
                        </StatusPill>
                        {d !== null && d >= 0 && d <= 30 && (
                          <div><ExpiryWarning><AlertTriangle size={10} /> Expires in {d}d</ExpiryWarning></div>
                        )}
                      </>
                    );
                  })()}
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {row.has_file && (
                      <ActionBtn title="Download PDF" onClick={() => downloadPdf(row.id, row.file_name)}><Download size={14} /></ActionBtn>
                    )}
                    <ActionBtn title="View Details" onClick={() => router.push(`/partner/policies/${row.id}`)}><FileSearch size={14} /></ActionBtn>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>

        {total > ROWS && (
          <Pagination>
            <span>Showing {page * ROWS + 1}–{Math.min((page + 1) * ROWS, total)} of {total.toLocaleString("en-IN")}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <PagBtn disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</PagBtn>
              <PagBtn disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next →</PagBtn>
            </div>
          </Pagination>
        )}
      </Card>

    </PageWrap>
  );
}
