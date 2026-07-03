"use client";

import React from "react";
import styled from "styled-components";

type Variant = "success" | "danger" | "warning" | "info" | "neutral";

const PALETTE: Record<Variant, { bg: string; color: string; dot: string }> = {
  success: { bg: "#dcfce7", color: "#15803d", dot: "#16a34a" },
  danger:  { bg: "#fee2e2", color: "#b91c1c", dot: "#dc2626" },
  warning: { bg: "#fef3c7", color: "#92400e", dot: "#d97706" },
  info:    { bg: "#dbeafe", color: "#1d4ed8", dot: "#2563eb" },
  neutral: { bg: "#f3f4f6", color: "#4b5563", dot: "#9ca3af" },
};

const STATUS_MAP: Record<string, Variant> = {
  active: "success", Active: "success", ACTIVE: "success",
  true: "success", yes: "success", Yes: "success",
  inactive: "danger", Inactive: "danger", INACTIVE: "danger",
  false: "danger", no: "danger", No: "danger",
  archived: "danger", Archived: "danger", ARCHIVED: "danger",
  expired: "danger", Expired: "danger", EXPIRED: "danger",
  cancelled: "danger", Cancelled: "danger", CANCELLED: "danger",
  rejected: "danger", Rejected: "danger", REJECTED: "danger",
  pending: "warning", Pending: "warning", PENDING: "warning",
  need_review: "warning",
  renewal_pending: "warning",
  renewed: "success",
  processing: "info", Processing: "info",
  draft: "info", Draft: "info", DRAFT: "info",
  global: "info",
};

const Chip = styled.span<{ $variant: Variant }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  background: ${p => PALETTE[p.$variant].bg};
  color: ${p => PALETTE[p.$variant].color};
  white-space: nowrap;

  &::before {
    content: "";
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${p => PALETTE[p.$variant].dot};
    flex-shrink: 0;
  }
`;

interface StatusBadgeProps {
  value: string | boolean;
  trueLabel?: string;
  falseLabel?: string;
}

const DISPLAY_LABEL: Record<string, string> = {
  need_review:      "Pending Review",
  renewal_pending:  "Renewal?",
  renewed:          "Renewed",
};

export default function StatusBadge({ value, trueLabel = "Active", falseLabel = "Inactive" }: StatusBadgeProps) {
  const str = typeof value === "boolean" ? String(value) : value;
  const variant = STATUS_MAP[str] || "neutral";
  const label = typeof value === "boolean"
    ? (value ? trueLabel : falseLabel)
    : (DISPLAY_LABEL[str] ?? value);
  return <Chip $variant={variant}>{label}</Chip>;
}
