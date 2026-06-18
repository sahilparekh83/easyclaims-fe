"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { memberGetProfile, memberUpdateProfile, memberListPartners } from "@/imports/core/api";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { Building2, CalendarDays, CreditCard, ShieldCheck } from "lucide-react";

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageWrap = styled.div`
  max-width: 1100px; display: grid;
  grid-template-columns: 1.1fr 1fr; gap: 20px; align-items: start;
  @media (max-width: 860px) { grid-template-columns: 1fr; }
`;

const SectionCard = styled.div`
  background: #fff; border: 1px solid #e0e6ec; border-radius: 14px;
  box-shadow: 0 1px 2px rgba(10,42,87,0.06), 0 2px 6px rgba(10,42,87,0.06);
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 18px 22px; border-bottom: 1px solid #e0e6ec;
`;

const CardTitle = styled.h3`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px; font-weight: 700; color: #161d26; margin: 0;
`;

const CardBody = styled.div`padding: 22px;`;

const InfoRow = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  padding: 11px 0; border-bottom: 1px solid #f1f3f6;
  &:last-child { border-bottom: none; }
`;

const InfoLabel = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: #6b7a8c;
`;

const InfoValue = styled.div`
  font-size: 14px; font-weight: 600; color: #161d26; text-align: right;
`;

const MonoValue = styled.div`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 13px; color: #161d26; font-weight: 500;
`;

const EnrollBadge = styled.span<{ $status: string }>`
  font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 999px;
  background: ${p => p.$status === "Active" ? "#dcfce7" : p.$status === "Expired" ? "#fee2e2" : "#fef3c7"};
  color: ${p => p.$status === "Active" ? "#166534" : p.$status === "Expired" ? "#991b1b" : "#92400e"};
`;

const PartnerTypeChip = styled.span`
  font-size: 10px; font-weight: 700; padding: 1px 8px; border-radius: 999px;
  background: #eff6ff; color: #0050b0; border: 1px solid #bfdbfe; margin-left: 6px;
`;

const FormGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;
`;

const FullCol = styled.div`grid-column: 1 / -1;`;

const FieldWrap = styled.div`
  display: flex; flex-direction: column; gap: 5px;
`;

const FieldLabel = styled.label`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 12px; font-weight: 600; color: #3a4756;
`;

const Divider = styled.hr`border: none; border-top: 1px solid #e0e6ec; margin: 18px 0;`;

const SectionLabel = styled.div`
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px; font-weight: 700; color: #161d26; margin-bottom: 12px;
`;

const CheckboxRow = styled.div`display: flex; gap: 20px; align-items: center; flex-wrap: wrap;`;

const CheckboxLabel = styled.label`
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; color: #3a4756; cursor: pointer;
`;

const SaveRow = styled.div`display: flex; justify-content: flex-end; margin-top: 18px;`;

const PartnerDropdownWrap = styled.div`
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
`;

// ─── Constants ────────────────────────────────────────────────────────────────

const genderOptions = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];
const languageOptions = [
  { label: "English", value: "English" }, { label: "Hindi", value: "Hindi" },
  { label: "Marathi", value: "Marathi" }, { label: "Gujarati", value: "Gujarati" },
  { label: "Tamil", value: "Tamil" }, { label: "Telugu", value: "Telugu" },
  { label: "Kannada", value: "Kannada" }, { label: "Bengali", value: "Bengali" },
];
const MOBILE_PATTERN = /^\+?[\d\s\-()]{7,15}$/;
const PIN_PATTERN = /^\d{6}$/;

interface ProfileFormValues {
  name: string; mobile_no: string; gender: string; dob: string;
  address_line: string; address_city: string; address_state: string; address_pin: string;
  preferred_language: string; channel_email: boolean; channel_whatsapp: boolean; channel_voice: boolean;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemberProfilePage() {
  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery({ queryKey: ["member", "profile"], queryFn: memberGetProfile });
  const { data: partnersData } = useQuery({ queryKey: ["member", "partners"], queryFn: memberListPartners });

  const partners: any[] = (partnersData as any)?.data ?? [];
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const selectedPartner = partners.find(p => p.partner_id === selectedPartnerId) ?? partners[0] ?? null;
  const partnerOptions = partners.map(p => ({ label: p.partner_name ?? "Unknown", value: p.partner_id }));

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormValues>({
    defaultValues: { name: "", mobile_no: "", gender: "", dob: "", address_line: "", address_city: "", address_state: "", address_pin: "", preferred_language: "", channel_email: false, channel_whatsapp: false, channel_voice: false },
  });

  useEffect(() => {
    if (profileData?.data) {
      const d = profileData.data;
      reset({ name: d.name ?? "", mobile_no: d.mobile_no ?? "", gender: d.gender ?? "", dob: d.dob ?? "", address_line: d.address_line ?? "", address_city: d.address_city ?? "", address_state: d.address_state ?? "", address_pin: d.address_pin ?? "", preferred_language: d.preferred_language ?? "", channel_email: !!d.channel_email, channel_whatsapp: !!d.channel_whatsapp, channel_voice: !!d.channel_voice });
    }
  }, [profileData, reset]);

  const mutation = useMutation({
    mutationFn: (data: ProfileFormValues) => memberUpdateProfile(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["member", "profile"] }); toast.success("Profile updated!"); },
    onError: () => { toast.error("Failed to update profile"); },
  });

  const d = profileData?.data;

  return (
    <PageWrap>
      {/* Left: Edit form */}
      <SectionCard>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          {d && <div style={{ fontSize: 13, color: "#6b7a8c", marginTop: 4 }}>{d.name || d.email}</div>}
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <p style={{ color: "#6b7a8c" }}>Loading…</p>
          ) : (
            <form onSubmit={handleSubmit(v => mutation.mutate(v))} noValidate>
              <FormGrid>
                <FieldWrap>
                  <FieldLabel htmlFor="name">Full Name *</FieldLabel>
                  <Controller name="name" control={control} rules={{ required: "Name is required" }} render={({ field }) => (
                    <InputText id="name" {...field} className={errors.name ? "p-invalid" : ""} style={{ width: "100%" }} />
                  )} />
                  {errors.name && <small style={{ color: "#ef4444" }}>{errors.name.message}</small>}
                </FieldWrap>

                <FieldWrap>
                  <FieldLabel htmlFor="mobile_no">Mobile Number</FieldLabel>
                  <Controller name="mobile_no" control={control} rules={{ pattern: { value: MOBILE_PATTERN, message: "Invalid mobile number" } }} render={({ field }) => (
                    <InputText id="mobile_no" {...field} className={errors.mobile_no ? "p-invalid" : ""} style={{ width: "100%" }} placeholder="+91 98765 43210" />
                  )} />
                  {errors.mobile_no && <small style={{ color: "#ef4444" }}>{errors.mobile_no.message}</small>}
                </FieldWrap>

                <FieldWrap>
                  <FieldLabel htmlFor="gender">Gender</FieldLabel>
                  <Controller name="gender" control={control} render={({ field }) => (
                    <Dropdown id="gender" value={field.value} onChange={e => field.onChange(e.value)} options={genderOptions} placeholder="Select gender" style={{ width: "100%" }} />
                  )} />
                </FieldWrap>

                <FieldWrap>
                  <FieldLabel htmlFor="dob">Date of Birth</FieldLabel>
                  <Controller name="dob" control={control} render={({ field }) => (
                    <Calendar id="dob" value={field.value ? new Date(field.value) : null} onChange={e => { const v = e.value; field.onChange(v instanceof Date ? dayjs(v).format("YYYY-MM-DD") : ""); }} dateFormat="dd M yy" showIcon maxDate={new Date()} style={{ width: "100%" }} inputStyle={{ width: "100%" }} placeholder="Select date" />
                  )} />
                </FieldWrap>

                <FullCol>
                  <FieldWrap>
                    <FieldLabel htmlFor="address_line">Address</FieldLabel>
                    <Controller name="address_line" control={control} render={({ field }) => <InputText id="address_line" {...field} style={{ width: "100%" }} />} />
                  </FieldWrap>
                </FullCol>

                <FieldWrap>
                  <FieldLabel htmlFor="address_city">City</FieldLabel>
                  <Controller name="address_city" control={control} render={({ field }) => <InputText id="address_city" {...field} style={{ width: "100%" }} />} />
                </FieldWrap>

                <FieldWrap>
                  <FieldLabel htmlFor="address_state">State</FieldLabel>
                  <Controller name="address_state" control={control} render={({ field }) => <InputText id="address_state" {...field} style={{ width: "100%" }} />} />
                </FieldWrap>

                <FieldWrap>
                  <FieldLabel htmlFor="address_pin">PIN Code</FieldLabel>
                  <Controller name="address_pin" control={control} rules={{ pattern: { value: PIN_PATTERN, message: "PIN must be 6 digits" } }} render={({ field }) => (
                    <InputText id="address_pin" {...field} className={errors.address_pin ? "p-invalid" : ""} style={{ width: "100%" }} placeholder="400001" maxLength={6} />
                  )} />
                  {errors.address_pin && <small style={{ color: "#ef4444" }}>{errors.address_pin.message}</small>}
                </FieldWrap>

                <FieldWrap>
                  <FieldLabel htmlFor="preferred_language">Preferred Language</FieldLabel>
                  <Controller name="preferred_language" control={control} render={({ field }) => (
                    <Dropdown id="preferred_language" value={field.value} options={languageOptions} onChange={e => field.onChange(e.value)} placeholder="Select language" style={{ width: "100%" }} />
                  )} />
                </FieldWrap>
              </FormGrid>

              <Divider />
              <SectionLabel>Communication Preferences</SectionLabel>
              <CheckboxRow>
                {(["channel_email", "channel_whatsapp", "channel_voice"] as const).map((ch, i) => (
                  <Controller key={ch} name={ch} control={control} render={({ field }) => (
                    <CheckboxLabel htmlFor={ch}>
                      <Checkbox inputId={ch} checked={field.value} onChange={e => field.onChange(e.checked)} />
                      {["Email", "WhatsApp", "Voice/Call"][i]}
                    </CheckboxLabel>
                  )} />
                ))}
              </CheckboxRow>

              <SaveRow>
                <Button type="submit" label="Save Changes" icon="pi pi-save" loading={mutation.isPending} disabled={mutation.isPending} />
              </SaveRow>
            </form>
          )}
        </CardBody>
      </SectionCard>

      {/* Right: Account details */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Account details card */}
        {d && (
          <SectionCard>
            <CardHeader><CardTitle>Account Details</CardTitle></CardHeader>
            <CardBody style={{ padding: "8px 22px 16px" }}>
              <InfoRow>
                <InfoLabel>Member ID</InfoLabel>
                <MonoValue>{d.id?.slice(-12)?.toUpperCase() || "—"}</MonoValue>
              </InfoRow>
              {d.email && (
                <InfoRow>
                  <InfoLabel>Email</InfoLabel>
                  <InfoValue style={{ fontSize: 13 }}>{d.email}</InfoValue>
                </InfoRow>
              )}
              {d.dob && (
                <InfoRow>
                  <InfoLabel>Date of Birth</InfoLabel>
                  <InfoValue>{dayjs(d.dob).format("DD MMM YYYY")}</InfoValue>
                </InfoRow>
              )}
              {d.gender && (
                <InfoRow>
                  <InfoLabel>Gender</InfoLabel>
                  <InfoValue>{d.gender}</InfoValue>
                </InfoRow>
              )}
              {(d.address_city || d.address_state) && (
                <InfoRow>
                  <InfoLabel>Location</InfoLabel>
                  <InfoValue style={{ fontSize: 13 }}>{[d.address_city, d.address_state].filter(Boolean).join(", ")}</InfoValue>
                </InfoRow>
              )}
            </CardBody>
          </SectionCard>
        )}

        {/* Partner enrollment card */}
        {partners.length > 0 && (
          <SectionCard>
            <CardHeader>
              <PartnerDropdownWrap>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Building2 size={15} color="#0050b0" />
                  <CardTitle>My Partner</CardTitle>
                </div>
                {partners.length > 1 && (
                  <Dropdown value={selectedPartnerId ?? partners[0]?.partner_id} options={partnerOptions} onChange={e => setSelectedPartnerId(e.value)} style={{ width: "180px", fontSize: "0.8rem" }} />
                )}
              </PartnerDropdownWrap>
            </CardHeader>
            {selectedPartner && (
              <CardBody style={{ padding: "8px 22px 16px" }}>
                <InfoRow>
                  <InfoLabel>Partner</InfoLabel>
                  <div style={{ textAlign: "right" }}>
                    <InfoValue style={{ display: "inline" }}>{selectedPartner.partner_name ?? "—"}</InfoValue>
                    {selectedPartner.partner_type && <PartnerTypeChip>{selectedPartner.partner_type}</PartnerTypeChip>}
                  </div>
                </InfoRow>
                <InfoRow>
                  <InfoLabel>Status</InfoLabel>
                  <EnrollBadge $status={selectedPartner.enrollment_status ?? ""}>{selectedPartner.enrollment_status ?? "—"}</EnrollBadge>
                </InfoRow>
                {selectedPartner.plan && (
                  <InfoRow>
                    <InfoLabel>Plan</InfoLabel>
                    <div style={{ textAlign: "right" }}>
                      <InfoValue>{selectedPartner.plan.name}</InfoValue>
                      {selectedPartner.plan.price != null && (
                        <div style={{ fontSize: 12, color: "#0050b0", fontWeight: 600 }}>
                          ₹{Number(selectedPartner.plan.price).toLocaleString("en-IN")}{selectedPartner.plan.cycle ? ` / ${selectedPartner.plan.cycle}` : ""}
                        </div>
                      )}
                    </div>
                  </InfoRow>
                )}
                {selectedPartner.end_date && (
                  <InfoRow>
                    <InfoLabel>Expires</InfoLabel>
                    <div style={{ textAlign: "right" }}>
                      <MonoValue>{dayjs(selectedPartner.end_date).format("DD MMM YYYY")}</MonoValue>
                      {(() => {
                        const daysLeft = dayjs(selectedPartner.end_date).diff(dayjs(), "day");
                        if (daysLeft < 0) return <div style={{ fontSize: 11, color: "#dc2626" }}>Expired</div>;
                        if (daysLeft <= 7) return <div style={{ fontSize: 11, color: "#d97706" }}>Expires in {daysLeft}d</div>;
                        return null;
                      })()}
                    </div>
                  </InfoRow>
                )}
              </CardBody>
            )}
          </SectionCard>
        )}
      </div>
    </PageWrap>
  );
}
