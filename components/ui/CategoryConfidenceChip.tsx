"use client";

import styled from "styled-components";
import { Loader2 } from "lucide-react";

const Wrap = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const TypeBadge = styled.span<{ $type: string }>`
  display: inline-flex;
  align-items: center;
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
  background: ${p =>
    p.$type === "Health" ? "#eff6ff" :
    p.$type === "Life"   ? "#fdf4ff" :
    p.$type === "Motor"  ? "#f1f5f9" :
    p.$type === "Travel" ? "#f0fdf4" : "#f8fafc"};
  color: ${p =>
    p.$type === "Health" ? "#1d4ed8" :
    p.$type === "Life"   ? "#9333ea" :
    p.$type === "Motor"  ? "#475569" :
    p.$type === "Travel" ? "#15803d" : "#475569"};
`;

const ConfChip = styled.span<{ $low: boolean }>`
  display: inline-flex; align-items: center; gap: 4px;
  flex: none; font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 11px; font-weight: 600;
  padding: 3px 8px; border-radius: 999px;
  color: ${p => p.$low ? '#b45309' : '#16a34a'};
  background: ${p => p.$low ? '#fffbeb' : '#f0fdf4'};
`;

const DetectingChip = styled.span`
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11.5px; font-weight: 600; color: #94a3b8;
  padding: 3px 10px; border-radius: 999px; background: #f8fafc;
  white-space: nowrap;
  svg { animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg) } }
`;

export interface CategoryConfidenceChipProps {
  category?: string | null;
  /** 0-100 */
  confidence?: number | null;
  status?: string | null;
}

export default function CategoryConfidenceChip({ category, confidence, status }: CategoryConfidenceChipProps) {
  // While extraction is running, the backend has already written a placeholder
  // fallback category (e.g. "Other Insurance") to satisfy a NOT NULL column —
  // it is not the AI's real answer yet, so show "Detecting…" regardless of
  // whether `category` is already a non-null string.
  if (status === "processing") {
    return (
      <DetectingChip>
        <Loader2 size={11} /> Detecting…
      </DetectingChip>
    );
  }

  if (!category) {
    return <span style={{ color: "#9ca3af" }}>—</span>;
  }

  return (
    <Wrap>
      <TypeBadge $type={category}>{category}</TypeBadge>
      {confidence != null && (
        <ConfChip $low={confidence < 70}>{confidence}%</ConfChip>
      )}
    </Wrap>
  );
}
