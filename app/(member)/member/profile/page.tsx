"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { memberGetProfile, memberListPartners } from "@/imports/core/api";
import { Button } from "primereact/button";
import dayjs from "dayjs";
import { Building2, Edit3, Info } from "lucide-react";

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
  display: flex; align-items: center; justify-content: space-between;
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

const InfoNote = styled.div`
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 14px; background: #fffbeb; border: 1px solid #fde68a;
  border-radius: 8px; font-size: 12.5px; color: #78350f; margin-bottom: 16px;
  line-height: 1.5;
`;

const InfoGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 1.5rem;
`;

const InfoField = styled.div`
  display: flex; flex-direction: column; gap: 2px;
`;

const FieldLabel = styled.span`
  font-size: 0.68rem; font-weight: 700; color: #9ca3af;
  text-transform: uppercase; letter-spacing: 0.05em;
`;

const FieldValue = styled.span`
  font-size: 0.875rem; color: #111827; font-weight: 500;
`;

const SectionDivider = styled.div`
  border-top: 1px solid #f1f3f6; margin: 16px 0;
  font-size: 0.7rem; font-weight: 700; color: #9ca3af;
  text-transform: uppercase; letter-spacing: 0.05em;
  padding-top: 12px;
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemberProfilePage() {
  const router = useRouter();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  const { data: profileData, isLoading } = useQuery({ queryKey: ["member", "profile"], queryFn: memberGetProfile });
  const { data: partnersData } = useQuery({ queryKey: ["member", "partners"], queryFn: memberListPartners });

  const partners: any[] = (partnersData as any)?.data ?? [];
  const selectedPartner = partners.find(p => p.partner_id === selectedPartnerId) ?? partners[0] ?? null;

  const d = profileData?.data;

  return (
    <PageWrap>
      {/* Left: Profile details (read-only) */}
      <SectionCard>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <Button
            label="Request Change"
            size="small"
            icon="pi pi-pencil"
            outlined
            onClick={() => router.push("/member/change-requests")}
            style={{ fontSize: 12 }}
          />
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <p style={{ color: "#6b7a8c" }}>Loading…</p>
          ) : d ? (
            <>
              <InfoNote>
                <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  Your profile is managed by your administrator. To update any details,
                  use <strong>Request Change</strong> — an admin will review and apply the changes.
                </div>
              </InfoNote>

              <InfoGrid>
                <InfoField>
                  <FieldLabel>Full Name</FieldLabel>
                  <FieldValue>{d.name || "—"}</FieldValue>
                </InfoField>
                <InfoField>
                  <FieldLabel>Email</FieldLabel>
                  <FieldValue style={{ fontSize: "0.78rem" }}>{d.email || "—"}</FieldValue>
                </InfoField>
                <InfoField>
                  <FieldLabel>Mobile No.</FieldLabel>
                  <FieldValue>{d.mobile_no || "—"}</FieldValue>
                </InfoField>
                <InfoField>
                  <FieldLabel>Gender</FieldLabel>
                  <FieldValue>{d.gender || "—"}</FieldValue>
                </InfoField>
                <InfoField style={{ gridColumn: "1 / -1" }}>
                  <FieldLabel>Address</FieldLabel>
                  <FieldValue style={{ fontSize: "0.85rem" }}>
                    {[d.address_line, d.address_city, d.address_state, d.address_pin ? `PIN ${d.address_pin}` : ""].filter(Boolean).join(", ") || "—"}
                  </FieldValue>
                </InfoField>
              </InfoGrid>

              <SectionDivider>Onboarding &amp; Sales Details</SectionDivider>
              <InfoGrid>
                <InfoField>
                  <FieldLabel>Sale Date</FieldLabel>
                  <FieldValue>{d.sale_date ? dayjs(d.sale_date).format("DD MMM YYYY") : "—"}</FieldValue>
                </InfoField>
                <InfoField>
                  <FieldLabel>Sales Channel</FieldLabel>
                  <FieldValue>{d.sales_channel || "—"}</FieldValue>
                </InfoField>
                <InfoField>
                  <FieldLabel>Branch Code</FieldLabel>
                  <FieldValue>{d.branch_code || "—"}</FieldValue>
                </InfoField>
                <InfoField>
                  <FieldLabel>Salesperson</FieldLabel>
                  <FieldValue>{d.salesperson_name || "—"}</FieldValue>
                </InfoField>
                <InfoField>
                  <FieldLabel>Employee Code</FieldLabel>
                  <FieldValue>{d.employee_code || "—"}</FieldValue>
                </InfoField>
                <InfoField>
                  <FieldLabel>Data 1</FieldLabel>
                  <FieldValue>{d.data1 || "—"}</FieldValue>
                </InfoField>
                <InfoField>
                  <FieldLabel>Data 2</FieldLabel>
                  <FieldValue>{d.data2 || "—"}</FieldValue>
                </InfoField>
                <InfoField>
                  <FieldLabel>Data 3</FieldLabel>
                  <FieldValue>{d.data3 || "—"}</FieldValue>
                </InfoField>
              </InfoGrid>
            </>
          ) : null}
        </CardBody>
      </SectionCard>

      {/* Right: Account details + Partner */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {d && (
          <SectionCard>
            <CardHeader><CardTitle>Account Details</CardTitle></CardHeader>
            <CardBody style={{ padding: "8px 22px 16px" }}>
              {d.member_code && (
                <InfoRow>
                  <InfoLabel>Member Code</InfoLabel>
                  <MonoValue>{d.member_code}</MonoValue>
                </InfoRow>
              )}
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
            </CardBody>
          </SectionCard>
        )}

        {partners.length > 0 && selectedPartner && (
          <SectionCard>
            <CardHeader>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Building2 size={15} color="#0050b0" />
                <CardTitle>My Partner</CardTitle>
              </div>
            </CardHeader>
            <CardBody style={{ padding: "8px 22px 16px" }}>
              <InfoRow>
                <InfoLabel>Partner</InfoLabel>
                <div style={{ textAlign: "right" }}>
                  <InfoValue style={{ display: "inline" }}>{selectedPartner.partner_name ?? "—"}</InfoValue>
                  {selectedPartner.partner_type && <PartnerTypeChip>{selectedPartner.partner_type}</PartnerTypeChip>}
                </div>
              </InfoRow>
              {selectedPartner.partner_code && (
                <InfoRow>
                  <InfoLabel>Partner Code</InfoLabel>
                  <MonoValue>{selectedPartner.partner_code}</MonoValue>
                </InfoRow>
              )}
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
          </SectionCard>
        )}

        <SectionCard>
          <CardBody>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Edit3 size={18} color="#7c3aed" />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Need to update your details?</div>
                <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 2 }}>
                  Submit a change request — an admin will review and apply it.
                </div>
              </div>
            </div>
            <Button
              label="Raise a Change Request"
              icon="pi pi-send"
              size="small"
              style={{ marginTop: 14, width: "100%" }}
              onClick={() => router.push("/member/change-requests")}
            />
          </CardBody>
        </SectionCard>
      </div>
    </PageWrap>
  );
}
