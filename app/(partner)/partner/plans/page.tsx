"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { Check, Minus, Users, Copy, CopyCheck } from "lucide-react";
import { toast } from "react-toastify";
import { partnerListPlans } from "@/imports/core/api";

// ─── Design tokens ────────────────────────────────────────────────────────────

const PLAN_COLORS = ["#3b82f6", "#22c55e", "#0a2257"];

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  max-width: 1240px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const PageTitle = styled.h2`
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
`;

const PageSub = styled.p`
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0;
`;

const PlanGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  align-items: start;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const CardWrap = styled.div<{ $popular?: boolean; $color: string }>`
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 480px;
  border: ${p => p.$popular ? `2px solid #4ade80` : `1px solid #e8eaf0`};
  box-shadow: ${p => p.$popular ? `0 4px 16px rgba(0,0,0,0.10)` : `0 1px 3px rgba(0,0,0,0.06)`};
`;

const CardColorBar = styled.div<{ $color: string }>`
  height: 5px;
  background: ${p => p.$color};
`;

const CardBody = styled.div`
  padding: 22px 22px 18px;
`;

const CardFooter = styled.div`
  margin-top: auto;
  padding: 15px 22px;
  border-top: 1px solid #f1f2f6;
  background: #f8f9fb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PopularBadge = styled.span`
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #15803d;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 999px;
  padding: 2px 9px;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 14px 0;
`;

const PriceNum = styled.span`
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #0f172a;
`;

const PriceSuffix = styled.span`
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
`;

const MembersRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 0;
  padding-top: 14px;
  border-top: 1px solid #f1f2f6;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 12.5px;
  color: #64748b;
`;

const BenefitsList = styled.div`
  padding: 4px 22px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const BenefitLine = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StatusPill = styled.span<{ $s: string }>`
  display: inline-block;
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 999px;
  padding: 3px 11px;
  background: ${p =>
    p.$s === "Active" ? "#f0fdf4" :
    p.$s === "Draft" ? "#f8f9fb" :
    p.$s === "Archived" ? "#fff1f2" : "#f8f9fb"};
  color: ${p =>
    p.$s === "Active" ? "#16a34a" :
    p.$s === "Draft" ? "#64748b" :
    p.$s === "Archived" ? "#e11d48" : "#64748b"};
  border: 1px solid ${p =>
    p.$s === "Active" ? "#bbf7d0" :
    p.$s === "Draft" ? "#e2e8f0" :
    p.$s === "Archived" ? "#fecdd3" : "#e2e8f0"};
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Benefits {
  family: number;
  slots: number;
  claim: string;
  aiqa: boolean;
  aicalls: boolean;
  voice: string;
  vault: boolean;
  rm: boolean;
  concierge: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BLANK_BENEFITS: Benefits = {
  family: 2, slots: 3, claim: "Standard", aiqa: true, aicalls: false,
  voice: "English", vault: true, rm: false, concierge: false,
};

function fmtINR(n: number) {
  const s = Math.round(n).toString();
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return "₹" + grouped;
}

function cycleSuffix(c: string) {
  if (c === "Annual") return "/year";
  if (c === "Half-yearly") return "/6 mo";
  if (c === "Quarterly") return "/quarter";
  return "";
}

function benefitLines(b: Partial<Benefits>) {
  const safe: Benefits = { ...BLANK_BENEFITS, ...b };
  return [
    { text: `${safe.family} family members covered`, on: true },
    { text: `${safe.slots} policy storage slots`, on: true },
    { text: `${safe.claim} claim assistance`, on: true },
    { text: "AI policy Q&A — WhatsApp & email", on: !!safe.aiqa },
    { text: "Outbound AI calls (welcome + renewal)", on: !!safe.aicalls },
    { text: `Voice support: ${safe.voice}`, on: true },
    { text: "Document vault & e-certificate", on: !!safe.vault },
    { text: "Dedicated relationship manager", on: !!safe.rm },
    { text: "Concierge claim filing", on: !!safe.concierge },
  ];
}

function planColor(index: number) {
  return PLAN_COLORS[index] ?? PLAN_COLORS[0];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["partner", "plans"],
    queryFn: partnerListPlans,
  });

  const plans: any[] = (data as any)?.data ?? [];
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyPlanName = async (id: string, name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      setCopiedId(id);
      toast.success(`Copied "${name}"`);
      setTimeout(() => setCopiedId(c => (c === id ? null : c)), 1500);
    } catch {
      toast.error("Failed to copy — please copy manually");
    }
  };

  return (
    <Page>
      <div>
        <PageTitle>Membership Plans</PageTitle>
        <PageSub>
          Plans available to your members — both global and partner-specific. Copy a Plan Name below to use in the
          "Plan Name" column of the member bulk-upload sheet.
        </PageSub>
      </div>

      {isLoading ? (
        <PlanGrid>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              height: 480, background: "#fff", borderRadius: 14,
              border: "1px solid #e8eaf0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              animation: "shimmer 1.4s infinite",
              backgroundImage: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)",
              backgroundSize: "200% 100%",
            }} />
          ))}
        </PlanGrid>
      ) : plans.length === 0 ? (
        <div style={{
          background: "#fff", border: "2px dashed #e2e8f0", borderRadius: 14,
          padding: 40, textAlign: "center", color: "#64748b", fontSize: 14,
        }}>
          No plans are available for your organisation yet.
        </div>
      ) : (
        <PlanGrid>
          {plans.map((plan, idx) => {
            const color = planColor(idx);
            const price = plan.price ?? plan.monthly_price ?? plan.amount ?? 0;
            const cycle = plan.cycle ?? plan.billing_cycle ?? "Annual";
            const tagline = plan.tagline ?? plan.description ?? "";
            const benefits = plan.benefits ?? plan.benefits_json ?? {};
            const lines = benefitLines(benefits);
            const status = plan.status ?? "Draft";

            return (
              <CardWrap key={plan.id} $popular={!!plan.popular} $color={color}>
                <CardColorBar $color={color} />
                <CardBody>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
                    <h3 style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", margin: 0, whiteSpace: "nowrap" }}>
                      {plan.name}
                    </h3>
                    <button
                      onClick={() => copyPlanName(plan.id, plan.name)}
                      title="Copy plan name for bulk-upload sheet"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: copiedId === plan.id ? "#f0fdf4" : "#f8f9fb",
                        border: `1px solid ${copiedId === plan.id ? "#bbf7d0" : "#e2e8f0"}`,
                        borderRadius: 999, padding: "2px 8px", cursor: "pointer",
                        fontSize: 11, fontWeight: 600, color: copiedId === plan.id ? "#16a34a" : "#64748b",
                      }}
                    >
                      {copiedId === plan.id ? <CopyCheck size={12} /> : <Copy size={12} />}
                      {copiedId === plan.id ? "Copied" : "Copy"}
                    </button>
                    {plan.popular && <PopularBadge>Most popular</PopularBadge>}
                  </div>
                  <p style={{ fontSize: 12.5, color: "#64748b", margin: 0 }}>{tagline}</p>
                  <PriceRow>
                    <PriceNum>{fmtINR(price)}</PriceNum>
                    <PriceSuffix>{cycleSuffix(cycle)}</PriceSuffix>
                  </PriceRow>
                  <MembersRow>
                    <Users size={13} />
                    <span>{(plan.member_count ?? 0).toLocaleString("en-IN")} members</span>
                  </MembersRow>
                </CardBody>
                <BenefitsList>
                  {lines.map((line, i) => (
                    <BenefitLine key={i}>
                      {line.on
                        ? <Check size={15} color="#16a34a" style={{ flex: "none" }} />
                        : <Minus size={15} color="#94a3b8" style={{ flex: "none" }} />}
                      <span style={{ fontSize: 13, color: line.on ? "#374151" : "#94a3b8", fontWeight: 500 }}>
                        {line.text}
                      </span>
                    </BenefitLine>
                  ))}
                </BenefitsList>
                <CardFooter>
                  <StatusPill $s={status}>{status}</StatusPill>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                    {cycle}
                  </span>
                </CardFooter>
              </CardWrap>
            );
          })}
        </PlanGrid>
      )}
    </Page>
  );
}
