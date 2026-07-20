"use client";

import styled from "styled-components";
import { User, Bot, ShieldCheck } from "lucide-react";
import dayjs from "dayjs";

const Timeline = styled.div`display: flex; flex-direction: column; gap: 0;`;

const TimelineRow = styled.div`
  display: flex; gap: 12px; padding: 12px 0; border-top: 1px solid #f1f3f6;
  &:first-child { border-top: none; padding-top: 0; }
`;

const TimelineIcon = styled.div<{ $actor: string }>`
  width: 28px; height: 28px; border-radius: 50%; flex: none;
  display: flex; align-items: center; justify-content: center;
  background: ${p => p.$actor === "member" ? "#eff6ff" : p.$actor === "system" ? "#f1f5f9" : "#f0fdf4"};
  color: ${p => p.$actor === "member" ? "#0050b0" : p.$actor === "system" ? "#64748b" : "#16a34a"};
`;

const TimelineBody = styled.div`flex: 1;`;
const TimelineMsg = styled.div`font-size: 13.5px; color: #161d26;`;
const TimelineMeta = styled.div`font-size: 11.5px; color: #94a3b8; margin-top: 2px;`;

const Empty = styled.div`
  padding: 1.5rem 0; text-align: center; color: #9ca3af; font-size: 0.85rem;
`;

export interface HistoryEntry {
  id: string;
  actor_type?: string | null;
  actor_name?: string | null;
  action?: string;
  message?: string;
  old_value?: Record<string, any> | null;
  new_value?: Record<string, any> | null;
  note?: string | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, (e: HistoryEntry) => string> = {
  policy_uploaded: () => "Policy document uploaded",
  policy_validation_result: (e) => {
    const status = e.new_value?.status;
    if (status === "rejected") return `AI validation result: rejected — ${e.new_value?.validation_reason ?? "reason unavailable"}`;
    if (status === "active") return "AI validation result: approved";
    return "AI validation completed";
  },
  policy_approved: () => "Policy approved and marked Active",
  policy_rejected: (e) => `Policy rejected — ${e.new_value?.reason ?? "reason unavailable"}`,
  policy_expired: () => "Policy marked Expired (end date passed)",
  policy_renewal_detected: (e) => `Renewal detected (confidence: ${e.new_value?.confidence ?? "—"})`,
  policy_renewal_confirmed: () => "Renewal confirmed by admin",
  policy_renewal_dismissed: () => "Renewal dismissed by admin — treated as a new policy",
};

function formatEntry(e: HistoryEntry): string {
  if (e.message) return e.message;
  const fn = e.action ? ACTION_LABELS[e.action] : undefined;
  if (fn) return fn(e);
  return e.action ? e.action.replace(/_/g, " ") : "Update";
}

export default function HistoryTimeline({ entries, emptyText = "No history yet." }: { entries: HistoryEntry[]; emptyText?: string }) {
  if (!entries || entries.length === 0) {
    return <Empty>{emptyText}</Empty>;
  }

  return (
    <Timeline>
      {entries.map(e => {
        const actor = e.actor_type || "system";
        return (
          <TimelineRow key={e.id}>
            <TimelineIcon $actor={actor}>
              {actor === "member" ? <User size={13} /> : actor === "system" ? <Bot size={13} /> : <ShieldCheck size={13} />}
            </TimelineIcon>
            <TimelineBody>
              <TimelineMsg>{formatEntry(e)}</TimelineMsg>
              <TimelineMeta>
                {dayjs(e.created_at).format("DD MMM YYYY, h:mm A")}
                {e.actor_name ? ` · ${e.actor_name}` : ""}
              </TimelineMeta>
            </TimelineBody>
          </TimelineRow>
        );
      })}
    </Timeline>
  );
}
