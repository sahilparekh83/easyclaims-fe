"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { toast } from "react-toastify";
import { memberGetPlan, memberSwitchPlan } from "@/imports/core/api";
import { getApiError } from "@/imports/core/errors";
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
  gap: 20px;
  max-width: 860px;
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
  padding: 24px 28px 28px;
`;

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 6px;
`;

const PlanName = styled.div`
  font-size: 22px; font-weight: 800; color: #161d26;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  letter-spacing: -0.01em;
`;

const StatusPill = styled.span<{ $status: string }>`
  font-size: 11.5px; font-weight: 600; border-radius: 999px; padding: 4px 12px;
  flex: none;
  background: ${p =>
    p.$status === "Active" ? "#f0fdf4" :
    p.$status === "Expired" ? "#fef2f2" : "#fffbeb"};
  color: ${p =>
    p.$status === "Active" ? "#16a34a" :
    p.$status === "Expired" ? "#b91c1c" : "#92400e"};
`;

const Tagline = styled.div`
  font-size: 13.5px; color: #6b7a8c; margin-top: 4px;
`;

const PriceRow = styled.div`
  display: flex; align-items: baseline; gap: 6px; margin-top: 18px;
`;

const Price = styled.div`
  font-size: 32px; font-weight: 800; color: #161d26;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  letter-spacing: -0.02em; line-height: 1;
`;

const PriceSuffix = styled.span`
  font-size: 14px; color: #6b7a8c; font-weight: 500;
`;

const MemberCount = styled.div`
  display: flex; align-items: center; gap: 5px;
  font-size: 13px; color: #6b7a8c; margin-top: 8px;
`;

const Divider = styled.div`
  height: 1px; background: #e0e6ec; margin: 22px 0;
`;

const DatesRow = styled.div`
  display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 22px;
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
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
  color: #6b7a8c; font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  margin-bottom: 14px;
`;

const BenefitsList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 32px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const BenefitRow = styled.div<{ $active?: boolean }>`
  display: flex; align-items: center; gap: 9px;
  font-size: 13px; font-weight: 500;
  color: ${p => p.$active !== false ? "#3a4756" : "#b0bac5"};
`;

const EmptyState = styled.div`
  background: #fff; border: 1px dashed #e0e6ec; border-radius: 14px;
  padding: 56px 24px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
`;

const DialogFooterRow = styled.div`
  display: flex; justify-content: flex-end; gap: 8px;
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
  const queryClient = useQueryClient();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const { data: planData, isLoading } = useQuery({
    queryKey: ["member", "plan"],
    queryFn: memberGetPlan,
    retry: false,
  });

  const enrollment = planData?.data?.enrollment;
  const currentPlan: any = planData?.data?.plan ?? null;

  const daysUntilExpiry = enrollment?.end_date
    ? dayjs(enrollment.end_date).diff(dayjs(), "day")
    : null;
  const showExpiredBanner = enrollment?.status === "Expired";
  const showExpiryWarning =
    !showExpiredBanner &&
    daysUntilExpiry !== null &&
    daysUntilExpiry >= 0 &&
    daysUntilExpiry <= 7;

  const switchMutation = useMutation({
    mutationFn: (planId: string) => memberSwitchPlan(planId),
    onSuccess: () => {
      toast.success("Plan changed successfully!");
      queryClient.invalidateQueries({ queryKey: ["member", "plan"] });
      setConfirmVisible(false);
    },
    onError: (err: any) => {
      toast.error(getApiError(err, "Failed to change plan"));
    },
  });

  const enrollmentStatus: string = enrollment?.status ?? (currentPlan ? "Active" : "");
  const benefits = buildBenefits(currentPlan);
  const color = planColor(currentPlan?.name);

  if (isLoading) {
    return (
      <Page>
        <div style={{ color: "#6b7a8c", fontSize: 14 }}>Loading plan details…</div>
      </Page>
    );
  }

  return (
    <Page>
      {showExpiredBanner && (
        <BannerWrap $variant="error">
          <XCircle size={17} />
          <span><strong>Your plan has expired.</strong> Contact your partner to renew your membership.</span>
        </BannerWrap>
      )}
      {showExpiryWarning && daysUntilExpiry !== null && (
        <BannerWrap $variant="warn">
          <AlertTriangle size={17} />
          <span>
            <strong>Plan expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}</strong>
            {enrollment?.end_date && <> ({dayjs(enrollment.end_date).format("DD MMM YYYY")})</>}.
            {" "}Contact your partner to renew.
          </span>
        </BannerWrap>
      )}

      {currentPlan ? (
        <PlanCard $color={color}>
          <CardBody>
            <CardTop>
              <div>
                <PlanName>{currentPlan.name}</PlanName>
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

            {(enrollment?.start_date || enrollment?.end_date) && (
              <DatesRow>
                {enrollment?.start_date && (
                  <DateItem>
                    <DateLabel>Valid from</DateLabel>
                    <DateValue>{dayjs(enrollment.start_date).format("DD MMM YYYY")}</DateValue>
                  </DateItem>
                )}
                {enrollment?.end_date && (
                  <DateItem>
                    <DateLabel>Valid to</DateLabel>
                    <DateValue>{dayjs(enrollment.end_date).format("DD MMM YYYY")}</DateValue>
                  </DateItem>
                )}
                {currentPlan.partner_name && (
                  <DateItem>
                    <DateLabel>Partner</DateLabel>
                    <DateValue>{currentPlan.partner_name}</DateValue>
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
          <div style={{ fontSize: 16, fontWeight: 700, color: "#3a4756" }}>No active plan</div>
          <div style={{ fontSize: 13, color: "#6b7a8c" }}>Contact your partner to get enrolled in a plan.</div>
        </EmptyState>
      )}

      {/* Confirm switch dialog — kept for partner-initiated switches if needed */}
      <Dialog
        header="Confirm Plan Change"
        visible={confirmVisible}
        onHide={() => { if (!switchMutation.isPending) setConfirmVisible(false); }}
        style={{ width: "480px" }}
        footer={
          <DialogFooterRow>
            <Button
              label="Cancel"
              severity="secondary"
              outlined
              onClick={() => setConfirmVisible(false)}
              disabled={switchMutation.isPending}
            />
            <Button
              label="Yes, confirm"
              icon="pi pi-check"
              loading={switchMutation.isPending}
              onClick={() => currentPlan && switchMutation.mutate(currentPlan.id)}
              style={{ background: "#0050b0", borderColor: "#0050b0" }}
            />
          </DialogFooterRow>
        }
      >
        <div style={{ fontSize: "0.9rem", color: "#3a4756" }}>
          This action will update your plan. It takes effect immediately.
        </div>
      </Dialog>
    </Page>
  );
}
