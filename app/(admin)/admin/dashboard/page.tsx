"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { adminGetDashboard, adminListMembers, adminListPlans, adminGetClaimAgentOverview } from "@/imports/core/api";
import StatusBadge from "@/components/ui/StatusBadge";
import { Users, FileText, CreditCard, ShieldCheck, Info, X, UserX, UserCheck, FileX, Calendar, ChevronDown, Headphones } from "lucide-react";
import { useAuthStore } from "@/stores/AuthStore";

// ─── Styled ────────────────────────────────────────────────────────────────────

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-width: 1300px;
  padding-bottom: 32px;
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
`;

const KpiGrid2 = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
`;

const KpiCard = styled.div`
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
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

const Row = styled.div`
  display: grid;
  gap: 18px;
`;

const TwoCol = styled(Row)`
  grid-template-columns: 1.8fr 1fr;
  @media (max-width: 1024px) { grid-template-columns: 1fr; }
`;

const ThreeCol = styled(Row)`
  grid-template-columns: 1.2fr 1fr 1fr;
  @media (max-width: 1100px) { grid-template-columns: 1fr; }
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f2f6;
`;

const CardTitle = styled.h3`
  font-size: 14.5px; font-weight: 700; color: #0f172a; margin: 0;
`;

const InfoWrap = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

const InfoBubble = styled.div`
  position: absolute;
  left: 50%;
  top: calc(100% + 8px);
  transform: translateX(-50%);
  background: #1e293b;
  color: #f1f5f9;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
  padding: 8px 12px;
  border-radius: 8px;
  white-space: normal;
  width: max-content;
  max-width: 220px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 999;
  box-shadow: 0 4px 14px rgba(0,0,0,0.18);

  &::before {
    content: "";
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-bottom-color: #1e293b;
  }

  ${InfoWrap}:hover & {
    opacity: 1;
  }
`;

const CardBody = styled.div`
  padding: 16px 20px;
`;

const Ghost = styled.button`
  background: none; border: none; cursor: pointer; font-size: 12px;
  font-weight: 600; color: #64748b; padding: 4px 8px; border-radius: 6px;
  &:hover { background: #f1f5f9; color: #0f172a; }
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse; font-size: 13px;
`;

const Th = styled.th`
  padding: 10px 20px; text-align: left; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; background: #f8f9fb;
`;

const Td = styled.td`
  padding: 11px 20px; border-top: 1px solid #f1f2f6; color: #374151;
`;

const AvatarCircle = styled.div`
  width: 30px; height: 30px; border-radius: 50%;
  background: #e0e7ff; color: #4338ca;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; flex: none;
`;

const MemberName = styled.div`
  font-weight: 600; color: #0f172a; font-size: 13px;
`;

const MemberSub = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: #94a3b8; font-size: 11px; margin-top: 1px;
`;

const PlanBar = styled.div`
  display: flex; flex-direction: column; gap: 14px; padding: 16px 20px;
`;

const BarTrack = styled.div`
  height: 7px; border-radius: 99px; background: #f1f5f9; overflow: hidden;
`;

const BarFill = styled.div<{ $w: string; $color: string }>`
  height: 100%; border-radius: 99px; width: ${p => p.$w}; background: ${p => p.$color};
`;


const Skeleton = styled.div`
  height: 2rem; width: 60px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f8fafc 50%, #e2e8f0 75%);
  background-size: 200% 100%; border-radius: 6px;
  animation: shimmer 1.4s infinite;
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

const ModalOverlay = styled.div`
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(15,23,42,0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
`;

const ModalBox = styled.div`
  background: #fff; border-radius: 16px;
  width: 580px; max-width: 100%; max-height: 92vh;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  overflow: hidden;
`;

const ModalHead = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #f1f2f6; flex: none;
`;

const ModalBody = styled.div`overflow-y: auto; flex: 1;`;

const ModalRow = styled.div`
  display: flex; align-items: center; gap: 10px;
  padding: 10px 20px; cursor: pointer;
  &:hover { background: #f8f9fb; }
`;

const CloseBtn = styled.button`
  background: none; border: none; cursor: pointer; color: #94a3b8;
  display: flex; align-items: center; padding: 4px;
  border-radius: 6px; &:hover { background: #f1f5f9; color: #374151; }
`;

// ─── Members Growth — Month Tiles ─────────────────────────────────────────────

const GrowthHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #f1f2f6;
`;

const YearBtn = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 6px 12px; font-size: 12.5px; font-weight: 600; color: #374151;
  cursor: pointer; transition: all 0.13s;
  &:hover { background: #f1f5f9; border-color: #cbd5e1; }
`;

const YearMenu = styled.div<{ $open: boolean }>`
  position: absolute; top: calc(100% + 4px); right: 0; z-index: 100;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1); min-width: 150px;
  display: ${p => p.$open ? "flex" : "none"}; flex-direction: column; overflow: hidden;
`;

const YearOption = styled.button<{ $active: boolean }>`
  background: ${p => p.$active ? "#eff6ff" : "none"}; border: none;
  padding: 10px 14px; font-size: 13px; font-weight: ${p => p.$active ? 700 : 500};
  color: ${p => p.$active ? "#2563eb" : "#374151"};
  text-align: left; cursor: pointer; transition: background 0.1s;
  &:hover { background: #f8fafc; }
`;

const MonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  padding: 16px 20px 20px;
  @media (max-width: 900px) { grid-template-columns: repeat(4, 1fr); }
`;

const MonthTile = styled.button<{ $active: boolean; $hasMembers: boolean }>`
  background: ${p => p.$active ? "#eff6ff" : "#fff"};
  border: 1.5px solid ${p => p.$active ? "#93c5fd" : "#e8eaf0"};
  border-radius: 10px; padding: 14px 8px 12px;
  cursor: pointer; text-align: center; transition: all 0.13s;
  &:hover { background: #eff6ff; border-color: #93c5fd; }
`;

const MonthTileLabel = styled.div`
  font-size: 11.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: #374151; margin-bottom: 2px;
`;

const MonthTileYear = styled.div`
  font-size: 10.5px; color: #94a3b8; margin-bottom: 8px;
`;

const MonthTileCount = styled.div<{ $zero: boolean }>`
  font-size: 1.75rem; font-weight: 800; line-height: 1;
  color: ${p => p.$zero ? "#cbd5e1" : "#0f172a"};
`;

const MonthTileSub = styled.div`
  font-size: 11px; color: #94a3b8; margin-top: 4px;
`;

// ─── Calendar Grid ─────────────────────────────────────────────────────────────

const CalSection = styled.div`padding: 12px 18px 16px; flex: none;`;

const CalDayHeaders = styled.div`
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; margin-bottom: 4px;
`;

const CalDayHeader = styled.div`
  text-align: center; font-size: 10px; font-weight: 700;
  text-transform: uppercase; color: #94a3b8; padding: 4px 0;
`;

const CalCells = styled.div`display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px;`;

const CalCell = styled.button<{ $empty: boolean; $has: boolean; $sel: boolean }>`
  border: none; border-radius: 8px; min-height: 40px; padding: 4px 2px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  font-size: 12.5px; font-weight: ${p => p.$has ? 700 : 400};
  cursor: ${p => p.$empty || !p.$has ? "default" : "pointer"};
  background: ${p => p.$sel ? "#2563eb" : p.$has ? "#dbeafe" : "transparent"};
  color: ${p => p.$sel ? "#fff" : p.$empty ? "transparent" : p.$has ? "#1e40af" : "#64748b"};
  transition: all 0.12s;
  user-select: none;
  &:hover { background: ${p => !p.$empty && p.$has && !p.$sel ? "#bfdbfe" : undefined}; }
`;

const CalBadge = styled.span<{ $sel: boolean }>`
  font-size: 9px; font-weight: 800; line-height: 1;
  color: ${p => p.$sel ? "rgba(255,255,255,0.8)" : "#3b82f6"};
  background: ${p => p.$sel ? "rgba(255,255,255,0.2)" : "#eff6ff"};
  border-radius: 999px; padding: 1px 5px;
`;

const DayPanel = styled.div`
  border-top: 1px solid #f1f2f6; flex: 1; overflow-y: auto; min-height: 0;
`;

const DayPanelHead = styled.div`
  padding: 10px 20px 8px; font-size: 11.5px; font-weight: 700;
  color: #64748b; background: #f8f9fb; border-bottom: 1px solid #f1f2f6; text-transform: uppercase;
  letter-spacing: 0.04em;
`;

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_COLORS = ["#3b82f6", "#22c55e", "#0a2a57", "#9333ea", "#f59e0b"];


// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const TooltipBox = styled.div`
  background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 8px 12px; font-size: 12.5px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);
`;

function InfoTooltip({ text }: { text: string }) {
  return (
    <InfoWrap>
      <Info size={13} color="#cbd5e1" style={{ cursor: "default" }} />
      <InfoBubble>{text}</InfoBubble>
    </InfoWrap>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <TooltipBox>
      <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color ?? "#3b82f6" }}>
          {p.name}: <b>{p.value}</b>
        </div>
      ))}
    </TooltipBox>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────


export default function DashboardPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter]    = useState<number>(currentYear);
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const yearRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!yearMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) setYearMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [yearMenuOpen]);
  const [selectedMonth, setSelectedMonth] = useState<{
    month: string; year: number; month_num: number; member_list: any[];
  } | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data: dash, isLoading: dashL } = useQuery({
    queryKey: ["admin", "dashboard", yearFilter],
    queryFn: () => adminGetDashboard({ year: yearFilter }),
  });

  const { data: plansData } = useQuery({
    queryKey: ["admin", "plans", "all"],
    queryFn: () => adminListPlans({}),
  });

  const userId = useAuthStore(s => s.userId);
  const { data: myAgentData } = useQuery({
    queryKey: ["admin", "my-claim-agent-overview", userId],
    queryFn: () => adminGetClaimAgentOverview(userId!),
    enabled: !!userId,
    retry: false,
  });
  const myAgent = myAgentData?.data; // undefined (incl. on 404) if this user isn't a claims agent

  const d = (dash as any)?.data ?? {};
  const plans: any[] = Array.isArray(plansData?.data) ? plansData.data : [];

  const totalMembers         = d.total_members          ?? 0;
  const activeMembers        = d.active_members         ?? 0;
  const inactiveMembers      = d.inactive_members       ?? 0;
  const membersWithoutPolicy = d.members_without_policy ?? 0;
  const totalPolicies        = d.total_policies         ?? 0;
  const totalPartners        = d.total_partners         ?? 0;
  const totalPlans           = d.active_plans           ?? 0;

  const membersGrowth:   any[] = d.members_growth   ?? [];
  const membersByPartner:any[] = d.members_by_partner ?? [];

  const maxMemberCount = Math.max(1, ...plans.map((p: any) => p.member_count ?? 0));

  const initials = (name: string) =>
    (name || "M").split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  const KPIS = [
    { label: "Total Members",          value: totalMembers,         bg: "#eff6ff", color: "#2563eb", icon: <Users size={18} />,       href: "/admin/members" },
    { label: "Active Partners",        value: totalPartners,        bg: "#f0fdf4", color: "#16a34a", icon: <ShieldCheck size={18} />, href: "/admin/partners" },
    { label: "Total Policies",         value: totalPolicies,        bg: "#fefce8", color: "#ca8a04", icon: <FileText size={18} />,    href: "/admin/policies?status=active" },
    { label: "Active Plans",           value: totalPlans,           bg: "#fdf4ff", color: "#9333ea", icon: <CreditCard size={18} />,  href: "/admin/plans" },
    { label: "Active Members",         value: activeMembers,        bg: "#f0fdf4", color: "#16a34a", icon: <UserCheck size={18} />,   href: "/admin/members" },
    { label: "Inactive Members",       value: inactiveMembers,      bg: "#fef2f2", color: "#dc2626", icon: <UserX size={18} />,       href: "/admin/members" },
    { label: "Members Without Policy", value: membersWithoutPolicy, bg: "#fff7ed", color: "#ea580c", icon: <FileX size={18} />,       href: "/admin/members" },
  ];

  return (
    <Page>
      {/* Org-wide KPIs/charts are hidden for Claims Agent users — they only
          see their own claim workload below, not business-wide metrics. */}
      {!myAgent && (
        <>
          {/* ── KPI Row 1 ─────────────────────────────────────────────────── */}
          <KpiGrid>
            {KPIS.slice(0, 4).map(k => (
              <KpiCard key={k.label} onClick={() => router.push(k.href)} style={{ cursor: "pointer" }}>
                <KpiIconBox $bg={k.bg} $color={k.color}>{k.icon}</KpiIconBox>
                {dashL ? <Skeleton /> : <KpiValue>{k.value.toLocaleString("en-IN")}</KpiValue>}
                <KpiLabel>{k.label}</KpiLabel>
              </KpiCard>
            ))}
          </KpiGrid>

          {/* ── KPI Row 2 — Members breakdown ───────────────────────────────── */}
          <KpiGrid2>
            {KPIS.slice(4).map(k => (
              <KpiCard key={k.label} onClick={() => router.push(k.href)} style={{ cursor: "pointer" }}>
                <KpiIconBox $bg={k.bg} $color={k.color}>{k.icon}</KpiIconBox>
                {dashL ? <Skeleton /> : <KpiValue>{k.value.toLocaleString("en-IN")}</KpiValue>}
                <KpiLabel>{k.label}</KpiLabel>
              </KpiCard>
            ))}
          </KpiGrid2>
        </>
      )}

      {/* ── My Claims — only shown to users holding the Claims Agent role ─── */}
      {myAgent && (
        <Card>
          <CardTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Headphones size={16} /> My Claims
          </CardTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginTop: 14 }}>
            <KpiCard
              onClick={() => router.push("/admin/claim-tickets")}
              style={{ cursor: "pointer" }}
            >
              <KpiIconBox $bg="#eff6ff" $color="#2563eb"><FileText size={18} /></KpiIconBox>
              <KpiValue>{myAgent.total_claims}</KpiValue>
              <KpiLabel>Total Claims</KpiLabel>
            </KpiCard>
            <KpiCard
              onClick={() => router.push("/admin/claim-tickets?tab=in_progress&status=pending")}
              style={{ cursor: "pointer" }}
            >
              <KpiIconBox $bg="#fefce8" $color="#ca8a04"><FileText size={18} /></KpiIconBox>
              <KpiValue>{myAgent.status_counts.pending ?? 0}</KpiValue>
              <KpiLabel>Pending</KpiLabel>
            </KpiCard>
            <KpiCard
              onClick={() => router.push("/admin/claim-tickets?tab=in_progress&status=processing")}
              style={{ cursor: "pointer" }}
            >
              <KpiIconBox $bg="#eff6ff" $color="#2563eb"><FileText size={18} /></KpiIconBox>
              <KpiValue>{myAgent.status_counts.processing ?? 0}</KpiValue>
              <KpiLabel>Processing</KpiLabel>
            </KpiCard>
            <KpiCard
              onClick={() => router.push("/admin/claim-tickets?tab=accepted")}
              style={{ cursor: "pointer" }}
            >
              <KpiIconBox $bg="#f0fdf4" $color="#16a34a"><FileText size={18} /></KpiIconBox>
              <KpiValue>{myAgent.status_counts.accepted ?? 0}</KpiValue>
              <KpiLabel>Accepted</KpiLabel>
            </KpiCard>
            <KpiCard
              onClick={() => router.push("/admin/claim-tickets?tab=rejected")}
              style={{ cursor: "pointer" }}
            >
              <KpiIconBox $bg="#fef2f2" $color="#dc2626"><FileText size={18} /></KpiIconBox>
              <KpiValue>{myAgent.status_counts.rejected ?? 0}</KpiValue>
              <KpiLabel>Rejected</KpiLabel>
            </KpiCard>
          </div>
        </Card>
      )}

      {!myAgent && (
      <>
      {/* ── Members Growth — Month Tiles + Calendar Drill-down ───────────── */}
      <Card>
        <GrowthHeader>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CardTitle>Members Growth</CardTitle>
            <InfoTooltip text="Click any month to see a date-wise calendar of members who joined" />
          </div>
          <div ref={yearRef} style={{ position: "relative", display: "inline-flex" }}>
            <YearBtn onClick={() => setYearMenuOpen(o => !o)}>
              <Calendar size={13} />
              {yearFilter === currentYear ? "This Year" : "Last Year"} ({yearFilter})
              <ChevronDown size={13} />
            </YearBtn>
            <YearMenu $open={yearMenuOpen}>
              {[currentYear, currentYear - 1].map(y => (
                <YearOption key={y} $active={yearFilter === y} onClick={() => { setYearFilter(y); setYearMenuOpen(false); setSelectedMonth(null); setSelectedDay(null); }}>
                  {y === currentYear ? "This Year" : "Last Year"} ({y})
                </YearOption>
              ))}
            </YearMenu>
          </div>
        </GrowthHeader>
        <MonthGrid>
          {membersGrowth.map((pt: any) => (
            <MonthTile
              key={`${pt.month}-${pt.year}`}
              $active={selectedMonth?.month === pt.month && selectedMonth?.year === pt.year}
              $hasMembers={pt.members > 0}
              onClick={() => {
                setSelectedDay(null);
                setSelectedMonth({ month: pt.month, year: pt.year, month_num: pt.month_num, member_list: pt.member_list });
                setYearMenuOpen(false);
              }}
            >
              <MonthTileLabel>{pt.month}</MonthTileLabel>
              <MonthTileYear>{pt.year}</MonthTileYear>
              <MonthTileCount $zero={pt.members === 0}>{pt.members}</MonthTileCount>
              <MonthTileSub>{pt.members === 1 ? "member" : "members"}</MonthTileSub>
            </MonthTile>
          ))}
        </MonthGrid>
      </Card>

      {/* Policies by Status — Donut (commented out: auto-approve makes status breakdown misleading)
      <Card>…</Card>
      */}

      {/* ── Bottom Row: Bar chart + Plan distribution ─────────────────────── */}
      <ThreeCol style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        {/* Members by Partner — Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Members by Partner</CardTitle>
            <InfoTooltip text="Top 6 partners ranked by number of enrolled members" />
          </CardHeader>
          <CardBody>
            {membersByPartner.length === 0 ? (
              <div style={{ padding: "30px 0", color: "#94a3b8", fontSize: 13, textAlign: "center" }}>No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={membersByPartner} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="partner" tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false} tickLine={false}
                    interval={0}
                    tickFormatter={(v: string) => v.length > 10 ? v.slice(0, 10) + "…" : v}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="members" name="Members" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        {/* Membership by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Membership by Plan</CardTitle>
            <InfoTooltip text="How many members are enrolled under each plan" />
          </CardHeader>
          <PlanBar>
            {plans.length === 0 ? (
              <div style={{ color: "#9ca3af", fontSize: 13 }}>No plans available</div>
            ) : plans.slice(0, 5).map((p: any, i: number) => {
              const count = p.member_count ?? 0;
              const pct = maxMemberCount > 0 ? Math.max(8, Math.round((count / maxMemberCount) * 100)) : 8;
              return (
                <div key={p.id ?? i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{p.name}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 11.5, color: "#64748b" }}>
                      {count > 0 ? count.toLocaleString("en-IN") : "—"}
                    </span>
                  </div>
                  <BarTrack><BarFill $w={`${pct}%`} $color={PLAN_COLORS[i % PLAN_COLORS.length]} /></BarTrack>
                </div>
              );
            })}
          </PlanBar>
        </Card>
      </ThreeCol>

      {/* ── Calendar Modal ────────────────────────────────────────────────── */}
      {selectedMonth && (() => {
        const { month, year, month_num, member_list } = selectedMonth;

        // Build day → members map  (joined = "DD MMM YYYY")
        const dayMap: Record<number, any[]> = {};
        member_list.forEach(m => {
          const day = parseInt((m.joined ?? "").split(" ")[0], 10);
          if (!day) return;
          if (!dayMap[day]) dayMap[day] = [];
          dayMap[day].push(m);
        });

        const firstDow  = new Date(year, month_num - 1, 1).getDay(); // 0=Sun
        const totalDays = new Date(year, month_num, 0).getDate();     // 28–31
        const cells: (number | null)[] = [
          ...Array(firstDow).fill(null),
          ...Array.from({ length: totalDays }, (_, i) => i + 1),
        ];
        // Pad to full weeks
        while (cells.length % 7 !== 0) cells.push(null);

        const dayMembers = selectedDay ? (dayMap[selectedDay] ?? []) : [];
        const MONTH_FULL = ["January","February","March","April","May","June",
                            "July","August","September","October","November","December"];

        const MRow = ({ m }: { m: any }) => (
          <ModalRow onClick={() => { router.push(`/admin/members/${m.id}`); setSelectedMonth(null); setSelectedDay(null); }}>
            <AvatarCircle>
              {(m.name || m.email || "M").split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
            </AvatarCircle>
            <div style={{ flex: 1, minWidth: 0 }}>
              <MemberName>{m.name || m.email}</MemberName>
              <MemberSub>{m.email}</MemberSub>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
              {m.partner_name && (
                <span style={{
                  fontSize: 11, fontWeight: 600, borderRadius: 999,
                  padding: "2px 8px", background: "#eff6ff", color: "#2563eb", whiteSpace: "nowrap",
                }}>
                  {m.partner_name}
                </span>
              )}
              <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{m.joined}</span>
            </div>
          </ModalRow>
        );

        return (
          <ModalOverlay onClick={() => { setSelectedMonth(null); setSelectedDay(null); }}>
            <ModalBox onClick={e => e.stopPropagation()}>
              <ModalHead>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
                    {MONTH_FULL[month_num - 1]} {year}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    {member_list.length} member{member_list.length !== 1 ? "s" : ""} joined
                    {selectedDay ? ` — ${selectedDay} ${month} selected` : " — click a date"}
                  </div>
                </div>
                <CloseBtn onClick={() => { setSelectedMonth(null); setSelectedDay(null); }}><X size={16} /></CloseBtn>
              </ModalHead>

              <ModalBody>
                {/* Calendar Grid */}
                <CalSection>
                  <CalDayHeaders>
                    {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                      <CalDayHeader key={d}>{d}</CalDayHeader>
                    ))}
                  </CalDayHeaders>
                  <CalCells>
                    {cells.map((day, idx) => {
                      const has = day !== null && !!dayMap[day];
                      const sel = day !== null && day === selectedDay;
                      return (
                        <CalCell
                          key={idx}
                          $empty={day === null}
                          $has={has}
                          $sel={sel}
                          onClick={() => day && has && setSelectedDay(sel ? null : day)}
                        >
                          {day !== null && <span>{day}</span>}
                          {has && <CalBadge $sel={sel}>{dayMap[day!].length}</CalBadge>}
                        </CalCell>
                      );
                    })}
                  </CalCells>
                </CalSection>

                {/* Day drill-down panel */}
                <DayPanel>
                  {!selectedDay ? (
                    member_list.length === 0 ? (
                      <div style={{ padding: "28px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                        No members joined this month
                      </div>
                    ) : (
                      <>
                        <DayPanelHead>All {member_list.length} members this month</DayPanelHead>
                        {member_list.map((m: any) => <MRow key={m.id} m={m} />)}
                      </>
                    )
                  ) : (
                    <>
                      <DayPanelHead>{selectedDay} {MONTH_FULL[month_num - 1]} — {dayMembers.length} member{dayMembers.length !== 1 ? "s" : ""}</DayPanelHead>
                      {dayMembers.map((m: any) => <MRow key={m.id} m={m} />)}
                    </>
                  )}
                </DayPanel>
              </ModalBody>
            </ModalBox>
          </ModalOverlay>
        );
      })()}
      </>
      )}
    </Page>
  );
}
