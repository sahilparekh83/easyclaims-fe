"use client";

import React from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import {
  memberGetProfile,
  memberListPolicies,
  memberListFamily,
  memberGetPlan,
} from "@/imports/core/api";
import StatusBadge from "@/components/ui/StatusBadge";
import { CreditCard, FileText, Users } from "lucide-react";

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1240px;
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 580px) { grid-template-columns: 1fr; }
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

const KpiValueText = styled.div`
  font-size: 1.1rem; font-weight: 800; color: #161d26;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  letter-spacing: -0.01em; line-height: 1.2;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;

const KpiLabel = styled.div`
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: #6b7a8c;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
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
  border: 1px solid #e0e6ec;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
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
  font-size: 16px; font-weight: 700; color: #161d26; margin: 0;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse; font-size: 13.5px;
`;

const Th = styled.th`
  padding: 11px 22px; text-align: left; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em; color: #6b7a8c; background: #f7f9fb;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
`;

const ThSm = styled(Th)` padding: 11px 8px; `;

const Td = styled.td`
  padding: 12px 22px; border-top: 1px solid #f1f2f6;
`;

const TdSm = styled(Td)` padding: 12px 8px; `;

const MonoText = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 12px; color: #6b7a8c;
`;

const TypeBadge = styled.span<{ $type: string }>`
  font-size: 11.5px; font-weight: 600; border-radius: 999px; padding: 3px 10px;
  background: ${p =>
    p.$type === "Health" ? "#eff6ff" :
    p.$type === "Motor" ? "#f8f9fb" :
    p.$type === "Life" ? "#f5f3ff" : "#f0fdf4"};
  color: ${p =>
    p.$type === "Health" ? "#1d4ed8" :
    p.$type === "Motor" ? "#374151" :
    p.$type === "Life" ? "#6d28d9" : "#15803d"};
`;

const Ghost = styled.button`
  background: none; border: none; cursor: pointer; font-size: 12px;
  font-weight: 600; color: #6b7a8c; padding: 4px 8px; border-radius: 6px;
  &:hover { background: #f1f5f9; color: #161d26; }
`;

const Skeleton = styled.div`
  height: 2rem; width: 60px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f8fafc 50%, #e2e8f0 75%);
  background-size: 200% 100%; border-radius: 6px;
  animation: shimmer 1.4s infinite;
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

const SkeletonSm = styled(Skeleton)`
  height: 1.1rem; width: 80%;
`;

const SubCard = styled.div`
  background: #fff;
  border: 1px solid #e0e6ec;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  padding: 20px 22px;
`;

const SubCardTitle = styled.div`
  font-size: 13px; font-weight: 700; color: #6b7a8c; text-transform: uppercase;
  letter-spacing: 0.06em; margin-bottom: 12px;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
`;

const PlanName = styled.div`
  font-size: 17px; font-weight: 700; color: #161d26;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
`;

const PlanBadge = styled.span`
  font-size: 11.5px; font-weight: 600;
  background: #f0fdf4; color: #16a34a;
  border-radius: 999px; padding: 3px 10px;
`;

const DatesRow = styled.div`
  display: flex; flex-direction: column; gap: 4px; margin: 12px 0;
`;

const DateLine = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 12px; color: #6b7a8c;
`;

const AmberBanner = styled.div`
  background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px;
  padding: 10px 14px; font-size: 13px; font-weight: 500; color: #92400e;
  display: flex; align-items: center; gap: 8px;
`;

const EmptyRow = styled.tr`
  td { padding: 32px 22px; text-align: center; color: #9ca3af; font-size: 13px; }
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemberDashboardPage() {
  const router = useRouter();

  const { data: profileData } = useQuery({
    queryKey: ["member", "profile"],
    queryFn: memberGetProfile,
  });

  const { data: policiesData, isLoading: polL } = useQuery({
    queryKey: ["member", "policies"],
    queryFn: () => memberListPolicies(),
  });

  const { data: familyData, isLoading: famL } = useQuery({
    queryKey: ["member", "family"],
    queryFn: memberListFamily,
  });

  const { data: planData, isLoading: planL } = useQuery({
    queryKey: ["member", "plan"],
    queryFn: memberGetPlan,
    retry: false,
  });

  const totalPolicies: number =
    policiesData?.data?.total ??
    policiesData?.data?.items?.length ??
    policiesData?.data?.data?.length ?? 0;

  const totalFamily: number = Array.isArray(familyData?.data)
    ? familyData.data.length : 0;

  const allPolicies: any[] =
    policiesData?.data?.items ?? policiesData?.data?.data ?? [];
  const recentPolicies = allPolicies.slice(0, 5);

  const enrollment = planData?.data?.enrollment;
  const currentPlan = planData?.data?.plan;
  const planName: string = currentPlan?.name ?? "No active plan";

  const daysUntilExpiry = enrollment?.end_date
    ? dayjs(enrollment.end_date).diff(dayjs(), "day")
    : null;
  const showExpiryWarning =
    daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30;

  return (
    <Page>
      <KpiGrid>
        <KpiCard>
          <KpiIconBox $bg="#eff6ff" $color="#2563eb"><CreditCard size={18} /></KpiIconBox>
          {planL ? <Skeleton /> : <KpiValueText>{planName}</KpiValueText>}
          <KpiLabel>Active Plan</KpiLabel>
        </KpiCard>
        <KpiCard>
          <KpiIconBox $bg="#fefce8" $color="#ca8a04"><FileText size={18} /></KpiIconBox>
          {polL ? <Skeleton /> : <KpiValue>{totalPolicies.toLocaleString("en-IN")}</KpiValue>}
          <KpiLabel>Total Policies</KpiLabel>
        </KpiCard>
        <KpiCard>
          <KpiIconBox $bg="#f0fdf4" $color="#16a34a"><Users size={18} /></KpiIconBox>
          {famL ? <Skeleton /> : <KpiValue>{totalFamily.toLocaleString("en-IN")}</KpiValue>}
          <KpiLabel>Family Members</KpiLabel>
        </KpiCard>
      </KpiGrid>

      <TwoCol>
        <SectionCard>
          <CardHeader>
            <CardTitle>My policies</CardTitle>
            <Ghost onClick={() => router.push("/member/policies")}>View all →</Ghost>
          </CardHeader>
          <Table>
            <thead>
              <tr>
                <Th>Policy ID</Th>
                <ThSm>Type</ThSm>
                <Th>Insurer</Th>
                <ThSm>Status</ThSm>
                <Th>Expiry</Th>
              </tr>
            </thead>
            <tbody>
              {polL ? (
                <EmptyRow><td>Loading…</td></EmptyRow>
              ) : recentPolicies.length === 0 ? (
                <EmptyRow><td>No policies found.</td></EmptyRow>
              ) : recentPolicies.map((p: any) => (
                <tr key={p.id} style={{ borderTop: "1px solid #f1f2f6" }}>
                  <Td>
                    <MonoText>{p.policy_number ?? p.id?.slice(-8)?.toUpperCase() ?? "—"}</MonoText>
                  </Td>
                  <TdSm>
                    {p.policy_type
                      ? <TypeBadge $type={p.policy_type}>{p.policy_type}</TypeBadge>
                      : <span style={{ color: "#9ca3af" }}>—</span>}
                  </TdSm>
                  <Td style={{ color: "#3a4756", fontSize: 13 }}>{p.insurer || "—"}</Td>
                  <TdSm>
                    {p.status
                      ? <StatusBadge value={p.status} />
                      : <span style={{ color: "#9ca3af" }}>—</span>}
                  </TdSm>
                  <Td>
                    <MonoText>
                      {p.end_date ? dayjs(p.end_date).format("DD MMM YYYY") : "—"}
                    </MonoText>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </SectionCard>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {showExpiryWarning && enrollment?.end_date && (
            <AmberBanner>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span>
                <b>Expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}</b>
                {" "}— {dayjs(enrollment.end_date).format("DD MMM YYYY")}
              </span>
            </AmberBanner>
          )}

          <SubCard>
            <SubCardTitle>Active subscription</SubCardTitle>
            {planL ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <SkeletonSm />
                <SkeletonSm style={{ width: "50%" }} />
              </div>
            ) : currentPlan ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <PlanName>{currentPlan.name}</PlanName>
                  <PlanBadge>{enrollment?.status ?? "Active"}</PlanBadge>
                </div>
                <DatesRow>
                  {enrollment?.start_date && (
                    <DateLine>From: {dayjs(enrollment.start_date).format("DD MMM YYYY")}</DateLine>
                  )}
                  {enrollment?.end_date && (
                    <DateLine>To: {dayjs(enrollment.end_date).format("DD MMM YYYY")}</DateLine>
                  )}
                </DatesRow>
                <Ghost
                  style={{ padding: "6px 0", fontSize: 13 }}
                  onClick={() => router.push("/member/plan")}
                >
                  View plan details →
                </Ghost>
              </>
            ) : (
              <div style={{ color: "#9ca3af", fontSize: 13 }}>No active plan. Contact your partner.</div>
            )}
          </SubCard>

          <SubCard>
            <SubCardTitle>Quick links</SubCardTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { label: "View all policies",   href: "/member/policies" },
                { label: "Family members",       href: "/member/family" },
                { label: "Nominees",             href: "/member/nominees" },
                { label: "My profile",           href: "/member/profile" },
              ].map(l => (
                <Ghost
                  key={l.href}
                  style={{ textAlign: "left", fontSize: 13, padding: "6px 8px" }}
                  onClick={() => router.push(l.href)}
                >
                  {l.label} →
                </Ghost>
              ))}
            </div>
          </SubCard>
        </div>
      </TwoCol>
    </Page>
  );
}
