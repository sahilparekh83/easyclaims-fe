"use client";

import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import {
  partnerGetProfile,
  partnerListMembers,
  partnerListPlans,
} from "@/imports/core/api";
import StatusBadge from "@/components/ui/StatusBadge";
import { Users, CreditCard, Sparkles, Wallet } from "lucide-react";

const LIST_PARAMS = { limit: 1, skip: 0 };
const RECENT_PARAMS = { limit: 5, skip: 0, sort_field: "created_at", sort_order: -1 };

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1240px;
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 580px) { grid-template-columns: 1fr; }
`;

const KpiCard = styled.div`
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
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
  font-size: 2rem; font-weight: 800; color: #0f172a;
  letter-spacing: -0.02em; line-height: 1;
`;

const KpiLabel = styled.div`
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: #64748b;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 18px;
  align-items: start;
  @media (max-width: 1024px) { grid-template-columns: 1fr; }
`;

const SectionCard = styled.div`
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid #f1f2f6;
`;

const CardTitle = styled.h3`
  font-size: 16px; font-weight: 700; color: #0f172a; margin: 0;
`;

const CardSub = styled.div`
  font-size: 12.5px; color: #64748b; margin-top: 2px;
`;

const TableScroll = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%; min-width: 480px; border-collapse: collapse; font-size: 13.5px;
`;

const Th = styled.th`
  padding: 11px 22px; text-align: left; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; background: #f8f9fb;
`;

const ThSm = styled(Th)` padding: 11px 8px; `;

const Td = styled.td`
  padding: 12px 22px; border-top: 1px solid #f1f2f6;
`;

const TdSm = styled(Td)` padding: 12px 8px; `;

const MemberName = styled.div`
  font-weight: 700; color: #0f172a; font-size: 13.5px;
`;

const MemberIdText = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace; color: #64748b; font-size: 11.5px; margin-top: 1px;
`;

const AvatarCircle = styled.div`
  width: 32px; height: 32px; border-radius: 50%;
  background: #e0e7ff; color: #4338ca;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8rem; font-weight: 700; flex: none;
`;

const AiCard = styled.div`
  background: #fff; border: 1px solid #e8eaf0;
  border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); overflow: hidden;
`;

const AiHeader = styled.div`
  display: flex; align-items: center; gap: 9px;
  padding: 16px 20px; border-bottom: 1px solid #f1f2f6;
`;

const FlaggedBadge = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 11px; font-weight: 600;
  background: #fffbeb; color: #b45309; border-radius: 999px; padding: 2px 9px; margin-left: auto;
`;

const AiItem = styled.div`
  display: flex; gap: 12px; padding: 14px 20px;
  border-top: 1px solid #f1f2f6; align-items: flex-start;
`;

const AmberDot = styled.span`
  width: 9px; height: 9px; border-radius: 50%;
  background: #f59e0b; flex: none; margin-top: 4px;
`;

const ReviewBadge = styled.span`
  font-size: 11px; font-weight: 600; color: #b45309;
  background: #fffbeb; border-radius: 999px; padding: 3px 10px; white-space: nowrap;
`;

const PlanBar = styled.div`
  display: flex; flex-direction: column; gap: 13px; padding: 18px 20px;
`;

const BarTrack = styled.div`
  height: 8px; border-radius: 99px; background: #f1f5f9; overflow: hidden;
`;

const BarFill = styled.div<{ $w: string; $color: string }>`
  height: 100%; border-radius: 99px; width: ${p => p.$w}; background: ${p => p.$color};
`;

const Ghost = styled.button`
  background: none; border: none; cursor: pointer; font-size: 12px;
  font-weight: 600; color: #64748b; padding: 4px 8px; border-radius: 6px;
  &:hover { background: #f1f5f9; color: #0f172a; }
`;

const Skeleton = styled.div`
  height: 2rem; width: 60px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f8fafc 50%, #e2e8f0 75%);
  background-size: 200% 100%; border-radius: 6px;
  animation: shimmer 1.4s infinite;
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

const PLAN_COLORS = ["#3b82f6", "#22c55e", "#9333ea", "#f59e0b", "#ef4444"];

export default function DashboardPage() {
  const router = useRouter();

  const { data: profileData } = useQuery({
    queryKey: ["partner", "profile"],
    queryFn: partnerGetProfile,
  });
  const { data: membersData, isLoading: mL } = useQuery({
    queryKey: ["partner", "members", "total"],
    queryFn: () => partnerListMembers(LIST_PARAMS),
  });
  const { data: plansData, isLoading: plL } = useQuery({
    queryKey: ["partner", "plans"],
    queryFn: partnerListPlans,
  });
  const { data: recentMembersData } = useQuery({
    queryKey: ["partner", "members", "recent"],
    queryFn: () => partnerListMembers(RECENT_PARAMS),
  });

  const partnerName: string =
    (profileData as any)?.data?.name ?? (profileData as any)?.data?.partner_name ?? "";
  const totalMembers: number = (membersData as any)?.data?.total ?? 0;
  const plans: any[] = (plansData as any)?.data ?? [];
  const activePlans = plans.filter((p: any) => p.status === "Active" || p.is_active);
  const totalPlans = activePlans.length || plans.length;
  const recentMembers: any[] = (recentMembersData as any)?.data?.data ?? [];
  const floatBalance: number = (profileData as any)?.data?.float_balance ?? 0;
  const isLowFloat: boolean = (profileData as any)?.data?.is_low_float ?? false;

  const initials = (name: string) =>
    (name || "M").split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  const KPIS = [
    { label: "Total members", value: totalMembers, loading: mL,  bg: "#eff6ff", color: "#2563eb", icon: <Users size={18} /> },
    { label: "Active plans",  value: totalPlans,   loading: plL, bg: "#fdf4ff", color: "#9333ea", icon: <CreditCard size={18} /> },
    {
      label: isLowFloat ? "Float balance (Low!)" : "Float balance",
      value: floatBalance, loading: false,
      bg: isLowFloat ? "#fef2f2" : "#f0fdf4",
      color: isLowFloat ? "#dc2626" : "#16a34a",
      icon: <Wallet size={18} />,
    },
  ];

  return (
    <Page>
      <KpiGrid>
        {KPIS.map(k => (
          <KpiCard key={k.label}>
            <KpiIconBox $bg={k.bg} $color={k.color}>{k.icon}</KpiIconBox>
            {k.loading ? <Skeleton /> : <KpiValue>{k.value.toLocaleString("en-IN")}</KpiValue>}
            <KpiLabel>{k.label}</KpiLabel>
          </KpiCard>
        ))}
      </KpiGrid>

      <TwoCol>
        <SectionCard>
          <CardHeader>
            <div>
              <CardTitle>Recent memberships</CardTitle>
              <CardSub>{partnerName ? `Members in ${partnerName}` : "Your workspace members"}</CardSub>
            </div>
            <Ghost onClick={() => router.push("/partner/members")}>View all →</Ghost>
          </CardHeader>
          <TableScroll>
          <Table>
            <thead>
              <tr>
                <Th>Member</Th>
                <ThSm>Plan</ThSm>
                <Th style={{ paddingLeft: "8px" }}>Status</Th>
              </tr>
            </thead>
            <tbody>
              {recentMembers.length === 0 ? (
                <tr><Td colSpan={3} style={{ color: "#9ca3af", textAlign: "center" }}>No members yet</Td></tr>
              ) : recentMembers.map((m: any) => (
                <tr
                  key={m.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/partner/members/${m.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fb")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <AvatarCircle>{initials(m.name || m.email || "M")}</AvatarCircle>
                      <div>
                        <MemberName>{m.name || m.email}</MemberName>
                        <MemberIdText>{m.id?.slice(-8)?.toUpperCase()}</MemberIdText>
                      </div>
                    </div>
                  </Td>
                  <TdSm style={{ color: "#374151" }}>{m.enrollment?.plan_name || "—"}</TdSm>
                  <Td style={{ paddingLeft: "8px" }}>
                    <StatusBadge value={!!m.is_active} trueLabel="Active" falseLabel="Inactive" />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          </TableScroll>
        </SectionCard>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <AiCard>
            <AiHeader>
              <Sparkles size={17} color="#2563eb" />
              <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>AI review queue</span>
            </AiHeader>
            <div style={{ padding: "24px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
              No items flagged for review
            </div>
            <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f2f6", background: "#f8f9fb" }}>
              <Ghost
                style={{ width: "100%", textAlign: "center" }}
                onClick={() => router.push("/partner/policies")}
              >
                Open policy repository →
              </Ghost>
            </div>
          </AiCard>

          <SectionCard>
            <div style={{ padding: "18px 20px 4px" }}>
              <CardTitle>Membership by plan</CardTitle>
            </div>
            {plans.length === 0 ? (
              <div style={{ padding: "16px 20px", color: "#9ca3af", fontSize: 13 }}>No plans available</div>
            ) : (
              <PlanBar>
                {plans.slice(0, 5).map((p: any, i: number) => (
                  <div key={p.id ?? i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{p.name}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 12, color: "#64748b" }}>
                        {p.member_count != null ? p.member_count.toLocaleString("en-IN") : "—"}
                      </span>
                    </div>
                    <BarTrack>
                      <BarFill
                        $w={`${Math.max(10, 100 - i * 18)}%`}
                        $color={PLAN_COLORS[i % PLAN_COLORS.length]}
                      />
                    </BarTrack>
                  </div>
                ))}
              </PlanBar>
            )}
          </SectionCard>
        </div>
      </TwoCol>
    </Page>
  );
}
