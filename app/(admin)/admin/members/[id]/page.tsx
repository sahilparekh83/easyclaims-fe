"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { ChevronLeft, User, MapPin, UserCheck, Shield, ShieldCheck, Briefcase, Users, CheckCircle2, AlertCircle } from "lucide-react";
import PoliciesTable from "@/components/ui/PoliciesTable";
import PolicyStatusBadge from "@/components/ui/PolicyStatusBadge";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import StatusBadge from "@/components/ui/StatusBadge";
import { adminGetMember, adminRenewMemberEnrollment, adminSwitchMemberPlan, adminCancelMemberEnrollment, adminUpdateMember, adminListChangeRequests, adminApproveChangeRequest, adminRejectChangeRequest, adminListPlans, adminViewPolicyPdf, adminDownloadPolicyPdf, adminDeletePolicy, adminListClaims } from "@/imports/core/api";
import AssignClaimAgentDialog from "@/components/ui/AssignClaimAgentDialog";
import { useAuthStore } from "@/stores/AuthStore";
import { getApiError } from "@/imports/core/errors";
import { InputTextarea } from "primereact/inputtextarea";

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

const FormGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const FieldLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Err = styled.small`
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 2px;
`;

const FooterRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const CrStatusPill = styled.span<{ $s: string }>`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: ${p => p.$s === "pending" ? "#fef3c7" : p.$s === "approved" ? "#dcfce7" : "#fee2e2"};
  color: ${p => p.$s === "pending" ? "#92400e" : p.$s === "approved" ? "#166534" : "#991b1b"};
`;

const CrRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  &:hover { background: #f9fafb; }
  &:last-child { border-bottom: none; }
`;

const FieldPill = styled.span`
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  margin: 2px;
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = ["Profile", "Family", "Policies", "Claims", "Change Requests", "Communication"] as const;
type TabKey = (typeof TABS)[number];

const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

interface FamilyMemberDetail {
  id: string; name: string; relation: string;
  gender?: string; dob?: string; coverage_type?: string;
  policy_count: number;
  linked_policies: Array<{ id: string; policy_number: string; insurer: string; status: string; }>;
}

interface EditFormValues {
  name: string;
  mobile_no: string;
  gender: string;
  address_line: string;
  address_city: string;
  address_state: string;
  address_pin: string;
  sale_date: string;
  sales_channel: string;
  branch_code: string;
  salesperson_name: string;
  employee_code: string;
  data1: string;
  data2: string;
  data3: string;
  is_active: boolean;
}

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("Profile");
  const isSuperadmin = useAuthStore(s => s.isSuperadmin);
  const [claimSearch, setClaimSearch] = useState("");
  const [claimPage, setClaimPage] = useState(0);
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>([]);
  const [claimAssignOpen, setClaimAssignOpen] = useState(false);
  const CLAIM_ROWS = 10;

  const fromPartnerId = searchParams.get("partner_id") ?? "";
  const fromPartnerName = searchParams.get("partner_name") ? decodeURIComponent(searchParams.get("partner_name")!) : "";
  const [editOpen, setEditOpen] = useState(false);
  const [crStatusFilter, setCrStatusFilter] = useState<string>("pending");
  const [crDetailOpen, setCrDetailOpen] = useState(false);
  const [selectedCr, setSelectedCr] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [familyCrOpen, setFamilyCrOpen] = useState(false);
  const [selectedFamilyCr, setSelectedFamilyCr] = useState<any>(null);
  const [familyCrNote, setFamilyCrNote] = useState("");
  const [switchPlanOpen, setSwitchPlanOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [viewLinkedPolicy, setViewLinkedPolicy] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "member", id],
    queryFn: () => adminGetMember(id),
    enabled: !!id,
  });

  const { data: crData, refetch: refetchCr } = useQuery({
    queryKey: ["admin", "member-change-requests", id, crStatusFilter],
    queryFn: () => adminListChangeRequests({ member_id: id, status: crStatusFilter === "all" ? undefined : crStatusFilter, limit: 50 }),
    enabled: activeTab === "Change Requests" && !!id,
  });
  const changeRequests: any[] = (crData as any)?.data?.data ?? [];

  const { data: claimsData, isLoading: claimsLoading } = useQuery({
    queryKey: ["admin", "member-claims", id],
    queryFn: () => adminListClaims({ user_id: id, limit: 100 }),
    enabled: activeTab === "Claims" && !!id,
  });
  const memberClaims: any[] = (claimsData as any)?.data?.data ?? [];

  const { data: familyCrData, refetch: refetchFamilyCr } = useQuery({
    queryKey: ["admin", "family-crs", id],
    queryFn: () => adminListChangeRequests({ member_id: id, entity_type: "family_member", limit: 50 }),
    enabled: activeTab === "Family",
  });
  const familyCrs: any[] = (familyCrData as any)?.data?.items ?? [];

  const approveFamilyCrMutation = useMutation({
    mutationFn: ({ crId, note }: { crId: string; note: string }) => adminApproveChangeRequest(crId, note),
    onSuccess: () => {
      toast.success("Change approved and applied");
      refetchFamilyCr();
      queryClient.invalidateQueries({ queryKey: ["admin", "member", id] });
    },
    onError: () => toast.error("Failed to approve"),
  });

  const rejectFamilyCrMutation = useMutation({
    mutationFn: ({ crId, note }: { crId: string; note: string }) => adminRejectChangeRequest(crId, note),
    onSuccess: () => { toast.success("Change request rejected"); refetchFamilyCr(); },
    onError: () => toast.error("Failed to reject"),
  });

  const member = data?.data;

  const editForm = useForm<EditFormValues>({
    defaultValues: {
      name: "",
      mobile_no: "",
      gender: "",
      address_line: "",
      address_city: "",
      address_state: "",
      address_pin: "",
      sale_date: "",
      sales_channel: "",
      branch_code: "",
      salesperson_name: "",
      employee_code: "",
      data1: "",
      data2: "",
      data3: "",
      is_active: true,
    },
  });

  const { data: plansData } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => adminListPlans({ limit: 200 }),
  });
  const allPlans: any[] = (plansData as any)?.data?.data ?? [];
  const activePlanOptions = allPlans
    .filter((p: any) => p.status === "Active")
    .map((p: any) => ({ label: p.name, value: p.id }));


  const renewMutation = useMutation({
    mutationFn: () => adminRenewMemberEnrollment(id),
    onSuccess: () => {
      toast.success("Enrollment renewed!");
      queryClient.invalidateQueries({ queryKey: ["admin", "member", id] });
    },
    onError: () => toast.error("Renewal failed"),
  });

  const switchPlanMutation = useMutation({
    mutationFn: (planId: string) => adminSwitchMemberPlan(id, planId),
    onSuccess: () => {
      toast.success("Plan switched successfully");
      setSwitchPlanOpen(false);
      setSelectedPlanId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "member", id] });
    },
    onError: () => toast.error("Failed to switch plan"),
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => adminCancelMemberEnrollment(id, reason || undefined),
    onSuccess: () => {
      toast.success("Membership cancelled");
      setCancelOpen(false);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["admin", "member", id] });
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to cancel membership")),
  });

  const deletePolicyMutation = useMutation({
    mutationFn: (policyId: string) => adminDeletePolicy(policyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "member", id] });
      toast.success("Policy deleted");
    },
    onError: () => toast.error("Failed to delete policy"),
  });

  const updateMutation = useMutation({
    mutationFn: (v: EditFormValues) => {
      // Backend expects a flat AdminMemberUpdate payload (no nested profile key)
      const payload: Record<string, any> = {
        name: v.name || undefined,
        mobile_no: v.mobile_no || undefined,
        is_active: v.is_active,
        gender: v.gender || undefined,
        address_line: v.address_line || undefined,
        address_city: v.address_city || undefined,
        address_state: v.address_state || undefined,
        address_pin: v.address_pin || undefined,
        sale_date: v.sale_date || undefined,
        sales_channel: v.sales_channel || undefined,
        branch_code: v.branch_code || undefined,
        salesperson_name: v.salesperson_name || undefined,
        employee_code: v.employee_code || undefined,
        data1: v.data1 || undefined,
        data2: v.data2 || undefined,
        data3: v.data3 || undefined,
      };
      return adminUpdateMember(id, payload);
    },
    onSuccess: () => {
      toast.success("Member updated successfully");
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "member", id] });
    },
    onError: () => toast.error("Failed to update member"),
  });

  const approveCrMutation = useMutation({
    mutationFn: ({ crId, note }: { crId: string; note: string }) => adminApproveChangeRequest(crId, note),
    onSuccess: () => {
      toast.success("Change request approved");
      setCrDetailOpen(false);
      setSelectedCr(null);
      refetchCr();
      queryClient.invalidateQueries({ queryKey: ["admin", "member", id] });
    },
    onError: () => toast.error("Failed to approve"),
  });

  const rejectCrMutation = useMutation({
    mutationFn: ({ crId, note }: { crId: string; note: string }) => adminRejectChangeRequest(crId, note),
    onSuccess: () => {
      toast.success("Change request rejected");
      setCrDetailOpen(false);
      setSelectedCr(null);
      refetchCr();
    },
    onError: () => toast.error("Failed to reject"),
  });

  const openEdit = () => {
    if (!member) return;
    const profile = member.profile ?? {};
    editForm.reset({
      name: member.name || "",
      mobile_no: member.mobile_no || "",
      gender: profile.gender || "",
      address_line: profile.address_line || "",
      address_city: profile.address_city || "",
      address_state: profile.address_state || "",
      address_pin: profile.address_pin || "",
      sale_date: profile.sale_date || "",
      sales_channel: profile.sales_channel || "",
      branch_code: profile.branch_code || "",
      salesperson_name: profile.salesperson_name || "",
      employee_code: profile.employee_code || "",
      data1: profile.data1 || "",
      data2: profile.data2 || "",
      data3: profile.data3 || "",
      is_active: member.is_active ?? true,
    });
    setEditOpen(true);
  };

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

  const editFooter = (
    <FooterRow>
      <Button label="Cancel" severity="secondary" onClick={() => setEditOpen(false)} />
      <Button
        label="Save changes"
        loading={updateMutation.isPending}
        onClick={editForm.handleSubmit((v) => updateMutation.mutate(v))}
      />
    </FooterRow>
  );

  const memberPolicies: any[] = member?.policies ?? [];
  const totalPolicies = memberPolicies.length;
  const activePolicies = memberPolicies.filter((p: any) => p.status?.toLowerCase() === "active").length;
  const expiredPolicies = memberPolicies.filter((p: any) => p.status?.toLowerCase() === "expired").length;

  return (
    <div style={{ maxWidth: "1100px" }}>
      {fromPartnerId ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <span style={{ cursor: "pointer" }} onClick={() => router.push("/admin/partners")}>Partners</span>
          <ChevronLeft size={13} style={{ transform: "rotate(180deg)" }} />
          <span style={{ cursor: "pointer" }} onClick={() => router.push(`/admin/partners/${fromPartnerId}?tab=members`)}>{fromPartnerName || "Partner"}</span>
          <ChevronLeft size={13} style={{ transform: "rotate(180deg)" }} />
          <span style={{ cursor: "pointer" }} onClick={() => router.push(`/admin/partners/${fromPartnerId}?tab=members`)}>Members</span>
          <ChevronLeft size={13} style={{ transform: "rotate(180deg)" }} />
          <span style={{ color: "#374151", fontWeight: 600 }}>{member?.name || "Member"}</span>
        </div>
      ) : (
        <Breadcrumb onClick={() => router.push("/admin/members")}>
          <ChevronLeft size={15} />
          Members
        </Breadcrumb>
      )}

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
            <MemberId style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
              {enrollment.partner_name || "Partner"} ·{" "}
              {enrollment.plan_name || enrollment.plan_id}
              <StatusBadge value={enrollment.status} />
            </MemberId>
          )}
        </HeroInfo>
        <HeroActions>
          <Button
            label="Switch Plan"
            outlined
            size="small"
            icon="pi pi-arrows-h"
            severity="secondary"
            onClick={() => {
              setSelectedPlanId((member as any)?.enrollment?.plan_id ?? null);
              setSwitchPlanOpen(true);
            }}
          />
          <Button
            label="Renew"
            outlined
            size="small"
            loading={renewMutation.isPending}
            onClick={() => renewMutation.mutate()}
            icon="pi pi-refresh"
          />
          <Button
            label="Cancel Membership"
            outlined
            size="small"
            severity="danger"
            disabled={enrollment?.status === "Cancelled"}
            onClick={() => setCancelOpen(true)}
            icon="pi pi-ban"
          />
          <Button
            label="Edit Member"
            size="small"
            icon="pi pi-pencil"
            onClick={openEdit}
          />
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
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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

            <Card>
              <CardTitle>
                <Briefcase size={14} /> Onboarding &amp; Sales
              </CardTitle>
              <InfoGrid>
                <InfoField>
                  <InfoLabel>Sale Date</InfoLabel>
                  <InfoValue>
                    {profile.sale_date ? dayjs(profile.sale_date).format("DD MMM YYYY") : "—"}
                  </InfoValue>
                </InfoField>
                <InfoField>
                  <InfoLabel>Sales Channel</InfoLabel>
                  <InfoValue>{profile.sales_channel || "—"}</InfoValue>
                </InfoField>
                <InfoField>
                  <InfoLabel>Branch Code</InfoLabel>
                  <InfoValue>{profile.branch_code || "—"}</InfoValue>
                </InfoField>
                <InfoField>
                  <InfoLabel>Salesperson Name</InfoLabel>
                  <InfoValue>{profile.salesperson_name || "—"}</InfoValue>
                </InfoField>
                <InfoField>
                  <InfoLabel>Employee Code</InfoLabel>
                  <InfoValue>{profile.employee_code || "—"}</InfoValue>
                </InfoField>
                <InfoField>
                  <InfoLabel>Data 1</InfoLabel>
                  <InfoValue>{profile.data1 || "—"}</InfoValue>
                </InfoField>
                <InfoField>
                  <InfoLabel>Data 2</InfoLabel>
                  <InfoValue>{profile.data2 || "—"}</InfoValue>
                </InfoField>
                <InfoField>
                  <InfoLabel>Data 3</InfoLabel>
                  <InfoValue>{profile.data3 || "—"}</InfoValue>
                </InfoField>
              </InfoGrid>
            </Card>
          </div>

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

            {/* Nominee card hidden */}
          </RightCol>
        </ProfileLayout>
      )}

      {/* Family Tab */}
      {activeTab === "Family" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Card>
            <CardTitle>
              <Users size={14} /> Family Members ({(member.family ?? []).length}
              {member.enrollment?.plan_family_limit != null
                ? ` / ${member.enrollment.plan_family_limit} allowed`
                : ""})
            </CardTitle>
            {(member.family ?? []).length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13 }}>No family members added.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {(member.family as FamilyMemberDetail[]).map((f) => (
                  <div key={f.id} style={{
                    border: "1px solid #e9e8f4", borderRadius: 10, padding: "12px 16px",
                    background: f.policy_count > 0 ? "#fffbeb" : "#fff",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{f.name}</span>
                      <span style={{ fontSize: 11, background: "#f1f5f9", color: "#374151", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>{f.relation}</span>
                      {/* coverage_type badge hidden */}
                      {f.policy_count > 0 && (
                        <span style={{ fontSize: 11, background: "#fef9c3", color: "#92400e", padding: "2px 8px", borderRadius: 999, fontWeight: 700, border: "1px solid #fde68a" }}>
                          🔗 {f.policy_count} Policy{f.policy_count > 1 ? "ies" : ""}
                        </span>
                      )}
                    </div>
                    {f.gender || f.dob ? (
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        {f.gender}{f.gender && f.dob ? " · " : ""}{f.dob ? dayjs(f.dob).format("DD MMM YYYY") : ""}
                      </div>
                    ) : null}
                    {f.linked_policies.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Linked Policies</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {f.linked_policies.map(p => (
                            <span key={p.id} style={{ fontSize: 11, background: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: 999, border: "1px solid #bfdbfe", fontWeight: 600 }}>
                              #{p.policy_number} · {p.insurer}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pending family change requests */}
          {familyCrs.length > 0 && (
            <Card>
              <CardTitle style={{ color: "#d97706" }}>
                ⚠ Pending Family Change Requests ({familyCrs.filter(c => c.status === "pending").length})
              </CardTitle>
              {familyCrs.map((cr: any) => (
                <div key={cr.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4 }}>
                      {cr.family_member_name && <span>Re: <strong>{cr.family_member_name}</strong> — </span>}
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700,
                        background: cr.status === "pending" ? "#fef3c7" : cr.status === "approved" ? "#dcfce7" : "#fee2e2",
                        color: cr.status === "pending" ? "#92400e" : cr.status === "approved" ? "#166534" : "#991b1b" }}>
                        {cr.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
                      {Object.entries(cr.requested_fields ?? {}).map(([k, v]: any) => (
                        <span key={k} style={{ fontSize: 10, background: "#eff6ff", color: "#1d4ed8", padding: "1px 7px", borderRadius: 999, border: "1px solid #bfdbfe" }}>{k}: {v}</span>
                      ))}
                    </div>
                    {cr.reason && <div style={{ fontSize: 12, color: "#6b7280" }}>Reason: {cr.reason}</div>}
                  </div>
                  {cr.status === "pending" && (
                    <Button label="Review" size="small" severity="warning" outlined style={{ fontSize: 11 }}
                      onClick={() => { setSelectedFamilyCr(cr); setFamilyCrNote(""); setFamilyCrOpen(true); }} />
                  )}
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Policies Tab */}
      {activeTab === "Policies" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            {[
              { label: "Total policies", value: totalPolicies, icon: <Shield size={18} />, bg: "#eff6ff", color: "#2563eb" },
              { label: "Active policies", value: activePolicies, icon: <CheckCircle2 size={18} />, bg: "#f0fdf4", color: "#16a34a" },
              { label: "Expired policies", value: expiredPolicies, icon: <AlertCircle size={18} />, bg: "#fef9c3", color: "#854d0e" },
            ].map(s => (
              <div key={s.label} style={{ background: "#fff", border: "1px solid #e9e8f4", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #f3f4f6" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>All Policies</span>
              <span style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{totalPolicies} total</span>
            </div>
            <PoliciesTable
              policies={memberPolicies}
              role="admin"
              onDownload={async p => { const blob = await adminDownloadPolicyPdf(p.id); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `policy_${p.policy_number}.pdf`; a.click(); URL.revokeObjectURL(url); }}
              onView={p => {
                const qs = new URLSearchParams();
                qs.set("member_id", id);
                if (member?.name) qs.set("member_name", encodeURIComponent(member.name));
                if (fromPartnerId) qs.set("partner_id", fromPartnerId);
                if (fromPartnerName) qs.set("partner_name", encodeURIComponent(fromPartnerName));
                router.push(`/admin/policies/${p.id}?${qs.toString()}`);
              }}
              onLinked={p => setViewLinkedPolicy(p)}
              onDelete={p => { if (confirm(`Delete policy ${p.policy_number ?? p.id}?`)) deletePolicyMutation.mutate(p.id); }}
              emptyText="No policies uploaded."
            />
          </Card>
        </div>
      )}

      {/* Claims Tab */}
      {activeTab === "Claims" && (() => {
        const filtered = memberClaims.filter(c =>
          !claimSearch.trim() ||
          c.claim_number?.toLowerCase().includes(claimSearch.toLowerCase()) ||
          c.policy_number?.toLowerCase().includes(claimSearch.toLowerCase())
        );
        const totalPages = Math.max(1, Math.ceil(filtered.length / CLAIM_ROWS));
        const pageRows = filtered.slice(claimPage * CLAIM_ROWS, (claimPage + 1) * CLAIM_ROWS);
        const allPageSelected = pageRows.length > 0 && pageRows.every(c => selectedClaimIds.includes(c.id));
        const toggleAll = () => {
          setSelectedClaimIds(prev => allPageSelected
            ? prev.filter(id => !pageRows.some(c => c.id === id))
            : [...new Set([...prev, ...pageRows.map(c => c.id)])]);
        };
        const toggleOne = (claimId: string) => {
          setSelectedClaimIds(prev => prev.includes(claimId) ? prev.filter(id => id !== claimId) : [...prev, claimId]);
        };
        const goToClaim = (claimId: string) => {
          const qs = new URLSearchParams();
          qs.set("member_id", id);
          if (member?.name) qs.set("member_name", encodeURIComponent(member.name));
          router.push(`/admin/claim-tickets/${claimId}?${qs.toString()}`);
        };

        return (
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid #f3f4f6", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Claim Tickets</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {isSuperadmin && selectedClaimIds.length > 0 && (
                  <button
                    onClick={() => setClaimAssignOpen(true)}
                    style={{ background: "#0a2257", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
                  >
                    Assign Claim Agent ({selectedClaimIds.length})
                  </button>
                )}
                <input
                  value={claimSearch}
                  onChange={e => { setClaimSearch(e.target.value); setClaimPage(0); }}
                  placeholder="Search claim or policy #…"
                  style={{ height: 32, border: "1px solid #e0e6ec", borderRadius: 8, padding: "0 10px", fontSize: 12.5, outline: "none", width: 200 }}
                />
                <span style={{ fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{filtered.length} total</span>
              </div>
            </div>
            {claimsLoading ? (
              <div style={{ padding: 24, textAlign: "center", color: "#9ca3af" }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9ca3af" }}>
                {memberClaims.length === 0 ? "No claims filed by this member yet." : "No claims match your search."}
              </div>
            ) : (
              <>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                  <thead>
                    <tr style={{ background: "#f8f9fb" }}>
                      {isSuperadmin && (
                        <th style={{ padding: "9px 12px", width: 34 }}>
                          <input type="checkbox" checked={allPageSelected} onChange={toggleAll} />
                        </th>
                      )}
                      {["Claim #", "Policy", "Insurer", "Claimed Amount", "Status", "Assigned Agent", "Submitted"].map(h => (
                        <th key={h} style={{ padding: "9px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7a8c" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map(c => (
                      <tr
                        key={c.id}
                        style={{ borderTop: "1px solid #f1f3f6", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fb")}
                        onMouseLeave={e => (e.currentTarget.style.background = "")}
                      >
                        {isSuperadmin && (
                          <td style={{ padding: "12px" }} onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={selectedClaimIds.includes(c.id)} onChange={() => toggleOne(c.id)} />
                          </td>
                        )}
                        <td style={{ padding: "12px 20px", fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }} onClick={() => goToClaim(c.id)}>{c.claim_number}</td>
                        <td style={{ padding: "12px 20px" }} onClick={() => goToClaim(c.id)}>
                          <div>{c.policy_number ?? "—"}</div>
                          <div style={{ fontSize: 11.5, color: "#9ca3af" }}>{c.policy_type}</div>
                        </td>
                        <td style={{ padding: "12px 20px" }} onClick={() => goToClaim(c.id)}>{c.insurer ?? "—"}</td>
                        <td style={{ padding: "12px 20px" }} onClick={() => goToClaim(c.id)}>{c.claimed_amount ? `₹${Number(c.claimed_amount).toLocaleString("en-IN")}` : "—"}</td>
                        <td style={{ padding: "12px 20px" }} onClick={() => goToClaim(c.id)}><StatusBadge value={c.status.charAt(0).toUpperCase() + c.status.slice(1)} /></td>
                        <td style={{ padding: "12px 20px" }} onClick={() => goToClaim(c.id)}>{c.assigned_agent_name || <span style={{ color: "#9ca3af" }}>Unassigned</span>}</td>
                        <td style={{ padding: "12px 20px" }} onClick={() => goToClaim(c.id)}>{dayjs(c.created_at).format("DD MMM YYYY")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: "1px solid #f1f3f6", fontSize: 12.5, color: "#6b7a8c" }}>
                    <span>Page {claimPage + 1} of {totalPages}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button disabled={claimPage === 0} onClick={() => setClaimPage(p => p - 1)} style={{ background: "none", border: "1px solid #e0e6ec", borderRadius: 8, padding: "6px 12px", cursor: claimPage === 0 ? "default" : "pointer", opacity: claimPage === 0 ? 0.4 : 1 }}>← Prev</button>
                      <button disabled={claimPage >= totalPages - 1} onClick={() => setClaimPage(p => p + 1)} style={{ background: "none", border: "1px solid #e0e6ec", borderRadius: 8, padding: "6px 12px", cursor: claimPage >= totalPages - 1 ? "default" : "pointer", opacity: claimPage >= totalPages - 1 ? 0.4 : 1 }}>Next →</button>
                    </div>
                  </div>
                )}
              </>
            )}

            <AssignClaimAgentDialog
              visible={claimAssignOpen}
              claimIds={selectedClaimIds}
              onHide={() => setClaimAssignOpen(false)}
              onAssigned={() => {
                setClaimAssignOpen(false);
                setSelectedClaimIds([]);
                queryClient.invalidateQueries({ queryKey: ["admin", "member-claims", id] });
              }}
            />
          </Card>
        );
      })()}

      {/* Change Requests Tab */}
      {activeTab === "Change Requests" && (
        <Card>
          <CardTitle style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Change Requests</span>
            <div style={{ display: "flex", gap: 6 }}>
              {["pending", "approved", "rejected", "all"].map(s => (
                <button
                  key={s}
                  onClick={() => setCrStatusFilter(s)}
                  style={{
                    padding: "3px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "1px solid",
                    background: crStatusFilter === s ? "#1d4ed8" : "#fff",
                    color: crStatusFilter === s ? "#fff" : "#6b7280",
                    borderColor: crStatusFilter === s ? "#1d4ed8" : "#e5e7eb",
                  }}
                >{s.charAt(0).toUpperCase() + s.slice(1)}</button>
              ))}
            </div>
          </CardTitle>
          {changeRequests.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No change requests found.</div>
          ) : changeRequests.map((cr: any) => (
            <CrRow key={cr.id} onClick={() => { setSelectedCr(cr); setAdminNote(cr.admin_note || ""); setCrDetailOpen(true); }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <CrStatusPill $s={cr.status}>{cr.status}</CrStatusPill>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{cr.created_at ? dayjs(cr.created_at).format("DD MMM YYYY HH:mm") : ""}</span>
                </div>
                <div>
                  {Object.keys(cr.requested_fields ?? {}).map((f: string) => (
                    <FieldPill key={f}>{f}: {String(cr.requested_fields[f])}</FieldPill>
                  ))}
                </div>
                {cr.reason && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{cr.reason}</div>}
              </div>
              {cr.status === "pending" && (
                <span style={{ fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>Review →</span>
              )}
            </CrRow>
          ))}
        </Card>
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

          {/* Consent & DPDP — hidden */}
        </div>
      )}

      {/* Edit Member Dialog */}
      <Dialog
        header="Edit Member"
        visible={editOpen}
        onHide={() => setEditOpen(false)}
        style={{ width: "640px" }}
        footer={editFooter}
        maximizable
      >
        <FormGrid>
          {/* Basic info */}
          <FormRow>
            <Field>
              <FieldLabel>Full Name *</FieldLabel>
              <Controller
                name="name"
                control={editForm.control}
                rules={{ required: "Full name is required" }}
                render={({ field, fieldState }) => (
                  <>
                    <InputText {...field} style={{ width: "100%" }} invalid={!!fieldState.error} />
                    {fieldState.error && <Err>{fieldState.error.message}</Err>}
                  </>
                )}
              />
            </Field>
            <Field>
              <FieldLabel>Mobile No.</FieldLabel>
              <Controller
                name="mobile_no"
                control={editForm.control}
                rules={{ pattern: { value: /^\+?[\d\s\-()]{7,15}$/, message: "Invalid mobile number (7–15 digits)" } }}
                render={({ field, fieldState }) => (
                  <>
                    <InputText {...field} placeholder="+91 98765 43210" style={{ width: "100%" }} invalid={!!fieldState.error} />
                    {fieldState.error && <Err>{fieldState.error.message}</Err>}
                  </>
                )}
              />
            </Field>
          </FormRow>

          <FormRow>
            <Field>
              <FieldLabel>Gender</FieldLabel>
              <Controller
                name="gender"
                control={editForm.control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value}
                    options={GENDER_OPTIONS}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Select gender"
                    showClear
                    style={{ width: "100%" }}
                  />
                )}
              />
            </Field>
            <Field>
              <FieldLabel style={{ marginBottom: "0.5rem" }}>Active</FieldLabel>
              <Controller
                name="is_active"
                control={editForm.control}
                render={({ field }) => (
                  <InputSwitch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.value)}
                  />
                )}
              />
            </Field>
          </FormRow>

          {/* Address */}
          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
            <FieldLabel style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Address
            </FieldLabel>
          </div>

          <Field>
            <FieldLabel>Address Line</FieldLabel>
            <Controller
              name="address_line"
              control={editForm.control}
              render={({ field }) => (
                <InputText {...field} style={{ width: "100%" }} />
              )}
            />
          </Field>

          <FormRow>
            <Field>
              <FieldLabel>City</FieldLabel>
              <Controller
                name="address_city"
                control={editForm.control}
                render={({ field }) => (
                  <InputText {...field} style={{ width: "100%" }} />
                )}
              />
            </Field>
            <Field>
              <FieldLabel>State</FieldLabel>
              <Controller
                name="address_state"
                control={editForm.control}
                render={({ field }) => (
                  <InputText {...field} style={{ width: "100%" }} />
                )}
              />
            </Field>
          </FormRow>

          <Field>
            <FieldLabel>PIN Code</FieldLabel>
            <Controller
              name="address_pin"
              control={editForm.control}
              rules={{ pattern: { value: /^\d{6}$/, message: "PIN must be exactly 6 digits" } }}
              render={({ field, fieldState }) => (
                <>
                  <InputText {...field} placeholder="400001" maxLength={6} style={{ width: "100%" }} invalid={!!fieldState.error} />
                  {fieldState.error && <Err>{fieldState.error.message}</Err>}
                </>
              )}
            />
          </Field>

          {/* Onboarding / Sales fields */}
          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
            <FieldLabel style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Onboarding &amp; Sales
            </FieldLabel>
          </div>

          <FormRow>
            <Field>
              <FieldLabel>Sale Date</FieldLabel>
              <Controller
                name="sale_date"
                control={editForm.control}
                render={({ field }) => (
                  <InputText {...field} placeholder="YYYY-MM-DD" style={{ width: "100%" }} />
                )}
              />
            </Field>
            <Field>
              <FieldLabel>Sales Channel</FieldLabel>
              <Controller
                name="sales_channel"
                control={editForm.control}
                render={({ field }) => (
                  <InputText {...field} style={{ width: "100%" }} />
                )}
              />
            </Field>
          </FormRow>

          <FormRow>
            <Field>
              <FieldLabel>Branch Code</FieldLabel>
              <Controller
                name="branch_code"
                control={editForm.control}
                render={({ field }) => (
                  <InputText {...field} style={{ width: "100%" }} />
                )}
              />
            </Field>
            <Field>
              <FieldLabel>Salesperson Name</FieldLabel>
              <Controller
                name="salesperson_name"
                control={editForm.control}
                render={({ field }) => (
                  <InputText {...field} style={{ width: "100%" }} />
                )}
              />
            </Field>
          </FormRow>

          <Field>
            <FieldLabel>Employee Code</FieldLabel>
            <Controller
              name="employee_code"
              control={editForm.control}
              render={({ field }) => (
                <InputText {...field} style={{ width: "100%" }} />
              )}
            />
          </Field>

          <FormRow>
            <Field>
              <FieldLabel>Data 1</FieldLabel>
              <Controller
                name="data1"
                control={editForm.control}
                render={({ field }) => (
                  <InputText {...field} style={{ width: "100%" }} />
                )}
              />
            </Field>
            <Field>
              <FieldLabel>Data 2</FieldLabel>
              <Controller
                name="data2"
                control={editForm.control}
                render={({ field }) => (
                  <InputText {...field} style={{ width: "100%" }} />
                )}
              />
            </Field>
          </FormRow>

          <Field>
            <FieldLabel>Data 3</FieldLabel>
            <Controller
              name="data3"
              control={editForm.control}
              render={({ field }) => (
                <InputText {...field} style={{ width: "100%" }} />
              )}
            />
          </Field>
        </FormGrid>
      </Dialog>

      {/* Change Request Detail Dialog */}
      <Dialog
        header="Review Change Request"
        visible={crDetailOpen}
        onHide={() => { setCrDetailOpen(false); setSelectedCr(null); }}
        style={{ width: "480px" }}
        footer={
          selectedCr?.status === "pending" ? (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button label="Reject" severity="danger" outlined
                loading={rejectCrMutation.isPending}
                onClick={() => rejectCrMutation.mutate({ crId: selectedCr.id, note: adminNote })} />
              <Button label="Approve" severity="success"
                loading={approveCrMutation.isPending}
                onClick={() => approveCrMutation.mutate({ crId: selectedCr.id, note: adminNote })} />
            </div>
          ) : null
        }
      >
        {selectedCr && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 6 }}>Requested Changes</div>
              {Object.entries(selectedCr.requested_fields ?? {}).map(([k, v]: [string, any]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
                  <span style={{ color: "#6b7280", fontWeight: 600 }}>{k}</span>
                  <span style={{ color: "#111827", fontWeight: 500 }}>{String(v)}</span>
                </div>
              ))}
            </div>
            {selectedCr.reason && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 4 }}>Reason</div>
                <div style={{ fontSize: 13, color: "#374151" }}>{selectedCr.reason}</div>
              </div>
            )}
            {selectedCr.status === "pending" && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 4 }}>Admin Note (optional)</div>
                <InputTextarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  rows={2}
                  style={{ width: "100%", fontSize: 13 }}
                  placeholder="Add a note for the member..."
                />
              </div>
            )}
            {selectedCr.status !== "pending" && selectedCr.admin_note && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 4 }}>Admin Note</div>
                <div style={{ fontSize: 13, color: "#374151" }}>{selectedCr.admin_note}</div>
              </div>
            )}
          </div>
        )}
      </Dialog>
      {/* Family CR Review Dialog */}
      <Dialog
        header="Review Family Change Request"
        visible={familyCrOpen}
        onHide={() => { setFamilyCrOpen(false); setSelectedFamilyCr(null); }}
        style={{ width: "480px" }}
        footer={
          selectedFamilyCr?.status === "pending" ? (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button label="Reject" severity="danger" outlined
                loading={rejectFamilyCrMutation.isPending}
                onClick={() => rejectFamilyCrMutation.mutate({ crId: selectedFamilyCr.id, note: familyCrNote })} />
              <Button label="Approve & Apply" severity="success"
                loading={approveFamilyCrMutation.isPending}
                onClick={() => approveFamilyCrMutation.mutate({ crId: selectedFamilyCr.id, note: familyCrNote })} />
            </div>
          ) : null
        }
      >
        {selectedFamilyCr && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {selectedFamilyCr.family_member_name && (
              <div style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
                Family member: {selectedFamilyCr.family_member_name}
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 6 }}>Requested Changes</div>
              {Object.entries(selectedFamilyCr.requested_fields ?? {}).map(([k, v]: any) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13 }}>
                  <span style={{ color: "#6b7280", fontWeight: 600 }}>{k}</span>
                  <span style={{ color: "#111827", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            {selectedFamilyCr.reason && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 4 }}>Reason</div>
                <div style={{ fontSize: 13, color: "#374151" }}>{selectedFamilyCr.reason}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 4 }}>Admin Note (optional)</div>
              <InputTextarea value={familyCrNote} onChange={e => setFamilyCrNote(e.target.value)}
                rows={2} style={{ width: "100%", fontSize: 13 }} placeholder="Note for the member..." />
            </div>
          </div>
        )}
      </Dialog>

      {/* Linked Family Members Dialog */}
      <Dialog
        header="Linked Family Members"
        visible={!!viewLinkedPolicy}
        onHide={() => setViewLinkedPolicy(null)}
        style={{ width: "380px" }}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button label="Close" severity="secondary" outlined onClick={() => setViewLinkedPolicy(null)} />
          </div>
        }
      >
        {viewLinkedPolicy && (
          <div>
            <p style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "#3a4756" }}>
              Policy: <strong style={{ fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }}>{viewLinkedPolicy.policy_number}</strong>
            </p>
            {(viewLinkedPolicy.linked_family_members ?? []).length === 0 ? (
              <div style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "1rem 0" }}>No linked family members.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(viewLinkedPolicy.linked_family_members ?? []).map((m: any) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: 18 }}>👤</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#161d26" }}>{m.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "#6b7a8c", textTransform: "capitalize" }}>{m.relation}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Switch Plan Dialog */}
      <Dialog
        header="Switch Member Plan"
        visible={switchPlanOpen}
        onHide={() => { setSwitchPlanOpen(false); setSelectedPlanId(null); }}
        style={{ width: "420px" }}
        modal
        draggable={false}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <Button label="Cancel" severity="secondary" outlined onClick={() => { setSwitchPlanOpen(false); setSelectedPlanId(null); }} disabled={switchPlanMutation.isPending} />
            <Button
              label="Switch Plan"
              icon="pi pi-check"
              loading={switchPlanMutation.isPending}
              disabled={!selectedPlanId}
              onClick={() => { if (selectedPlanId) switchPlanMutation.mutate(selectedPlanId); }}
            />
          </div>
        }
      >
        <div style={{ paddingTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {(member as any)?.enrollment?.plan_name && (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Current plan: <strong style={{ color: "#111827" }}>{(member as any).enrollment.plan_name}</strong>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7a8c" }}>
              Select New Plan *
            </label>
            <Dropdown
              value={selectedPlanId}
              onChange={e => setSelectedPlanId(e.value)}
              options={activePlanOptions}
              placeholder="Choose a plan"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Dialog>

      {/* Cancel Membership Dialog */}
      <Dialog
        header="Cancel Membership"
        visible={cancelOpen}
        onHide={() => { setCancelOpen(false); setCancelReason(""); }}
        style={{ width: "420px" }}
        modal
        draggable={false}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <Button label="Back" severity="secondary" outlined onClick={() => { setCancelOpen(false); setCancelReason(""); }} disabled={cancelMutation.isPending} />
            <Button
              label="Cancel Membership"
              severity="danger"
              icon="pi pi-ban"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(cancelReason)}
            />
          </div>
        }
      >
        <div style={{ paddingTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            This will immediately block the member's portal access for this enrollment. This action can be reversed later via "Renew".
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7a8c" }}>
              Reason (optional)
            </label>
            <InputTextarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Why is this membership being cancelled?"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
