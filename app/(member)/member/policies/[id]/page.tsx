"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import styled from "styled-components";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import PolicyStatusBadge from "@/components/ui/PolicyStatusBadge";
import CategoryConfidenceChip from "@/components/ui/CategoryConfidenceChip";
import { memberGetPolicy, memberViewPolicyPdf, memberUpdatePolicy, memberListFamily, memberListNominees } from "@/imports/core/api";
import { getApiError } from "@/imports/core/errors";

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

const CompleteCard = styled.div`
  margin: 12px 16px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const CompleteTitle = styled.div`
  font-size: 12.5px;
  font-weight: 700;
  color: #1d4ed8;
`;

const CompleteField = styled.select`
  height: 36px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 0 10px;
  font-size: 13px;
  color: #0f172a;
  background: #fff;
  outline: none;
`;

const CompleteInput = styled.input`
  height: 36px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 0 10px;
  font-size: 13px;
  color: #0f172a;
  background: #fff;
  outline: none;
`;

const CompleteSaveBtn = styled.button`
  align-self: flex-start;
  height: 34px;
  padding: 0 16px;
  border-radius: 8px;
  border: none;
  background: #0050b0;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover:not(:disabled) { background: #0046a0; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
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
  const queryClient = useQueryClient();
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleOwnerId, setVehicleOwnerId] = useState("");
  const [nomineeId, setNomineeId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["member", "policy", id],
    queryFn: () => memberGetPolicy(id),
    enabled: !!id,
    refetchInterval: (query: any) => query.state.data?.data?.status === "processing" ? 4000 : false,
  });

  const policy = (data as any)?.data;
  const extractedFields: Record<string, any> = policy?.extracted_fields ?? {};
  const visibleFields = Object.entries(extractedFields).filter(([k]) => !SKIP_KEYS.has(k));

  const policyTypeLower = (policy?.policy_type ?? "").toLowerCase();
  const needsVehicleDetails = policyTypeLower === "motor" && !policy?.vehicle_number;
  const needsNominee = policyTypeLower === "life" && (policy?.linked_nominees ?? []).length === 0;

  const { data: familyData } = useQuery({
    queryKey: ["member", "family"], queryFn: memberListFamily, enabled: needsVehicleDetails,
  });
  const { data: nomineesData } = useQuery({
    queryKey: ["member", "nominees"], queryFn: memberListNominees, enabled: needsNominee,
  });
  const familyMembers: any[] = (familyData as any)?.data?.family ?? (familyData as any)?.data ?? [];
  const nominees: any[] = (nomineesData as any)?.data ?? [];

  const detailsMutation = useMutation({
    mutationFn: (payload: object) => memberUpdatePolicy(id, payload),
    onSuccess: () => {
      toast.success("Details saved!");
      queryClient.invalidateQueries({ queryKey: ["member", "policy", id] });
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to save details")),
  });

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
        <CategoryConfidenceChip category={policy?.policy_type} confidence={policy?.ai_confidence} status={policy?.status} />
      </TopBar>

      {isLoading ? (
        <div style={{ padding: "2rem", color: "#94a3b8" }}>Loading…</div>
      ) : (
        <Body>
          {/* Left — extracted fields */}
          <LeftPanel>
            <PanelHeader>Policy Details</PanelHeader>

            {policy?.status === "rejected" && extractedFields["validation_reason"] && (
              <div style={{ margin: "12px 16px", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, fontSize: 12.5, color: "#b91c1c", lineHeight: 1.5 }}>
                <strong>Rejected</strong> — {String(extractedFields["validation_reason"])}
              </div>
            )}

            {needsVehicleDetails && (
              <CompleteCard>
                <CompleteTitle>Complete Vehicle Details</CompleteTitle>
                <CompleteInput
                  placeholder="Vehicle Number (e.g. MH12AB1234)"
                  value={vehicleNumber}
                  onChange={e => setVehicleNumber(e.target.value)}
                />
                <CompleteField value={vehicleType} onChange={e => setVehicleType(e.target.value)}>
                  <option value="">Select vehicle type…</option>
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="Commercial">Commercial</option>
                </CompleteField>
                <CompleteField value={vehicleOwnerId} onChange={e => setVehicleOwnerId(e.target.value)}>
                  <option value="">Select vehicle owner…</option>
                  {familyMembers.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </CompleteField>
                <CompleteSaveBtn
                  disabled={detailsMutation.isPending || (!vehicleNumber && !vehicleType && !vehicleOwnerId)}
                  onClick={() => detailsMutation.mutate({
                    vehicle_number: vehicleNumber || undefined,
                    vehicle_type: vehicleType || undefined,
                    vehicle_owner_family_member_id: vehicleOwnerId || undefined,
                  })}
                >
                  {detailsMutation.isPending ? "Saving…" : "Save Vehicle Details"}
                </CompleteSaveBtn>
              </CompleteCard>
            )}

            {needsNominee && (
              <CompleteCard>
                <CompleteTitle>Add Nominee(s)</CompleteTitle>
                {nominees.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: "#64748b" }}>No nominees added yet. Add nominees first from the Nominees menu.</div>
                ) : (
                  <>
                    <CompleteField value={nomineeId} onChange={e => setNomineeId(e.target.value)}>
                      <option value="">Select nominee…</option>
                      {nominees.map((n: any) => <option key={n.id} value={n.id}>{n.name} ({n.relation})</option>)}
                    </CompleteField>
                    <CompleteSaveBtn
                      disabled={detailsMutation.isPending || !nomineeId}
                      onClick={() => detailsMutation.mutate({ nominee_ids: [nomineeId] })}
                    >
                      {detailsMutation.isPending ? "Saving…" : "Save Nominee"}
                    </CompleteSaveBtn>
                  </>
                )}
              </CompleteCard>
            )}

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
