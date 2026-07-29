"use client";

import React from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { memberListPartners } from "@/imports/core/api";
import PlanFeaturesBlock from "@/components/ui/PlanFeaturesBlock";
import {
  CreditCard, CheckCircle2, Minus, AlertTriangle, XCircle,
  Users, FolderOpen, Headphones, MessageSquare, Phone,
  Mic, Archive, UserCheck, Star,
} from "lucide-react";

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 680px;
`;

const PartnerLabel = styled.div`
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
  color: #6b7a8c; font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  margin-bottom: 6px;
`;

const PartnerCodeBadge = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 10.5px; font-weight: 600; text-transform: none; letter-spacing: normal;
  color: #0050b0; background: #eff6ff; border: 1px solid #bfdbfe;
  border-radius: 999px; padding: 2px 9px;
`;

const BannerWrap = styled.div<{ $variant: "warn" | "error" }>`
  background: ${p => p.$variant === "error" ? "#fef2f2" : "#fffbeb"};
  border: 1px solid ${p => p.$variant === "error" ? "#fca5a5" : "#fcd34d"};
  border-radius: 10px; padding: 12px 16px;
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; font-weight: 500;
  color: ${p => p.$variant === "error" ? "#b91c1c" : "#92400e"};
`;

const PlanCard = styled.div<{ $color: string }>`
  background: #fff;
  border: 1px solid #e0e6ec;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  overflow: hidden;
  position: relative;
  &::before {
    content: '';
    display: block;
    height: 5px;
    background: ${p => p.$color};
  }
`;

const CardBody = styled.div`
  padding: 16px 20px 18px;
`;

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 4px;
`;

const PlanName = styled.div`
  font-size: 17px; font-weight: 800; color: #161d26;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  letter-spacing: -0.01em;
`;

const PlanCode = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 10.5px; font-weight: 700; color: #7c3aed;
  background: #f5f3ff; border: 1px solid #ddd6fe;
  border-radius: 999px; padding: 2px 9px;
  margin-left: 8px;
  vertical-align: middle;
`;

const StatusPill = styled.span<{ $status: string }>`
  font-size: 11px; font-weight: 600; border-radius: 999px; padding: 3px 10px;
  flex: none;
  background: ${p =>
    p.$status === "Active" ? "#f0fdf4" :
    p.$status === "Expired" ? "#fef2f2" : "#fffbeb"};
  color: ${p =>
    p.$status === "Active" ? "#16a34a" :
    p.$status === "Expired" ? "#b91c1c" : "#92400e"};
`;

const Tagline = styled.div`
  font-size: 12.5px; color: #6b7a8c; margin-top: 2px;
`;

const PriceRow = styled.div`
  display: flex; align-items: baseline; gap: 5px; margin-top: 10px;
`;

const Price = styled.div`
  font-size: 24px; font-weight: 800; color: #161d26;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  letter-spacing: -0.02em; line-height: 1;
`;

const PriceSuffix = styled.span`
  font-size: 13px; color: #6b7a8c; font-weight: 500;
`;

const MemberCount = styled.div`
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: #6b7a8c; margin-top: 6px;
`;

const Divider = styled.div`
  height: 1px; background: #e0e6ec; margin: 14px 0;
`;

const DatesRow = styled.div`
  display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 4px;
`;

const DateItem = styled.div`
  display: flex; flex-direction: column; gap: 3px;
`;

const DateLabel = styled.div`
  font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
  color: #6b7a8c; font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
`;

const DateValue = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 12.5px; font-weight: 500; color: #3a4756;
`;

const BenefitsLabel = styled.div`
  font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
  color: #6b7a8c; font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  margin-bottom: 8px;
`;

const BenefitsList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 24px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const BenefitRow = styled.div<{ $active?: boolean }>`
  display: flex; align-items: center; gap: 8px;
  font-size: 12.5px; font-weight: 500;
  color: ${p => p.$active !== false ? "#3a4756" : "#b0bac5"};
`;

const EmptyState = styled.div`
  background: #fff; border: 1px dashed #e0e6ec; border-radius: 14px;
  padding: 56px 24px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function planColor(name?: string) {
  if (!name) return "#3b82f6";
  const n = name.toLowerCase();
  if (n.includes("essential")) return "#3b82f6";
  if (n.includes("secure")) return "#22c55e";
  if (n.includes("total") || n.includes("care")) return "#0a2a57";
  return "#3b82f6";
}

interface Benefit { icon: React.ReactNode; label: string; active: boolean; }

function buildBenefits(plan: any): Benefit[] {
  if (!plan) return [];
  return [
    {
      icon: <Users size={15} />,
      label: plan.max_family_members
        ? `${plan.max_family_members} family member${plan.max_family_members !== 1 ? "s" : ""} covered`
        : "Family members covered",
      active: !!plan.max_family_members,
    },
    {
      icon: <FolderOpen size={15} />,
      label: plan.max_policies
        ? `${plan.max_policies} policy storage slot${plan.max_policies !== 1 ? "s" : ""}`
        : "Policy storage slots",
      active: !!plan.max_policies,
    },
    {
      icon: <Headphones size={15} />,
      label: plan.claim_assistance
        ? `${plan.claim_assistance} claim assistance`
        : "Standard claim assistance",
      active: true,
    },
    {
      icon: <MessageSquare size={15} />,
      label: "AI policy Q&A — WhatsApp & email",
      active: !!plan.has_ai_qa,
    },
    {
      icon: <Phone size={15} />,
      label: "Outbound AI calls (welcome + renewal)",
      active: !!plan.has_ai_calls,
    },
    {
      icon: <Mic size={15} />,
      label: plan.voice_languages
        ? `Voice support: ${plan.voice_languages}`
        : "Voice support",
      active: !!(plan.has_ai_calls && plan.voice_languages),
    },
    {
      icon: <Archive size={15} />,
      label: "Document vault & e-certificate",
      active: !!plan.has_vault,
    },
    {
      icon: <UserCheck size={15} />,
      label: "Dedicated relationship manager",
      active: !!plan.has_relationship_manager,
    },
    {
      icon: <Star size={15} />,
      label: "Concierge claim filing",
      active: !!plan.has_concierge,
    },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemberPlanPage() {
  const { data: partnersData, isLoading } = useQuery({
    queryKey: ["member", "partners"],
    queryFn: memberListPartners,
  });

  const enrollments: any[] = (partnersData as any)?.data ?? [];

  if (isLoading) {
    return (
      <Page>
        <div style={{ color: "#6b7a8c", fontSize: 14 }}>Loading plan details…</div>
      </Page>
    );
  }

  if (enrollments.length === 0) {
    return (
      <Page>
        <EmptyState>
          <CreditCard size={36} color="#e0e6ec" />
          <div style={{ fontSize: 16, fontWeight: 700, color: "#3a4756" }}>No active plan</div>
          <div style={{ fontSize: 13, color: "#6b7a8c" }}>Contact your partner to get enrolled in a plan.</div>
        </EmptyState>
      </Page>
    );
  }

  return (
    <Page>
      {enrollments.map((enrollment) => {
        const currentPlan: any = enrollment.plan ?? null;
        const daysUntilExpiry = enrollment.end_date
          ? dayjs(enrollment.end_date).diff(dayjs(), "day")
          : null;
        const showExpiredBanner = enrollment.enrollment_status === "Expired";
        const showExpiryWarning =
          !showExpiredBanner &&
          daysUntilExpiry !== null &&
          daysUntilExpiry >= 0 &&
          daysUntilExpiry <= 7;
        const enrollmentStatus: string = enrollment.enrollment_status ?? (currentPlan ? "Active" : "");
        const benefits = buildBenefits(currentPlan);
        const color = planColor(currentPlan?.name);

        return (
          <div key={enrollment.partner_id}>
            <PartnerLabel>
              <span>{enrollment.partner_name || "Partner"}</span>
              {enrollment.partner_code && (
                <PartnerCodeBadge>{enrollment.partner_code}</PartnerCodeBadge>
              )}
            </PartnerLabel>

            {showExpiredBanner && (
              <BannerWrap $variant="error" style={{ marginBottom: 12 }}>
                <XCircle size={17} />
                <span><strong>This plan has expired.</strong> Contact {enrollment.partner_name || "your partner"} to renew.</span>
              </BannerWrap>
            )}
            {showExpiryWarning && daysUntilExpiry !== null && (
              <BannerWrap $variant="warn" style={{ marginBottom: 12 }}>
                <AlertTriangle size={17} />
                <span>
                  <strong>Plan expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}</strong>
                  {enrollment.end_date && <> ({dayjs(enrollment.end_date).format("DD MMM YYYY")})</>}.
                  {" "}Contact {enrollment.partner_name || "your partner"} to renew.
                </span>
              </BannerWrap>
            )}

            {currentPlan ? (
              <PlanCard $color={color}>
                <CardBody>
                  <CardTop>
                    <div>
                      <div>
                        <PlanName style={{ display: "inline" }}>{currentPlan.name}</PlanName>
                        {currentPlan.plan_code && <PlanCode>{currentPlan.plan_code}</PlanCode>}
                      </div>
                      {currentPlan.tagline && <Tagline>{currentPlan.tagline}</Tagline>}
                    </div>
                    {enrollmentStatus && (
                      <StatusPill $status={enrollmentStatus}>{enrollmentStatus}</StatusPill>
                    )}
                  </CardTop>

                  {currentPlan.price != null && (
                    <>
                      <PriceRow>
                        <Price>₹{Number(currentPlan.price).toLocaleString("en-IN")}</Price>
                        <PriceSuffix>/{currentPlan.cycle ?? "year"}</PriceSuffix>
                      </PriceRow>
                      {currentPlan.member_count != null && (
                        <MemberCount>
                          <Users size={13} />
                          {Number(currentPlan.member_count).toLocaleString("en-IN")} members
                        </MemberCount>
                      )}
                    </>
                  )}

                  <Divider />

                  {(enrollment.start_date || enrollment.end_date) && (
                    <DatesRow>
                      {enrollment.start_date && (
                        <DateItem>
                          <DateLabel>Valid from</DateLabel>
                          <DateValue>{dayjs(enrollment.start_date).format("DD MMM YYYY")}</DateValue>
                        </DateItem>
                      )}
                      {enrollment.end_date && (
                        <DateItem>
                          <DateLabel>Valid to</DateLabel>
                          <DateValue>{dayjs(enrollment.end_date).format("DD MMM YYYY")}</DateValue>
                        </DateItem>
                      )}
                    </DatesRow>
                  )}

                  <BenefitsLabel>What's included</BenefitsLabel>
                  <BenefitsList>
                    {benefits.map((b, i) => (
                      <BenefitRow key={i} $active={b.active}>
                        {b.active
                          ? <CheckCircle2 size={15} color="#65a147" style={{ flex: "none" }} />
                          : <Minus size={15} color="#b0bac5" style={{ flex: "none" }} />
                        }
                        {b.label}
                      </BenefitRow>
                    ))}
                  </BenefitsList>

                  {(currentPlan.fee_slabs?.length || currentPlan.basic_features?.length || currentPlan.advanced_features?.length) ? (
                    <>
                      <Divider />
                      <PlanFeaturesBlock plan={currentPlan} />
                    </>
                  ) : null}
                </CardBody>
              </PlanCard>
            ) : (
              <EmptyState>
                <CreditCard size={36} color="#e0e6ec" />
                <div style={{ fontSize: 16, fontWeight: 700, color: "#3a4756" }}>No plan on this partner</div>
                <div style={{ fontSize: 13, color: "#6b7a8c" }}>Contact {enrollment.partner_name || "your partner"} for details.</div>
              </EmptyState>
            )}
          </div>
        );
      })}
    </Page>
  );
}
