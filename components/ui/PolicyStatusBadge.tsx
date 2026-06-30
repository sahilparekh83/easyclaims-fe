"use client";

import React from "react";
import styled from "styled-components";
import { Check, AlertTriangle, X, RefreshCw } from "lucide-react";

export type PolicyStatus =
  | "processing"
  | "need_review" | "pending"
  | "renewal_pending"
  | "active"
  | "renewed"
  | "rejected"
  | "expired"
  | string;

interface Config {
  bg: string;
  color: string;
  label: string;
  icon?: React.ReactNode;
}

const CONFIG: Record<string, Config> = {
  processing:      { bg: "#eff6ff", color: "#2563eb", label: "Processing",     icon: <span>⏳</span> },
  need_review:     { bg: "#fffbeb", color: "#b45309", label: "Need Review",     icon: <AlertTriangle size={11} /> },
  pending:         { bg: "#fffbeb", color: "#b45309", label: "Need Review",     icon: <AlertTriangle size={11} /> },
  renewal_pending: { bg: "#fdf4ff", color: "#7c3aed", label: "Renewal?",        icon: <RefreshCw size={11} /> },
  active:          { bg: "#f0fdf4", color: "#16a34a", label: "Active",          icon: <Check size={11} /> },
  renewed:         { bg: "#f0fdf4", color: "#16a34a", label: "Renewed",         icon: <RefreshCw size={11} /> },
  rejected:        { bg: "#fef2f2", color: "#b91c1c", label: "Rejected",        icon: <X size={11} /> },
  expired:         { bg: "#fef9c3", color: "#854d0e", label: "Expired",         icon: <AlertTriangle size={11} /> },
};

const Badge = styled.span<{ $bg: string; $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
  background: ${p => p.$bg};
  color: ${p => p.$color};
`;

interface Props {
  status: PolicyStatus;
  /** If true, show as "Renewed" when active + has previous_policy_id */
  isRenewal?: boolean;
  showIcon?: boolean;
}

export default function PolicyStatusBadge({ status, isRenewal = false, showIcon = true }: Props) {
  const key = status === "active" && isRenewal ? "renewed_active" : status;
  const cfg = CONFIG[key] ?? CONFIG[status] ?? {
    bg: "#f8fafc", color: "#64748b", label: status, icon: null,
  };

  // active + isRenewal → show "Renewed" badge
  if (status === "active" && isRenewal) {
    const renewedCfg = CONFIG["renewed"];
    return (
      <Badge $bg={renewedCfg.bg} $color={renewedCfg.color}>
        {showIcon && renewedCfg.icon}
        {renewedCfg.label}
      </Badge>
    );
  }

  return (
    <Badge $bg={cfg.bg} $color={cfg.color}>
      {showIcon && cfg.icon}
      {cfg.label}
    </Badge>
  );
}
