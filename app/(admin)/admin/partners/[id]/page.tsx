"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import styled from "styled-components";
import { ArrowLeft, Download, Eye, Users, FileText, User, Calendar, Phone, Mail, MapPin, Building2, Upload, ClipboardList, Bell } from "lucide-react";
import {
  adminGetPartner,
  adminListMembersByPartner,
  adminListPoliciesByPartner,
  adminViewPolicyPdf,
  adminDownloadPolicyPdf,
  adminGetPartnerPlansOverview,
  adminLinkPlanToPartner,
  adminUnlinkPlanFromPartner,
  adminGetMember,
  adminListPartnerChangeRequests,
  adminApprovePartnerChangeRequest,
  adminRejectPartnerChangeRequest,
  adminAddMemberToPartner,
  adminGetPartnerNotifications,
} from "@/imports/core/api";
import { getApiError } from "@/imports/core/errors";

// ─── Styled ───────────────────────────────────────────────────────────────────

const PageWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const BackRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
`;

const InfoCardHeader = styled.div`
  padding: 1.25rem 1.25rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
`;

const InfoSection = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #f1f2f6;
`;

const InfoSectionTitle = styled.div`
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: #6b7a8c; margin-bottom: 12px;
`;

const InfoGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
`;

const InfoFieldLabel = styled.div`
  font-size: 11px; color: #9ca3af; margin-bottom: 2px;
`;

const InfoFieldValue = styled.div`
  font-size: 13px; color: #161d26;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;

  svg { color: #9ca3af; flex-shrink: 0; }
  strong { color: #111827; }
`;

const SectionCard = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CountBadge = styled.span`
  background: #ede9fe;
  color: #6d28d9;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
`;

const ExpandedWrap = styled.div`
  padding: 0.75rem 1.25rem 1rem;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
`;

const ExpandedTitle = styled.div`
  font-size: 0.78rem;
  font-weight: 700;
  color: #6d28d9;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
`;

const EmptyMsg = styled.div`
  color: #9ca3af;
  font-size: 0.8rem;
  padding: 0.5rem 0;
`;

const MemberMeta = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
  color: #6b7280;

  span { display: flex; align-items: center; gap: 4px; }
  strong { color: #374151; }
`;

const TabRow = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 0;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: ${p => p.$active ? 700 : 500};
  color: ${p => p.$active ? "#6366f1" : "#6b7280"};
  border: none;
  border-bottom: 2px solid ${p => p.$active ? "#6366f1" : "transparent"};
  background: none;
  cursor: pointer;
  margin-bottom: -2px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s;
  &:hover { color: ${p => p.$active ? "#6366f1" : "#374151"}; }
`;

const FormGrid = styled.div`
  display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem;
`;

const Field = styled.div`
  display: flex; flex-direction: column; gap: 0.25rem;
`;

const FieldLabel = styled.label`
  font-size: 0.875rem; font-weight: 500; color: #374151;
`;

const FieldErr = styled.small`
  color: #dc2626; font-size: 0.75rem;
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Partner {
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
  api_key: string | null;
  api_rate_limit: number;
  member_count?: number;
  created_at: string | null;
}

function InfoField({ label, value, mono, fullWidth }: { label: string; value?: string | null; mono?: boolean; fullWidth?: boolean }) {
  return (
    <div style={fullWidth ? { gridColumn: "1 / -1" } : undefined}>
      <InfoFieldLabel>{label}</InfoFieldLabel>
      <InfoFieldValue style={{ fontFamily: mono ? "'IBM Plex Mono', ui-monospace, monospace" : undefined, color: value ? "#161d26" : "#d1d5db" }}>
        {value || "—"}
      </InfoFieldValue>
    </div>
  );
}

interface Member {
  id: string;
  name: string;
  email: string;
  mobile_no?: string;
  is_active: boolean;
  enrollment_status?: string;
  plan_id?: string;
  plan_name?: string;
  policy_count: number;
  family_count: number;
}

interface PlanOverview {
  id: string;
  name: string;
  plan_type: string;
  status: string;
  price: number | null;
  cycle: string | null;
  description: string | null;
  linked: boolean;
  member_count: number;
}

interface PartnerChangeRequest {
  id: string;
  partner_id: string;
  requested_fields: Record<string, string>;
  reason: string | null;
  status: string;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string | null;
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

interface Policy {
  id: string;
  policy_number?: string;
  policy_type?: string;
  insurer?: string;
  sum_insured?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  file_name?: string;
  has_file?: boolean;
}

interface MemberFormValues {
  email: string;
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
  plan_id: string;
}

const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

// ─── PDF helpers ──────────────────────────────────────────────────────────────

async function openPdf(policyId: string) {
  try {
    const blob = await adminViewPolicyPdf(policyId);
    const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch {
    toast.error("Could not load PDF");
  }
}

async function downloadPdf(policyId: string, fileName?: string) {
  try {
    const blob = await adminDownloadPolicyPdf(policyId);
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

// ─── Member Row Expansion ─────────────────────────────────────────────────────

function MemberPolicies({ partnerId, member }: { partnerId: string; member: Member }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "partner-member-policies", partnerId, member.id],
    queryFn: () => adminListPoliciesByPartner(partnerId, {
      user_id: member.id, skip: 0, limit: 50,
    }),
    enabled: !!partnerId && !!member.id,
  });

  const { data: memberDetail } = useQuery({
    queryKey: ["admin", "member-detail", member.id],
    queryFn: () => adminGetMember(member.id),
    enabled: !!member.id,
  });

  const policies: Policy[] = data?.data?.data ?? [];
  const familyMembers: any[] = memberDetail?.data?.family ?? [];

  const statusSeverity = (s?: string) => {
    if (s === "Active") return "success";
    if (s === "Expired") return "warning";
    if (s === "Cancelled") return "danger";
    return "secondary";
  };

  const pdfActions = (row: Policy) => (
    <div style={{ display: "flex", gap: "0.25rem" }}>
      {row.has_file && (
        <>
          <Button
            icon={<Eye size={13} />}
            text
            size="small"
            severity="info"
            title="View PDF"
            onClick={() => openPdf(row.id)}
          />
          <Button
            icon={<Download size={13} />}
            text
            size="small"
            severity="secondary"
            title="Download PDF"
            onClick={() => downloadPdf(row.id, row.file_name)}
          />
        </>
      )}
      {!row.has_file && (
        <span style={{ color: "#d1d5db", fontSize: "0.75rem" }}>No file</span>
      )}
    </div>
  );

  return (
    <ExpandedWrap>
      <MemberMeta>
        <span><Mail size={12} /><strong>{member.email}</strong></span>
        {member.mobile_no && <span><Phone size={12} />{member.mobile_no}</span>}
        {member.plan_name && <span><FileText size={12} />Plan: <strong>{member.plan_name}</strong></span>}
        <span>Family: <strong>{member.family_count}</strong></span>
        <span>Status: <strong>{member.enrollment_status ?? "—"}</strong></span>
      </MemberMeta>

      {familyMembers.length > 0 && (
        <>
          <ExpandedTitle>Family Members ({familyMembers.length})</ExpandedTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
            {familyMembers.map((f: any) => (
              <span key={f.id} style={{
                fontSize: "0.78rem", padding: "3px 10px", borderRadius: "999px",
                background: "#f5f3ff", color: "#6d28d9", border: "1px solid #ede9fe", fontWeight: 500,
              }}>
                {f.name} <span style={{ color: "#9ca3af", fontWeight: 400 }}>({f.relation})</span>
              </span>
            ))}
          </div>
        </>
      )}

      <ExpandedTitle>Policies ({policies.length})</ExpandedTitle>

      {isLoading ? (
        <EmptyMsg>Loading policies…</EmptyMsg>
      ) : policies.length === 0 ? (
        <EmptyMsg>No policies under this partner for this member.</EmptyMsg>
      ) : (
        <DataTable
          value={policies}
          size="small"
          stripedRows
          style={{ fontSize: "0.8rem" }}
        >
          <Column field="policy_number" header="Policy #" style={{ minWidth: "130px" }} />
          <Column field="policy_type" header="Type" />
          <Column field="insurer" header="Insurer" />
          <Column
            header="Sum Insured"
            body={(r: Policy) => r.sum_insured ? `₹${Number(r.sum_insured).toLocaleString("en-IN")}` : "—"}
          />
          <Column
            header="Valid"
            body={(r: Policy) =>
              r.start_date && r.end_date
                ? `${dayjs(r.start_date).format("DD MMM YY")} – ${dayjs(r.end_date).format("DD MMM YY")}`
                : r.start_date ? dayjs(r.start_date).format("DD MMM YY") : "—"
            }
          />
          <Column
            header="Status"
            body={(r: Policy) =>
              r.status ? <Tag severity={statusSeverity(r.status)} value={r.status} style={{ fontSize: "0.7rem" }} /> : "—"
            }
          />
          <Column header="PDF" body={pdfActions} style={{ width: "90px" }} />
        </DataTable>
      )}
    </ExpandedWrap>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [expandedRows, setExpandedRows] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"plans" | "members" | "change-requests" | "notifications">(
    (searchParams.get("tab") as "plans" | "members" | "change-requests" | "notifications") ?? "members"
  );
  const [reviewCR, setReviewCR] = useState<PartnerChangeRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const memberForm = useForm<MemberFormValues>({
    defaultValues: {
      email: "", name: "", mobile_no: "", gender: "", address_line: "",
      address_city: "", address_state: "", address_pin: "", sale_date: "",
      sales_channel: "", branch_code: "", salesperson_name: "", employee_code: "",
      data1: "", data2: "", data3: "", plan_id: "",
    },
  });

  const { data: partnerRes, isLoading: partnerLoading } = useQuery({
    queryKey: ["admin", "partner", id],
    queryFn: () => adminGetPartner(id),
    enabled: !!id,
  });

  const { data: membersRes, isLoading: membersLoading } = useQuery({
    queryKey: ["admin", "partner-members", id],
    queryFn: () => adminListMembersByPartner(id, { skip: 0, limit: 200 }),
    enabled: !!id,
  });

  const { data: plansRes, refetch: refetchPlans } = useQuery({
    queryKey: ["admin", "partner-plans-overview", id],
    queryFn: () => adminGetPartnerPlansOverview(id),
    enabled: !!id,
  });

  const linkPlanMutation = useMutation({
    mutationFn: (planId: string) => adminLinkPlanToPartner(planId, id),
    onSuccess: () => { toast.success("Plan assigned to partner"); refetchPlans(); },
    onError: (err: any) => toast.error(getApiError(err, "Failed to assign plan")),
  });

  const unlinkPlanMutation = useMutation({
    mutationFn: (planId: string) => adminUnlinkPlanFromPartner(planId, id),
    onSuccess: () => { toast.success("Plan unlinked"); refetchPlans(); },
    onError: (err: any) => toast.error(getApiError(err, "Failed to unlink plan")),
  });

  const { data: crRes, isLoading: crLoading } = useQuery({
    queryKey: ["admin", "partner-change-requests", id],
    queryFn: () => adminListPartnerChangeRequests(id, { limit: 100 }),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: ({ crId, note }: { crId: string; note: string }) =>
      adminApprovePartnerChangeRequest(crId, { admin_note: note || undefined }),
    onSuccess: () => {
      toast.success("Change request approved and applied to partner record.");
      queryClient.invalidateQueries({ queryKey: ["admin", "partner-change-requests", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "partner", id] });
      setReviewCR(null);
      setAdminNote("");
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to approve")),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ crId, note }: { crId: string; note: string }) =>
      adminRejectPartnerChangeRequest(crId, { admin_note: note || undefined }),
    onSuccess: () => {
      toast.success("Change request rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin", "partner-change-requests", id] });
      setReviewCR(null);
      setAdminNote("");
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to reject")),
  });

  const linkedPlanOptions = ((plansRes as any)?.data ?? [])
    .filter((p: any) => p.linked)
    .map((p: any) => ({ label: p.name, value: p.id }));

  const addMemberMutation = useMutation({
    mutationFn: (v: MemberFormValues) => {
      const payload: Record<string, unknown> = { email: v.email, name: v.name, partner_id: id };
      if (v.mobile_no) payload.mobile_no = v.mobile_no;
      if (v.gender) payload.gender = v.gender;
      if (v.address_line) payload.address_line = v.address_line;
      if (v.address_city) payload.address_city = v.address_city;
      if (v.address_state) payload.address_state = v.address_state;
      if (v.address_pin) payload.address_pin = v.address_pin;
      if (v.sale_date) payload.sale_date = v.sale_date;
      if (v.sales_channel) payload.sales_channel = v.sales_channel;
      if (v.branch_code) payload.branch_code = v.branch_code;
      if (v.salesperson_name) payload.salesperson_name = v.salesperson_name;
      if (v.employee_code) payload.employee_code = v.employee_code;
      if (v.data1) payload.data1 = v.data1;
      if (v.data2) payload.data2 = v.data2;
      if (v.data3) payload.data3 = v.data3;
      if (v.plan_id) payload.plan_id = v.plan_id;
      return adminAddMemberToPartner(id, payload);
    },
    onSuccess: () => {
      toast.success("Member added");
      setAddMemberOpen(false);
      memberForm.reset();
      queryClient.invalidateQueries({ queryKey: ["admin", "partner-members", id] });
    },
    onError: (err: any) => toast.error(getApiError(err, "Failed to add member")),
  });

  const { data: notifRes } = useQuery({
    queryKey: ["admin", "partner-notifications", id],
    queryFn: () => adminGetPartnerNotifications(id),
    enabled: !!id,
  });

  const partner: Partner | null = partnerRes?.data ?? null;
  const members: Member[] = membersRes?.data?.data ?? [];
  const plansOverview: PlanOverview[] = (plansRes as any)?.data ?? [];
  const linkedPlans = plansOverview.filter(p => p.linked);
  const changeRequests: PartnerChangeRequest[] = (crRes as any)?.data?.data ?? [];
  const pendingCRCount = changeRequests.filter(cr => cr.status === "pending").length;
  const partnerNotifications: any[] = (notifRes as any)?.data?.data ?? [];
  const notifUnreadCount: number = (notifRes as any)?.data?.unread_count ?? 0;

  // ── Column templates ──────────────────────────────────────────────────────

  const nameBody = (row: Member) => (
    <div>
      <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>{row.name || "—"}</div>
      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{row.email}</div>
    </div>
  );

  const planBody = (row: Member) => (
    <div>
      <div style={{ fontSize: "0.85rem", color: "#111827" }}>{row.plan_name || <span style={{ color: "#9ca3af" }}>No plan</span>}</div>
      {row.enrollment_status && (
        <div style={{ fontSize: "0.72rem", color: row.enrollment_status === "Active" ? "#059669" : "#6b7280" }}>
          {row.enrollment_status}
        </div>
      )}
    </div>
  );

  const policyCountBody = (row: Member) => (
    <span style={{
      fontWeight: 600,
      color: row.policy_count > 0 ? "#6366f1" : "#9ca3af",
      fontSize: "0.875rem",
    }}>
      {row.policy_count}
    </span>
  );

  const familyCountBody = (row: Member) => (
    <span style={{ color: "#374151", fontSize: "0.875rem" }}>{row.family_count}</span>
  );

  const activeBody = (row: Member) => (
    <span style={{
      fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px", borderRadius: "999px",
      background: row.is_active ? "#dcfce7" : "#fee2e2",
      color: row.is_active ? "#166534" : "#991b1b",
    }}>
      {row.is_active ? "Active" : "Inactive"}
    </span>
  );

  const rowExpansionTemplate = (row: Member) => (
    <MemberPolicies partnerId={id} member={row} />
  );

  const expanderBody = (row: Member) => (
    <Button
      text
      size="small"
      icon={expandedRows?.[row.id] ? "pi pi-chevron-down" : "pi pi-chevron-right"}
      onClick={() => {
        setExpandedRows((prev: any) => {
          const next = { ...prev };
          if (next?.[row.id]) delete next[row.id];
          else next[row.id] = true;
          return next;
        });
      }}
    />
  );

  if (partnerLoading) {
    return (
      <PageWrap>
        <BackRow>
          <Button text icon={<ArrowLeft size={16} />} label="Partners" onClick={() => router.push("/admin/partners")} />
        </BackRow>
        <div style={{ color: "#9ca3af", padding: "2rem" }}>Loading partner…</div>
      </PageWrap>
    );
  }

  if (!partner) {
    return (
      <PageWrap>
        <BackRow>
          <Button text icon={<ArrowLeft size={16} />} label="Partners" onClick={() => router.push("/admin/partners")} />
        </BackRow>
        <div style={{ color: "#dc2626", padding: "2rem" }}>Partner not found.</div>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      {/* Back + Header actions */}
      <BackRow style={{ justifyContent: "space-between" }}>
        <Button
          text
          size="small"
          style={{ color: "#6b7280", padding: "0.25rem 0" }}
          onClick={() => router.push("/admin/partners")}
          label="← Back to Partners"
        />
        <Button
          label="Bulk Upload"
          icon="pi pi-upload"
          severity="secondary"
          outlined
          size="small"
          onClick={() => router.push("/admin/partners/bulk-upload")}
        />
      </BackRow>

      {/* Partner Info */}
      <InfoCard>
        <InfoCardHeader>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Building2 size={20} color="#6366f1" />
            <div>
              <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827" }}>
                {partner.legal_company_name || partner.name}
              </div>
              {partner.trade_name && (
                <div style={{ fontSize: 13, color: "#6b7a8c" }}>{partner.trade_name}</div>
              )}
            </div>
            <span style={{
              fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px", borderRadius: "999px",
              background: partner.status === "Active" ? "#dcfce7" : "#fee2e2",
              color: partner.status === "Active" ? "#166534" : "#991b1b",
            }}>
              {partner.status}
            </span>
          </div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#6366f1" }}>{members.length}</div>
              <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "2px" }}>Members</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#059669" }}>
                {members.reduce((s, m) => s + (m.policy_count ?? 0), 0)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "2px" }}>Policies</div>
            </div>
          </div>
        </InfoCardHeader>

        {/* Company Details */}
        <InfoSection>
          <InfoSectionTitle>Company Details</InfoSectionTitle>
          <InfoGrid>
            <InfoField label="Legal Company Name" value={partner.legal_company_name} fullWidth />
            <InfoField label="Trade Name / Brand" value={partner.trade_name} />
            <InfoField label="Partner Type" value={partner.partner_type} />
            <InfoField label="GSTIN" value={partner.gstin} mono />
            <InfoField label="PAN" value={partner.pan} mono />
          </InfoGrid>
        </InfoSection>

        {/* Registered Address */}
        <InfoSection>
          <InfoSectionTitle>Registered Address</InfoSectionTitle>
          <InfoGrid>
            <InfoField label="Address" value={partner.registered_address} fullWidth />
            <InfoField label="City" value={partner.city} />
            <InfoField label="State" value={partner.state} />
            <InfoField label="Pin Code" value={partner.pin_code} mono />
          </InfoGrid>
        </InfoSection>

        {/* Signatory & Contact */}
        <InfoSection>
          <InfoSectionTitle>Authorized Signatory &amp; Contact</InfoSectionTitle>
          <InfoGrid>
            <InfoField label="Signatory Name" value={partner.authorized_signatory_name} />
            <InfoField label="Designation" value={partner.designation} />
            <InfoField label="Email" value={partner.email} />
            <InfoField label="Mobile" value={partner.mobile_no} />
          </InfoGrid>
        </InfoSection>

        {/* Additional Data - only if any populated */}
        {(partner.data_1 || partner.data_2 || partner.data_3) && (
          <InfoSection>
            <InfoSectionTitle>Additional Data</InfoSectionTitle>
            <InfoGrid>
              {partner.data_1 && <InfoField label="Data 1" value={partner.data_1} />}
              {partner.data_2 && <InfoField label="Data 2" value={partner.data_2} />}
              {partner.data_3 && <InfoField label="Data 3" value={partner.data_3} />}
            </InfoGrid>
          </InfoSection>
        )}

        {/* API Key */}
        {partner.api_key && (
          <InfoSection>
            <InfoSectionTitle>API Access</InfoSectionTitle>
            <InfoGrid>
              <InfoField label="API Key" value={partner.api_key} mono fullWidth />
            </InfoGrid>
          </InfoSection>
        )}

        {/* Joined date */}
        {partner.created_at && (
          <div style={{ padding: "10px 20px 14px", borderTop: "1px solid #f1f2f6", fontSize: 12, color: "#9ca3af" }}>
            <Calendar size={12} style={{ display: "inline", marginRight: 4 }} />
            Joined {dayjs(partner.created_at).format("DD MMM YYYY")}
          </div>
        )}
      </InfoCard>

      {/* Tabbed: Plans / Members / Change Requests */}
      <SectionCard>
        <TabRow>
          <Tab $active={activeTab === "members"} onClick={() => setActiveTab("members")}>
            <Users size={14} />
            Members
            <CountBadge>{members.length}</CountBadge>
          </Tab>
          <Tab $active={activeTab === "plans"} onClick={() => { setActiveTab("plans"); }}>
            <FileText size={14} />
            Plans
            <CountBadge>{linkedPlans.length} linked</CountBadge>
          </Tab>
          <Tab $active={activeTab === "change-requests"} onClick={() => setActiveTab("change-requests")}>
            <ClipboardList size={14} />
            Change Requests
            {pendingCRCount > 0 && (
              <CountBadge style={{ background: "#fef3c7", color: "#92400e" }}>{pendingCRCount} pending</CountBadge>
            )}
          </Tab>
          <Tab $active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")}>
            <Bell size={14} />
            Notifications
            {notifUnreadCount > 0 && (
              <CountBadge style={{ background: "#fef2f2", color: "#dc2626" }}>{notifUnreadCount} unread</CountBadge>
            )}
          </Tab>
        </TabRow>

        {/* Members tab */}
        {activeTab === "members" && (
          <>
            <SectionHeader style={{ borderTop: "none" }}>
              <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                Click the arrow to see member policies
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button
                  label="Add Member"
                  icon="pi pi-plus"
                  size="small"
                  onClick={() => { memberForm.reset(); setAddMemberOpen(true); }}
                  style={{ fontSize: 12, height: 30 }}
                />
                <Button
                  label="Bulk Upload"
                  icon={<Upload size={13} />}
                  size="small"
                  severity="secondary"
                  outlined
                  onClick={() => router.push(`/admin/partners/${id}/members/bulk-upload`)}
                  style={{ fontSize: 12, height: 30 }}
                />
              </div>
            </SectionHeader>
            <DataTable
              value={members}
              loading={membersLoading}
              expandedRows={expandedRows}
              onRowToggle={(e) => setExpandedRows(e.data)}
              rowExpansionTemplate={rowExpansionTemplate}
              dataKey="id"
              emptyMessage="No members enrolled under this partner."
              stripedRows
              style={{ fontSize: "0.875rem" }}
              onRowClick={(e) => router.push(`/admin/members/${e.data.id}?partner_id=${id}&partner_name=${encodeURIComponent(partner.legal_company_name || partner.name || "")}`)}
              rowClassName={() => "cursor-pointer"}
            >
              <Column expander={false} body={expanderBody} style={{ width: "44px" }} />
              <Column header="Member" body={nameBody} style={{ minWidth: "200px" }} />
              <Column field="mobile_no" header="Mobile" style={{ minWidth: "120px" }}
                body={(r: Member) => r.mobile_no || "—"} />
              <Column header="Plan" body={planBody} style={{ minWidth: "150px" }} />
              <Column header="Policies" body={policyCountBody} style={{ width: "80px", textAlign: "center" }} />
              <Column header="Family" body={familyCountBody} style={{ width: "70px", textAlign: "center" }} />
              <Column header="Status" body={activeBody} style={{ width: "90px" }} />
            </DataTable>
          </>
        )}

        {/* Plans tab */}
        {activeTab === "plans" && (
          <div style={{ padding: "0.75rem 1.25rem 1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: 0 }}>
                All active plans — assign or delink plans for this partner.
              </p>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                {linkedPlans.length} linked · {plansOverview.length - linkedPlans.length} unlinked
              </div>
            </div>

            {plansOverview.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No active plans found.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {/* Linked plans first, then unlinked */}
                {[...plansOverview].sort((a, b) => (b.linked ? 1 : 0) - (a.linked ? 1 : 0)).map((p) => (
                  <div key={p.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: 10,
                    border: p.linked ? "1px solid #a5b4fc" : "1px solid #e5e7eb",
                    background: p.linked ? "#f5f3ff" : "#fafafa",
                    flexWrap: "wrap",
                  }}>
                    {/* Plan info */}
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#111827" }}>{p.name}</span>
                        <span style={{
                          fontSize: "0.62rem", fontWeight: 700, padding: "1px 7px", borderRadius: "999px",
                          background: p.plan_type === "partner" ? "#f5f3ff" : "#e0f2fe",
                          color: p.plan_type === "partner" ? "#6d28d9" : "#0369a1",
                          border: "1px solid", borderColor: p.plan_type === "partner" ? "#ede9fe" : "#bae6fd",
                        }}>
                          {p.plan_type === "partner" ? "Partner" : "Global"}
                        </span>
                        {p.linked && (
                          <span style={{
                            fontSize: "0.62rem", fontWeight: 700, padding: "1px 7px", borderRadius: "999px",
                            background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0",
                          }}>
                            Linked
                          </span>
                        )}
                      </div>
                      {p.price != null && (
                        <div style={{ fontSize: "0.78rem", color: "#7c3aed", fontWeight: 600, marginTop: 3 }}>
                          ₹{Number(p.price).toLocaleString("en-IN")} / {p.cycle ?? "year"}
                        </div>
                      )}
                      {p.description && (
                        <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>{p.description}</div>
                      )}
                    </div>

                    {/* Member count (only for linked) */}
                    {p.linked && (
                      <div style={{ textAlign: "center", minWidth: 60 }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: p.member_count > 0 ? "#6366f1" : "#9ca3af" }}>
                          {p.member_count}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#9ca3af" }}>members</div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                      {p.linked ? (
                        <Button
                          label={p.member_count > 0 ? `Delink (${p.member_count} member${p.member_count !== 1 ? "s" : ""})` : "Delink"}
                          icon="pi pi-link"
                          size="small"
                          severity="danger"
                          outlined
                          disabled={p.member_count > 0 || unlinkPlanMutation.isPending}
                          title={p.member_count > 0 ? `Cannot delink: ${p.member_count} member(s) enrolled under this plan` : "Remove this plan from partner"}
                          onClick={() => unlinkPlanMutation.mutate(p.id)}
                        />
                      ) : (
                        <Button
                          label="Assign"
                          icon="pi pi-plus"
                          size="small"
                          severity="success"
                          disabled={linkPlanMutation.isPending}
                          onClick={() => linkPlanMutation.mutate(p.id)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Change Requests tab */}
        {activeTab === "change-requests" && (
          <div style={{ padding: "0.75rem 1.25rem 1.25rem" }}>
            {crLoading ? (
              <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>Loading change requests…</p>
            ) : changeRequests.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>No change requests from this partner.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {changeRequests.map((cr) => (
                  <div key={cr.id} style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: "14px 16px",
                    background: cr.status === "pending" ? "#fffbeb" : "#fafafa",
                    borderColor: cr.status === "pending" ? "#fcd34d" : "#e5e7eb",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <CRStatusChip $status={cr.status}>
                        {cr.status.charAt(0).toUpperCase() + cr.status.slice(1)}
                      </CRStatusChip>
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>
                        {cr.created_at ? dayjs(cr.created_at).format("DD MMM YYYY, h:mm A") : ""}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginBottom: 8 }}>
                      {Object.entries(cr.requested_fields).map(([k, v]) => (
                        <div key={k} style={{ fontSize: 12 }}>
                          <span style={{ color: "#6b7280" }}>{FIELD_LABELS[k] ?? k}:</span>{" "}
                          <span style={{ fontWeight: 600, color: "#111827" }}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {cr.reason && (
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                        <i className="pi pi-comment" style={{ fontSize: 11, marginRight: 4 }} />
                        {cr.reason}
                      </div>
                    )}

                    {cr.admin_note && (
                      <div style={{ fontSize: 11, color: "#0369a1", background: "#e0f2fe", borderRadius: 6, padding: "4px 8px", marginBottom: 8 }}>
                        Admin note: {cr.admin_note}
                      </div>
                    )}

                    {cr.status === "pending" && (
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: 8 }}>
                        <Button
                          label="Approve"
                          icon="pi pi-check"
                          size="small"
                          severity="success"
                          onClick={() => { setReviewCR(cr); setReviewAction("approve"); setAdminNote(""); }}
                        />
                        <Button
                          label="Reject"
                          icon="pi pi-times"
                          size="small"
                          severity="danger"
                          outlined
                          onClick={() => { setReviewCR(cr); setReviewAction("reject"); setAdminNote(""); }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications tab */}
        {activeTab === "notifications" && (
          <div style={{ padding: "20px 22px" }}>
            {partnerNotifications.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 14 }}>
                No notifications sent to this partner yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {partnerNotifications.map((n: any) => (
                  <div
                    key={n.id}
                    style={{
                      background: n.is_read ? "#f9fafb" : "#eff6ff",
                      border: `1px solid ${n.is_read ? "#e5e7eb" : "#bfdbfe"}`,
                      borderRadius: 10,
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0,
                      background: n.is_read ? "#d1d5db" : "#3b82f6",
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: "#111827" }}>{n.title}</div>
                      {n.body && <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 3 }}>{n.body}</div>}
                      <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 5 }}>
                        {n.created_at ? new Date(n.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                        {!n.is_read && <span style={{ marginLeft: 8, background: "#dbeafe", color: "#1d4ed8", borderRadius: 4, padding: "1px 6px", fontSize: 11, fontWeight: 600 }}>Unread</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Approve / Reject Dialog */}
      <Dialog
        visible={!!reviewCR && !!reviewAction}
        onHide={() => { setReviewCR(null); setReviewAction(null); setAdminNote(""); }}
        header={reviewAction === "approve" ? "Approve Change Request" : "Reject Change Request"}
        style={{ width: "480px" }}
        modal
        draggable={false}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <Button
              label="Cancel"
              severity="secondary"
              outlined
              onClick={() => { setReviewCR(null); setReviewAction(null); setAdminNote(""); }}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            />
            <Button
              label={reviewAction === "approve" ? "Approve & Apply" : "Reject"}
              icon={reviewAction === "approve" ? "pi pi-check" : "pi pi-times"}
              severity={reviewAction === "approve" ? "success" : "danger"}
              loading={approveMutation.isPending || rejectMutation.isPending}
              onClick={() => {
                if (!reviewCR) return;
                if (reviewAction === "approve") {
                  approveMutation.mutate({ crId: reviewCR.id, note: adminNote });
                } else {
                  rejectMutation.mutate({ crId: reviewCR.id, note: adminNote });
                }
              }}
            />
          </div>
        }
      >
        {reviewCR && (
          <div style={{ paddingTop: "0.5rem" }}>
            {reviewAction === "approve" && (
              <div style={{
                background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8,
                padding: "10px 12px", marginBottom: 12, fontSize: 13, color: "#166534",
              }}>
                These fields will be updated on the partner record:
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              {Object.entries(reviewCR.requested_fields).map(([k, v]) => (
                <div key={k} style={{
                  display: "flex", justifyContent: "space-between", fontSize: 13,
                  padding: "6px 10px", background: "#f9fafb", borderRadius: 6,
                }}>
                  <span style={{ color: "#6b7280" }}>{FIELD_LABELS[k] ?? k}</span>
                  <span style={{ fontWeight: 600, color: "#111827" }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6b7a8c" }}>
                Admin Note (optional)
              </label>
              <InputTextarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={2}
                placeholder="Add a note for the partner…"
                style={{ width: "100%", resize: "vertical" }}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* ── Add Member Dialog ─────────────────────────────────────────────── */}
      <Dialog
        header="Add Member"
        visible={addMemberOpen}
        onHide={() => { setAddMemberOpen(false); memberForm.reset(); }}
        style={{ width: "620px" }}
        maximizable
        footer={
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button label="Cancel" severity="secondary" outlined onClick={() => { setAddMemberOpen(false); memberForm.reset(); }} />
            <Button
              label="Add Member"
              loading={addMemberMutation.isPending}
              onClick={memberForm.handleSubmit(v => addMemberMutation.mutate(v))}
            />
          </div>
        }
      >
        <FormGrid>
          {/* Basic */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field>
              <FieldLabel>Full Name *</FieldLabel>
              <Controller name="name" control={memberForm.control} rules={{ required: "Name is required" }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} invalid={!!fieldState.error} style={{ width: "100%" }} />
                  {fieldState.error && <FieldErr>{fieldState.error.message}</FieldErr>}</>
                )} />
            </Field>
            <Field>
              <FieldLabel>Email *</FieldLabel>
              <Controller name="email" control={memberForm.control} rules={{ required: "Email is required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" } }}
                render={({ field, fieldState }) => (
                  <><InputText type="email" {...field} invalid={!!fieldState.error} style={{ width: "100%" }} />
                  {fieldState.error && <FieldErr>{fieldState.error.message}</FieldErr>}</>
                )} />
            </Field>
            <Field>
              <FieldLabel>Mobile No. *</FieldLabel>
              <Controller name="mobile_no" control={memberForm.control} rules={{ required: "Mobile is required", pattern: { value: /^\+?[\d\s\-()]{7,15}$/, message: "Invalid mobile" } }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} placeholder="+91 98765 43210" invalid={!!fieldState.error} style={{ width: "100%" }} />
                  {fieldState.error && <FieldErr>{fieldState.error.message}</FieldErr>}</>
                )} />
            </Field>
            <Field>
              <FieldLabel>Gender</FieldLabel>
              <Controller name="gender" control={memberForm.control}
                render={({ field }) => (
                  <Dropdown value={field.value} options={GENDER_OPTIONS} onChange={e => field.onChange(e.value)} placeholder="Select gender" showClear style={{ width: "100%" }} />
                )} />
            </Field>
          </div>

          {/* Address */}
          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
            <FieldLabel style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Address (optional)</FieldLabel>
          </div>
          <Field>
            <FieldLabel>Address Line</FieldLabel>
            <Controller name="address_line" control={memberForm.control}
              render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <Field>
              <FieldLabel>City</FieldLabel>
              <Controller name="address_city" control={memberForm.control}
                render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
            </Field>
            <Field>
              <FieldLabel>State</FieldLabel>
              <Controller name="address_state" control={memberForm.control}
                render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
            </Field>
            <Field>
              <FieldLabel>PIN Code</FieldLabel>
              <Controller name="address_pin" control={memberForm.control} rules={{ pattern: { value: /^\d{6}$/, message: "6-digit PIN" } }}
                render={({ field, fieldState }) => (
                  <><InputText {...field} placeholder="400001" maxLength={6} invalid={!!fieldState.error} style={{ width: "100%" }} />
                  {fieldState.error && <FieldErr>{fieldState.error.message}</FieldErr>}</>
                )} />
            </Field>
          </div>

          {/* Onboarding */}
          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
            <FieldLabel style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Onboarding &amp; Sales (optional)</FieldLabel>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <Field>
              <FieldLabel>Sale Date</FieldLabel>
              <Controller name="sale_date" control={memberForm.control}
                render={({ field }) => <InputText {...field} placeholder="YYYY-MM-DD" style={{ width: "100%" }} />} />
            </Field>
            <Field>
              <FieldLabel>Sales Channel</FieldLabel>
              <Controller name="sales_channel" control={memberForm.control}
                render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
            </Field>
            <Field>
              <FieldLabel>Branch Code</FieldLabel>
              <Controller name="branch_code" control={memberForm.control}
                render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
            </Field>
            <Field>
              <FieldLabel>Salesperson Name</FieldLabel>
              <Controller name="salesperson_name" control={memberForm.control}
                render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
            </Field>
            <Field>
              <FieldLabel>Employee Code</FieldLabel>
              <Controller name="employee_code" control={memberForm.control}
                render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
            </Field>
            <Field>
              <FieldLabel>Data 1</FieldLabel>
              <Controller name="data1" control={memberForm.control}
                render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
            </Field>
            <Field>
              <FieldLabel>Data 2</FieldLabel>
              <Controller name="data2" control={memberForm.control}
                render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
            </Field>
            <Field>
              <FieldLabel>Data 3</FieldLabel>
              <Controller name="data3" control={memberForm.control}
                render={({ field }) => <InputText {...field} style={{ width: "100%" }} />} />
            </Field>
          </div>

          {/* Enrollment */}
          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
            <FieldLabel style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Enrollment</FieldLabel>
          </div>
          <Field>
            <FieldLabel>Plan * (partner&apos;s linked plans only)</FieldLabel>
            <Controller name="plan_id" control={memberForm.control} rules={{ required: "Plan is required" }}
              render={({ field, fieldState }) => (
                <><Dropdown value={field.value} onChange={e => field.onChange(e.value)} options={linkedPlanOptions} placeholder="Select a plan" showClear filter invalid={!!fieldState.error} style={{ width: "100%" }} />
                {fieldState.error && <FieldErr>{fieldState.error.message}</FieldErr>}</>
              )} />
          </Field>
        </FormGrid>
      </Dialog>
    </PageWrap>
  );
}
