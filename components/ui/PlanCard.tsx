"use client";

import React from "react";
import styled from "styled-components";
import { Button } from "primereact/button";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PlanBenefits {
  family?: number | null;
  slots?: number | null;
  claim?: string | null;
  aiqa?: boolean | null;
  aicalls?: boolean | null;
  voice?: string | null;
  vault?: boolean | null;
  rm?: boolean | null;
  concierge?: boolean | null;
  teleconsult_sessions?: number | null;
  hospital_cash?: boolean | null;
  wellness_sessions?: number | null;
  emergency_assist?: boolean | null;
  legal_assist?: boolean | null;
}

export interface PlanData {
  id: string;
  name: string;
  tagline?: string | null;
  info_text?: string | null;
  price?: number | null;
  cycle?: string | null;
  plan_type?: string | null;
  status?: string;
  popular?: boolean | null;
  color?: string | null;
  benefits?: PlanBenefits | null;
}

interface PlanCardProps {
  plan: PlanData;
  isCurrent?: boolean;
  actionLabel?: string;
  actionDisabled?: boolean;
  actionLoading?: boolean;
  onAction?: () => void;
  memberCount?: number | null;
}

// ─── Styled ────────────────────────────────────────────────────────────────────

const Card = styled.div<{ $current?: boolean; $popular?: boolean; $accent: string }>`
  background: #fff;
  border: 2px solid ${p => p.$current ? p.$accent : p.$popular ? p.$accent + "66" : "#e5e7eb"};
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: ${p => p.$current
    ? `0 0 0 4px ${p.$accent}22, 0 4px 16px rgba(0,0,0,0.08)`
    : "0 2px 8px rgba(0,0,0,0.06)"};
  position: relative;
  transition: box-shadow 0.15s;
`;

const PopularBadge = styled.div<{ $accent: string }>`
  position: absolute;
  top: -13px;
  left: 50%;
  transform: translateX(-50%);
  background: ${p => p.$accent};
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 3px 14px;
  border-radius: 999px;
  white-space: nowrap;
`;

const CurrentBadge = styled.div<{ $accent: string }>`
  position: absolute;
  top: -13px;
  right: 1.25rem;
  background: ${p => p.$accent};
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 3px 12px;
  border-radius: 999px;
`;

const PlanHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
`;

const PlanName = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.2;
`;

const TypeChip = styled.span<{ $partner?: boolean }>`
  font-size: 0.62rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
  color: ${p => p.$partner ? "#6d28d9" : "#0369a1"};
  background: ${p => p.$partner ? "#f5f3ff" : "#e0f2fe"};
  border: 1px solid ${p => p.$partner ? "#ede9fe" : "#bae6fd"};
`;

const Tagline = styled.p`
  font-size: 0.82rem;
  color: #6b7280;
  margin: -0.25rem 0 0 0;
  line-height: 1.5;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

const PriceAmount = styled.span<{ $accent: string }>`
  font-size: 2rem;
  font-weight: 800;
  color: ${p => p.$accent};
  line-height: 1;
`;

const PriceCurrency = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  color: #6b7280;
  align-self: flex-start;
  margin-top: 4px;
`;

const PriceCycle = styled.span`
  font-size: 0.82rem;
  color: #9ca3af;
  font-weight: 400;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #f3f4f6;
  margin: 0;
`;

const BenefitsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
`;

const BenefitSectionLabel = styled.div`
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #9ca3af;
  margin-bottom: 0.25rem;
`;

const BenefitRow = styled.div<{ $accent: string }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #374151;

  &::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${p => p.$accent};
    flex-shrink: 0;
  }
`;

const InfoNote = styled.p`
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
  line-height: 1.5;
  font-style: italic;
`;

const MemberCount = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: #6b7280;
  border-top: 1px solid #f3f4f6;
  padding-top: 0.625rem;
`;

// ─── Benefit builder ──────────────────────────────────────────────────────────

function buildBenefits(b: PlanBenefits): Array<{ icon: string; label: string }> {
  const items: Array<{ icon: string; label: string }> = [];
  if (b.family) items.push({ icon: "👨‍👩‍👧", label: `${b.family} family member${b.family > 1 ? "s" : ""}` });
  if (b.slots) items.push({ icon: "📁", label: `${b.slots} policy slot${b.slots > 1 ? "s" : ""}` });
  if (b.teleconsult_sessions) items.push({ icon: "🩺", label: `${b.teleconsult_sessions} teleconsult session${b.teleconsult_sessions > 1 ? "s" : ""}` });
  if (b.wellness_sessions) items.push({ icon: "🧘", label: `${b.wellness_sessions} wellness session${b.wellness_sessions > 1 ? "s" : ""}` });
  if (b.claim && b.claim !== "Standard") items.push({ icon: "🔖", label: `${b.claim} claim` });
  if (b.aiqa) items.push({ icon: "🤖", label: "AI Health Assistant" });
  if (b.aicalls) items.push({ icon: "📞", label: "AI Health Calls" });
  if (b.vault) items.push({ icon: "🔒", label: "Health Vault" });
  if (b.rm) items.push({ icon: "👔", label: "Relationship Manager" });
  if (b.concierge) items.push({ icon: "🛎️", label: "Concierge Service" });
  if (b.hospital_cash) items.push({ icon: "🏥", label: "Hospital Cash Benefit" });
  if (b.emergency_assist) items.push({ icon: "🚨", label: "Emergency Assistance" });
  if (b.legal_assist) items.push({ icon: "⚖️", label: "Legal Assistance" });
  if (b.voice && b.voice !== "English") items.push({ icon: "🌐", label: `${b.voice} language support` });
  return items;
}

// ─── Accent colors ────────────────────────────────────────────────────────────

const ACCENTS: Record<string, string> = {
  purple: "#7c3aed",
  blue:   "#2563eb",
  green:  "#059669",
  orange: "#ea580c",
  pink:   "#db2777",
};

function getAccent(plan: PlanData): string {
  if (plan.color && ACCENTS[plan.color]) return ACCENTS[plan.color];
  return plan.plan_type === "partner" ? "#7c3aed" : "#2563eb";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlanCard({
  plan, isCurrent, actionLabel, actionDisabled, actionLoading, onAction, memberCount,
}: PlanCardProps) {
  const accent = getAccent(plan);
  const benefits = buildBenefits(plan.benefits ?? {});
  const isPartnerType = plan.plan_type === "partner";

  return (
    <Card $current={isCurrent} $popular={!!plan.popular} $accent={accent}>
      {plan.popular && !isCurrent && <PopularBadge $accent={accent}>Most Popular</PopularBadge>}
      {isCurrent && <CurrentBadge $accent={accent}>Your Plan</CurrentBadge>}

      <PlanHeader>
        <PlanName>{plan.name}</PlanName>
        <TypeChip $partner={isPartnerType}>
          {isPartnerType ? "Partner" : "Global"}
        </TypeChip>
      </PlanHeader>

      {plan.tagline && <Tagline>{plan.tagline}</Tagline>}

      {plan.price != null ? (
        <PriceRow>
          <PriceCurrency>₹</PriceCurrency>
          <PriceAmount $accent={accent}>{Number(plan.price).toLocaleString("en-IN")}</PriceAmount>
          <PriceCycle>/ {plan.cycle ?? "year"}</PriceCycle>
        </PriceRow>
      ) : (
        <PriceRow>
          <PriceAmount $accent="#9ca3af" style={{ fontSize: "1rem" }}>Price on request</PriceAmount>
        </PriceRow>
      )}

      <Divider />

      <BenefitsSection>
        {benefits.length > 0 ? (
          <>
            <BenefitSectionLabel>What&apos;s included</BenefitSectionLabel>
            {benefits.map((b) => (
              <BenefitRow key={b.label} $accent={accent}>
                <span style={{ fontSize: "0.85rem" }}>{b.icon}</span>
                {b.label}
              </BenefitRow>
            ))}
          </>
        ) : (
          <BenefitSectionLabel>No benefits configured</BenefitSectionLabel>
        )}
      </BenefitsSection>

      {plan.info_text && (
        <>
          <Divider />
          <InfoNote>{plan.info_text}</InfoNote>
        </>
      )}

      {memberCount != null && (
        <MemberCount>
          <i className="pi pi-users" style={{ fontSize: "0.7rem" }} />
          {memberCount} member{memberCount !== 1 ? "s" : ""} enrolled
        </MemberCount>
      )}

      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          size="small"
          style={{
            width: "100%",
            background: isCurrent ? "#f3f4f6" : accent,
            border: "none",
            color: isCurrent ? "#6b7280" : "#fff",
            fontWeight: 600,
          }}
          disabled={actionDisabled || isCurrent}
          loading={actionLoading}
          onClick={onAction}
        />
      )}
    </Card>
  );
}
