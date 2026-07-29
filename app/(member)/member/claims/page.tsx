"use client";

import React, { useMemo, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText, ChevronRight } from "lucide-react";
import { memberListClaims } from "@/imports/core/api";
import StatusBadge from "@/components/ui/StatusBadge";
import { useDebounce } from "@/hooks/useDebounce";
import dayjs from "dayjs";

const ROWS = 10;

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const PageWrap = styled.div`max-width: 1000px;`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e0e6ec;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  overflow: hidden;
`;

const CardTop = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e6ec;
`;

const CardTitle = styled.h2`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px; font-weight: 700; color: #161d26; margin: 0;
`;

const CardSub = styled.p`
  font-size: 13px; color: #6b7a8c; margin: 3px 0 0;
`;

const SearchWrap = styled.div`
  position: relative; display: flex; align-items: center; flex: none;
  i { position: absolute; left: 10px; color: #94a3b8; font-size: 13px; pointer-events: none; }
`;

const SearchInput = styled.input`
  height: 34px; border: 1px solid #e0e6ec; border-radius: 8px;
  padding: 0 12px 0 32px; font-size: 13px; color: #161d26;
  outline: none; width: 220px; background: #f7f9fb;
  &:focus { border-color: #0050b0; background: #fff; }
`;

const Row = styled.div`
  display: flex; align-items: center; gap: 16px;
  padding: 16px 20px; border-top: 1px solid #f1f3f6;
  cursor: pointer;
  &:hover { background: #f7f9fb; }
`;

const IconBox = styled.div`
  width: 38px; height: 38px; border-radius: 10px;
  background: #eff6ff; color: #0050b0;
  display: flex; align-items: center; justify-content: center; flex: none;
`;

const ClaimNumber = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 13px; font-weight: 700; color: #161d26;
`;

const ClaimMeta = styled.div`
  font-size: 12.5px; color: #6b7a8c; margin-top: 2px;
`;

const EmptyState = styled.div`
  padding: 48px 20px; text-align: center; color: #9ca3af;
`;

const Pagination = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; border-top: 1px solid #e0e6ec; font-size: 13px; color: #6b7a8c;
`;

const PagBtn = styled.button`
  background: none; border: 1px solid #e0e6ec; border-radius: 8px;
  padding: 6px 14px; font-size: 13px; font-weight: 600; color: #3a4756; cursor: pointer;
  &:hover:not(:disabled) { background: #f1f5f9; }
  &:disabled { opacity: 0.4; cursor: default; }
`;

interface Claim {
  id: string;
  claim_number: string;
  status: string;
  description?: string | null;
  claimed_amount?: number | null;
  assigned_agent_name?: string | null;
  created_at: string;
}

export default function MemberClaimsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useQuery({ queryKey: ["member", "claims"], queryFn: memberListClaims });
  const allClaims: Claim[] = (data as any)?.data ?? [];

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return allClaims;
    return allClaims.filter(c =>
      c.claim_number?.toLowerCase().includes(q) ||
      c.status?.toLowerCase().includes(q) ||
      c.assigned_agent_name?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  }, [allClaims, debouncedSearch]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / ROWS);
  const pageClaims = filtered.slice(page * ROWS, page * ROWS + ROWS);

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(0);
  };

  return (
    <PageWrap>
      <Card>
        <CardTop>
          <div>
            <CardTitle>My Claims</CardTitle>
            <CardSub>Track every claim you've filed and who's handling it.</CardSub>
          </div>
          <SearchWrap>
            <i className="pi pi-search" />
            <SearchInput
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search claims…"
            />
          </SearchWrap>
        </CardTop>

        {isLoading ? (
          <EmptyState>Loading…</EmptyState>
        ) : total === 0 ? (
          <EmptyState>
            <FileText size={32} color="#e0e6ec" style={{ marginBottom: 10 }} />
            <div>{debouncedSearch ? "No claims match your search." : "No claims filed yet."}</div>
            {!debouncedSearch && (
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Go to My Policies and click "Claim Policy" on an active policy.</div>
            )}
          </EmptyState>
        ) : (
          pageClaims.map(c => (
            <Row key={c.id} onClick={() => router.push(`/member/claims/${c.id}`)}>
              <IconBox><FileText size={17} /></IconBox>
              <div style={{ flex: 1 }}>
                <ClaimNumber>{c.claim_number}</ClaimNumber>
                <ClaimMeta>
                  {dayjs(c.created_at).format("DD MMM YYYY")}
                  {c.assigned_agent_name ? ` · Handled by ${c.assigned_agent_name}` : ""}
                  {c.claimed_amount ? ` · ₹${Number(c.claimed_amount).toLocaleString("en-IN")}` : ""}
                </ClaimMeta>
              </div>
              <StatusBadge value={titleCase(c.status)} />
              <ChevronRight size={16} color="#94a3b8" />
            </Row>
          ))
        )}

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
