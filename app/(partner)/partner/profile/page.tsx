"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { partnerGetProfile, partnerSubmitChangeRequest, partnerListChangeRequests } from "@/imports/core/api";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "react-toastify";
import styled from "styled-components";
import dayjs from "dayjs";
import { getApiError } from "@/imports/core/errors";

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  max-width: 960px;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 20px;
  align-items: start;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const Card = styled.div`
  background: #fff;
  border: 1px solid #e0e6ec;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  overflow: hidden;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid #e0e6ec;
`;

const CardTitle = styled.h3`
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #161d26;
  margin: 0;
`;

const CardBody = styled.div`
  padding: 22px;
`;

const AvatarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
`;

const Avatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #0a2a57;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  flex-shrink: 0;
`;

const NameBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const PartnerName = styled.div`
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 20px;
  font-weight: 800;
  color: #161d26;
  letter-spacing: -0.01em;
`;

const TypeBadge = styled.span<{ $type: string }>`
  display: inline-block;
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 999px;
  padding: 3px 11px;
  background: ${p => p.$type === 'Broker' ? '#eff6ff' : '#f0fdf4'};
  color: ${p => p.$type === 'Broker' ? '#1d4ed8' : '#15803d'};
`;

const StatusPill = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  padding: 3px 11px;
  background: ${p => p.$active ? '#f0fdf4' : '#fef2f2'};
  color: ${p => p.$active ? '#15803d' : '#b91c1c'};
  &::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${p => p.$active ? '#22c55e' : '#ef4444'};
  }
`;

const InfoLabel = styled.div`
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #6b7a8c;
`;

const InfoValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #161d26;
`;

const RightCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const ApiKeyWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f7f9fb;
  border: 1px solid #e0e6ec;
  border-radius: 10px;
  padding: 10px 14px;
`;

const ApiKeyText = styled.span`
  flex: 1;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 12.5px;
  color: #161d26;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const IconBtn = styled.button`
  width: 30px;
  height: 30px;
  border: 1px solid #e0e6ec;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7a8c;
  flex-shrink: 0;
  &:hover { color: #0050b0; border-color: #0050b0; }
`;

const RateLimitRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0 0;
  border-top: 1px solid #e0e6ec;
  margin-top: 10px;
`;

const RateLimitLabel = styled.div`
  font-size: 12px;
  color: #6b7a8c;
  font-weight: 500;
`;

const RateLimitValue = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 12.5px;
  font-weight: 600;
  color: #161d26;
`;

const ApiBadge = styled.span`
  font-size: 11px;
  font-weight: 600;
  background: #f0fdf4;
  color: #15803d;
  border-radius: 999px;
  padding: 2px 9px;
`;

const Skeleton = styled.div`
  height: 18px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e0e6ec 25%, #f7f9fb 50%, #e0e6ec 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

const ProfileSection = styled.div`
  padding: 16px 22px;
  border-top: 1px solid #f1f2f6;
`;

const ProfileSectionTitle = styled.div`
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: #6b7a8c; margin-bottom: 12px;
`;

const ProfileGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const ProfileFieldLabel = styled.div`
  font-size: 11px; color: #9ca3af; margin-bottom: 2px;
`;

const ProfileFieldValue = styled.div`
  font-size: 13px; color: #161d26;
`;

const RequestBtn = styled.button`
  height: 32px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #0050b0;
  background: #eff6ff;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #0050b0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover { background: #dbeafe; }
`;

const FormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 0.25rem;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FormLabel = styled.label`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7a8c;
`;

const CRStatusChip = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 999px;
  background: ${p => p.$status === "approved" ? "#f0fdf4" : p.$status === "rejected" ? "#fef2f2" : "#fef9c3"};
  color: ${p => p.$status === "approved" ? "#15803d" : p.$status === "rejected" ? "#b91c1c" : "#854d0e"};
`;

const FooterRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PartnerProfile {
  id: string;
  user_id: string;
  name: string;
  partner_type: string;
  city: string | null;
  state: string | null;
  legal_company_name: string | null;
  trade_name: string | null;
  registered_address: string | null;
  pin_code: string | null;
  gstin: string | null;
  pan: string | null;
  authorized_signatory_name: string | null;
  designation: string | null;
  data_1: string | null;
  data_2: string | null;
  data_3: string | null;
  email: string | null;
  mobile_no: string | null;
  status: string;
  api_rate_limit: number;
  api_key?: string;
  is_active?: boolean;
  created_at?: string;
}

interface ChangeRequest {
  id: string;
  requested_fields: Record<string, string>;
  reason: string | null;
  status: string;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ProfileField({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <ProfileFieldLabel>{label}</ProfileFieldLabel>
      <ProfileFieldValue style={{ fontFamily: mono ? "'IBM Plex Mono', ui-monospace, monospace" : undefined, color: value ? "#161d26" : "#d1d5db" }}>
        {value || "—"}
      </ProfileFieldValue>
    </div>
  );
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  city: "City",
  state: "State",
  legal_company_name: "Legal Company Name",
  trade_name: "Trade Name / Brand",
  registered_address: "Registered Address",
  pin_code: "Pin Code",
  gstin: "GSTIN",
  pan: "PAN",
  authorized_signatory_name: "Authorized Signatory Name",
  designation: "Designation",
  data_1: "Data 1",
  data_2: "Data 2",
  data_3: "Data 3",
};

const CHANGEABLE_FIELDS = Object.keys(FIELD_LABELS);

// ─── Component ────────────────────────────────────────────────────────────────

export default function PartnerProfilePage() {
  const queryClient = useQueryClient();
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [showCRDialog, setShowCRDialog] = useState(false);
  const [crFields, setCrFields] = useState<Record<string, string>>({});
  const [crReason, setCrReason] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["partner", "profile"],
    queryFn: partnerGetProfile,
  });

  const { data: crData } = useQuery({
    queryKey: ["partner", "change-requests"],
    queryFn: () => partnerListChangeRequests({ limit: 20 }),
    enabled: showHistory,
  });

  const profile: PartnerProfile | undefined = (data as any)?.data;
  const changeRequests: ChangeRequest[] = (crData as any)?.data?.data ?? [];

  const submitCRMutation = useMutation({
    mutationFn: () => partnerSubmitChangeRequest({
      requested_fields: crFields,
      reason: crReason.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success("Change request submitted. Admin will review and apply the changes.");
      queryClient.invalidateQueries({ queryKey: ["partner", "change-requests"] });
      setShowCRDialog(false);
      setCrFields({});
      setCrReason("");
    },
    onError: (err: any) => {
      toast.error(getApiError(err, "Failed to submit change request"));
    },
  });

  function openCRDialog() {
    setCrFields({});
    setCrReason("");
    setShowCRDialog(true);
  }

  function maskApiKey(key: string) {
    if (!key) return "";
    return "•".repeat(Math.max(key.length - 4, 8)) + key.slice(-4);
  }

  async function handleCopyApiKey() {
    if (!profile?.api_key) return;
    try {
      await navigator.clipboard.writeText(profile.api_key);
      toast.success("API key copied!");
    } catch {
      toast.error("Failed to copy");
    }
  }

  const initials = (name?: string) =>
    (name || "P").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  const partnerType = profile?.partner_type || "Partner";

  const hasCRFields = Object.values(crFields).some(v => v.trim() !== "");

  return (
    <Page>
      {/* ── Left: Profile card ── */}
      <Card>
        <CardHeader>
          <CardTitle>Partner profile</CardTitle>
          <RequestBtn onClick={openCRDialog}>
            <i className="pi pi-send" style={{ fontSize: 12 }} />
            Request Change
          </RequestBtn>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...Array(4)].map((_, i) => <Skeleton key={i} style={{ width: i === 0 ? "60%" : "100%" }} />)}
            </div>
          ) : (
            <>
              <AvatarRow>
                <Avatar>{initials(profile?.name)}</Avatar>
                <NameBlock>
                  <PartnerName>{profile?.legal_company_name || profile?.name || "—"}</PartnerName>
                  {profile?.trade_name && (
                    <div style={{ fontSize: 13, color: "#6b7a8c", marginTop: 2 }}>{profile.trade_name}</div>
                  )}
                  <TypeBadge $type={partnerType}>{partnerType}</TypeBadge>
                </NameBlock>
                <StatusPill $active={profile?.is_active !== false}>
                  {profile?.status || (profile?.is_active !== false ? "Active" : "Inactive")}
                </StatusPill>
              </AvatarRow>

              {/* Company Details */}
              <ProfileSection>
                <ProfileSectionTitle>Company Details</ProfileSectionTitle>
                <ProfileGrid>
                  <ProfileField label="Legal Company Name" value={profile?.legal_company_name} />
                  <ProfileField label="Trade Name / Brand" value={profile?.trade_name} />
                  <ProfileField label="Partner Type" value={profile?.partner_type} />
                  <ProfileField label="GSTIN" value={profile?.gstin} mono />
                  <ProfileField label="PAN" value={profile?.pan} mono />
                </ProfileGrid>
              </ProfileSection>

              {/* Registered Address */}
              <ProfileSection>
                <ProfileSectionTitle>Registered Address</ProfileSectionTitle>
                <ProfileGrid>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <ProfileFieldLabel>Address</ProfileFieldLabel>
                    <ProfileFieldValue>{profile?.registered_address || "—"}</ProfileFieldValue>
                  </div>
                  <ProfileField label="City" value={profile?.city} />
                  <ProfileField label="State" value={profile?.state} />
                  <ProfileField label="Pin Code" value={profile?.pin_code} mono />
                </ProfileGrid>
              </ProfileSection>

              {/* Authorized Signatory & Contact */}
              <ProfileSection>
                <ProfileSectionTitle>Authorized Signatory &amp; Contact</ProfileSectionTitle>
                <ProfileGrid>
                  <ProfileField label="Signatory Name" value={profile?.authorized_signatory_name} />
                  <ProfileField label="Designation" value={profile?.designation} />
                  <ProfileField label="Email ID" value={profile?.email} />
                  <ProfileField label="Mobile Number" value={profile?.mobile_no} />
                </ProfileGrid>
              </ProfileSection>

              {/* Additional Data (only if any populated) */}
              {(profile?.data_1 || profile?.data_2 || profile?.data_3) && (
                <ProfileSection>
                  <ProfileSectionTitle>Additional Information</ProfileSectionTitle>
                  <ProfileGrid>
                    {profile?.data_1 && <ProfileField label="Data 1" value={profile.data_1} />}
                    {profile?.data_2 && <ProfileField label="Data 2" value={profile.data_2} />}
                    {profile?.data_3 && <ProfileField label="Data 3" value={profile.data_3} />}
                  </ProfileGrid>
                </ProfileSection>
              )}

              {profile?.created_at && (
                <ProfileSection>
                  <ProfileGrid>
                    <div>
                      <InfoLabel>Partner since</InfoLabel>
                      <InfoValue>{dayjs(profile.created_at).format("DD MMM YYYY")}</InfoValue>
                    </div>
                  </ProfileGrid>
                </ProfileSection>
              )}

              {/* Notice about read-only */}
              <div style={{
                margin: "0 22px 18px",
                padding: "10px 14px",
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: 8,
                fontSize: 12,
                color: "#0369a1",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <i className="pi pi-info-circle" style={{ fontSize: 13 }} />
                To update your details, use the <strong>&nbsp;Request Change&nbsp;</strong> button. An admin will review and apply the changes.
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* ── Right column ── */}
      <RightCol>
        {/* API Access card */}
        {(profile?.api_key || isLoading) && (
          <Card>
            <CardHeader>
              <CardTitle>API access</CardTitle>
              <ApiBadge>Active</ApiBadge>
            </CardHeader>
            <CardBody>
              <InfoLabel style={{ marginBottom: 8 }}>API key</InfoLabel>
              <ApiKeyWrap>
                <ApiKeyText>
                  {isLoading ? "••••••••••••••••••••••••••••••••" : profile?.api_key
                    ? apiKeyVisible ? profile.api_key : maskApiKey(profile.api_key)
                    : "—"}
                </ApiKeyText>
                {profile?.api_key && (
                  <>
                    <IconBtn type="button" title={apiKeyVisible ? "Hide" : "Reveal"} onClick={() => setApiKeyVisible(v => !v)}>
                      {apiKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </IconBtn>
                    <IconBtn type="button" title="Copy" onClick={handleCopyApiKey}>
                      <Copy size={14} />
                    </IconBtn>
                  </>
                )}
              </ApiKeyWrap>
              <RateLimitRow>
                <RateLimitLabel>Rate limit</RateLimitLabel>
                <RateLimitValue>600 req / min</RateLimitValue>
              </RateLimitRow>
              <p style={{ fontSize: 12, color: "#6b7a8c", marginTop: 12, lineHeight: 1.5 }}>
                Keep your API key secret. Use it to authenticate integration requests.
              </p>
            </CardBody>
          </Card>
        )}

        {/* Change Request History */}
        <Card>
          <CardHeader>
            <CardTitle>Change Requests</CardTitle>
            <button
              style={{ fontSize: 12, color: "#6b7a8c", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              onClick={() => setShowHistory(v => !v)}
            >
              {showHistory ? "Hide" : "Show history"}
            </button>
          </CardHeader>
          {showHistory && (
            <CardBody>
              {changeRequests.length === 0 ? (
                <div style={{ color: "#9ca3af", fontSize: 13 }}>No change requests submitted yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {changeRequests.map((cr) => (
                    <div key={cr.id} style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      padding: "10px 12px",
                      background: "#fafafa",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <CRStatusChip $status={cr.status}>
                          {cr.status.charAt(0).toUpperCase() + cr.status.slice(1)}
                        </CRStatusChip>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>
                          {cr.created_at ? dayjs(cr.created_at).format("DD MMM YYYY") : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#374151" }}>
                        {Object.entries(cr.requested_fields).map(([k, v]) => (
                          <div key={k}>
                            <span style={{ color: "#6b7280" }}>{FIELD_LABELS[k] ?? k}:</span>{" "}
                            <span style={{ fontWeight: 600 }}>{v}</span>
                          </div>
                        ))}
                      </div>
                      {cr.reason && (
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                          Reason: {cr.reason}
                        </div>
                      )}
                      {cr.admin_note && (
                        <div style={{ fontSize: 11, color: "#0369a1", marginTop: 4 }}>
                          Admin note: {cr.admin_note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          )}
        </Card>
      </RightCol>

      {/* ── Request Change Dialog ── */}
      <Dialog
        visible={showCRDialog}
        onHide={() => setShowCRDialog(false)}
        header="Request Profile Change"
        style={{ width: "560px" }}
        modal
        draggable={false}
        footer={
          <FooterRow>
            <Button
              label="Cancel"
              severity="secondary"
              outlined
              onClick={() => setShowCRDialog(false)}
              disabled={submitCRMutation.isPending}
            />
            <Button
              label="Submit Request"
              icon="pi pi-send"
              loading={submitCRMutation.isPending}
              disabled={!hasCRFields}
              onClick={() => submitCRMutation.mutate()}
            />
          </FooterRow>
        }
      >
        <div style={{ marginBottom: 12, fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
          Fill in only the fields you want to change. Leave others blank.
        </div>
        <FormGrid>
          {CHANGEABLE_FIELDS.map((field) => (
            <FormField key={field}>
              <FormLabel htmlFor={`cr-${field}`}>{FIELD_LABELS[field]}</FormLabel>
              <InputText
                id={`cr-${field}`}
                value={crFields[field] ?? ""}
                onChange={(e) => setCrFields(prev => ({ ...prev, [field]: e.target.value }))}
                placeholder={`New ${FIELD_LABELS[field].toLowerCase()}`}
                style={{ width: "100%" }}
              />
            </FormField>
          ))}
          <FormField>
            <FormLabel htmlFor="cr-reason">Reason (optional)</FormLabel>
            <InputTextarea
              id="cr-reason"
              value={crReason}
              onChange={(e) => setCrReason(e.target.value)}
              rows={2}
              placeholder="Why are you requesting this change?"
              style={{ width: "100%", resize: "vertical" }}
            />
          </FormField>
        </FormGrid>
      </Dialog>
    </Page>
  );
}
