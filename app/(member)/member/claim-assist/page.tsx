"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memberClaimAssist, memberListTickets } from "@/imports/core/api";
import { toast } from "react-toastify";
import styled, { keyframes } from "styled-components";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import dayjs from "dayjs";

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageWrap = styled.div`
  max-width: 680px;
`;

const PageTitle = styled.h1`
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: #161d26;
  margin: 0 0 4px;
`;

const PageSub = styled.p`
  font-size: 13px;
  color: #6b7a8c;
  margin: 0 0 24px;
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e0e6ec;
  border-radius: 16px;
  padding: 28px 32px;
  box-shadow: 0 1px 4px rgba(10,42,87,0.06);
  margin-bottom: 24px;
`;

const SectionLabel = styled.div`
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7a8c;
  margin-bottom: 10px;
`;

const FieldLabel = styled.label`
  display: block;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #3a4756;
  margin-bottom: 8px;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 12px 14px;
  border: 1.5px solid #e0e6ec;
  border-radius: 10px;
  font-size: 13.5px;
  font-family: 'Public Sans', system-ui, sans-serif;
  color: #161d26;
  background: #f7f9fb;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.15s;
  &:focus { outline: none; border-color: #0050b0; background: #fff; }
  &::placeholder { color: #b0bec9; }
`;

const CharCount = styled.div<{ $warn: boolean }>`
  font-size: 11px;
  color: ${p => p.$warn ? "#b45309" : "#9ca3af"};
  text-align: right;
  margin-top: 4px;
  margin-bottom: 20px;
`;

const spin = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;

const Spinner = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
`;

const SubmitBtn = styled.button`
  width: 100%;
  height: 46px;
  background: #0050b0;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  &:hover:not(:disabled) { background: #0046a0; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`;

const ResultCard = styled.div`
  margin-top: 24px;
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 14px;
  padding: 22px 26px;
`;

const ResultHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
`;

const ResultTitle = styled.div`
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 15px;
  font-weight: 800;
  color: #15803d;
`;

const TicketRef = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 11px;
  color: #6b7a8c;
  margin-top: 2px;
`;

const DupBadge = styled.span`
  display: inline-block;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 999px;
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
  margin-left: 8px;
`;

const SummaryText = styled.p`
  font-size: 13.5px;
  color: #374151;
  margin: 0 0 16px;
  line-height: 1.55;
`;

const DocList = styled.ul`
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const DocItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #374151;
`;

const DocDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #16a34a;
  margin-top: 6px;
  flex-shrink: 0;
`;

const NextStepsBox = styled.div`
  background: #fff;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
  color: #374151;
  line-height: 1.55;
`;

// ─── History ──────────────────────────────────────────────────────────────────

const HistoryWrap = styled.div`
  margin-top: 8px;
`;

const HistoryTitle = styled.div`
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #6b7a8c;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 10px;
`;

const TicketRow = styled.div`
  background: #fff;
  border: 1px solid #e0e6ec;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TicketMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

const TicketSummary = styled.div`
  font-size: 13px;
  color: #161d26;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TicketDate = styled.div`
  font-size: 11px;
  color: #9ca3af;
  margin-top: 3px;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  white-space: nowrap;
  background: ${p =>
    p.$status === "open" ? "#fef9c3" :
    p.$status === "in_progress" ? "#dbeafe" :
    "#f0fdf4"};
  color: ${p =>
    p.$status === "open" ? "#854d0e" :
    p.$status === "in_progress" ? "#1d4ed8" :
    "#15803d"};
`;

// ─── Component ────────────────────────────────────────────────────────────────

interface ClaimResult {
  ticket_id: string;
  is_duplicate: boolean;
  incident_summary: string;
  required_documents: string[];
  next_steps: string;
}

export default function ClaimAssistPage() {
  const qc = useQueryClient();
  const [incident, setIncident] = useState("");
  const [result, setResult] = useState<ClaimResult | null>(null);

  const { data: ticketsData } = useQuery({
    queryKey: ["member", "tickets"],
    queryFn: () => memberListTickets({ limit: 10 }),
  });
  const tickets: any[] = ticketsData?.data ?? [];

  const mutation = useMutation({
    mutationFn: () => memberClaimAssist({ claim_type: "General", incident_details: incident }),
    onSuccess: (res) => {
      setResult(res?.data);
      setIncident("");
      toast.success("Ticket raised — our team will follow up shortly");
      qc.invalidateQueries({ queryKey: ["member", "tickets"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Something went wrong. Please try again.");
    },
  });

  const canSubmit = incident.trim().length >= 20 && !mutation.isPending;

  return (
    <PageWrap>
      <PageTitle>Claim Assistance</PageTitle>
      <PageSub>Describe your incident — AI will guide you with required documents and next steps.</PageSub>

      <Card>
        <div>
          <FieldLabel htmlFor="incident">Describe your incident</FieldLabel>
          <Textarea
            id="incident"
            placeholder="e.g. I was hospitalised for 3 days due to dengue fever and my insurer rejected my claim saying documents are incomplete..."
            value={incident}
            onChange={e => { setIncident(e.target.value); setResult(null); }}
          />
          <CharCount $warn={incident.length > 0 && incident.trim().length < 20}>
            {incident.trim().length < 20 && incident.length > 0
              ? `${20 - incident.trim().length} more characters needed`
              : `${incident.length} characters`}
          </CharCount>
        </div>

        <SubmitBtn onClick={() => mutation.mutate()} disabled={!canSubmit}>
          {mutation.isPending ? <><Spinner />Processing…</> : "Submit"}
        </SubmitBtn>

        {result && (
          <ResultCard>
            <ResultHeader>
              <CheckCircle2 size={22} color="#16a34a" />
              <div>
                <ResultTitle>
                  Ticket Raised
                  {result.is_duplicate && <DupBadge><AlertTriangle size={9} style={{ marginRight: 3 }} />Possible duplicate</DupBadge>}
                </ResultTitle>
                <TicketRef>Ref: {result.ticket_id}</TicketRef>
              </div>
            </ResultHeader>

            <SectionLabel style={{ color: "#15803d" }}>Summary</SectionLabel>
            <SummaryText>{result.incident_summary}</SummaryText>

            {result.required_documents?.length > 0 && (
              <>
                <SectionLabel style={{ color: "#15803d" }}>Documents Required</SectionLabel>
                <DocList>
                  {result.required_documents.map((doc, i) => (
                    <DocItem key={i}>
                      <DocDot />
                      {doc}
                    </DocItem>
                  ))}
                </DocList>
              </>
            )}

            <SectionLabel style={{ color: "#15803d" }}>Next Steps</SectionLabel>
            <NextStepsBox>{result.next_steps}</NextStepsBox>
          </ResultCard>
        )}
      </Card>

      {tickets.length > 0 && (
        <HistoryWrap>
          <HistoryTitle>My Tickets</HistoryTitle>
          {tickets.map((t: any) => (
            <TicketRow key={t.id}>
              <Clock size={15} color="#b0bec9" style={{ flexShrink: 0 }} />
              <TicketMeta>
                <TicketSummary>{t.summary || "—"}</TicketSummary>
                <TicketDate>{t.created_at ? dayjs(t.created_at).format("DD MMM YYYY, HH:mm") : "—"}</TicketDate>
              </TicketMeta>
              <StatusBadge $status={t.status}>{t.status?.replace("_", " ")}</StatusBadge>
            </TicketRow>
          ))}
        </HistoryWrap>
      )}
    </PageWrap>
  );
}
