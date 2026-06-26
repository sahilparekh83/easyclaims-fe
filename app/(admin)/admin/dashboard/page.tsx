"use client";

import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { adminGetDashboard, adminListMembers, adminListPlans } from "@/imports/core/api";
import StatusBadge from "@/components/ui/StatusBadge";
import { Users, FileText, CreditCard, ShieldCheck, FileSearch, Info } from "lucide-react";

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

const QueueItem = styled.div`
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px; border-top: 1px solid #f1f2f6; cursor: pointer;
  &:hover { background: #f8fafc; }
  &:first-of-type { border-top: none; }
`;

const QueueDot = styled.span`
  width: 8px; height: 8px; border-radius: 50%;
  background: #f59e0b; flex: none;
`;

const Skeleton = styled.div`
  height: 2rem; width: 60px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f8fafc 50%, #e2e8f0 75%);
  background-size: 200% 100%; border-radius: 6px;
  animation: shimmer 1.4s infinite;
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_COLORS = ["#3b82f6", "#22c55e", "#0a2a57", "#9333ea", "#f59e0b"];

const STATUS_COLORS: Record<string, string> = {
  active:       "#22c55e",
  need_review:  "#f59e0b",
  processing:   "#3b82f6",
  rejected:     "#ef4444",
  pending:      "#94a3b8",
};

const STATUS_LABELS: Record<string, string> = {
  active:      "Active",
  need_review: "Need Review",
  processing:  "Processing",
  rejected:    "Rejected",
  pending:     "Pending",
};

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

const RECENT_PARAMS = { limit: 5, skip: 0, sort_field: "created_at", sort_order: -1 };

export default function DashboardPage() {
  const router = useRouter();

  const { data: dash, isLoading: dashL } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: adminGetDashboard,
  });

  const { data: recentMembersData } = useQuery({
    queryKey: ["admin", "members", "recent"],
    queryFn: () => adminListMembers(RECENT_PARAMS),
  });

  const { data: plansData } = useQuery({
    queryKey: ["admin", "plans", "all"],
    queryFn: () => adminListPlans({}),
  });

  const d = (dash as any)?.data ?? {};
  const recentMembers: any[] = recentMembersData?.data?.data ?? [];
  const plans: any[] = Array.isArray(plansData?.data) ? plansData.data : [];

  const totalMembers  = d.total_members  ?? 0;
  const totalPolicies = d.total_policies ?? 0;
  const totalPartners = d.total_partners ?? 0;
  const totalPlans    = d.active_plans   ?? 0;

  const membersGrowth:   any[] = d.members_growth      ?? [];
  const policiesByStatus:any[] = d.policies_by_status  ?? [];
  const membersByPartner:any[] = d.members_by_partner  ?? [];
  const reviewQueue:     any[] = d.review_queue        ?? [];
  const reviewQueueTotal: number = d.review_queue_total ?? reviewQueue.length;

  const maxMemberCount = Math.max(1, ...plans.map((p: any) => p.member_count ?? 0));

  const initials = (name: string) =>
    (name || "M").split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  const KPIS = [
    { label: "Total Members",   value: totalMembers,  bg: "#eff6ff", color: "#2563eb", icon: <Users size={18} />,       href: "/admin/members" },
    { label: "Active Partners", value: totalPartners, bg: "#f0fdf4", color: "#16a34a", icon: <ShieldCheck size={18} />, href: "/admin/partners" },
    { label: "Total Policies",  value: totalPolicies, bg: "#fefce8", color: "#ca8a04", icon: <FileText size={18} />,    href: "/admin/policies?status=active" },
    { label: "Active Plans",    value: totalPlans,    bg: "#fdf4ff", color: "#9333ea", icon: <CreditCard size={18} />,  href: "/admin/plans" },
  ];

  return (
    <Page>
      {/* ── KPI Row ───────────────────────────────────────────────────────── */}
      <KpiGrid>
        {KPIS.map(k => (
          <KpiCard key={k.label} onClick={() => router.push(k.href)} style={{ cursor: "pointer" }}>
            <KpiIconBox $bg={k.bg} $color={k.color}>{k.icon}</KpiIconBox>
            {dashL ? <Skeleton /> : <KpiValue>{k.value.toLocaleString("en-IN")}</KpiValue>}
            <KpiLabel>{k.label}</KpiLabel>
          </KpiCard>
        ))}
      </KpiGrid>

      {/* ── Charts Row: Area + Donut ──────────────────────────────────────── */}
      <TwoCol>
        {/* Members Growth — Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Members Growth</CardTitle>
            <InfoTooltip text="New members joined each month over the last 6 months" />
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={membersGrowth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="memberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="members" name="Members"
                  stroke="#3b82f6" strokeWidth={2.5}
                  fill="url(#memberGrad)" dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Policies by Status — Donut */}
        <Card>
          <CardHeader>
            <CardTitle>Policies by Status</CardTitle>
            <InfoTooltip text="Breakdown of all policies by their current review status" />
          </CardHeader>
          <CardBody style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {policiesByStatus.length === 0 ? (
              <div style={{ padding: "40px 0", color: "#94a3b8", fontSize: 13 }}>No policies yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={policiesByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={72}
                      paddingAngle={3}
                      style={{ cursor: "pointer" }}
                      onClick={(entry: any) => router.push(`/admin/policies?status=${entry.status}`)}
                    >
                      {policiesByStatus.map((entry, i) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? PLAN_COLORS[i % PLAN_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [val, STATUS_LABELS[name] ?? name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 4, justifyContent: "center" }}>
                  {policiesByStatus.map(e => (
                    <div
                      key={e.status}
                      onClick={() => router.push(`/admin/policies?status=${e.status}`)}
                      style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, cursor: "pointer" }}
                    >
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: STATUS_COLORS[e.status] ?? "#94a3b8", flexShrink: 0, display: "inline-block" }} />
                      <span style={{ color: "#64748b" }}>{STATUS_LABELS[e.status] ?? e.status}</span>
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>{e.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </TwoCol>

      {/* ── Data Row: Members table + AI Queue ───────────────────────────── */}
      <TwoCol>
        {/* Recent Members */}
        <Card>
          <CardHeader>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CardTitle>Recent Members</CardTitle>
              <InfoTooltip text="Last 5 members who joined the platform" />
            </div>
            <Ghost onClick={() => router.push("/admin/members")}>View all →</Ghost>
          </CardHeader>
          <Table>
            <thead>
              <tr>
                <Th>Member</Th>
                <Th>Plan</Th>
                <Th>Partner</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {recentMembers.length === 0 ? (
                <tr><Td colSpan={4} style={{ color: "#9ca3af", textAlign: "center" }}>No members yet</Td></tr>
              ) : recentMembers.map((m: any) => (
                <tr
                  key={m.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/admin/members/${m.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fb")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <AvatarCircle>{initials(m.name || m.email || "M")}</AvatarCircle>
                      <div>
                        <MemberName>{m.name || m.email}</MemberName>
                        <MemberSub>{m.id?.slice(-8)?.toUpperCase()}</MemberSub>
                      </div>
                    </div>
                  </Td>
                  <Td>{m.plan_name || "—"}</Td>
                  <Td>{m.partner_name || "—"}</Td>
                  <Td><StatusBadge value={!!m.is_active} trueLabel="Active" falseLabel="Inactive" /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        {/* AI Review Queue */}
        <Card>
          <CardHeader>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CardTitle>Policy Review Queue</CardTitle>
              <InfoTooltip text="Policies extracted by AI that need your approval or rejection" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {reviewQueueTotal > 0 && (
                <span style={{
                  background: "#fffbeb", color: "#b45309",
                  fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "2px 9px"
                }}>
                  {reviewQueueTotal} pending
                </span>
              )}
              <Ghost onClick={() => router.push("/admin/policies?status=need_review")}>View all →</Ghost>
            </div>
          </CardHeader>
          {reviewQueue.length === 0 ? (
            <div style={{ padding: "28px 20px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
              No policies pending review
            </div>
          ) : (
            reviewQueue.map((p: any) => (
              <QueueItem key={p.id} onClick={() => router.push(`/admin/policies/${p.id}`)}>
                <QueueDot />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.policy_number || p.file_name || "Unnamed policy"}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
                    {p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                  </div>
                </div>
                <FileSearch size={14} color="#94a3b8" />
              </QueueItem>
            ))
          )}
          <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f2f6", background: "#f8f9fb" }}>
            <Ghost style={{ width: "100%", textAlign: "center" }} onClick={() => router.push("/admin/policies")}>
              Open policy repository →
            </Ghost>
          </div>
        </Card>
      </TwoCol>

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
    </Page>
  );
}
