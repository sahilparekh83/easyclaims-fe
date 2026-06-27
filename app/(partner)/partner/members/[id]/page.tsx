"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import { ChevronLeft, Eye, Download } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { getApiError } from "@/imports/core/errors";
import {
  partnerGetMember,
  partnerListPlans,
  partnerSwitchMemberPlan,
  partnerRenewMemberEnrollment,
  partnerGetMemberEnrollmentHistory,
  partnerViewMemberPolicyPdf,
  partnerDownloadMemberPolicyPdf,
} from "@/imports/core/api";

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
  border: 1px solid #e8eaf0;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  flex-wrap: wrap;
`;

const Avatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #0a2257;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.5rem;
  font-weight: 700;
  flex-shrink: 0;
`;

const HeroInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 200px;
`;

const HeroName = styled.h2`
  margin: 0;
  font-size: 1.375rem;
  font-weight: 700;
  color: #0f172a;
`;

const HeroMeta = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const HeroRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
`;

const PlanPill = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
`;

const MemberSince = styled.div`
  font-size: 0.75rem;
  color: #64748b;
`;

const Banner = styled.div<{ $type: "error" | "warn" }>`
  padding: 12px 18px;
  border-radius: 10px;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: ${p => p.$type === "error" ? "#ffebee" : "#fff8e1"};
  border: 1px solid ${p => p.$type === "error" ? "#ef9a9a" : "#ffd54f"};
  color: ${p => p.$type === "error" ? "#b71c1c" : "#7c4009"};
`;

const ActionsCard = styled.div`
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e8eaf0;
  padding: 14px 22px;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
`;

const TabBar = styled.div`
  display: flex;
  border-bottom: 2px solid #e8eaf0;
  margin-bottom: 1.5rem;
`;

const Tab = styled.button<{ $active?: boolean }>`
  padding: 10px 20px;
  border: none;
  background: none;
  font-size: 0.875rem;
  font-weight: ${({ $active }) => ($active ? "600" : "500")};
  color: ${({ $active }) => ($active ? "#0a2257" : "#64748b")};
  border-bottom: 2px solid ${({ $active }) => ($active ? "#0a2257" : "transparent")};
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { color: #0a2257; }
`;

const Card = styled.div`
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e8eaf0;
  padding: 20px 22px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
`;

const CardTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 700;
  color: #374151;
  margin-bottom: 1rem;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
`;

const ProfileLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  align-items: start;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
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
  color: #0f172a;
  font-weight: 500;
`;

const PolicyTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;

  th {
    text-align: left;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    padding: 11px 16px;
    background: #f8f9fb;
    border-bottom: 1px solid #e8eaf0;
  }
  td {
    padding: 12px 16px;
    border-bottom: 1px solid #f1f2f6;
    color: #374151;
    vertical-align: middle;
  }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8f9fb; }
`;

const PolicySection = styled.div`
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e8eaf0;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
`;

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;

  th {
    text-align: left;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    padding: 11px 16px;
    background: #f8f9fb;
    border-bottom: 1px solid #e8eaf0;
  }
  td {
    padding: 10px 16px;
    border-bottom: 1px solid #f1f2f6;
    color: #374151;
    vertical-align: middle;
  }
  tr:last-child td { border-bottom: none; }
`;

const ActionBadge = styled.span<{ $action: string }>`
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${p => p.$action === "renewed" ? "#e8f5e9" : p.$action === "expired" ? "#ffebee" : "#f0f9ff"};
  color: ${p => p.$action === "renewed" ? "#2e7d32" : p.$action === "expired" ? "#c62828" : "#0369a1"};
`;

const EmptyMsg = styled.p`
  color: #9ca3af;
  font-size: 0.875rem;
  margin: 0;
`;

const DialogFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.5rem;
`;

const FormLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #0f172a;
`;

// ─── Types ───────────────────────────────────────────────────────────────────

interface LinkedFamilyMember { id: string; name: string; relation: string; }
interface MemberPolicy {
  id: string;
  policy_number?: string | null;
  policy_type?: string | null;
  insurer?: string | null;
  sum_insured?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  file_name?: string | null;
  has_file?: boolean;
  linked_family_members?: LinkedFamilyMember[];
}
interface MemberEnrollment {
  plan_id: string;
  plan_name?: string | null;
  plan_type?: string | null;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
}
interface MemberProfile {
  gender?: string | null;
  dob?: string | null;
  address_line?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_pin?: string | null;
  sale_date?: string | null;
  sales_channel?: string | null;
  branch_code?: string | null;
  salesperson_name?: string | null;
  employee_code?: string | null;
  data1?: string | null;
  data2?: string | null;
  data3?: string | null;
}
interface MemberDetail {
  id: string;
  name: string;
  email: string;
  mobile_no?: string | null;
  is_active?: boolean;
  has_logged_in: boolean;
  first_login_at?: string | null;
  last_login_at?: string | null;
  login_count?: number | null;
  enrollment?: MemberEnrollment | null;
  profile?: MemberProfile | null;
  family?: any[];
  policies?: MemberPolicy[];
}
interface Plan { id: string; name: string; status: string; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function openPdf(memberId: string, policyId: string) {
  try {
    const blob = await partnerViewMemberPolicyPdf(memberId, policyId);
    const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch {
    toast.error("Could not load PDF");
  }
}

async function downloadPdf(memberId: string, policyId: string, fileName?: string | null) {
  try {
    const blob = await partnerDownloadMemberPolicyPdf(memberId, policyId);
    const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "policy.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5_000);
  } catch {
    toast.error("Could not download PDF");
  }
}

const TABS = ["Profile", "Policies", "Family", "History"] as const;
type TabKey = (typeof TABS)[number];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("Profile");
  const [switchPlanOpen, setSwitchPlanOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const { data: memberData, isLoading } = useQuery({
    queryKey: ["partner", "members", id],
    queryFn: () => partnerGetMember(id),
    enabled: !!id,
  });

  const { data: plansData } = useQuery({
    queryKey: ["partner", "plans"],
    queryFn: partnerListPlans,
  });

  const { data: historyData } = useQuery({
    queryKey: ["partner", "members", id, "enrollment-history"],
    queryFn: () => partnerGetMemberEnrollmentHistory(id),
    enabled: activeTab === "History",
  });

  const member: MemberDetail | undefined = (memberData as any)?.data;
  const plans: Plan[] = (plansData as any)?.data ?? [];
  const enrollmentHistory: any[] = (historyData as any)?.data ?? [];
  const planOptions = plans
    .filter(p => p.status === "Active")
    .map(p => ({ label: p.name, value: p.id }));

  const renewMutation = useMutation({
    mutationFn: () => partnerRenewMemberEnrollment(id),
    onSuccess: () => {
      toast.success("Enrollment renewed for 1 year!");
      queryClient.invalidateQueries({ queryKey: ["partner", "members", id] });
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to renew enrollment")),
  });

  const switchPlanMutation = useMutation({
    mutationFn: (plan_id: string) => partnerSwitchMemberPlan(id, plan_id),
    onSuccess: () => {
      toast.success("Plan switched successfully");
      setSwitchPlanOpen(false);
      setSelectedPlanId(null);
      queryClient.invalidateQueries({ queryKey: ["partner", "members", id] });
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to switch plan")),
  });

  if (isLoading) return <div style={{ padding: "2rem", color: "#64748b" }}>Loading member…</div>;
  if (!member) return <div style={{ padding: "2rem", color: "#ef4444" }}>Member not found.</div>;

  const enrollment = member.enrollment;
  const initials = (member.name || "M").split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
  const daysUntilExpiry = enrollment?.end_date ? dayjs(enrollment.end_date).diff(dayjs(), "day") : null;
  const isExpired = enrollment?.status === "Expired";
  const isExpiringSoon = !isExpired && daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
  const memberSince = member.first_login_at ? dayjs(member.first_login_at).format("DD MMM YYYY") : null;

  const policies: MemberPolicy[] = member.policies ?? [];
  const policyCount = policies.length;

  const tabLabel = (t: TabKey) => {
    if (t === "Policies" && policyCount > 0) return `Policies ${policyCount}`;
    return t;
  };

  return (
    <div style={{ maxWidth: "1100px" }}>
      <Breadcrumb onClick={() => router.push("/partner/members")}>
        <ChevronLeft size={15} />
        Members
      </Breadcrumb>

      {/* Hero */}
      <HeroCard>
        <Avatar>{initials}</Avatar>
        <HeroInfo>
          <HeroName>{member.name || "—"}</HeroName>
          <HeroMeta>
            <span>{member.email}</span>
            {member.mobile_no && <><span>·</span><span>{member.mobile_no}</span></>}
          </HeroMeta>
        </HeroInfo>
        <HeroRight>
          <StatusBadge value={!!member.is_active} trueLabel="Active" falseLabel="Inactive" />
          {enrollment?.plan_name && <PlanPill>{enrollment.plan_name}</PlanPill>}
          {memberSince && <MemberSince>Member since {memberSince}</MemberSince>}
        </HeroRight>
      </HeroCard>

      {/* Expiry banners */}
      {isExpired && (
        <Banner $type="error">
          <i className="pi pi-times-circle" style={{ fontSize: "1.1rem" }} />
          <span>
            <strong>Plan Expired</strong> — Expired on{" "}
            {dayjs(enrollment?.end_date).format("DD MMM YYYY")}. Use{" "}
            <strong>Renew Enrollment</strong> to restore access.
          </span>
        </Banner>
      )}
      {!isExpired && isExpiringSoon && (
        <Banner $type="warn">
          <i className="pi pi-exclamation-triangle" style={{ fontSize: "1.1rem" }} />
          <span>
            <strong>Plan expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}</strong>
            {" "}— on {dayjs(enrollment?.end_date).format("DD MMM YYYY")}. Consider renewing now.
          </span>
        </Banner>
      )}

      {/* Actions */}
      <ActionsCard>
        <Button
          label="Switch Plan"
          icon="pi pi-refresh"
          severity="secondary"
          size="small"
          onClick={() => {
            setSelectedPlanId(enrollment?.plan_id ?? null);
            setSwitchPlanOpen(true);
          }}
        />
        <Button
          label="Renew Enrollment"
          icon="pi pi-calendar-plus"
          severity="success"
          size="small"
          loading={renewMutation.isPending}
          onClick={() => {
            if (window.confirm("Renew this member's enrollment for 1 more year?")) {
              renewMutation.mutate();
            }
          }}
        />
      </ActionsCard>

      {/* Tabs */}
      <TabBar>
        {TABS.map(t => (
          <Tab key={t} $active={activeTab === t} onClick={() => setActiveTab(t)}>
            {tabLabel(t)}
          </Tab>
        ))}
      </TabBar>

      {/* Profile Tab */}
      {activeTab === "Profile" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <ProfileLayout>
            <Card>
              <CardTitle>Personal Information</CardTitle>
              <InfoGrid>
                <InfoField><InfoLabel>Full Name</InfoLabel><InfoValue>{member.name || "—"}</InfoValue></InfoField>
                <InfoField><InfoLabel>Email</InfoLabel><InfoValue style={{ fontSize: "0.82rem" }}>{member.email || "—"}</InfoValue></InfoField>
                <InfoField><InfoLabel>Mobile No.</InfoLabel><InfoValue>{member.mobile_no || "—"}</InfoValue></InfoField>
                <InfoField><InfoLabel>Gender</InfoLabel><InfoValue>{member.profile?.gender || "—"}</InfoValue></InfoField>
                {member.profile?.dob && (
                  <InfoField><InfoLabel>Date of Birth</InfoLabel><InfoValue>{dayjs(member.profile.dob).format("DD MMM YYYY")}</InfoValue></InfoField>
                )}
                <InfoField><InfoLabel>Last Login</InfoLabel><InfoValue>{member.last_login_at ? dayjs(member.last_login_at).format("DD MMM YYYY HH:mm") : "Never"}</InfoValue></InfoField>
              </InfoGrid>
              {(member.profile?.address_line || member.profile?.address_city) && (
                <>
                  <div style={{ borderTop: "1px solid #f3f4f6", margin: "12px 0 10px", fontSize: "0.68rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Address</div>
                  <InfoValue style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                    {[member.profile.address_line, member.profile.address_city, member.profile.address_state, member.profile.address_pin ? `PIN ${member.profile.address_pin}` : ""].filter(Boolean).join(", ")}
                  </InfoValue>
                </>
              )}
            </Card>

            <Card>
              <CardTitle>Enrollment Details</CardTitle>
              {enrollment ? (
                <InfoGrid>
                  <InfoField><InfoLabel>Plan</InfoLabel><InfoValue>{enrollment.plan_name ?? "—"}</InfoValue></InfoField>
                  <InfoField><InfoLabel>Plan Type</InfoLabel><InfoValue style={{ textTransform: "capitalize" }}>{enrollment.plan_type ?? "—"}</InfoValue></InfoField>
                  <InfoField>
                    <InfoLabel>Status</InfoLabel>
                    <StatusBadge value={enrollment.status === "Active"} trueLabel="Active" falseLabel={enrollment.status ?? "Inactive"} />
                  </InfoField>
                  <InfoField><InfoLabel>Start Date</InfoLabel><InfoValue>{enrollment.start_date ? dayjs(enrollment.start_date).format("DD MMM YYYY") : "—"}</InfoValue></InfoField>
                  <InfoField><InfoLabel>End Date</InfoLabel><InfoValue>{enrollment.end_date ? dayjs(enrollment.end_date).format("DD MMM YYYY") : "—"}</InfoValue></InfoField>
                </InfoGrid>
              ) : (
                <EmptyMsg>No plan enrolled</EmptyMsg>
              )}
            </Card>
          </ProfileLayout>

          <Card>
            <CardTitle>Onboarding &amp; Sales Details</CardTitle>
            <InfoGrid>
              <InfoField><InfoLabel>Sale Date</InfoLabel><InfoValue>{member.profile?.sale_date ? dayjs(member.profile.sale_date).format("DD MMM YYYY") : "—"}</InfoValue></InfoField>
              <InfoField><InfoLabel>Sales Channel</InfoLabel><InfoValue>{member.profile?.sales_channel || "—"}</InfoValue></InfoField>
              <InfoField><InfoLabel>Branch Code</InfoLabel><InfoValue>{member.profile?.branch_code || "—"}</InfoValue></InfoField>
              <InfoField><InfoLabel>Salesperson</InfoLabel><InfoValue>{member.profile?.salesperson_name || "—"}</InfoValue></InfoField>
              <InfoField><InfoLabel>Employee Code</InfoLabel><InfoValue>{member.profile?.employee_code || "—"}</InfoValue></InfoField>
              <InfoField><InfoLabel>Data 1</InfoLabel><InfoValue>{member.profile?.data1 || "—"}</InfoValue></InfoField>
              <InfoField><InfoLabel>Data 2</InfoLabel><InfoValue>{member.profile?.data2 || "—"}</InfoValue></InfoField>
              <InfoField><InfoLabel>Data 3</InfoLabel><InfoValue>{member.profile?.data3 || "—"}</InfoValue></InfoField>
            </InfoGrid>
          </Card>
        </div>
      )}

      {/* Policies Tab */}
      {activeTab === "Policies" && (
        policyCount === 0 ? (
          <Card><EmptyMsg>No policies uploaded for this member.</EmptyMsg></Card>
        ) : (
          <PolicySection>
            <PolicyTable>
              <thead>
                <tr>
                  <th>Policy #</th>
                  <th>Type</th>
                  <th>Insurer</th>
                  <th>Sum Insured</th>
                  <th>Validity</th>
                  <th>Status</th>
                  <th>Linked Members</th>
                  <th>PDF</th>
                </tr>
              </thead>
              <tbody>
                {policies.map(p => (
                  <tr key={p.id}>
                    <td><strong style={{ color: "#0f172a" }}>{p.policy_number || "—"}</strong></td>
                    <td style={{ color: "#64748b" }}>{p.policy_type || "—"}</td>
                    <td>{p.insurer || "—"}</td>
                    <td>
                      {p.sum_insured != null
                        ? <span style={{ fontWeight: 500 }}>₹{Number(p.sum_insured).toLocaleString("en-IN")}</span>
                        : "—"}
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      {p.start_date && p.end_date
                        ? `${dayjs(p.start_date).format("DD MMM YY")} – ${dayjs(p.end_date).format("DD MMM YY")}`
                        : p.start_date ? dayjs(p.start_date).format("DD MMM YY") : "—"}
                    </td>
                    <td>
                      {p.status ? (
                        <span style={{
                          fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px",
                          background: p.status === "Active" ? "#f0fdf4" : p.status === "Expired" ? "#fffbeb" : "#fef2f2",
                          color: p.status === "Active" ? "#15803d" : p.status === "Expired" ? "#b45309" : "#b91c1c",
                        }}>
                          {p.status}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ fontSize: "0.78rem" }}>
                      {(p.linked_family_members ?? []).length > 0
                        ? (p.linked_family_members ?? []).map(m => `${m.name} (${m.relation})`).join(", ")
                        : <span style={{ color: "#9ca3af" }}>Self only</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "2px" }}>
                        {p.has_file ? (
                          <>
                            <button
                              title="View PDF"
                              onClick={() => openPdf(member.id, p.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px", color: "#3b82f6" }}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              title="Download PDF"
                              onClick={() => downloadPdf(member.id, p.id, p.file_name)}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px", color: "#64748b" }}
                            >
                              <Download size={14} />
                            </button>
                          </>
                        ) : (
                          <span style={{ color: "#d1d5db", fontSize: "0.72rem" }}>No file</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </PolicyTable>
          </PolicySection>
        )
      )}

      {/* Family Tab */}
      {activeTab === "Family" && (
        <Card>
          <CardTitle>Family Members</CardTitle>
          {(member.family ?? []).length === 0 ? (
            <EmptyMsg>No family members added.</EmptyMsg>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {(member.family ?? []).map((f: any) => (
                <div key={f.id} style={{
                  border: "1px solid #e9e8f4", borderRadius: 10, padding: "12px 16px",
                  background: f.policy_count > 0 ? "#fffbeb" : "#fff",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{f.name}</span>
                    <span style={{ fontSize: 11, background: "#f1f5f9", color: "#374151", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>{f.relation}</span>
                    {f.coverage_type && <span style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>{f.coverage_type}</span>}
                    {f.policy_count > 0 && (
                      <span style={{ fontSize: 11, background: "#fef9c3", color: "#92400e", padding: "2px 8px", borderRadius: 999, fontWeight: 700, border: "1px solid #fde68a" }}>
                        Linked to {f.policy_count} {f.policy_count > 1 ? "policies" : "policy"}
                      </span>
                    )}
                  </div>
                  {(f.gender || f.dob) && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                      {f.gender}{f.gender && f.dob ? " · " : ""}{f.dob ? dayjs(f.dob).format("DD MMM YYYY") : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* History Tab */}
      {activeTab === "History" && (
        enrollmentHistory.length === 0 ? (
          <Card><EmptyMsg>No plan change history found.</EmptyMsg></Card>
        ) : (
          <PolicySection>
            <HistoryTable>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>From Plan</th>
                  <th>To Plan</th>
                  <th>Changed By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {enrollmentHistory.map((h: any) => (
                  <tr key={h.id}>
                    <td><ActionBadge $action={h.action}>{h.action}</ActionBadge></td>
                    <td style={{ color: "#64748b" }}>{h.from_plan_name || "—"}</td>
                    <td style={{ fontWeight: 600, color: "#0f172a" }}>{h.to_plan_name || "—"}</td>
                    <td style={{ color: "#64748b", textTransform: "capitalize" }}>{h.changed_by}</td>
                    <td style={{ color: "#64748b" }}>
                      {h.changed_at ? dayjs(h.changed_at).format("DD MMM YYYY HH:mm") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </HistoryTable>
          </PolicySection>
        )
      )}

      {/* Switch Plan Dialog */}
      <Dialog
        header="Switch Plan"
        visible={switchPlanOpen}
        onHide={() => setSwitchPlanOpen(false)}
        style={{ width: "400px" }}
        footer={
          <DialogFooter>
            <Button label="Cancel" severity="secondary" onClick={() => setSwitchPlanOpen(false)} />
            <Button
              label="Switch Plan"
              loading={switchPlanMutation.isPending}
              onClick={() => {
                if (!selectedPlanId) { toast.error("Please select a plan"); return; }
                switchPlanMutation.mutate(selectedPlanId);
              }}
            />
          </DialogFooter>
        }
      >
        <FormField>
          <FormLabel htmlFor="switch-plan-dropdown">Select Plan</FormLabel>
          <Dropdown
            id="switch-plan-dropdown"
            value={selectedPlanId}
            onChange={e => setSelectedPlanId(e.value)}
            options={planOptions}
            placeholder="Choose a plan"
            style={{ width: "100%" }}
          />
        </FormField>
      </Dialog>
    </div>
  );
}
