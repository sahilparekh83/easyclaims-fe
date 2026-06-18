"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { partnerGetProfile, partnerUpdateProfile } from "@/imports/core/api";
import { InputText } from "primereact/inputtext";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Copy, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import styled from "styled-components";
import dayjs from "dayjs";

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

const Divider = styled.div`
  height: 1px;
  background: #e0e6ec;
  margin-bottom: 20px;
`;

const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
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

const EditBtn = styled.button`
  height: 32px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #e0e6ec;
  background: #fff;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #3a4756;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover { background: #f7f9fb; }
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

const FormWrap = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FieldLabel = styled.label`
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7a8c;
`;

const Err = styled.small`
  color: #dc2626;
  font-size: 0.75rem;
`;

const SaveBtn = styled.button`
  width: 100%;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: #0050b0;
  color: #fff;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #0046a0; }
  &:disabled { opacity: 0.6; cursor: default; }
`;

const CancelBtn = styled.button`
  width: 100%;
  height: 38px;
  border-radius: 10px;
  border: 1px solid #e0e6ec;
  background: #fff;
  color: #3a4756;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #f7f9fb; }
`;

const Skeleton = styled.div`
  height: 18px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e0e6ec 25%, #f7f9fb 50%, #e0e6ec 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  name: string;
  email: string;
  mobile_no: string;
  api_key?: string;
  partner_type?: string;
  city?: string;
  is_active?: boolean;
  created_at?: string;
}

interface EditFormValues {
  name: string;
  mobile_no: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PartnerProfilePage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["partner", "profile"],
    queryFn: partnerGetProfile,
  });

  const profile: ProfileData | undefined = (data as any)?.data;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormValues>();

  const updateMutation = useMutation({
    mutationFn: (values: EditFormValues) =>
      partnerUpdateProfile({ name: values.name, mobile_no: values.mobile_no }),
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["partner", "profile"] });
      setEditing(false);
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  function handleEditOpen() {
    if (profile) reset({ name: profile.name, mobile_no: profile.mobile_no });
    setEditing(true);
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

  return (
    <Page>
      {/* ── Left: Profile card ── */}
      <Card>
        <CardHeader>
          <CardTitle>Partner profile</CardTitle>
          {!editing && (
            <EditBtn onClick={handleEditOpen}>
              <i className="pi pi-pencil" style={{ fontSize: 12 }} />
              Edit
            </EditBtn>
          )}
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...Array(4)].map((_, i) => <Skeleton key={i} style={{ width: i === 0 ? "60%" : "100%" }} />)}
            </div>
          ) : !editing ? (
            <>
              <AvatarRow>
                <Avatar>{initials(profile?.name)}</Avatar>
                <NameBlock>
                  <PartnerName>{profile?.name || "—"}</PartnerName>
                  <TypeBadge $type={partnerType}>{partnerType}</TypeBadge>
                </NameBlock>
              </AvatarRow>
              <Divider />
              <InfoGrid>
                <InfoRow>
                  <InfoLabel>Email</InfoLabel>
                  <InfoValue>{profile?.email || "—"}</InfoValue>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Mobile</InfoLabel>
                  <InfoValue>{profile?.mobile_no || "—"}</InfoValue>
                </InfoRow>
                {profile?.city && (
                  <InfoRow>
                    <InfoLabel>City</InfoLabel>
                    <InfoValue style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <MapPin size={13} color="#6b7a8c" />
                      {profile.city}
                    </InfoValue>
                  </InfoRow>
                )}
                <InfoRow>
                  <InfoLabel>Status</InfoLabel>
                  <div>
                    <StatusPill $active={profile?.is_active !== false}>
                      {profile?.is_active !== false ? "Active" : "Inactive"}
                    </StatusPill>
                  </div>
                </InfoRow>
                {profile?.created_at && (
                  <InfoRow>
                    <InfoLabel>Partner since</InfoLabel>
                    <InfoValue>{dayjs(profile.created_at).format("DD MMM YYYY")}</InfoValue>
                  </InfoRow>
                )}
              </InfoGrid>
            </>
          ) : (
            <FormWrap onSubmit={handleSubmit(v => updateMutation.mutate(v))} noValidate>
              <Field>
                <FieldLabel htmlFor="p-name">Name *</FieldLabel>
                <InputText
                  id="p-name"
                  placeholder="Full name"
                  {...register("name", { required: "Name is required" })}
                  className={errors.name ? "p-invalid" : ""}
                  style={{ width: "100%" }}
                />
                {errors.name && <Err>{errors.name.message}</Err>}
              </Field>
              <Field>
                <FieldLabel htmlFor="p-mobile">Mobile</FieldLabel>
                <InputText
                  id="p-mobile"
                  placeholder="+91 98765 43210"
                  {...register("mobile_no", {
                    pattern: { value: /^\+?[\d\s\-()]{7,15}$/, message: "Invalid mobile (7–15 digits)" },
                  })}
                  className={errors.mobile_no ? "p-invalid" : ""}
                  style={{ width: "100%" }}
                />
                {errors.mobile_no && <Err>{errors.mobile_no.message}</Err>}
              </Field>
              <Field>
                <FieldLabel>Email (read-only)</FieldLabel>
                <InputText value={profile?.email ?? ""} disabled style={{ width: "100%" }} />
              </Field>
              <SaveBtn type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </SaveBtn>
              <CancelBtn type="button" onClick={() => { setEditing(false); reset(); }}>
                Cancel
              </CancelBtn>
            </FormWrap>
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
      </RightCol>
    </Page>
  );
}
