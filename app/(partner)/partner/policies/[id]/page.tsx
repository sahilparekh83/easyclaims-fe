"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import styled from "styled-components";
import { partnerGetPolicy, partnerViewPolicyPdf } from "@/imports/core/api";

// ─── Styled (same as admin policy detail page) ────────────────────────────────

const PageWrap = styled.div`
  display: flex; flex-direction: column;
  height: calc(100vh - 64px); overflow: hidden;
`;

const TopBar = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 24px; border-bottom: 1px solid #e5e7eb;
  background: #fff; flex-shrink: 0;
`;

const TopLeft = styled.div`display: flex; align-items: center; gap: 12px;`;

const PolicyNo = styled.div`font-size: 1rem; font-weight: 700; color: #0f172a;`;
const MemberName = styled.div`font-size: 0.8rem; color: #64748b;`;

const StatusBadge = styled.span<{ $s: string }>`
  font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px;
  background: ${p =>
    p.$s === "active"      ? "#f0fdf4" :
    p.$s === "rejected"    ? "#fef2f2" :
    p.$s === "need_review" || p.$s === "pending" ? "#fffbeb" : "#f0f9ff"};
  color: ${p =>
    p.$s === "active"      ? "#16a34a" :
    p.$s === "rejected"    ? "#b91c1c" :
    p.$s === "need_review" || p.$s === "pending" ? "#b45309" : "#0369a1"};
`;

const Body = styled.div`display: flex; flex: 1; overflow: hidden;`;

const LeftPanel = styled.div`
  width: 42%; flex-shrink: 0; overflow-y: auto;
  border-right: 1px solid #e5e7eb; background: #fff;
`;

const PanelHeader = styled.div`
  padding: 14px 20px; font-size: 0.8rem; font-weight: 700;
  color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;
  border-bottom: 1px solid #f1f5f9; background: #f8fafc;
`;

const FieldTable = styled.table`width: 100%; border-collapse: collapse; font-size: 0.8rem;`;

const FieldRow = styled.tr`
  border-bottom: 1px solid #f1f5f9;
  &:hover { background: #f8fafc; }
`;

const FieldKey = styled.td`
  padding: 9px 16px; font-weight: 600; color: #475569; width: 42%;
  text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.03em; vertical-align: top;
`;

const FieldVal = styled.td`
  padding: 9px 10px 9px 0; color: #0f172a;
  white-space: pre-wrap; line-height: 1.5; vertical-align: top;
`;

const RightPanel = styled.div`
  flex: 1; background: #f1f5f9; display: flex; flex-direction: column;
`;

const PdfFrame = styled.iframe`flex: 1; border: none; width: 100%;`;

const NoPdf = styled.div`
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: #94a3b8; font-size: 0.875rem;
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SKIP_KEYS = new Set(["confidence", "validation_status", "validation_reason", "name_match"]);

function formatKey(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function toDisplayString(v: any): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.map(item =>
    typeof item === "object" ? Object.values(item).filter(Boolean).join(" · ") : String(item)
  ).join("\n");
  if (typeof v === "object") return Object.entries(v).map(([k, val]) => `${k}: ${val}`).join("\n");
  return String(v);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerPolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["partner", "policy", id],
    queryFn: () => partnerGetPolicy(id),
    enabled: !!id,
  });

  const policy = (data as any)?.data;
  const extractedFields: Record<string, any> = policy?.extracted_fields ?? {};
  const status: string = policy?.status ?? "";

  useEffect(() => {
    if (!policy?.has_file) return;
    let objectUrl: string;
    partnerViewPolicyPdf(id)
      .then((blob: Blob) => {
        objectUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(objectUrl);
      })
      .catch(() => {});
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [policy?.has_file, id]);

  const visibleFields = Object.entries(extractedFields).filter(([k]) => !SKIP_KEYS.has(k));

  return (
    <PageWrap>
      <TopBar>
        <TopLeft>
          <button
            onClick={() => router.push("/partner/policies")}
            style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center" }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <PolicyNo>{policy?.policy_number || "—"}</PolicyNo>
            <MemberName>{policy?.member_name ?? ""}</MemberName>
          </div>
          {status && (
            <StatusBadge $s={status}>
              {status === "processing"                         ? "Processing" :
               status === "need_review" || status === "pending" ? "Need Review" :
               status === "active"                            ? "Approved" :
               status === "rejected"                          ? "Rejected" : status}
            </StatusBadge>
          )}
        </TopLeft>
      </TopBar>

      {isLoading ? (
        <div style={{ padding: "2rem", color: "#94a3b8" }}>Loading…</div>
      ) : (
        <Body>
          <LeftPanel>
            <PanelHeader>Extracted Fields</PanelHeader>
            {visibleFields.length === 0 ? (
              <div style={{ padding: "1.5rem", color: "#94a3b8", fontSize: "0.8rem" }}>
                No extracted data available.
              </div>
            ) : (
              <FieldTable>
                <tbody>
                  {visibleFields.map(([k, v]) => (
                    <FieldRow key={k}>
                      <FieldKey>{formatKey(k)}</FieldKey>
                      <FieldVal>{toDisplayString(v) || "—"}</FieldVal>
                    </FieldRow>
                  ))}
                </tbody>
              </FieldTable>
            )}
          </LeftPanel>

          <RightPanel>
            <PanelHeader>Policy Document</PanelHeader>
            {pdfBlobUrl ? (
              <PdfFrame src={pdfBlobUrl} title="Policy PDF" />
            ) : (
              <NoPdf>No document uploaded</NoPdf>
            )}
          </RightPanel>
        </Body>
      )}
    </PageWrap>
  );
}
