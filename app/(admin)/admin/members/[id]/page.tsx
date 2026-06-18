"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "primereact/button";
import { ChevronLeft, User, MapPin, UserCheck, Shield, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import StatusBadge from "@/components/ui/StatusBadge";
import { adminGetMember, adminRenewMemberEnrollment } from "@/imports/core/api";

// ─── Styled ───────────────────────────────────────────────────────────────────

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.25rem;
  cursor: pointer;
  width: fit-content;
  &:hover { color: #374151; }
`;

const HeroCard = styled.div`
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e9e8f4;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
`;

const Avatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.4rem;
  font-weight: 700;
  flex-shrink: 0;
`;

const HeroInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MemberName = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
`;

const MemberMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const MemberId = styled.span`
  font-size: 0.78rem;
  color: #6b7280;
  font-weight: 500;
`;

const SecureBadge = styled.span`
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
`;

const HeroActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const TabBar = styled.div`
  display: flex;
  border-bottom: 2px solid #e9e8f4;
  margin-bottom: 1.5rem;
`;

const Tab = styled.button<{ $active?: boolean }>`
  padding: 10px 20px;
  border: none;
  background: none;
  font-size: 0.875rem;
  font-weight: ${({ $active }) => ($active ? "600" : "500")};
  color: ${({ $active }) => ($active ? "#7c3aed" : "#6b7280")};
  border-bottom: 2px solid ${({ $active }) => ($active ? "#7c3aed" : "transparent")};
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { color: #7c3aed; }
`;

const Card = styled.div`
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e9e8f4;
  padding: 20px 22px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
`;

const CardTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 1rem;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 1.5rem;
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const InfoField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const InfoLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const InfoValue = styled.span`
  font-size: 0.9rem;
  color: #111827;
  font-weight: 500;
`;

const ProfileLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 1.25rem;
  align-items: start;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const RightCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FamilyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
`;

const FamilyCard = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e9e8f4;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
`;

const PolicyRow = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e9e8f4;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const NomineeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  &:last-child { border-bottom: none; }
`;

const CommRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-top: 1px solid #f3f4f6;
  font-size: 13.5px;
`;

const CommLabel = styled.span`
  color: #374151;
  font-weight: 500;
`;

const LangBadge = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #1d4ed8;
  background: #eff6ff;
  border-radius: 999px;
  padding: 4px 12px;
`;

const StatusDot = styled.span<{ $on?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: ${p => p.$on ? '#16a34a' : '#9ca3af'};
  &::before {
    content: '';
    display: block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${p => p.$on ? '#22c55e' : '#d1d5db'};
  }
`;

const ConsentAlert = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;
  padding: 12px 14px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  font-size: 12.5px;
  color: #166534;
  line-height: 1.5;
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = ["Profile", "Family", "Policies", "Communication"] as const;
type TabKey = (typeof TABS)[number];

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("Profile");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "member", id],
    queryFn: () => adminGetMember(id),
    enabled: !!id,
  });

  const member = data?.data;

  const renewMutation = useMutation({
    mutationFn: () => adminRenewMemberEnrollment(id),
    onSuccess: () => {
      toast.success("Enrollment renewed!");
      queryClient.invalidateQueries({ queryKey: ["admin", "member", id] });
    },
    onError: () => toast.error("Renewal failed"),
  });

  if (isLoading) {
    return <div style={{ padding: "2rem", color: "#6b7280" }}>Loading member...</div>;
  }
  if (!member) {
    return <div style={{ padding: "2rem", color: "#ef4444" }}>Member not found.</div>;
  }

  const enrollment = member.enrollments?.[0];
  const initials = (member.name || "M")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const memberSince = member.created_at
    ? dayjs(member.created_at).format("DD MMM YYYY")
    : null;

  const familyCount = (member.family ?? []).length;
  const policyCount = (member.policies ?? []).length;

  const tabLabel = (t: TabKey) => {
    if (t === "Family" && familyCount > 0) return `Family ${familyCount}`;
    if (t === "Policies" && policyCount > 0) return `Policies ${policyCount}`;
    return t;
  };

  const profile = member.profile ?? {};
  const hasAddress =
    profile.address_line || profile.address_city || profile.address_state;

  return (
    <div style={{ maxWidth: "1100px" }}>
      <Breadcrumb onClick={() => router.push("/admin/members")}>
        <ChevronLeft size={15} />
        Members
      </Breadcrumb>

      <HeroCard>
        <Avatar>{initials}</Avatar>
        <HeroInfo>
          <MemberName>{member.name || "—"}</MemberName>
          <MemberMeta>
            <MemberId>MEM-{member.id?.slice(-8)?.toUpperCase()}</MemberId>
            <SecureBadge>
              <Shield size={9} />
              Secure
            </SecureBadge>
            <StatusBadge
              value={!!member.is_active}
              trueLabel="Active"
              falseLabel="Inactive"
            />
            {memberSince && (
              <MemberId>· Member since {memberSince}</MemberId>
            )}
          </MemberMeta>
          {enrollment && (
            <MemberId style={{ marginTop: 2 }}>
              {enrollment.partner_name || "Partner"} ·{" "}
              {enrollment.plan_name || enrollment.plan_id}
            </MemberId>
          )}
        </HeroInfo>
        <HeroActions>
          <Button
            label="Renew"
            outlined
            size="small"
            loading={renewMutation.isPending}
            onClick={() => renewMutation.mutate()}
            icon="pi pi-refresh"
          />
          <Button label="Edit" size="small" disabled icon="pi pi-pencil" />
        </HeroActions>
      </HeroCard>

      <TabBar>
        {TABS.map((t) => (
          <Tab key={t} $active={activeTab === t} onClick={() => setActiveTab(t)}>
            {tabLabel(t)}
          </Tab>
        ))}
      </TabBar>

      {/* Profile Tab */}
      {activeTab === "Profile" && (
        <ProfileLayout>
          <Card>
            <CardTitle>
              <User size={14} /> Personal information
            </CardTitle>
            <InfoGrid>
              <InfoField>
                <InfoLabel>Full Name</InfoLabel>
                <InfoValue>{member.name || "—"}</InfoValue>
              </InfoField>
              <InfoField>
                <InfoLabel>Date of Birth</InfoLabel>
                <InfoValue>
                  {profile.dob ? dayjs(profile.dob).format("DD MMM YYYY") : "—"}
                </InfoValue>
              </InfoField>
              <InfoField>
                <InfoLabel>Gender</InfoLabel>
                <InfoValue>{profile.gender || "—"}</InfoValue>
              </InfoField>
              <InfoField>
                <InfoLabel>Mobile Number</InfoLabel>
                <InfoValue>{member.mobile_no || "—"}</InfoValue>
              </InfoField>
              <InfoField>
                <InfoLabel>Email Address</InfoLabel>
                <InfoValue>{member.email || "—"}</InfoValue>
              </InfoField>
              <InfoField>
                <InfoLabel>Acquired By</InfoLabel>
                <InfoValue>{enrollment?.partner_name || "—"}</InfoValue>
              </InfoField>
            </InfoGrid>
          </Card>

          <RightCol>
            <Card>
              <CardTitle>
                <MapPin size={14} /> Address
              </CardTitle>
              {hasAddress ? (
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", lineHeight: 1.55 }}>
                  {profile.address_line && <div>{profile.address_line}</div>}
                  {(profile.address_city || profile.address_state) && (
                    <div>{[profile.address_city, profile.address_state].filter(Boolean).join(", ")}</div>
                  )}
                  {profile.address_pin && (
                    <div style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", color: "#64748b", fontWeight: 500 }}>
                      PIN {profile.address_pin}
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
                  No address on file
                </p>
              )}
            </Card>

            <Card>
              <CardTitle>
                <UserCheck size={14} /> Nominee
              </CardTitle>
              {(member.nominees ?? []).length === 0 ? (
                <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
                  No nominees added
                </p>
              ) : (
                (member.nominees ?? []).map((n: any) => (
                  <NomineeRow key={n.id}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
                        {n.name}
                      </div>
                      <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>
                        {n.relation}
                      </div>
                    </div>
                    <span style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 13, fontWeight: 600, color: "#1d4ed8", background: "#eff6ff", borderRadius: 999, padding: "3px 11px" }}>
                      {n.share_percent}%
                    </span>
                  </NomineeRow>
                ))
              )}
            </Card>
          </RightCol>
        </ProfileLayout>
      )}

      {/* Family Tab */}
      {activeTab === "Family" && (
        <div>
          {familyCount === 0 ? (
            <Card>
              <p style={{ color: "#9ca3af" }}>No family members added.</p>
            </Card>
          ) : (
            <FamilyGrid>
              {(member.family ?? []).map((f: any) => (
                <FamilyCard key={f.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "#f5f3ff",
                        color: "#7c3aed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                      }}
                    >
                      {(f.name || "F")[0].toUpperCase()}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          color: "#111827",
                        }}
                      >
                        {f.name}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                        {f.relation}
                      </div>
                    </div>
                  </div>
                  <InfoGrid
                    style={{ gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}
                  >
                    <InfoField>
                      <InfoLabel>Gender</InfoLabel>
                      <InfoValue style={{ fontSize: "0.8rem" }}>
                        {f.gender || "—"}
                      </InfoValue>
                    </InfoField>
                    <InfoField>
                      <InfoLabel>Date of Birth</InfoLabel>
                      <InfoValue style={{ fontSize: "0.8rem" }}>
                        {f.dob ? dayjs(f.dob).format("DD MMM YYYY") : "—"}
                      </InfoValue>
                    </InfoField>
                  </InfoGrid>
                </FamilyCard>
              ))}
            </FamilyGrid>
          )}
        </div>
      )}

      {/* Policies Tab */}
      {activeTab === "Policies" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {policyCount === 0 ? (
            <Card>
              <p style={{ color: "#9ca3af" }}>No policies uploaded.</p>
            </Card>
          ) : (
            (member.policies ?? []).map((p: any) => (
              <PolicyRow key={p.id}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div
                    style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827" }}
                  >
                    {p.policy_number}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    {p.policy_type || "—"} · {p.insurer || "—"}
                  </div>
                </div>
                <StatusBadge
                  value={
                    p.status?.toLowerCase() === "active"
                  }
                  trueLabel={p.status}
                  falseLabel={p.status}
                />
                <div style={{ fontSize: "0.8rem", color: "#374151" }}>
                  {p.sum_insured
                    ? `₹${Number(p.sum_insured).toLocaleString("en-IN")}`
                    : "—"}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    textAlign: "right",
                  }}
                >
                  {p.start_date ? dayjs(p.start_date).format("DD MMM YY") : "—"}
                  {" → "}
                  {p.end_date ? dayjs(p.end_date).format("DD MMM YY") : "—"}
                </div>
                {(p.linked_family_members ?? []).length > 0 && (
                  <div style={{ fontSize: "0.72rem", color: "#7c3aed" }}>
                    +{p.linked_family_members.length} family
                  </div>
                )}
              </PolicyRow>
            ))
          )}
        </div>
      )}

      {/* Communication Tab */}
      {activeTab === "Communication" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", alignItems: "start" }}>
          <Card>
            <CardTitle>Communication preferences</CardTitle>
            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 4px" }}>Language &amp; channels for member messaging</p>
            <CommRow>
              <CommLabel>Preferred language</CommLabel>
              <LangBadge>English</LangBadge>
            </CommRow>
            <CommRow>
              <CommLabel>Email updates</CommLabel>
              <StatusDot $on={!!member.email}>
                {member.email ? "Enabled" : "Not configured"}
              </StatusDot>
            </CommRow>
            <CommRow>
              <CommLabel>WhatsApp messages</CommLabel>
              <StatusDot $on={false}>Not configured</StatusDot>
            </CommRow>
            <CommRow>
              <CommLabel>Voice calls</CommLabel>
              <StatusDot $on={false}>Not configured</StatusDot>
            </CommRow>
          </Card>

          <Card>
            <CardTitle>Consent &amp; DPDP</CardTitle>
            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 4px" }}>Digital Personal Data Protection consent record</p>
            <CommRow>
              <CommLabel>Consent timestamp</CommLabel>
              <span style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 12.5, color: "#0f172a", fontWeight: 500 }}>
                {member.created_at ? new Date(member.created_at).toLocaleString("en-IN") : "Not recorded"}
              </span>
            </CommRow>
            <CommRow>
              <CommLabel>Consent version</CommLabel>
              <span style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontSize: 12.5, color: "#0f172a", fontWeight: 500 }}>v2.1</span>
            </CommRow>
            <CommRow>
              <CommLabel>Consent source</CommLabel>
              <span style={{ fontSize: 12.5, color: "#0f172a", fontWeight: 500 }}>Member portal</span>
            </CommRow>
            <ConsentAlert>
              <ShieldCheck size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Active consent on file</strong><br />
                Member can withdraw consent any time; honoured within 72 hours.
              </div>
            </ConsentAlert>
          </Card>
        </div>
      )}
    </div>
  );
}
