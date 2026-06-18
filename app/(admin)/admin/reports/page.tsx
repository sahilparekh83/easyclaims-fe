"use client";

import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { Users, Briefcase, FileText, CreditCard } from "lucide-react";
import {
  adminListPlans,
  adminListMembers,
  adminListPartners,
  adminListPolicies,
} from "@/imports/core/api";

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1240px;
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
`;

const KpiCard = styled.div`
  background: #fff;
  border: 1px solid #e0e6ec;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const KpiIconBox = styled.div<{ $bg: string; $color: string }>`
  width: 42px; height: 42px; border-radius: 10px;
  background: ${p => p.$bg};
  color: ${p => p.$color};
  display: flex; align-items: center; justify-content: center;
  flex: none;
`;

const KpiValue = styled.div`
  font-size: 2rem; font-weight: 800; color: #161d26;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  letter-spacing: -0.02em; line-height: 1;
`;

const KpiLabel = styled.div`
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: #6b7a8c;
`;

const Skeleton = styled.div`
  height: 1.8rem; width: 60px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f8fafc 50%, #e2e8f0 75%);
  background-size: 200% 100%; border-radius: 6px;
  animation: shimmer 1.4s infinite;
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 18px;
  align-items: start;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const ThreeCol = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const SectionCard = styled.div`
  background: #fff;
  border: 1px solid #e0e6ec;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 18px 22px 14px;
  border-bottom: 1px solid #e0e6ec;
`;

const CardTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: #161d26;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  margin: 0 0 2px;
`;

const CardSub = styled.div`
  font-size: 12px;
  color: #6b7a8c;
`;

const PlanBars = styled.div`
  display: flex; flex-direction: column; gap: 14px;
  padding: 18px 22px;
`;

const BarRow = styled.div``;

const BarMeta = styled.div`
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 6px;
`;

const BarLabel = styled.span`
  font-size: 13px; font-weight: 600; color: #161d26;
`;

const BarCount = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 12px; color: #6b7a8c;
`;

const BarTrack = styled.div`
  height: 10px; border-radius: 99px; background: #f1f5f9; overflow: hidden;
`;

const BarFill = styled.div<{ $w: string; $color: string }>`
  height: 100%; border-radius: 99px; width: ${p => p.$w}; background: ${p => p.$color};
  transition: width 0.5s ease;
`;

const PricingList = styled.div`
  display: flex; flex-direction: column;
`;

const PricingRow = styled.div`
  display: flex; flex-direction: column; gap: 3px;
  padding: 14px 22px;
  border-top: 1px solid #e0e6ec;
  &:first-child { border-top: none; }
`;

const PricingTop = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
`;

const PlanNameText = styled.span`
  font-size: 14px; font-weight: 600; color: #161d26;
`;

const StatusPill = styled.span<{ $active: boolean }>`
  font-size: 11px; font-weight: 600; border-radius: 999px; padding: 2px 9px;
  background: ${p => p.$active ? "#f0fdf4" : "#f1f5f9"};
  color: ${p => p.$active ? "#16a34a" : "#6b7a8c"};
`;

const PriceText = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 13px; color: #161d26; font-weight: 600;
`;

const MembersText = styled.div`
  font-size: 12px; color: #6b7a8c;
`;

const StatCard = styled.div`
  background: #fff;
  border: 1px solid #e0e6ec;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  overflow: hidden;
`;

const StatCardHeader = styled.div`
  display: flex; align-items: center; gap: 9px;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e6ec;
`;

const StatCardTitle = styled.div`
  font-size: 14px; font-weight: 700; color: #161d26;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
`;

const StatRow = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 20px;
  border-top: 1px solid #f1f5f9;
  &:first-of-type { border-top: none; }
`;

const StatLabel = styled.span`
  font-size: 13px; color: #6b7a8c;
`;

const StatValue = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 14px; font-weight: 600; color: #161d26;
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLAN_COLORS = ["#3b82f6", "#22c55e", "#0a2a57", "#9333ea", "#f59e0b"];

function planColor(name: string, idx: number) {
  const n = (name || "").toLowerCase();
  if (n.includes("essential")) return "#3b82f6";
  if (n.includes("secure")) return "#22c55e";
  if (n.includes("total") || n.includes("care")) return "#0a2a57";
  return PLAN_COLORS[idx % PLAN_COLORS.length];
}

function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-IN");
}

function fmtPrice(price: number | null | undefined, cycle: string | null | undefined): string {
  if (price == null) return "—";
  return `₹${Number(price).toLocaleString("en-IN")} / ${cycle ?? "year"}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const LIST_ONE = { limit: 1, skip: 0 };

export default function ReportsPage() {
  const { data: membersData, isLoading: mL } = useQuery({
    queryKey: ["admin", "reports", "members", "total"],
    queryFn: () => adminListMembers(LIST_ONE),
  });
  const { data: activeMembersData, isLoading: amL } = useQuery({
    queryKey: ["admin", "reports", "members", "active"],
    queryFn: () => adminListMembers({ limit: 1, skip: 0, filters: [{ field: "is_active", value: true }] }),
  });
  const { data: partnersData, isLoading: pL } = useQuery({
    queryKey: ["admin", "reports", "partners", "total"],
    queryFn: () => adminListPartners(LIST_ONE),
  });
  const { data: activePartnersData, isLoading: apL } = useQuery({
    queryKey: ["admin", "reports", "partners", "active"],
    queryFn: () => adminListPartners({ limit: 1, skip: 0, filters: [{ field: "status", value: "Active" }] }),
  });
  const { data: policiesData, isLoading: poL } = useQuery({
    queryKey: ["admin", "reports", "policies", "total"],
    queryFn: () => adminListPolicies(LIST_ONE),
  });
  const { data: activePoliciesData, isLoading: apoL } = useQuery({
    queryKey: ["admin", "reports", "policies", "active"],
    queryFn: () => adminListPolicies({ limit: 1, skip: 0, filters: [{ field: "status", value: "Active" }] }),
  });
  const { data: plansData, isLoading: plL } = useQuery({
    queryKey: ["admin", "reports", "plans"],
    queryFn: () => adminListPlans({}),
  });

  const totalMembers: number = (membersData as any)?.data?.total ?? 0;
  const activeMembers: number = (activeMembersData as any)?.data?.total ?? 0;
  const totalPartners: number = (partnersData as any)?.data?.total ?? 0;
  const activePartners: number = (activePartnersData as any)?.data?.total ?? 0;
  const totalPolicies: number = (policiesData as any)?.data?.total ?? 0;
  const activePolicies: number = (activePoliciesData as any)?.data?.total ?? 0;

  const plans: any[] = Array.isArray((plansData as any)?.data) ? (plansData as any).data : [];
  const activePlans = plans.filter((p: any) => p.status === "Active");
  const maxCount = Math.max(1, ...plans.map((p: any) => p.member_count ?? 0));

  return (
    <Page>
      {/* ── KPI Row ── */}
      <KpiGrid>
        <KpiCard>
          <KpiIconBox $bg="#eff6ff" $color="#2563eb"><Users size={18} /></KpiIconBox>
          {mL ? <Skeleton /> : <KpiValue>{fmt(totalMembers)}</KpiValue>}
          <KpiLabel>Total members</KpiLabel>
        </KpiCard>
        <KpiCard>
          <KpiIconBox $bg="#f0fdf4" $color="#16a34a"><Briefcase size={18} /></KpiIconBox>
          {pL ? <Skeleton /> : <KpiValue>{fmt(totalPartners)}</KpiValue>}
          <KpiLabel>Total partners</KpiLabel>
        </KpiCard>
        <KpiCard>
          <KpiIconBox $bg="#fefce8" $color="#ca8a04"><FileText size={18} /></KpiIconBox>
          {poL ? <Skeleton /> : <KpiValue>{fmt(totalPolicies)}</KpiValue>}
          <KpiLabel>Total policies</KpiLabel>
        </KpiCard>
        <KpiCard>
          <KpiIconBox $bg="#fdf4ff" $color="#9333ea"><CreditCard size={18} /></KpiIconBox>
          {plL ? <Skeleton /> : <KpiValue>{activePlans.length || "—"}</KpiValue>}
          <KpiLabel>Active plans</KpiLabel>
        </KpiCard>
      </KpiGrid>

      {/* ── Plan charts ── */}
      <TwoCol>
        <SectionCard>
          <CardHeader>
            <CardTitle>Membership by plan</CardTitle>
            <CardSub>Members enrolled per plan</CardSub>
          </CardHeader>
          <PlanBars>
            {plL ? (
              <div style={{ color: "#9ca3af", fontSize: 13 }}>Loading…</div>
            ) : plans.length === 0 ? (
              <div style={{ color: "#9ca3af", fontSize: 13 }}>No plans found</div>
            ) : plans.map((p: any, i: number) => {
              const count: number = p.member_count ?? 0;
              const pct = count > 0 ? Math.max(8, Math.round((count / maxCount) * 100)) : 5;
              return (
                <BarRow key={p.id ?? i}>
                  <BarMeta>
                    <BarLabel>{p.name}</BarLabel>
                    <BarCount>{count > 0 ? count.toLocaleString("en-IN") : "—"}</BarCount>
                  </BarMeta>
                  <BarTrack>
                    <BarFill $w={`${pct}%`} $color={planColor(p.name, i)} />
                  </BarTrack>
                </BarRow>
              );
            })}
          </PlanBars>
        </SectionCard>

        <SectionCard>
          <CardHeader>
            <CardTitle>Plan pricing overview</CardTitle>
            <CardSub>Active plans and their pricing</CardSub>
          </CardHeader>
          <PricingList>
            {plL ? (
              <div style={{ padding: "16px 22px", color: "#9ca3af", fontSize: 13 }}>Loading…</div>
            ) : activePlans.length === 0 ? (
              <div style={{ padding: "16px 22px", color: "#9ca3af", fontSize: 13 }}>No active plans</div>
            ) : activePlans.map((p: any) => (
              <PricingRow key={p.id}>
                <PricingTop>
                  <PlanNameText>{p.name}</PlanNameText>
                  <StatusPill $active={p.status === "Active"}>{p.status ?? "Active"}</StatusPill>
                </PricingTop>
                <PriceText>{fmtPrice(p.price, p.cycle)}</PriceText>
                <MembersText>{(p.member_count ?? 0).toLocaleString("en-IN")} members enrolled</MembersText>
              </PricingRow>
            ))}
          </PricingList>
        </SectionCard>
      </TwoCol>

      {/* ── Stat cards ── */}
      <ThreeCol>
        <StatCard>
          <StatCardHeader>
            <KpiIconBox $bg="#eff6ff" $color="#2563eb" style={{ width: 32, height: 32, borderRadius: 8 }}>
              <Users size={15} />
            </KpiIconBox>
            <StatCardTitle>Members</StatCardTitle>
          </StatCardHeader>
          <StatRow>
            <StatLabel>Total members</StatLabel>
            {mL ? <Skeleton style={{ width: 40, height: "1.1rem" }} /> : <StatValue>{fmt(totalMembers)}</StatValue>}
          </StatRow>
          <StatRow>
            <StatLabel>Active members</StatLabel>
            {amL ? <Skeleton style={{ width: 40, height: "1.1rem" }} /> : <StatValue>{fmt(activeMembers)}</StatValue>}
          </StatRow>
          <StatRow>
            <StatLabel>Inactive members</StatLabel>
            {(mL || amL) ? <Skeleton style={{ width: 40, height: "1.1rem" }} /> : (
              <StatValue>{totalMembers > 0 ? fmt(totalMembers - activeMembers) : "—"}</StatValue>
            )}
          </StatRow>
        </StatCard>

        <StatCard>
          <StatCardHeader>
            <KpiIconBox $bg="#f0fdf4" $color="#16a34a" style={{ width: 32, height: 32, borderRadius: 8 }}>
              <Briefcase size={15} />
            </KpiIconBox>
            <StatCardTitle>Partners</StatCardTitle>
          </StatCardHeader>
          <StatRow>
            <StatLabel>Total partners</StatLabel>
            {pL ? <Skeleton style={{ width: 40, height: "1.1rem" }} /> : <StatValue>{fmt(totalPartners)}</StatValue>}
          </StatRow>
          <StatRow>
            <StatLabel>Active partners</StatLabel>
            {apL ? <Skeleton style={{ width: 40, height: "1.1rem" }} /> : <StatValue>{fmt(activePartners)}</StatValue>}
          </StatRow>
          <StatRow>
            <StatLabel>Members enrolled</StatLabel>
            <StatValue>{fmt(totalMembers)}</StatValue>
          </StatRow>
        </StatCard>

        <StatCard>
          <StatCardHeader>
            <KpiIconBox $bg="#fefce8" $color="#ca8a04" style={{ width: 32, height: 32, borderRadius: 8 }}>
              <FileText size={15} />
            </KpiIconBox>
            <StatCardTitle>Policies</StatCardTitle>
          </StatCardHeader>
          <StatRow>
            <StatLabel>Total policies</StatLabel>
            {poL ? <Skeleton style={{ width: 40, height: "1.1rem" }} /> : <StatValue>{fmt(totalPolicies)}</StatValue>}
          </StatRow>
          <StatRow>
            <StatLabel>Active policies</StatLabel>
            {apoL ? <Skeleton style={{ width: 40, height: "1.1rem" }} /> : <StatValue>{fmt(activePolicies)}</StatValue>}
          </StatRow>
          <StatRow>
            <StatLabel>Expired policies</StatLabel>
            {(poL || apoL) ? <Skeleton style={{ width: 40, height: "1.1rem" }} /> : (
              <StatValue>{totalPolicies > 0 ? fmt(totalPolicies - activePolicies) : "—"}</StatValue>
            )}
          </StatRow>
        </StatCard>
      </ThreeCol>
    </Page>
  );
}
