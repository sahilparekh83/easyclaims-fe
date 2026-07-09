"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ChevronLeft, Upload, FileText, User, Bot, ShieldCheck, Eye, Download } from "lucide-react";
import dayjs from "dayjs";
import {
  memberGetClaim, memberListClaimDocTypes, memberUploadClaimDocument,
  memberViewClaimDocument, memberDownloadClaimDocument,
} from "@/imports/core/api";
import StatusBadge from "@/components/ui/StatusBadge";
import { getApiError } from "@/imports/core/errors";

const PageWrap = styled.div`max-width: 900px; display: flex; flex-direction: column; gap: 16px;`;

const Back = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer; color: #6b7a8c;
  font-size: 13px; font-weight: 600; padding: 0; align-self: flex-start;
  &:hover { color: #0050b0; }
`;

const Card = styled.div`
  background: #fff; border: 1px solid #e0e6ec; border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  padding: 22px 24px;
`;

const HeaderRow = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
`;

const ClaimNumber = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 18px; font-weight: 800; color: #161d26;
`;

const AgentRow = styled.div`
  display: flex; align-items: center; gap: 8px; margin-top: 10px;
  font-size: 13px; color: #3a4756;
`;

const InfoGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px; margin-top: 18px;
`;

const InfoField = styled.div``;
const InfoLabel = styled.div`font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; color: #9ca3af; margin-bottom: 3px;`;
const InfoValue = styled.div`font-size: 13.5px; color: #161d26; font-weight: 600;`;

const SectionTitle = styled.h3`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14.5px; font-weight: 700; color: #161d26; margin: 0 0 14px;
`;

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

const DocRow = styled.div`
  display: flex; align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid #f1f3f6;
  &:first-child { border-top: none; }
`;

const DocIcon = styled.div`
  width: 30px; height: 30px; border-radius: 8px; background: #f7f9fb;
  display: flex; align-items: center; justify-content: center; color: #6b7a8c; flex: none;
`;

const UploadRow = styled.div`
  display: flex; gap: 8px; margin-top: 14px;
`;

const Select = styled.select`
  height: 38px; border: 1.5px solid #e0e6ec; border-radius: 8px; padding: 0 10px;
  font-size: 13px; color: #161d26; background: #f7f9fb; outline: none; cursor: pointer;
`;

const FileBtn = styled.label`
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  background: #0050b0; color: #fff; border-radius: 8px; padding: 0 14px; height: 38px;
  font-size: 13px; font-weight: 600;
  &:hover { background: #0046a0; }
`;

interface TimelineEntry {
  id: string; actor_type: string; actor_name: string | null; message: string;
  old_status: string | null; new_status: string | null; created_at: string;
}
interface Document { id: string; doc_type: string; file_name: string; uploaded_by: string; created_at: string; }

function titleCase(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

export default function MemberClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const claimId = params.id as string;
  const [docType, setDocType] = useState("Other");
  const [uploading, setUploading] = useState(false);
  const [docActionId, setDocActionId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["member", "claim", claimId],
    queryFn: () => memberGetClaim(claimId),
  });
  const { data: docTypesData } = useQuery({ queryKey: ["member", "claim-doc-types"], queryFn: memberListClaimDocTypes });
  const docTypes: string[] = (docTypesData as any)?.data ?? ["Other"];

  const claim: any = (data as any)?.data;
  const timeline: TimelineEntry[] = claim?.timeline ?? [];
  const documents: Document[] = claim?.documents ?? [];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !claim) return;
    setUploading(true);
    try {
      await memberUploadClaimDocument(claim.id, docType, file);
      toast.success("Document uploaded");
      queryClient.invalidateQueries({ queryKey: ["member", "claim", claimId] });
    } catch (err: any) {
      toast.error(getApiError(err, "Failed to upload document"));
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = async (doc: Document) => {
    setDocActionId(doc.id);
    try {
      const blob = await memberViewClaimDocument(claimId, doc.id);
      const url = URL.createObjectURL(new Blob([blob]));
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      toast.error("Could not load the document");
    } finally {
      setDocActionId(null);
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    setDocActionId(doc.id);
    try {
      const blob = await memberDownloadClaimDocument(claimId, doc.id);
      const url = URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url; a.download = doc.file_name || "document";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5_000);
    } catch {
      toast.error("Could not download the document");
    } finally {
      setDocActionId(null);
    }
  };

  if (isLoading) return <PageWrap>Loading…</PageWrap>;
  if (!claim) return <PageWrap>Claim not found.</PageWrap>;

  return (
    <PageWrap>
      <Back onClick={() => router.push("/member/claims")}><ChevronLeft size={16} /> My Claims</Back>

      <Card>
        <HeaderRow>
          <div>
            <ClaimNumber>{claim.claim_number}</ClaimNumber>
            {claim.assigned_agent_name && (
              <AgentRow>
                <ShieldCheck size={14} color="#0050b0" />
                Handled by <strong>{claim.assigned_agent_name}</strong>
              </AgentRow>
            )}
          </div>
          <StatusBadge value={titleCase(claim.status)} />
        </HeaderRow>

        <InfoGrid>
          <InfoField>
            <InfoLabel>Incident Date</InfoLabel>
            <InfoValue>{claim.incident_date ? dayjs(claim.incident_date).format("DD MMM YYYY") : "—"}</InfoValue>
          </InfoField>
          <InfoField>
            <InfoLabel>Claimed Amount</InfoLabel>
            <InfoValue>{claim.claimed_amount ? `₹${Number(claim.claimed_amount).toLocaleString("en-IN")}` : "—"}</InfoValue>
          </InfoField>
          <InfoField>
            <InfoLabel>Submitted</InfoLabel>
            <InfoValue>{dayjs(claim.created_at).format("DD MMM YYYY")}</InfoValue>
          </InfoField>
        </InfoGrid>

        {claim.description && (
          <div style={{ marginTop: 16, fontSize: 13.5, color: "#3a4756", background: "#f7f9fb", borderRadius: 8, padding: "10px 14px" }}>
            {claim.description}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Documents</SectionTitle>
        {documents.length === 0 ? (
          <div style={{ fontSize: 13, color: "#9ca3af" }}>No documents uploaded yet.</div>
        ) : (
          documents.map(d => (
            <DocRow key={d.id}>
              <DocIcon><FileText size={15} /></DocIcon>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#161d26" }}>{d.file_name}</div>
                <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{d.doc_type} · uploaded by {d.uploaded_by} · {dayjs(d.created_at).format("DD MMM YYYY")}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => handleViewDocument(d)} disabled={docActionId === d.id} title="View document"
                  style={{ background: "none", border: "1px solid #e0e6ec", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "#6b7a8c", display: "inline-flex", alignItems: "center" }}
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => handleDownloadDocument(d)} disabled={docActionId === d.id} title="Download document"
                  style={{ background: "none", border: "1px solid #e0e6ec", borderRadius: 7, padding: "5px 8px", cursor: "pointer", color: "#6b7a8c", display: "inline-flex", alignItems: "center" }}
                >
                  <Download size={14} />
                </button>
              </div>
            </DocRow>
          ))
        )}
        <UploadRow>
          <Select value={docType} onChange={e => setDocType(e.target.value)}>
            {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
          <FileBtn>
            <Upload size={14} /> {uploading ? "Uploading…" : "Upload document"}
            <input type="file" style={{ display: "none" }} onChange={handleFileSelect} disabled={uploading} />
          </FileBtn>
        </UploadRow>
      </Card>

      <Card>
        <SectionTitle>Timeline</SectionTitle>
        <Timeline>
          {timeline.map(t => (
            <TimelineRow key={t.id}>
              <TimelineIcon $actor={t.actor_type}>
                {t.actor_type === "member" ? <User size={13} /> : t.actor_type === "system" ? <Bot size={13} /> : <ShieldCheck size={13} />}
              </TimelineIcon>
              <TimelineBody>
                <TimelineMsg>{t.message}</TimelineMsg>
                <TimelineMeta>{dayjs(t.created_at).format("DD MMM YYYY, h:mm A")}{t.actor_name ? ` · ${t.actor_name}` : ""}</TimelineMeta>
              </TimelineBody>
            </TimelineRow>
          ))}
        </Timeline>
      </Card>
    </PageWrap>
  );
}
