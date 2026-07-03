"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import styled from "styled-components";
import dayjs from "dayjs";
import PolicyStatusBadge from "@/components/ui/PolicyStatusBadge";
import { memberGetPolicy, memberViewPolicyPdf } from "@/imports/core/api";

// ─── Styled ────────────────────────────────────────────────────────────────────

const PageWrap = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  overflow: hidden;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  flex-shrink: 0;
`;

const PolicyNo = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
`;

const PolicySub = styled.div`
  font-size: 0.8rem;
  color: #64748b;
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const LeftPanel = styled.div`
  width: 42%;
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid #e5e7eb;
  background: #fff;
`;

const PanelHeader = styled.div`
  padding: 14px 20px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
`;

const FieldTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
`;

const FieldRow = styled.tr`
  border-bottom: 1px solid #f1f5f9;
`;

const FieldKey = styled.td`
  padding: 9px 16px;
  font-weight: 600;
  color: #475569;
  width: 42%;
  text-transform: uppercase;
  font-size: 0.72rem;
  letter-spacing: 0.03em;
  vertical-align: middle;
`;

const FieldVal = styled.td`
  padding: 9px 10px 9px 0;
  color: #0f172a;
  vertical-align: middle;
  white-space: pre-wrap;
  line-height: 1.5;
`;

const RightPanel = styled.div`
  flex: 1;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
`;

const PdfFrame = styled.iframe`
  flex: 1;
  border: none;
  width: 100%;
`;

const NoPdf = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.875rem;
`;

// ─── Helpers ───────────────────────────────────────────────────────────────────

const SKIP_KEYS = new Set(["confidence", "validation_status", "validation_reason", "name_match"]);

function formatKey(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function toDisplayString(v: any): string {
  if (v === null || v === undefined) return "—";
  if (Array.isArray(v)) {
    return v.map(item =>
      typeof item === "object" ? Object.values(item).filter(Boolean).join(" · ") : String(item)
    ).join("\n");
  }
  if (typeof v === "object") {
    return Object.entries(v).map(([k, val]) => `${k}: ${val}`).join("\n");
  }
  return String(v);
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MemberPolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["member", "policy", id],
    queryFn: () => memberGetPolicy(id),
    enabled: !!id,
  });

  const policy = (data as any)?.data;
  const extractedFields: Record<string, any> = policy?.extracted_fields ?? {};
  const visibleFields = Object.entries(extractedFields).filter(([k]) => !SKIP_KEYS.has(k));

  useEffect(() => {
    if (!policy?.file_name) return;
    let objectUrl: string;
    memberViewPolicyPdf(id)
      .then((blob: Blob) => {
        objectUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(objectUrl);
      })
      .catch(() => {});
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [policy?.file_name, id]);

  return (
    <PageWrap>
      <TopBar>
        <button
          onClick={() => router.push("/member/policies")}
          style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center" }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <PolicyNo>{policy?.policy_number ?? "—"}</PolicyNo>
          <PolicySub>
            {policy?.policy_type ?? ""}
            {policy?.insurer ? ` · ${policy.insurer}` : ""}
          </PolicySub>
        </div>
        {policy?.status && (
          <PolicyStatusBadge status={policy.status} isRenewal={!!policy.previous_policy_id} />
        )}
      </TopBar>

      {isLoading ? (
        <div style={{ padding: "2rem", color: "#94a3b8" }}>Loading…</div>
      ) : (
        <Body>
          {/* Left — extracted fields */}
          <LeftPanel>
            <PanelHeader>Policy Details</PanelHeader>

            {/* Basic info always shown */}
            <FieldTable>
              <tbody>
                {policy?.sum_insured != null && (
                  <FieldRow>
                    <FieldKey>Sum Insured</FieldKey>
                    <FieldVal>₹{Number(policy.sum_insured).toLocaleString("en-IN")}</FieldVal>
                  </FieldRow>
                )}
                {(policy?.start_date || policy?.end_date) && (
                  <FieldRow>
                    <FieldKey>Policy Period</FieldKey>
                    <FieldVal>
                      {policy.start_date ? dayjs(policy.start_date).format("DD MMM YYYY") : "—"}
                      {" → "}
                      {policy.end_date ? dayjs(policy.end_date).format("DD MMM YYYY") : "—"}
                    </FieldVal>
                  </FieldRow>
                )}
                {policy?.insurer && (
                  <FieldRow>
                    <FieldKey>Insurer</FieldKey>
                    <FieldVal>{policy.insurer}</FieldVal>
                  </FieldRow>
                )}
                {policy?.vehicle_number && (
                  <FieldRow>
                    <FieldKey>Vehicle Number</FieldKey>
                    <FieldVal>{policy.vehicle_number}</FieldVal>
                  </FieldRow>
                )}
                {policy?.vehicle_type && (
                  <FieldRow>
                    <FieldKey>Vehicle Type</FieldKey>
                    <FieldVal>{policy.vehicle_type}</FieldVal>
                  </FieldRow>
                )}
                {policy?.vehicle_owner_family_member_id && (
                  <FieldRow>
                    <FieldKey>Vehicle Owner</FieldKey>
                    <FieldVal>
                      {(policy.linked_family_members ?? []).find(
                        (m: any) => m.id === policy.vehicle_owner_family_member_id
                      )?.name ?? "—"}
                    </FieldVal>
                  </FieldRow>
                )}
                {(policy?.linked_nominees ?? []).length > 0 && (
                  <FieldRow>
                    <FieldKey>Nominee(s)</FieldKey>
                    <FieldVal>
                      {policy.linked_nominees.map((n: any) => `${n.name} (${n.relation} · ${n.share_percent}%)`).join(", ")}
                    </FieldVal>
                  </FieldRow>
                )}
              </tbody>
            </FieldTable>

            {/* AI extracted fields */}
            {visibleFields.length > 0 && (
              <>
                <PanelHeader style={{ marginTop: 0 }}>Extracted Fields</PanelHeader>
                <FieldTable>
                  <tbody>
                    {visibleFields.map(([k, v]) => (
                      <FieldRow key={k}>
                        <FieldKey>{formatKey(k)}</FieldKey>
                        <FieldVal>{toDisplayString(v)}</FieldVal>
                      </FieldRow>
                    ))}
                  </tbody>
                </FieldTable>
              </>
            )}

            {visibleFields.length === 0 && !policy?.sum_insured && (
              <div style={{ padding: "1.5rem", color: "#94a3b8", fontSize: "0.8rem" }}>
                No extracted data available yet.
              </div>
            )}
          </LeftPanel>

          {/* Right — PDF */}
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
