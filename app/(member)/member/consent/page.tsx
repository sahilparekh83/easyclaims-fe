"use client";
import React from "react";
import styled from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memberListConsents, memberCreateConsent } from "@/imports/core/api";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { ShieldCheck } from "lucide-react";

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageWrap = styled.div`max-width: 720px; display: flex; flex-direction: column; gap: 20px;`;

const PageHeader = styled.div`display: flex; align-items: center; justify-content: space-between;`;

const PageTitle = styled.h1`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 19px; font-weight: 800; color: #161d26; margin: 0;
`;

const SectionCard = styled.div`
  background: #fff; border: 1px solid #e0e6ec; border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 18px 22px; border-bottom: 1px solid #e0e6ec;
  display: flex; align-items: center; gap: 9px;
`;

const CardTitle = styled.h3`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px; font-weight: 700; color: #161d26; margin: 0;
`;

const StatusBanner = styled.div<{ $hasConsent: boolean }>`
  display: flex; align-items: center; gap: 12px; padding: 14px 22px;
  background: ${p => p.$hasConsent ? "#f0fdf4" : "#fffbeb"};
  border-bottom: 1px solid ${p => p.$hasConsent ? "#bbf7d0" : "#fde68a"};
  color: ${p => p.$hasConsent ? "#166534" : "#92400e"};
  font-size: 14px; font-weight: 600;
`;

const ConsentRow = styled.div`
  padding: 18px 22px; border-top: 1px solid #f1f3f6;
  display: flex; align-items: flex-start; gap: 16px; justify-content: space-between;
  &:first-of-type { border-top: none; }
`;

const ConsentInfo = styled.div`flex: 1;`;

const ConsentTitle = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px; font-weight: 600; color: #161d26;
`;

const ConsentDesc = styled.div`font-size: 12px; color: #6b7a8c; margin-top: 3px; line-height: 1.5;`;

const ConsentTimestamp = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 11px; color: #6b7a8c; margin-top: 5px;
`;

const GrantedBadge = styled.span`
  font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px;
  background: #dcfce7; color: #166534; white-space: nowrap;
`;

const NotGrantedBadge = styled.span`
  font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px;
  background: #f1f5f9; color: #6b7a8c; white-space: nowrap;
`;

const DPDPNote = styled.div`
  background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;
  padding: 12px 16px; font-size: 12px; color: #8a6113; line-height: 1.5;
`;

const HistoryCard = styled(SectionCard)``;

const HistoryRow = styled.div`
  display: flex; align-items: center; gap: 12px; padding: 13px 22px;
  border-top: 1px solid #f1f3f6;
  &:first-child { border-top: none; }
`;

const MonoText = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 12.5px; color: #161d26;
`;

const AccentBtn = styled.button`
  display: inline-flex; align-items: center; gap: 7px;
  background: #0050b0; color: #fff; border: none; border-radius: 9px;
  padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  &:hover { background: #0046a0; }
  &:disabled { opacity: 0.6; cursor: default; }
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemberConsentPage() {
  const queryClient = useQueryClient();

  const { data: consentsData, isLoading } = useQuery({
    queryKey: ["member", "consents"],
    queryFn: memberListConsents,
    retry: false,
  });

  const rawConsents = consentsData?.data;
  const consents: any[] = Array.isArray(rawConsents) ? rawConsents : rawConsents ? [rawConsents] : [];
  const hasConsents = consents.length > 0;
  const latestConsent = consents[0] ?? null;

  const grantConsentMutation = useMutation({
    mutationFn: () => memberCreateConsent({ version: "1.0", source: "member_portal" }),
    onSuccess: () => { toast.success("Consent granted!"); queryClient.invalidateQueries({ queryKey: ["member", "consents"] }); },
    onError: () => { toast.error("Failed to grant consent"); },
  });

  const CONSENT_ITEMS = [
    {
      title: "DPDP Consent",
      desc: "You consent to the collection, storage, and processing of your personal data under the Digital Personal Data Protection Act 2023.",
    },
    {
      title: "Marketing Communications",
      desc: "Receive updates about new plans, offers, and health tips via email, WhatsApp, and SMS.",
    },
    {
      title: "Third-party Data Sharing",
      desc: "Allow your data to be shared with partner insurers and healthcare providers to process claims faster.",
    },
  ];

  return (
    <PageWrap>
      <PageHeader>
        <PageTitle>Privacy & Consent</PageTitle>
        {!hasConsents && !isLoading && (
          <AccentBtn onClick={() => grantConsentMutation.mutate()} disabled={grantConsentMutation.isPending}>
            <ShieldCheck size={14} />
            {grantConsentMutation.isPending ? "Granting…" : "Grant Consent"}
          </AccentBtn>
        )}
      </PageHeader>

      {/* Status banner */}
      {!isLoading && (
        <StatusBanner $hasConsent={hasConsents}>
          {hasConsents ? (
            <>
              <ShieldCheck size={16} />
              Consent Granted — Active consent on record
              {latestConsent && (
                <span style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 11, fontWeight: 400, marginLeft: 8, opacity: 0.75 }}>
                  v{latestConsent.version} · {latestConsent.consented_at ? dayjs(latestConsent.consented_at).format("DD MMM YYYY") : ""}
                </span>
              )}
            </>
          ) : (
            <><span>⚠</span> No consent on record. Please grant consent to use the platform.</>
          )}
        </StatusBanner>
      )}

      {/* Consent items */}
      <SectionCard>
        <CardHeader>
          <ShieldCheck size={15} color="#0050b0" />
          <CardTitle>Consent Settings</CardTitle>
        </CardHeader>
        {CONSENT_ITEMS.map((item, i) => (
          <ConsentRow key={i}>
            <ConsentInfo>
              <ConsentTitle>{item.title}</ConsentTitle>
              <ConsentDesc>{item.desc}</ConsentDesc>
              {hasConsents && latestConsent?.consented_at && (
                <ConsentTimestamp>Last updated: {dayjs(latestConsent.consented_at).format("DD MMM YYYY HH:mm")}</ConsentTimestamp>
              )}
            </ConsentInfo>
            {hasConsents ? <GrantedBadge>✓ Granted</GrantedBadge> : <NotGrantedBadge>Not granted</NotGrantedBadge>}
          </ConsentRow>
        ))}
        <div style={{ padding: "16px 22px", borderTop: "1px solid #f1f3f6" }}>
          <DPDPNote>
            🔒 Your data is handled under the Digital Personal Data Protection (DPDP) Act 2023. You have the right to access, correct, and erase your personal data at any time.
          </DPDPNote>
          {!hasConsents && (
            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
              <Button label="Grant Consent" icon="pi pi-check-circle" onClick={() => grantConsentMutation.mutate()} loading={grantConsentMutation.isPending} disabled={grantConsentMutation.isPending} />
            </div>
          )}
        </div>
      </SectionCard>

      {/* Consent history */}
      {consents.length > 0 && (
        <HistoryCard>
          <CardHeader><CardTitle>Consent History</CardTitle></CardHeader>
          {consents.map((c: any, i: number) => (
            <HistoryRow key={i}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#65a147", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#161d26" }}>Version {c.version}</div>
                <div style={{ fontSize: 12, color: "#6b7a8c" }}>{c.source ?? "member_portal"}</div>
              </div>
              <MonoText>{c.consented_at ? dayjs(c.consented_at).format("DD MMM YYYY HH:mm") : c.created_at ? dayjs(c.created_at).format("DD MMM YYYY HH:mm") : "—"}</MonoText>
            </HistoryRow>
          ))}
        </HistoryCard>
      )}
    </PageWrap>
  );
}
