"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { Users, CheckCircle, Minus } from "lucide-react";
import { partnerListPlans } from "@/imports/core/api";

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageWrap = styled.div`
  max-width: 1240px;
`;

const PageTitle = styled.h1`
  font-size: 19px;
  font-weight: 800;
  color: #161d26;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  letter-spacing: -0.01em;
  margin: 0;
`;

const PageSub = styled.p`
  font-size: 13px;
  color: #6b7a8c;
  margin: 4px 0 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 20px;
  @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 640px)  { grid-template-columns: 1fr; }
`;

const PlanCard = styled.div<{ $color: string; $popular?: boolean }>`
  background: #fff;
  border: ${p => p.$popular ? `2px solid #84ba52` : `1px solid #e0e6ec`};
  border-radius: 14px;
  box-shadow: ${p => p.$popular
    ? "0 4px 16px rgba(10,42,87,0.10), 0 1px 4px rgba(10,42,87,0.06)"
    : "0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06)"};
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ColorBar = styled.div<{ $color: string }>`
  height: 5px;
  background: ${p => p.$color};
  flex-shrink: 0;
`;

const CardBody = styled.div`
  padding: 20px 22px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const CardHead = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
`;

const PlanName = styled.h3`
  font-size: 19px;
  font-weight: 700;
  color: #161d26;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  margin: 0;
  line-height: 1.2;
`;

const PopularBadge = styled.span`
  font-size: 11px;
  font-weight: 700;
  background: #f0fdf4;
  color: #16a34a;
  border-radius: 999px;
  padding: 3px 10px;
  white-space: nowrap;
  flex-shrink: 0;
`;

const Tagline = styled.p`
  font-size: 13px;
  color: #6b7a8c;
  margin: 0;
  line-height: 1.5;
`;

const PriceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

const Price = styled.span`
  font-size: 32px;
  font-weight: 800;
  color: #161d26;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  letter-spacing: -0.02em;
  line-height: 1;
`;

const PricePer = styled.span`
  font-size: 14px;
  color: #6b7a8c;
  font-weight: 400;
`;

const MemberRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7a8c;
`;

const BenefitsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const BenefitItem = styled.li<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: ${p => p.$active ? "#161d26" : "#94a3b8"};
`;

const CardFooter = styled.div`
  padding: 14px 22px;
  border-top: 1px solid #e0e6ec;
  background: #f7f9fb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatusPill = styled.span<{ $active: boolean }>`
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 999px;
  padding: 4px 12px;
  background: ${p => p.$active ? "#f0fdf4" : "#f3f4f6"};
  color: ${p => p.$active ? "#16a34a" : "#6b7280"};
`;

const Skeleton = styled.div`
  height: 200px;
  border-radius: 14px;
  background: linear-gradient(90deg, #e0e6ec 25%, #f7f9fb 50%, #e0e6ec 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 48px 16px;
  color: #9ca3af;
  font-size: 13.5px;
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  Essential: "#3b82f6",
  Secure: "#22c55e",
  "Total Care": "#0a2a57",
};
const COLOR_ROTATE = ["#3b82f6", "#22c55e", "#0a2a57", "#f59e0b", "#9333ea"];

function planColor(name: string, idx: number): string {
  for (const key of Object.keys(PLAN_COLORS)) {
    if (name?.toLowerCase().includes(key.toLowerCase())) return PLAN_COLORS[key];
  }
  return COLOR_ROTATE[idx % COLOR_ROTATE.length];
}

function formatPrice(plan: any): string {
  const price = plan.price ?? plan.monthly_price ?? plan.amount;
  if (price == null) return "—";
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["partner", "plans"],
    queryFn: partnerListPlans,
  });

  const plans: any[] = (data as any)?.data ?? [];
  const popularIdx = plans.findIndex(p => p.is_popular || p.name?.toLowerCase().includes("secure"));

  return (
    <PageWrap>
      <PageTitle>Membership Plans</PageTitle>
      <PageSub>Plans available to your members — both global and partner-specific</PageSub>

      <Grid>
        {isLoading ? (
          <>
            <Skeleton /><Skeleton /><Skeleton />
          </>
        ) : plans.length === 0 ? (
          <EmptyState>No plans are available for your organisation yet.</EmptyState>
        ) : plans.map((plan, i) => {
          const color = planColor(plan.name, i);
          const isPopular = i === popularIdx;
          const isActive = plan.status === "Active" || plan.is_active;
          const benefits: { label: string; active: boolean }[] = plan.benefits
            ? Object.entries(plan.benefits).map(([k, v]) => ({
                label: k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
                active: !!v && v !== false && v !== 0,
              }))
            : [];

          return (
            <PlanCard key={plan.id} $color={color} $popular={isPopular}>
              <ColorBar $color={color} />
              <CardBody>
                <div>
                  <CardHead>
                    <PlanName>{plan.name}</PlanName>
                    {isPopular && <PopularBadge>Most popular</PopularBadge>}
                  </CardHead>
                  {plan.tagline && <Tagline style={{ marginTop: 6 }}>{plan.tagline}</Tagline>}
                </div>

                <PriceRow>
                  <Price>{formatPrice(plan)}</Price>
                  <PricePer>/ month</PricePer>
                </PriceRow>

                <MemberRow>
                  <Users size={14} color="#6b7a8c" />
                  <span>
                    {plan.member_count != null
                      ? `${Number(plan.member_count).toLocaleString("en-IN")} members`
                      : "Members"}
                  </span>
                </MemberRow>

                {benefits.length > 0 && (
                  <BenefitsList>
                    {benefits.slice(0, 6).map(b => (
                      <BenefitItem key={b.label} $active={b.active}>
                        {b.active
                          ? <CheckCircle size={14} color="#65a147" />
                          : <Minus size={14} color="#d1d5db" />}
                        {b.label}
                      </BenefitItem>
                    ))}
                  </BenefitsList>
                )}
              </CardBody>

              <CardFooter>
                <StatusPill $active={isActive}>
                  {isActive ? "Active" : plan.status || "Inactive"}
                </StatusPill>
                {plan.cycle && (
                  <span style={{ fontSize: 12, color: "#6b7a8c" }}>
                    {plan.cycle.charAt(0).toUpperCase() + plan.cycle.slice(1)}
                  </span>
                )}
              </CardFooter>
            </PlanCard>
          );
        })}
      </Grid>
    </PageWrap>
  );
}
