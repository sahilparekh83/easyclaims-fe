"use client";

import React from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText, ChevronRight } from "lucide-react";
import { memberListClaims } from "@/imports/core/api";
import StatusBadge from "@/components/ui/StatusBadge";
import dayjs from "dayjs";

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
  const { data, isLoading } = useQuery({ queryKey: ["member", "claims"], queryFn: memberListClaims });
  const claims: Claim[] = (data as any)?.data ?? [];

  return (
    <PageWrap>
      <Card>
        <CardTop>
          <CardTitle>My Claims</CardTitle>
          <CardSub>Track every claim you've filed and who's handling it.</CardSub>
        </CardTop>

        {isLoading ? (
          <EmptyState>Loading…</EmptyState>
        ) : claims.length === 0 ? (
          <EmptyState>
            <FileText size={32} color="#e0e6ec" style={{ marginBottom: 10 }} />
            <div>No claims filed yet.</div>
            <div style={{ fontSize: 12.5, marginTop: 4 }}>Go to My Policies and click "Claim Policy" on an active policy.</div>
          </EmptyState>
        ) : (
          claims.map(c => (
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
      </Card>
    </PageWrap>
  );
}
