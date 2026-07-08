"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { Check, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FeeSlab {
  slab: string;
  fee: string;
}

export interface PlanFeaturesData {
  fee_slabs?: FeeSlab[] | null;
  basic_features_note?: string | null;
  basic_features?: string[] | null;
  advanced_features_note?: string | null;
  advanced_features?: string[] | null;
  co_powered_by_easyclaims?: boolean | null;
}

// ─── Styled ────────────────────────────────────────────────────────────────────

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SectionTitle = styled.div`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
`;

const SectionNote = styled.p`
  font-size: 12px;
  color: #94a3b8;
  font-style: italic;
  margin: -4px 0 2px;
`;

const SlabTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
`;

const SlabTh = styled.th`
  text-align: left;
  padding: 7px 10px;
  background: #f8f9fb;
  color: #64748b;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #e8eaf0;
`;

const SlabTd = styled.td`
  padding: 8px 10px;
  border-bottom: 1px solid #f1f2f6;
  color: #374151;
`;

const FeatureLine = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
`;

const CoPoweredBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  border-top: 1px solid #f1f2f6;
  padding-top: 10px;
  margin-top: 4px;
`;

const ToggleBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  background: none;
  border: none;
  padding: 4px 0;
  font-size: 12.5px;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  &:hover { text-decoration: underline; }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlanFeaturesBlock({
  plan,
  defaultExpanded = false,
}: {
  plan: PlanFeaturesData;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const feeSlabs = plan.fee_slabs ?? [];
  const basicFeatures = plan.basic_features ?? [];
  const advancedFeatures = plan.advanced_features ?? [];
  const hasAnything =
    feeSlabs.length > 0 || basicFeatures.length > 0 || advancedFeatures.length > 0;

  if (!hasAnything && !plan.co_powered_by_easyclaims) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {hasAnything && (
        <ToggleBtn onClick={() => setExpanded(e => !e)} type="button">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Show less" : "Show plan details"}
        </ToggleBtn>
      )}

      {expanded && feeSlabs.length > 0 && (
        <Section>
          <SectionTitle>Advanced Assistance Service Fee</SectionTitle>
          <SlabTable>
            <thead>
              <tr>
                <SlabTh>Claim Amount Slab</SlabTh>
                <SlabTh>Additional Service Fee</SlabTh>
              </tr>
            </thead>
            <tbody>
              {feeSlabs.map((row, i) => (
                <tr key={i}>
                  <SlabTd>{row.slab}</SlabTd>
                  <SlabTd>{row.fee}</SlabTd>
                </tr>
              ))}
            </tbody>
          </SlabTable>
        </Section>
      )}

      {expanded && basicFeatures.length > 0 && (
        <Section>
          <SectionTitle>Basic Assistance Services</SectionTitle>
          {plan.basic_features_note && <SectionNote>{plan.basic_features_note}</SectionNote>}
          {basicFeatures.map((f, i) => (
            <FeatureLine key={i}>
              <Check size={14} color="#16a34a" style={{ flex: "none", marginTop: 2 }} />
              <span>{f}</span>
            </FeatureLine>
          ))}
        </Section>
      )}

      {expanded && advancedFeatures.length > 0 && (
        <Section>
          <SectionTitle>Advanced Assistance Service</SectionTitle>
          {plan.advanced_features_note && <SectionNote>{plan.advanced_features_note}</SectionNote>}
          {advancedFeatures.map((f, i) => (
            <FeatureLine key={i}>
              <Check size={14} color="#2563eb" style={{ flex: "none", marginTop: 2 }} />
              <span>{f}</span>
            </FeatureLine>
          ))}
        </Section>
      )}

      {plan.co_powered_by_easyclaims && (
        <CoPoweredBadge>
          <ShieldCheck size={13} />
          Co-powered by EasyClaims
        </CoPoweredBadge>
      )}
    </div>
  );
}
